'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Building2,
  Package,
  AlertTriangle,
  Clock,
  Upload,
  ChevronDown,
  Eye,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { getAllApiSpecs } from '@/lib/api';
import type { ApiSpecEnriched } from '@/lib/types';
import { UploadSpecModal } from '@/components/UploadSpecModal';

export default function ApiSpecsPage() {
  const { isLoaded } = useAuth();
  const [specs, setSpecs] = useState<ApiSpecEnriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'provider' | 'updated'>('provider');
  const [uploadingForProduct, setUploadingForProduct] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    loadSpecs();
  }, [isLoaded]);

  async function loadSpecs() {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllApiSpecs();
      setSpecs(data);
    } catch (err) {
      console.error('Error loading specs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load specifications');
      toast.error('Failed to load specifications');
    } finally {
      setLoading(false);
    }
  }

  // Get unique providers and products for filters
  const providers = useMemo(() => {
    const providerMap = new Map<string, { id: string; name: string }>();
    specs.forEach(spec => {
      if (!providerMap.has(spec.provider_id)) {
        providerMap.set(spec.provider_id, {
          id: spec.provider_id,
          name: spec.provider_name
        });
      }
    });
    return Array.from(providerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [specs]);

  const products = useMemo(() => {
    const productMap = new Map<string, { id: string; name: string; providerId: string }>();
    specs.forEach(spec => {
      if (!productMap.has(spec.api_product_id)) {
        productMap.set(spec.api_product_id, {
          id: spec.api_product_id,
          name: spec.product_name,
          providerId: spec.provider_id
        });
      }
    });
    const allProducts = Array.from(productMap.values());
    
    // Filter by selected provider if applicable
    if (selectedProvider !== 'all') {
      return allProducts.filter(p => p.providerId === selectedProvider)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return allProducts.sort((a, b) => a.name.localeCompare(b.name));
  }, [specs, selectedProvider]);

  // Filter and sort specs
  const filteredAndSortedSpecs = useMemo(() => {
    let filtered = specs;

    // Filter by provider
    if (selectedProvider !== 'all') {
      filtered = filtered.filter(s => s.provider_id === selectedProvider);
    }

    // Filter by product
    if (selectedProduct !== 'all') {
      filtered = filtered.filter(s => s.api_product_id === selectedProduct);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s =>
          s.name.toLowerCase().includes(query) ||
          s.provider_name.toLowerCase().includes(query) ||
          s.product_name.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'updated') {
        // Most recent first
        const aDate = a.latest_version_created_at ? new Date(a.latest_version_created_at).getTime() : 0;
        const bDate = b.latest_version_created_at ? new Date(b.latest_version_created_at).getTime() : 0;
        return bDate - aDate;
      }

      const providerCompare = a.provider_name.localeCompare(b.provider_name);
      if (providerCompare !== 0) return providerCompare;
      const productCompare = a.product_name.localeCompare(b.product_name);
      if (productCompare !== 0) return productCompare;
      return a.name.localeCompare(b.name);
    });

    return sorted;
  }, [specs, selectedProvider, selectedProduct, searchQuery, sortBy]);

  // Group specs by provider → product
  const groupedSpecs = useMemo(() => {
    const groups: Record<string, {
      provider: { id: string; name: string; slug: string };
      products: Record<string, {
        product: { id: string; name: string; slug: string };
        specs: ApiSpecEnriched[];
      }>;
    }> = {};

    filteredAndSortedSpecs.forEach(spec => {
      // Initialize provider group
      if (!groups[spec.provider_id]) {
        groups[spec.provider_id] = {
          provider: {
            id: spec.provider_id,
            name: spec.provider_name,
            slug: spec.provider_slug
          },
          products: {}
        };
      }

      // Initialize product group within provider
      if (!groups[spec.provider_id].products[spec.api_product_id]) {
        groups[spec.provider_id].products[spec.api_product_id] = {
          product: {
            id: spec.api_product_id,
            name: spec.product_name,
            slug: spec.product_slug
          },
          specs: []
        };
      }

      // Add spec to product group
      groups[spec.provider_id].products[spec.api_product_id].specs.push(spec);
    });

    return groups;
  }, [filteredAndSortedSpecs]);

  // Format relative time
  function formatRelativeTime(dateString: string | null): string {
    if (!dateString) return 'Never updated';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) !== 1 ? 's' : ''} ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} month${Math.floor(diffInDays / 30) !== 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInDays / 365)} year${Math.floor(diffInDays / 365) !== 1 ? 's' : ''} ago`;
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500 dark:text-slate-400" role="status" aria-live="polite">
          Loading specifications...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={loadSpecs}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalSpecs = filteredAndSortedSpecs.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-purple-600" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              API Specifications
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Browse and manage all API specifications across providers and products
          </p>
        </div>
        <Link
          href="/api-products"
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          aria-label="Upload new API specification"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          Upload Spec
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label htmlFor="spec-search" className="sr-only">
              Search specifications
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="spec-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search specs, providers, products..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                aria-label="Search specifications by name, provider, or product"
              />
            </div>
          </div>

          {/* Provider Filter */}
          <div>
            <label htmlFor="provider-filter" className="sr-only">
              Filter by provider
            </label>
            <div className="relative">
              <select
                id="provider-filter"
                value={selectedProvider}
                onChange={(e) => {
                  setSelectedProvider(e.target.value);
                  setSelectedProduct('all'); // Reset product filter
                }}
                className="w-full appearance-none px-4 py-2 pr-10 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                aria-label="Filter specifications by provider"
              >
                <option value="all">All Providers</option>
                {providers.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Product Filter */}
          <div>
            <label htmlFor="product-filter" className="sr-only">
              Filter by product
            </label>
            <div className="relative">
              <select
                id="product-filter"
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full appearance-none px-4 py-2 pr-10 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                aria-label="Filter specifications by product"
                disabled={products.length === 0}
              >
                <option value="all">All Products</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        {/* Sort and Results Count */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Showing <span className="font-semibold text-slate-900 dark:text-white">{totalSpecs}</span> specification{totalSpecs !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">Sort by:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('provider')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  sortBy === 'provider'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                aria-label="Sort by provider name"
                aria-pressed={sortBy === 'provider'}
              >
                Provider Name
              </button>
              <button
                onClick={() => setSortBy('updated')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  sortBy === 'updated'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                aria-label="Sort by last updated"
                aria-pressed={sortBy === 'updated'}
              >
                Last Updated
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Specs List - Grouped by Provider → Product */}
      {totalSpecs === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 p-12 text-center">
          <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No specifications found
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {searchQuery || selectedProvider !== 'all' || selectedProduct !== 'all'
              ? 'Try adjusting your filters or search query'
              : 'Get started by uploading your first API specification'}
          </p>
          {!searchQuery && selectedProvider === 'all' && selectedProduct === 'all' && (
            <Link
              href="/api-products"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Upload Your First Spec
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedSpecs).map(([providerId, providerGroup]) => (
            <section key={providerId} aria-labelledby={`provider-${providerId}`}>
              {/* Provider Header */}
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="h-5 w-5 text-purple-600" aria-hidden="true" />
                <h2
                  id={`provider-${providerId}`}
                  className="text-xl font-bold text-slate-900 dark:text-white"
                >
                  {providerGroup.provider.name}
                </h2>
                <span className="px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                  Provider
                </span>
              </div>

              {/* Products within Provider */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pl-4">
                {Object.entries(providerGroup.products).map(([productId, productGroup]) => (
                  <div key={productId}>
                    {/* Product Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <Package className="h-4 w-4 text-slate-500" aria-hidden="true" />
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                        {productGroup.product.name}
                      </h3>
                      <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                        Product
                      </span>
                    </div>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-1 gap-4">
                      {productGroup.specs.map(spec => (
                        <article
                          key={spec.id}
                          className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                        >
                          {/* Spec Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                                {spec.name}
                              </h4>
                              {spec.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                  {spec.description}
                                </p>
                              )}
                            </div>
                            {spec.has_breaking_changes && (
                              <span
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded ml-3"
                                role="status"
                                aria-label="Contains breaking changes"
                              >
                                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                                Breaking
                              </span>
                            )}
                          </div>

                          {/* Spec Metadata */}
                          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                            {spec.latest_version !== null && (
                              <span>
                                Version {spec.latest_version}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {formatRelativeTime(spec.latest_version_created_at)}
                            </span>
                            <span>
                              {spec.total_versions} version{spec.total_versions !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/specs/${spec.id}`}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                              aria-label={`View ${spec.name} specification`}
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                              View Spec
                            </Link>
                            <Link
                              href={`/specs/${spec.id}/versions`}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              aria-label={`View version history for ${spec.name}`}
                            >
                              <History className="h-4 w-4" aria-hidden="true" />
                              Versions
                            </Link>
                            <button
                              onClick={() => setUploadingForProduct({
                                id: spec.api_product_id,
                                name: spec.product_name
                              })}
                              className="px-3 py-2 border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              aria-label={`Upload new version for ${spec.name}`}
                            >
                              <Upload className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {uploadingForProduct && (
        <UploadSpecModal
          product={{
            id: uploadingForProduct.id,
            name: uploadingForProduct.name,
            tenant_id: '', // Modal doesn't use this
            provider_id: '', // Modal doesn't use this
            slug: '', // Modal doesn't use this
            description: null,
            created_at: '',
            updated_at: null,
            created_by_user_id: null,
            updated_by_user_id: null,
            provider_name: null,
            provider_slug: null,
            latest_spec_id: null,
            latest_spec_version: null,
            latest_spec_uploaded_at: null
          }}
          onClose={() => setUploadingForProduct(null)}
          onSuccess={() => {
            setUploadingForProduct(null);
            loadSpecs(); // Reload specs after upload
          }}
        />
      )}
    </div>
  );
}
