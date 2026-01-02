'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { updateApiProduct } from '@/lib/api';
import type { ApiProduct, ApiProductUpdate, Provider } from '@/lib/types';

interface EditApiProductModalProps {
  product: ApiProduct;
  providers: Provider[];
  onClose: () => void;
  onSuccess: () => void;
}

export function EditApiProductModal({ product, providers, onClose, onSuccess }: EditApiProductModalProps) {
  const [formData, setFormData] = useState<ApiProductUpdate>({
    name: product.name,
    slug: product.slug,
    provider_id: product.provider_id,
    description: product.description,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields
    if (formData.name && !formData.name.trim()) {
      setError('Product name cannot be empty');
      setLoading(false);
      return;
    }

    if (formData.slug && !formData.slug.trim()) {
      setError('Slug cannot be empty');
      setLoading(false);
      return;
    }

    try {
      await updateApiProduct(product.id, formData);
      onSuccess();
    } catch (err: any) {
      console.error('Error updating product:', err);
      
      let errorMessage = 'Failed to update API product';
      
      if (err?.detail) {
        errorMessage = err.detail;
      } else if (err?.message) {
        if (err.message.includes('already exists')) {
          errorMessage = 'An API product with this slug already exists for this provider.';
        } else {
          const jsonMatch = err.message.match(/\{.*\}/);
          if (jsonMatch) {
            try {
              const errorData = JSON.parse(jsonMatch[0]);
              if (errorData.detail) {
                errorMessage = errorData.detail;
              }
            } catch {
              errorMessage = err.message
                .replace(`API PUT /api-products/${product.id} failed: 400`, '')
                .replace(`API PUT /api-products/${product.id} failed:`, '')
                .trim();
            }
          } else {
            errorMessage = err.message
              .replace(`API PUT /api-products/${product.id} failed: 400`, '')
              .replace(`API PUT /api-products/${product.id} failed:`, '')
              .trim();
          }
        }
      }
      
      if (!errorMessage || errorMessage === 'Failed to update API product') {
        errorMessage = 'Validation failed. Please check your input.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="edit-product-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 id="edit-product-title" className="text-2xl font-bold text-slate-900 dark:text-white">
            Edit API Product
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
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Provider Selection */}
          <div>
            <label htmlFor="edit-provider" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Provider <span className="text-red-500">*</span>
            </label>
            <select
              id="edit-provider"
              value={formData.provider_id || ''}
              onChange={(e) => setFormData({ ...formData, provider_id: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Name */}
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-name"
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Payments API"
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
              value={formData.slug || ''}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="e.g., payments-api"
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              URL-friendly identifier
            </p>
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
              placeholder="Payment processing and billing API"
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