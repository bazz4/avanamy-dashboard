'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Plus, GitBranch, Users, Mail, Search, RefreshCw, RotateCw } from 'lucide-react';
import { toast } from 'sonner';
import { CodeRepository } from '@/lib/types';
import { getCodeRepositories, deleteCodeRepository, triggerCodeRepositoryScan } from '@/lib/api';
import { AddCodeRepositoryModal } from '@/components/AddCodeRepositoryModal';
import { EditCodeRepositoryModal } from '@/components/EditCodeRepositoryModal';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

export default function CodeRepositoriesPage() {
  const { isLoaded } = useAuth();
  const [repositories, setRepositories] = useState<CodeRepository[]>([]);
  const [filteredRepositories, setFilteredRepositories] = useState<CodeRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRepo, setEditingRepo] = useState<CodeRepository | null>(null);
  const [deletingRepo, setDeletingRepo] = useState<CodeRepository | null>(null);

  useEffect(() => {
    if (isLoaded) {
      loadRepositories();
    }
  }, [isLoaded]);

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

  // Auto-refresh when there are scanning/pending repos
  useEffect(() => {
    const hasActiveScans = repositories.some(
      (repo) => repo.scan_status === 'scanning'
    );

    if (!hasActiveScans) return;

    const interval = setInterval(() => {
      refreshRepositories();
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [repositories]);

  async function loadRepositories() {
    try {
      setLoading(true);
      const data = await getCodeRepositories();
      setRepositories(data);
      setFilteredRepositories(data);
    } catch (error) {
      console.log('Failed to load code repositories:', error);
      toast.error('Failed to load code repositories');
    } finally {
      setLoading(false);
    }
  }

  async function refreshRepositories() {
    try {
      setUpdating(true);
      const data = await getCodeRepositories();
      setRepositories(data);
      // Preserve current search filter
      if (searchQuery.trim() === '') {
        setFilteredRepositories(data);
      } else {
        const query = searchQuery.toLowerCase();
        setFilteredRepositories(
          data.filter(
            (repo) =>
              repo.name.toLowerCase().includes(query) ||
              repo.url.toLowerCase().includes(query) ||
              repo.owner_team?.toLowerCase().includes(query)
          )
        );
      }
    } catch (error) {
      console.log('Failed to refresh code repositories:', error);
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete(repo: CodeRepository) {
    try {
      await deleteCodeRepository(repo.id);
      toast.success('Code repository deleted');
      loadRepositories();
      setDeletingRepo(null);
    } catch (error) {
      console.log('Failed to delete code repository:', error);
      toast.error('Failed to delete code repository');
    }
  }

  async function handleScan(repo: CodeRepository) {
    if (!repo.access_token_encrypted) {
      toast.error('Connect GitHub before scanning');
      return;
    }

    try {
      await triggerCodeRepositoryScan(repo.id);
      toast.success('Scan started');
      await refreshRepositories();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start scan');
      await refreshRepositories();
    }
  }

  function getScanStatusBadge(status: string) {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      scanning: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse',
      success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status}
      </span>
    );
  }

  function getScanStatusLabel(status: string) {
    switch (status) {
      case 'pending':
        return 'Ready to scan';
      case 'scanning':
        return 'Scanning';
      case 'success':
        return 'Scanned';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  }

  // Check if auto-updating is active
  const hasActiveScans = repositories.some(
    (repo) => repo.scan_status === 'scanning'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600 dark:text-slate-400">Loading code repositories...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auto-Update Indicator */}
      {hasActiveScans && (
        <div className="fixed top-20 left-72 z-50">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-lg">
            <RotateCw 
              className={`h-3 w-3 text-blue-600 dark:text-blue-400 ${updating ? 'animate-spin' : ''}`}
            />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {updating ? 'Updating...' : 'Auto-updating'}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Code Repositories</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Connect your repositories to detect API endpoint usage
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Add Repository</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{repositories.length}</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Repositories</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {repositories.filter((r) => r.scan_status === 'success').length}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Successfully Scanned</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {repositories.reduce((sum, r) => sum + r.total_endpoints_found, 0)}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Endpoints Detected</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search repositories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
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
          {filteredRepositories.map((repo) => (
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
                    {getScanStatusBadge(repo.scan_status)}
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

              {/* Last Scan Info */}
              {repo.last_scanned_at && (
                <div className="text-xs text-slate-500 dark:text-slate-500 mb-4">
                  Last scanned: {new Date(repo.last_scanned_at).toLocaleString()}
                </div>
              )}

              {/* Error Message */}
              {repo.last_scan_error && (
                <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
                  {repo.last_scan_error}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Add GitHub connection indicator */}
                {!repo.access_token_encrypted && (
                  <div className="flex-1 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                    ⚠️ Connect GitHub to scan
                  </div>
                )}
                <a                
                  href={`/code-repositories/${repo.id}`}
                  className="flex-1 px-3 py-2 text-center bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded transition-colors text-sm"
                >
                  View Details
                </a>
                <button
                  onClick={() => handleScan(repo)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title={repo.access_token_encrypted ? "Trigger scan" : "Connect GitHub first"}
                  disabled={
                    repo.scan_status === 'scanning' || 
                    !repo.access_token_encrypted  // ← Add this
                  }
                >
                  <RefreshCw className={`h-4 w-4 ${(repo.scan_status === 'scanning') ? 'animate-spin' : ''}`} />
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
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddCodeRepositoryModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadRepositories();
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