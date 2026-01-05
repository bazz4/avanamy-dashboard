'use client';

import { useState, useEffect } from 'react';
import { X, Github } from 'lucide-react';
import { toast } from 'sonner';
import { createCodeRepository, initiateGitHubOAuth, listGitHubRepositories, triggerCodeRepositoryScan  } from '@/lib/api';
import { CreateCodeRepositoryRequest } from '@/lib/types';

interface AddCodeRepositoryModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddCodeRepositoryModal({ onClose, onSuccess }: AddCodeRepositoryModalProps) {
  const [mode, setMode] = useState<'select' | 'manual' | 'github-repos'>('select');
  const [formData, setFormData] = useState<CreateCodeRepositoryRequest>({
    name: '',
    url: '',
    owner_team: '',
    owner_email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);

  useEffect(() => {
    // Check if we just connected GitHub
    const token = sessionStorage.getItem('github_token');
    const user = sessionStorage.getItem('github_user');
    
    if (token && user) {
      setGithubToken(token);
      loadGitHubRepositories(token);
    }
  }, []);

  async function handleGitHubConnect() {
    try {
      const { authorization_url } = await initiateGitHubOAuth();
      // Redirect to GitHub OAuth
      window.location.href = authorization_url;
    } catch (error: any) {
      console.log('Failed to initiate GitHub OAuth:', error);
      toast.error('Failed to connect to GitHub');
    }
  }

  async function loadGitHubRepositories(token: string) {
    try {
      setLoadingRepos(true);
      const { repositories } = await listGitHubRepositories(token);
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
      const data: any = {
        name: formData.name.trim(),
        url: formData.url.trim(),
      };

      if (formData.owner_team?.trim()) {
        data.owner_team = formData.owner_team.trim();
      }

      if (formData.owner_email?.trim()) {
        data.owner_email = formData.owner_email.trim();
      }

      // Add GitHub token if available
      if (githubToken) {
        data.access_token_encrypted = githubToken;
      }

      const repo = await createCodeRepository(data);

      // Auto-scan ONLY if GitHub OAuth was used
      if (repo.access_token_encrypted) {
        await triggerCodeRepositoryScan(repo.id);
      }
      
      // Clear GitHub session data
      sessionStorage.removeItem('github_token');
      sessionStorage.removeItem('github_user');
      
      toast.success('Code repository added successfully');
      onSuccess();
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

            {/* GitHub OAuth Option */}
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
                    Connect via GitHub
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Authenticate with GitHub to select repositories and enable automatic scanning.
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
                    Add repository details manually. Scanning will require GitHub OAuth later.
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
              </>
            )}
          </div>
        )}

       {mode === 'manual' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {!githubToken && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  ⚠️ <strong>Note:</strong> This repository cannot be scanned without GitHub OAuth.
                  <button
                    type="button"
                    onClick={() => setMode('select')}
                    className="ml-1 underline hover:no-underline"
                  >
                    Connect GitHub instead
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
                className="w-full px-3 py-2 border rounded-lg"
              />
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
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
                className="w-full px-3 py-2 border rounded-lg"
              />
              {errors.url && <p className="text-sm text-red-600">{errors.url}</p>}
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
                className="w-full px-3 py-2 border rounded-lg"
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
                className="w-full px-3 py-2 border rounded-lg"
              />
              {errors.owner_email && <p className="text-sm text-red-600">{errors.owner_email}</p>}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={onClose} className="px-4 py-2">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-purple-600 text-white rounded"
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