'use client';

import { useState, useEffect } from 'react';
import { X, Github } from 'lucide-react';
import { toast } from 'sonner';
import { createCodeRepository, initiateGitHubApp, listGitHubRepositories } from '@/lib/api';
import { CodeRepository, CreateCodeRepositoryRequest } from '@/lib/types';

interface AddCodeRepositoryModalProps {
  onClose: () => void;
  onSuccess: (repo?: CodeRepository) => void;
}

export function AddCodeRepositoryModal({ onClose, onSuccess }: AddCodeRepositoryModalProps) {
  const [mode, setMode] = useState<'select' | 'manual' | 'github-repos'>(() => {
    if (typeof window === 'undefined') return 'select';
    const token = sessionStorage.getItem('github_token');
    const installation = sessionStorage.getItem('github_installation_id');
    return token && installation ? 'github-repos' : 'select';
  });
  const [formData, setFormData] = useState<CreateCodeRepositoryRequest>({
    name: '',
    url: '',
    owner_team: '',
    owner_email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [githubToken, setGithubToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('github_token');
  });
  const [installationId, setInstallationId] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const installation = sessionStorage.getItem('github_installation_id');
    return installation ? parseInt(installation, 10) : null;
  });
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(() => {
    if (typeof window === 'undefined') return false;
    const token = sessionStorage.getItem('github_token');
    const installation = sessionStorage.getItem('github_installation_id');
    return Boolean(token && installation);
  });

  useEffect(() => {
    // Check if we just connected GitHub
    const token = sessionStorage.getItem('github_token');
    const installation = sessionStorage.getItem('github_installation_id');
    
    if (token && installation) {
      setGithubToken(token);
      const instId = parseInt(installation, 10);
      setInstallationId(instId);
      setMode('github-repos');
      loadGitHubRepositories(instId);
    }
  }, []);

  async function handleGitHubConnect() {
    try {
      const { authorization_url } = await initiateGitHubApp();
      // Redirect to GitHub App installation
      window.location.href = authorization_url;
    } catch (error: any) {
      console.log('Failed to initiate GitHub App installation:', error);
      toast.error('Failed to connect to GitHub');
    }
  }

  async function loadGitHubRepositories(instId: number) {
    try {
      setLoadingRepos(true);
      const { repositories } = await listGitHubRepositories(instId);
      setGithubRepos(repositories);
      setMode('github-repos');
    } catch (error) {
      console.log('Failed to load repositories:', error);
      toast.error('Failed to load repositories');
      setMode('manual');
    } finally {
      setLoadingRepos(false);
    }
  }

  function selectGitHubRepo(repo: any) {
    setFormData({
      name: repo.name,
      url: repo.clone_url,
      owner_team: '',
      owner_email: '',
    });
    setMode('manual');
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Repository name is required';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'Repository URL is required';
    } else if (!formData.url.startsWith('https://github.com/') && !formData.url.startsWith('https://gitlab.com/')) {
      newErrors.url = 'URL must be a valid GitHub or GitLab repository URL';
    }

    if (formData.owner_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.owner_email)) {
      newErrors.owner_email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      // Prepare data
      const data: CreateCodeRepositoryRequest = {
        name: formData.name.trim(),
        url: formData.url.trim(),
      };

      if (formData.owner_team?.trim()) {
        data.owner_team = formData.owner_team.trim();
      }

      if (formData.owner_email?.trim()) {
        data.owner_email = formData.owner_email.trim();
      }

      // Add GitHub App data if available
      if (githubToken) {
        data.access_token_encrypted = githubToken;
      }

      if (installationId) {
        data.installation_id = installationId;
      }

      const repo = await createCodeRepository(data);
      toast.success('Code repository added successfully');
      onSuccess(repo);
    } catch (error: any) {
      console.log('Failed to create code repository:', error);
      const errorMessage = error?.message || 'Failed to create code repository';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Add Code Repository
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {mode === 'select' && (
          <div className="p-6 space-y-4">
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              How would you like to add your repository?
            </p>

            {/* GitHub App Installation Option */}
            <button
              onClick={handleGitHubConnect}
              className="w-full p-6 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 transition-colors text-left"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-900 dark:bg-slate-800 rounded-lg">
                  <Github className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    Install GitHub App
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Install Avanamy on your GitHub account to access private repositories and enable automatic scanning.
                  </p>
                </div>
              </div>
            </button>

            {/* Manual Entry Option */}
            <button
              onClick={() => setMode('manual')}
              className="w-full p-6 border-2 border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 transition-colors text-left"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    Enter Manually
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Add repository details manually. Scanning will require GitHub App installation later.
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {mode === 'github-repos' && (
          <div className="p-6">
            {loadingRepos ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading repositories...</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Select a repository to add:
                  </p>
                  <button
                    onClick={() => setMode('manual')}
                    className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400"
                  >
                    Enter manually instead
                  </button>
                </div>

                {githubRepos.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      No repositories found. Make sure Avanamy is installed on your repositories.
                    </p>
                    <a
                      href="https://github.com/settings/installations"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline"
                    >
                      Manage installations →
                    </a>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {githubRepos.map((repo) => (
                      <button
                        key={repo.full_name}
                        onClick={() => selectGitHubRepo(repo)}
                        className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <Github className="h-5 w-5 text-slate-400" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-900 dark:text-white truncate">
                              {repo.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {repo.full_name}
                            </div>
                          </div>
                          {repo.private && (
                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">
                              Private
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {mode === 'manual' && (
          <form onSubmit={handleSubmit} noValidate>
            <div className="p-6 space-y-4">
              {/* Show GitHub connected banner if installation exists */}
              {installationId && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-300">
                    ✓ GitHub App installed! This repository will be automatically scanned.
                  </p>
                </div>
              )}

              {/* Warning if no GitHub App */}
              {!installationId && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    ⚠️ <strong>Note:</strong> This repository cannot be scanned without GitHub App installation.{' '}
                    <button
                      type="button"
                      onClick={() => setMode('select')}
                      className="underline hover:no-underline"
                    >
                      Install GitHub App
                    </button>
                  </p>
                </div>
              )}

              {/* Repository Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Repository Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., payments-service"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-900 dark:text-white ${
                    errors.name
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Repository URL */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Repository URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://github.com/yourorg/yourrepo"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-900 dark:text-white ${
                    errors.url
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                />
                {errors.url && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.url}</p>
                )}
              </div>

              {/* Owner Team */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Owner Team (Optional)
                </label>
                <input
                  type="text"
                  value={formData.owner_team}
                  onChange={(e) => setFormData({ ...formData, owner_team: e.target.value })}
                  placeholder="e.g., Payments Team"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-900 dark:text-white"
                />
              </div>

              {/* Owner Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Owner Email (Optional)
                </label>
                <input
                  type="email"
                  value={formData.owner_email}
                  onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                  placeholder="team@example.com"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-900 dark:text-white ${
                    errors.owner_email
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                />
                {errors.owner_email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.owner_email}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => mode === 'manual' && githubRepos.length > 0 ? setMode('github-repos') : onClose()}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                disabled={submitting}
              >
                {mode === 'manual' && githubRepos.length > 0 ? 'Back' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Adding...' : 'Add Repository'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
