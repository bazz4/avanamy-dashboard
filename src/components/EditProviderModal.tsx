'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { updateProvider } from '@/lib/api';
import type { Provider, ProviderUpdate } from '@/lib/types';

interface EditProviderModalProps {
  provider: Provider;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProviderModal({ provider, onClose, onSuccess }: EditProviderModalProps) {
  const [formData, setFormData] = useState<ProviderUpdate>({
    name: provider.name,
    slug: provider.slug,
    website: provider.website,
    logo_url: provider.logo_url,
    description: provider.description,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateProvider(provider.id, formData);
      onSuccess();
    } catch (err) {
      console.error('Error updating provider:', err);
      setError(err instanceof Error ? err.message : 'Failed to update provider');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="edit-provider-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 id="edit-provider-title" className="text-2xl font-bold text-slate-900 dark:text-white">
            Edit Provider
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Provider Name */}
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Provider Name <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-name"
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Stripe"
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="edit-slug" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-slug"
              type="text"
              required
              value={formData.slug || ''}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="e.g., stripe"
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              URL-friendly identifier
            </p>
          </div>

          {/* Website */}
          <div>
            <label htmlFor="edit-website" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Website
            </label>
            <input
              id="edit-website"
              type="url"
              value={formData.website || ''}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://stripe.com"
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Logo URL */}
          <div>
            <label htmlFor="edit-logo-url" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Logo URL
            </label>
            <input
              id="edit-logo-url"
              type="url"
              value={formData.logo_url || ''}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="edit-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Description
            </label>
            <textarea
              id="edit-description"
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Payment processing API provider"
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-400 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}