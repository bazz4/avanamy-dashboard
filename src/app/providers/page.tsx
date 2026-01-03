'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Building2, Plus, Search, Edit2, Trash2, Globe, ExternalLink, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { getProviders, deleteProvider } from '@/lib/api';
import type { Provider } from '@/lib/types';
import { AddProviderModal } from '@/components/AddProviderModal';
import { EditProviderModal } from '@/components/EditProviderModal';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

export default function ProvidersPage() {
  const { isLoaded } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<Provider | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    loadProviders();
  }, [isLoaded]);

  // Filter providers when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProviders(providers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = providers.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
    );
    setFilteredProviders(filtered);
  }, [searchQuery, providers]);

  async function loadProviders() {
    try {
      setLoading(true);
      setError(null);
      const data = await getProviders();
      setProviders(data);
      setFilteredProviders(data);
    } catch (err) {
      console.error('Error loading providers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(provider: Provider) {
    try {
      await deleteProvider(provider.id);
      await loadProviders();
      setDeletingProvider(null);
      toast.success('Provider deleted successfully', {
        description: `${provider.name} has been removed`,
      });
    } catch (err: any) {
      console.error('Error deleting provider:', err);
      
      // Parse structured error from backend
      let errorMessage = 'Please try again';
      let canArchive = false;
      
      if (err?.message) {
        // Try to extract JSON from error message
        const jsonMatch = err.message.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const errorData = JSON.parse(jsonMatch[0]);
            if (errorData.message) {
              errorMessage = errorData.message;
              canArchive = errorData.can_archive || false;
            } else if (errorData.detail) {
              // Handle both formats
              if (typeof errorData.detail === 'object') {
                errorMessage = errorData.detail.message || errorData.detail;
                canArchive = errorData.detail.can_archive || false;
              } else {
                errorMessage = errorData.detail;
              }
            }
          } catch (parseErr) {
            // If JSON parse fails, use the original message
            errorMessage = err.message;
          }
        } else {
          errorMessage = err.message;
        }
      }
      
      toast.error('Cannot delete provider', {
        description: errorMessage,
        duration: 7000,
      });
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500" role="status">Loading providers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
          <button
            onClick={loadProviders}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Providers
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage API provider companies
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/50"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          Add Provider
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search providers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Providers Grid */}
      {filteredProviders.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" aria-hidden="true" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            {searchQuery ? 'No providers found' : 'No providers yet'}
          </h3>
          <p className="text-slate-500 mb-6">
            {searchQuery
              ? 'Try adjusting your search'
              : 'Get started by adding your first API provider'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
              Add Your First Provider
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((provider) => (
            <article
              key={provider.id}
              className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-purple-500 dark:hover:border-purple-500 transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {provider.logo_url ? (
                    <img
                      src={provider.logo_url}
                      alt={`${provider.name} logo`}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {provider.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {provider.slug}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {provider.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                  {provider.description}
                </p>
              )}

              {/* Website */}
              {provider.website && (
                <a
                  href={provider.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-500 mb-4"
                >
                  <Globe className="h-4 w-4" aria-hidden="true" />
                  <span className="truncate">{provider.website}</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setEditingProvider(provider)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-all"
                >
                  <Edit2 className="h-4 w-4" aria-hidden="true" />
                  Edit
                </button>
                <button
                  onClick={() => setDeletingProvider(provider)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium rounded-lg transition-all"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddProviderModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadProviders();
            setShowAddModal(false);
          }}
        />
      )}

      {editingProvider && (
        <EditProviderModal
          provider={editingProvider}
          onClose={() => setEditingProvider(null)}
          onSuccess={() => {
            loadProviders();
            setEditingProvider(null);
          }}
        />
      )}

      {deletingProvider && (
        <DeleteConfirmDialog
          title="Delete Provider"
          message={`Are you sure you want to delete "${deletingProvider.name}"? This action cannot be undone.`}
          onConfirm={() => handleDelete(deletingProvider)}
          onCancel={() => setDeletingProvider(null)}
        />
      )}
    </div>
  );
}