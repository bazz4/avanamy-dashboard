'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, GitBranch, Users, Mail, Search, RefreshCw, Clock, Calendar, Info } from 'lucide-react';
import { toast } from 'sonner';
import { CodeRepository } from '@/lib/types';
import { getCodeRepositories, deleteCodeRepository, triggerCodeRepositoryScan, connectGitHubToRepository } from '@/lib/api';
import { AddCodeRepositoryModal } from '@/components/AddCodeRepositoryModal';
import { EditCodeRepositoryModal } from '@/components/EditCodeRepositoryModal';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

export default function CodeRepositoriesPage() {
  const { isLoaded } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [repositories, setRepositories] = useState<CodeRepository[]>([]);
  const [filteredRepositories, setFilteredRepositories] = useState<CodeRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRepo, setEditingRepo] = useState<CodeRepository | null>(null);
  const [deletingRepo, setDeletingRepo] = useState<CodeRepository | null>(null);
  const [githubToken, setGithubToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('github_token');
  });
  const [scanRequested, setScanRequested] = useState<Set<string>>(() => new Set());
  const [showStatusLegend, setShowStatusLegend] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      loadRepositories();
    }
  }, [isLoaded]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = sessionStorage.getItem('github_token');
    setGithubToken(token);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const connected = searchParams.get('github_connected');
    if (connected === 'true') {
      setShowAddModal(true);
      router.replace('/code-repositories');
    }
  }, [isLoaded, searchParams, router]);

  useEffect(() => {
    // Filter repositories based on search
    if (searchQuery.trim() === '') {
      setFilteredRepositories(repositories);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredRepositories(
        repositories.filter(
          (repo) =>
            repo.name.toLowerCase().includes(query) ||
            repo.url.toLowerCase().includes(query) ||
            repo.owner_team?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, repositories]);

  const hasActiveScans = repositories.some(
    (repo) => repo.scan_status === 'scanning'
  ) || scanRequested.size > 0;

  // Auto-refresh while scans are active.
  useEffect(() => {
    if (!hasActiveScans) return;

    const interval = setInterval(() => {
      refreshRepositories();
    }, 5000);

    return () => clearInterval(interval);
  }, [hasActiveScans]);

  useEffect(() => {
    setScanRequested((prev) => {
      if (prev.size === 0) return prev;
      const next = new Set<string>();
      prev.forEach((id) => {
        const repo = repositories.find((item) => item.id === id);
        if (repo && (repo.scan_status === 'pending' || repo.scan_status === 'scanning')) {
          next.add(id);
        }
      });
      return next;
    });
  }, [repositories]);

  async function loadRepositories(showLoading = true) {
    if (showLoading) setLoading(true);
    try {
      const data = await getCodeRepositories();
      setRepositories(data);
      setHasLoadedOnce(true);
    } catch (error: any) {
      console.error('Failed to load repositories:', error);
      toast.error(error.message || 'Failed to load repositories');
    } finally {
      setLoading(false);
    }
  }

  async function refreshRepositories() {
    if (updating) return;
    setUpdating(true);
    try {
      const data = await getCodeRepositories();
      setRepositories(data);
    } catch (error) {
      console.error('Failed to refresh repositories:', error);
    } finally {
      setUpdating(false);
    }
  }

  async function handleScan(repo: CodeRepository) {
    setScanRequested((prev) => new Set(prev).add(repo.id));
    try {
      await triggerCodeRepositoryScan(repo.id);
      toast.success(`Scan started for ${repo.name}`);
      setTimeout(() => refreshRepositories(), 1000);
    } catch (error: any) {
      console.error('Failed to trigger scan:', error);
      toast.error(error.message || 'Failed to trigger scan');
      setScanRequested((prev) => {
        const next = new Set(prev);
        next.delete(repo.id);
        return next;
      });
    }
  }

  async function handleDelete(repo: CodeRepository) {
    try {
      await deleteCodeRepository(repo.id);
      toast.success(`Repository "${repo.name}" deleted`);
      setRepositories((prev) => prev.filter((item) => item.id !== repo.id));
      setDeletingRepo(null);
    } catch (error: any) {
      console.error('Failed to delete repository:', error);
      toast.error(error.message || 'Failed to delete repository');
    }
  }

  function getScanStatusBadge(
    status: string, 
    nextScanAt: string | null, 
    hasScanRequested: boolean
  ) {
    const now = new Date();
    const nextScan = nextScanAt ? new Date(nextScanAt) : null;
    const isOverdue = nextScan && nextScan <= now;

    const styles = {
      'never-scanned': 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
      'scanning': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse',
      'up-to-date': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'overdue': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'failed': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };

    let label = '';
    let style = '';
    let tooltip = '';

    if (status === 'scanning' || hasScanRequested) {
      label = 'Scanning...';
      style = styles['scanning'];
      tooltip = 'Repository is currently being scanned for API endpoint usage';
    } else if (status === 'failed') {
      label = 'Scan failed';
      style = styles['failed'];
      tooltip = 'Last scan encountered an error. Check error details below.';
    } else if (status === 'pending') {
      label = 'Never scanned';
      style = styles['never-scanned'];
      tooltip = 'Repository has been added but not yet scanned. Schedule a scan or click "Scan Now" to start.';
    } else if (status === 'success') {
      if (isOverdue) {
        label = 'Scan overdue';
        style = styles['overdue'];
        tooltip = 'Scheduled scan is overdue. Schedule a scan or click "Scan Now".';
      } else {
        label = 'Up to date';
        style = styles['up-to-date'];
        tooltip = 'Repository has been scanned recently and is up to date.';
      }
    }

    return (
      <span 
        className={`px-2 py-1 text-xs font-medium rounded-full ${style} cursor-help`}
        title={tooltip}
      >
        {label}
      </span>
    );
  }

  // ✨ NEW: Helper to format relative time
  function formatRelativeTime(dateString: string | null): string {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  }

  // ✨ NEW: Helper to format next scan time
  function formatNextScanTime(nextScanAt: string | null, scanStatus: string): string {
    if (!nextScanAt) return 'Not scheduled';
    if (scanStatus === 'scanning') return 'Scanning now...';
    
    const date = new Date(nextScanAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Scan pending';
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `in ${diffMins} min${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }

  // Check if auto-updating is active
  const isAutoUpdating = hasActiveScans;

  if (loading && !hasLoadedOnce) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600 dark:text-slate-400">Loading code repositories...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Home</span>
            <span>&rsaquo;</span>
            <span className="text-cyan-600 dark:text-cyan-400">Code Repositories</span>
          </div>
          {isAutoUpdating && (
            <div className="flex items-center gap-2 text-xs">
              {updating ? (
                <>
                  <RefreshCw className="h-3 w-3 text-cyan-600 dark:text-cyan-400 animate-spin" />
                  <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Updating...</span>
                </>
              ) : (
                <>
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-slate-500">Auto-updating every 5s</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Code Repositories
          </h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="h-5 w-5" />
            Add Repository
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Status Legend */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setShowStatusLegend(!showStatusLegend)}
            className="w-full flex items-center justify-between p-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="font-medium">What do scan statuses mean?</span>
            </div>
            <span className="text-xs text-slate-500">{showStatusLegend ? 'Hide' : 'Show'}</span>
          </button>
          
          {showStatusLegend && (
            <div className="px-3 pb-3 space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full font-medium whitespace-nowrap">Up to date</span>
                <span className="text-slate-600 dark:text-slate-400">Recently scanned and next scan is scheduled</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full font-medium whitespace-nowrap">Scan overdue</span>
                <span className="text-slate-600 dark:text-slate-400">Scheduled scan is past due - schedule a scan or click "Scan Now"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full font-medium whitespace-nowrap">Scanning...</span>
                <span className="text-slate-600 dark:text-slate-400">Repository is currently being analyzed for API usage</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="px-2 py-1 bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-full font-medium whitespace-nowrap">Never scanned</span>
                <span className="text-slate-600 dark:text-slate-400">Repository added but not yet scanned - schedule a scan or click "Scan Now"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full font-medium whitespace-nowrap">Scan failed</span>
                <span className="text-slate-600 dark:text-slate-400">Last scan encountered an error - check error message below repository</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Repository List */}
      {filteredRepositories.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <GitBranch className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            {searchQuery ? 'No repositories found' : 'No repositories yet'}
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            {searchQuery
              ? 'Try adjusting your search'
              : 'Connect a repository to start detecting API usage'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Add Your First Repository
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRepositories.map((repo) => {
            const hasScanRequested = scanRequested.has(repo.id);
            return (
              <div
                key={repo.id}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow"
              >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {repo.name}
                    </h3>
                    {getScanStatusBadge(repo.scan_status, repo.next_scan_at, hasScanRequested)}
                  </div>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <GitBranch className="h-3 w-3" />
                    {repo.url}
                  </a>
                </div>
              </div>

              {/* Owner Info */}
              {(repo.owner_team || repo.owner_email) && (
                <div className="space-y-1 mb-4">
                  {repo.owner_team && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Users className="h-4 w-4" />
                      <span>{repo.owner_team}</span>
                    </div>
                  )}
                  {repo.owner_email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Mail className="h-4 w-4" />
                      <span>{repo.owner_email}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded">
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Files Scanned</div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">
                    {repo.total_files_scanned}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Endpoints Found</div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">
                    {repo.total_endpoints_found}
                  </div>
                </div>
              </div>

              {/* ✨ NEW: Scan Timing Info */}
              <div className="space-y-2 mb-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Last scanned:</span>
                  </div>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatRelativeTime(repo.last_scanned_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Next scan:</span>
                  </div>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatNextScanTime(repo.next_scan_at, repo.scan_status)}
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {repo.last_scan_error && (
                <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
                  {repo.last_scan_error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <a
                  href={`/code-repositories/${repo.id}`}
                  className="flex-1 px-3 py-2 text-center bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded transition-colors text-sm"
                >
                  View Details
                </a>
                <button
                  onClick={() => handleScan(repo)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Trigger scan"
                  disabled={repo.scan_status === 'scanning' || hasScanRequested}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${(repo.scan_status === 'scanning' || hasScanRequested) ? 'animate-spin' : ''}`}
                  />
                </button>
                <button
                  onClick={() => setEditingRepo(repo)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded transition-colors text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeletingRepo(repo)}
                  className="px-3 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddCodeRepositoryModal
          onClose={() => setShowAddModal(false)}
          onSuccess={(repo) => {
            setShowAddModal(false);
            if (repo) {
              setRepositories((prev) => {
                if (prev.some((item) => item.id === repo.id)) {
                  return prev;
                }
                return [repo, ...prev];
              });
            }
            loadRepositories(false);
          }}
        />
      )}

      {editingRepo && (
        <EditCodeRepositoryModal
          repository={editingRepo}
          onClose={() => setEditingRepo(null)}
          onSuccess={() => {
            setEditingRepo(null);
            loadRepositories();
          }}
        />
      )}

      {deletingRepo && (
        <DeleteConfirmDialog
          title="Delete Code Repository"
          message={`Are you sure you want to delete "${deletingRepo.name}"? This will remove all detected endpoint usage data.`}
          onConfirm={() => handleDelete(deletingRepo)}
          onCancel={() => setDeletingRepo(null)}
        />
      )}
    </div>
  );
}