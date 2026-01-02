'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { getProviders, getApiProducts, createWatchedAPI } from '@/lib/api';
import type { Provider, ApiProduct } from '@/lib/types';

interface AddWatchedAPIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddWatchedAPIModal({ isOpen, onClose, onSuccess }: AddWatchedAPIModalProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  
  const [formData, setFormData] = useState({
    provider_id: '',
    api_product_id: '',
    spec_url: '',
    polling_frequency: 'daily' as 'hourly' | 'daily' | 'weekly',
  });
  
  const [errors, setErrors] = useState({
    provider_id: '',
    api_product_id: '',
    spec_url: '',
  });

  // Load providers on mount and handle keyboard/focus
  useEffect(() => {
    if (isOpen) {
      loadProviders();
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Load products when provider changes
  useEffect(() => {
    if (formData.provider_id) {
      loadProducts(formData.provider_id);
    } else {
      setProducts([]);
      setFormData(prev => ({ ...prev, api_product_id: '' }));
    }
  }, [formData.provider_id]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await getProviders();
      setProviders(data);
    } catch (err) {
      console.error('Failed to load providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (providerId: string) => {
    try {
      setLoading(true);
      const data = await getApiProducts(providerId);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {
      provider_id: '',
      api_product_id: '',
      spec_url: '',
    };

    if (!formData.provider_id) {
      newErrors.provider_id = 'Provider is required';
    }
    if (!formData.api_product_id) {
      newErrors.api_product_id = 'Product is required';
    }
    if (!formData.spec_url) {
      newErrors.spec_url = 'Spec URL is required';
    } else {
      try {
        new URL(formData.spec_url);
      } catch {
        newErrors.spec_url = 'Must be a valid URL';
      }
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(err => err !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await createWatchedAPI({
        provider_id: formData.provider_id,
        api_product_id: formData.api_product_id,
        spec_url: formData.spec_url,
        polling_frequency: formData.polling_frequency,
      });
      
      // Reset form and close
      setFormData({
        provider_id: '',
        api_product_id: '',
        spec_url: '',
        polling_frequency: 'daily',
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create watched API:', err);
      alert('Failed to add watched API. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-purple-500/20 max-w-2xl w-full max-h-[90vh] overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="add-api-modal-title">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 id="add-api-modal-title" className="text-2xl font-bold text-slate-900 dark:text-white">Add Watched API</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Monitor a new external API for changes</p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5 text-slate-600 dark:text-slate-400" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Provider Selection */}
          <div>
            <label htmlFor="provider-select" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Provider *
            </label>
            <select
              id="provider-select"
              value={formData.provider_id}
              onChange={(e) => setFormData(prev => ({ ...prev, provider_id: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
              aria-required="true"
              aria-invalid={!!errors.provider_id}
              aria-describedby={errors.provider_id ? "provider-error" : undefined}
            >
              <option value="">Select a provider...</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
            {errors.provider_id && (
              <p id="provider-error" className="text-sm text-red-400 mt-1" role="alert">{errors.provider_id}</p>
            )}
          </div>

          {/* Product Selection */}
          <div>
            <label htmlFor="product-select" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              API Product *
            </label>
            <select
              id="product-select"
              value={formData.api_product_id}
              onChange={(e) => setFormData(prev => ({ ...prev, api_product_id: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
              disabled={!formData.provider_id || loading}
              aria-required="true"
              aria-invalid={!!errors.api_product_id}
              aria-describedby={errors.api_product_id ? "product-error" : undefined}
            >
              <option value="">
                {formData.provider_id ? 'Select a product...' : 'Select a provider first'}
              </option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            {errors.api_product_id && (
              <p id="product-error" className="text-sm text-red-400 mt-1" role="alert">{errors.api_product_id}</p>
            )}
          </div>

          {/* Spec URL */}
          <div>
            <label htmlFor="spec-url" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              OpenAPI Spec URL *
            </label>
            <input
              id="spec-url"
              type="url"
              value={formData.spec_url}
              onChange={(e) => setFormData(prev => ({ ...prev, spec_url: e.target.value }))}
              placeholder="https://api.example.com/openapi.yaml"
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              aria-required="true"
              aria-invalid={!!errors.spec_url}
              aria-describedby={errors.spec_url ? "spec-url-error spec-url-help" : "spec-url-help"}
            />
            {errors.spec_url && (
              <p id="spec-url-error" className="text-sm text-red-400 mt-1" role="alert">{errors.spec_url}</p>
            )}
            <p id="spec-url-help" className="text-xs text-slate-500 mt-2">
              The URL must be publicly accessible and return an OpenAPI specification (JSON or YAML)
            </p>
          </div>

          {/* Polling Frequency */}
          <div>
            <fieldset>
              <legend className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Polling Frequency
              </legend>
              <div className="grid grid-cols-3 gap-3" role="group" aria-describedby="polling-help">
                {(['hourly', 'daily', 'weekly'] as const).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, polling_frequency: freq }))}
                    className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                      formData.polling_frequency === freq
                        ? 'bg-purple-500/20 text-purple-400 border-2 border-purple-500'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
                    }`}
                    aria-pressed={formData.polling_frequency === freq}
                  >
                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </button>
                ))}
              </div>
              <p id="polling-help" className="text-xs text-slate-500 mt-2">
                How often should we check this API for changes?
              </p>
            </fieldset>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition-all border border-slate-300 dark:border-slate-700"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            aria-busy={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add Watched API
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}