'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { Package, Plus, Search, Edit2, Trash2, Building2, Upload, CheckCircle, AlertCircle, ChevronRight, FileText, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { getApiProducts, deleteApiProduct, getProviders } from '@/lib/api';
import type { ApiProduct, Provider } from '@/lib/types';
import { AddApiProductModal } from '@/components/AddApiProductModal';
import { EditApiProductModal } from '@/components/EditApiProductModal';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { UploadSpecModal } from '@/components/UploadSpecModal';
import { actionButtonSpec, actionButtonSecondary } from '@/components/ui/actionClasses';

export default function ApiProductsPage() {
  const { isLoaded } = useAuth();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [filterProviderId, setFilterProviderId] = useState<string | null>(null);
  const [uploadingProduct, setUploadingProduct] = useState<ApiProduct | null>(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ApiProduct | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    loadData();
  }, [isLoaded]);

  // Filter products when search query or provider filter changes
  useEffect(() => {
    let filtered = products;

    // Filter by provider
    if (selectedProvider !== 'all') {
      filtered = filtered.filter(p => p.provider_id === selectedProvider);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.slug.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.provider_name?.toLowerCase().includes(query)
      );
    }

    setFilteredProducts(filtered);
  }, [searchQuery, selectedProvider, products]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [productsData, providersData] = await Promise.all([
        getApiProducts(),
        getProviders(),
      ]);
      setProducts(productsData);
      setProviders(providersData);
      setFilteredProducts(productsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(product: ApiProduct) {
    try {
      await deleteApiProduct(product.id);
      await loadData();
      setDeletingProduct(null);
      toast.success('API Product deleted successfully', {
        description: `${product.name} has been removed`,
      });
    } catch (err: any) {
      console.error('Error deleting product:', err);
      
      let errorMessage = 'Failed to delete API product';
      if (err?.message) {
        errorMessage = err.message;
      }
      
      toast.error('Cannot delete API product', {
        description: errorMessage,
        duration: 7000,
      });
    }
  }

  // Format date helper
  function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  // Format relative time
  function formatRelativeTime(dateString: string | null | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  }

  // Group products by provider
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const providerId = product.provider_id;
    if (!acc[providerId]) {
      acc[providerId] = {
        provider: {
          id: providerId,
          name: product.provider_name || 'Unknown Provider',
          slug: product.provider_slug || '',
        },
        products: []
      };
    }
    acc[providerId].products.push(product);
    return acc;
  }, {} as Record<string, { provider: { id: string; name: string; slug: string }; products: ApiProduct[] }>);

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500 dark:text-slate-400" role="status" aria-live="polite">
          Loading API products...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center" role="alert" aria-live="assertive">
          <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
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
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <span>Home</span>
            <span>&rsaquo;</span>
            <span className="text-cyan-600 dark:text-cyan-400">API Products</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            API Products
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage API products and their specifications
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={providers.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          aria-label="Add new API product"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          <span>Add Product</span>
        </button>
      </div>

      {/* No providers warning */}
      {providers.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6" role="alert">
          <div className="flex items-start gap-4">
            <Building2 className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                No providers yet
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                You need to create at least one provider before you can add API products.
              </p>
              <Link
                href="/providers"
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                Go to Providers
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      {providers.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <label htmlFor="product-search" className="sr-only">
              Search API products
            </label>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
            <input
              id="product-search"
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              aria-label="Search API products"
            />
          </div>

          {/* Provider Filter */}
          <div className="sm:w-64">
            <label htmlFor="provider-filter" className="sr-only">Filter by provider</label>
            <select
              id="provider-filter"
              value={selectedProvider}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedProvider(value);
                setFilterProviderId(value === 'all' ? null : value);
              }}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              aria-label="Filter API products by provider"
            >
              <option value="all">All Providers</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Products Grid - Grouped by Provider */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl" role="status">
          <Package className="h-16 w-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" aria-hidden="true" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            {searchQuery || selectedProvider !== 'all' ? 'No products found' : 'No API products yet'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {searchQuery || selectedProvider !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Get started by adding your first API product'}
          </p>
          {!searchQuery && selectedProvider === 'all' && providers.length > 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
              Add Your First Product
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8" role="region" aria-label="API Products grouped by provider">
          {Object.values(groupedProducts).map((group) => (
            <section key={group.provider.id} className="space-y-4">
              {/* Provider Header */}
              <div className="flex items-center gap-3 pb-2 border-b-2 border-purple-200 dark:border-purple-800">
                <div
                  className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center"
                  aria-hidden="true"
                >
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {group.provider.name}
                </h2>
                <span 
                  className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-full"
                  aria-label={`${group.products.length} ${group.products.length === 1 ? 'product' : 'products'}`}
                >
                  {group.products.length} {group.products.length === 1 ? 'product' : 'products'}
                </span>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {group.products.map((product) => (
                  <article
                    key={product.id}
                    className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-purple-500 dark:hover:border-purple-500 transition-all group focus-within:ring-2 focus-within:ring-purple-500"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0" aria-hidden="true">
                          <Package className="h-6 w-6 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                            {product.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {product.slug}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Spec Status Badge - Clickable if spec exists */}
                    {product.latest_spec_id ? (
                      <Link 
                        href={`/specs/${product.latest_spec_id}`}
                        className="block mb-4 p-3 bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900/80 rounded-lg border border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 transition-all group/spec focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                        aria-label={`View API specification for ${product.name}. Version ${product.latest_spec_version}, ${product.spec_count} ${product.spec_count === 1 ? 'version' : 'versions'} available`}
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" aria-hidden="true" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-green-900 dark:text-green-100">
                              API Spec Available
                            </p>
                            <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300 mt-0.5">
                              <span>Version {product.latest_spec_version}</span>
                              <span aria-hidden="true">•</span>
                              <span>{product.spec_count || 1} {product.spec_count === 1 ? 'version' : 'versions'}</span>
                              {product.latest_spec_uploaded_at && (
                                <>
                                  <span aria-hidden="true">•</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" aria-hidden="true" />
                                    <span>{formatRelativeTime(product.latest_spec_uploaded_at)}</span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 group-hover/spec:translate-x-1 transition-transform" aria-hidden="true" />
                        </div>
                      </Link>
                    ) : (
                      <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800" role="status">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" aria-hidden="true" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                              No API Spec
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                              Upload to get started
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {product.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                        {product.description}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="space-y-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                      {/* View + Upload */}
                      <div className="flex items-center gap-2">
                        {product.latest_spec_id && (
                          <Link
                            href={`/specs/${product.latest_spec_id}`}
                            className={`flex-1 ${actionButtonSpec}`}
                          >
                            <FileText className="h-4 w-4" aria-hidden="true" />
                            View Spec
                          </Link>
                        )}
                        <button
                          onClick={() => setUploadingProduct(product)}
                          className={`${product.latest_spec_id ? 'flex-1' : 'w-full'} ${actionButtonSecondary}`}
                          aria-label={product.latest_spec_id ? `Update specification for ${product.name}` : `Upload specification for ${product.name}`}
                        >
                          <Upload className="h-4 w-4" aria-hidden="true" />
                          {product.latest_spec_id ? 'Update Spec' : 'Upload Spec'}
                        </button>
                      </div>

                      {/* Edit and Delete - provider style */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg transition-all"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Edit2 className="h-4 w-4" aria-hidden="true" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingProduct(product)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium rounded-lg transition-all"
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <AddApiProductModal
          providers={providers}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadData();
            setShowAddModal(false);
          }}
          defaultProviderId={filterProviderId}
        />
      )}

      {editingProduct && (
        <EditApiProductModal
          product={editingProduct}
          providers={providers}
          onClose={() => setEditingProduct(null)}
          onSuccess={() => {
            loadData();
            setEditingProduct(null);
          }}
        />
      )}

      {deletingProduct && (
        <DeleteConfirmDialog
          title="Delete API Product"
          message={`Are you sure you want to delete "${deletingProduct.name}"? This will permanently remove all specs, versions, diffs, and stored files.
            This action cannot be undone.`}
          onConfirm={() => handleDelete(deletingProduct)}
          onCancel={() => setDeletingProduct(null)}
        />
      )}

      {uploadingProduct && (
        <UploadSpecModal
            product={uploadingProduct}
            onClose={() => setUploadingProduct(null)}
            onSuccess={() => {
            setUploadingProduct(null);
            loadData(); // Reload to show updated spec info
            toast.success('API Spec uploaded successfully', {
              description: 'Your specification is now available',
              duration: 5000,
            });
            }}
        />
        )}
    </div>
  );
}
