'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { createApiProduct } from '@/lib/api';
import type { ApiProductCreate, Provider } from '@/lib/types';

interface AddApiProductModalProps {
  providers: Provider[];
  onClose: () => void;
  onSuccess: () => void;
  defaultProviderId?: string | null;
}

export function AddApiProductModal({ providers, onClose, onSuccess, defaultProviderId }: AddApiProductModalProps) {
  const [formData, setFormData] = useState<ApiProductCreate>({
    name: '',
    slug: '',
    provider_id: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  // Set default provider when modal opens or defaultProviderId changes
  useEffect(() => {
    if (defaultProviderId && providers.some(p => p.id === defaultProviderId)) {
      setFormData(prev => ({ ...prev, provider_id: defaultProviderId }));
    }
    setShowValidation(false);
  }, [defaultProviderId, providers]);

  // Auto-generate slug from name
  function handleNameChange(name: string) {
    setFormData({
      ...formData,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate required fields
    if (!formData.name.trim()) {
      setError('Product name is required');
      setLoading(false);
      return;
    }

    if (!formData.slug.trim()) {
      setError('Slug is required');
      setLoading(false);
      return;
    }

    if (!formData.provider_id) {
      setShowValidation(true);
      toast.error('Validation failed', {
        description: 'Please select a provider',
      });
      setLoading(false);
      return;
    }

    // Clean data
    const cleanData: ApiProductCreate = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      provider_id: formData.provider_id,
      description: formData.description?.trim() || null,
    };

    try {
      await createApiProduct(cleanData);
      toast.success('API Product created successfully', {
        description: `${cleanData.name} is now available`,
      });
      onSuccess();
    } catch (err: any) {
      console.error('Error creating product:', err);
      
      let errorMessage = 'Failed to create API product';
      
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
                .replace('API POST /api-products failed: 400', '')
                .replace('API POST /api-products failed:', '')
                .trim();
            }
          } else {
            errorMessage = err.message
              .replace('API POST /api-products failed: 400', '')
              .replace('API POST /api-products failed:', '')
              .trim();
          }
        }
      }
      
      if (!errorMessage || errorMessage === 'Failed to create API product') {
        errorMessage = 'Validation failed. Please check your input.';
      }
      
      toast.error('Failed to create API product', {
        description: errorMessage || 'Please check your input and try again',
      });
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
        aria-labelledby="add-product-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 id="add-product-title" className="text-2xl font-bold text-slate-900 dark:text-white">
            Add API Product
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
            <label htmlFor="provider" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Provider <span className="text-red-500">*</span>
            </label>
            <select
              id="provider"
              value={formData.provider_id}
              onChange={(e) => {
                setFormData({ ...formData, provider_id: e.target.value });
                setShowValidation(false);
              }}
              className={`w-full px-4 py-2 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                !formData.provider_id && showValidation 
                  ? 'border-red-500' 
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <option value="" disabled>Select a provider...</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
            {!formData.provider_id && showValidation && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                Please select a provider
              </p>
            )}
          </div>

          {/* Product Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Payments API"
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              id="slug"
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="e.g., payments-api"
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              URL-friendly identifier (auto-generated from name)
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
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
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}