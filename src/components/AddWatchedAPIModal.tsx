'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { getProviders, getProductsForProvider, createWatchedAPI } from '@/lib/api';
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

  // Load providers on mount
  useEffect(() => {
    if (isOpen) {
      loadProviders();
    }
  }, [isOpen]);

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
      const data = await getProductsForProvider(providerId);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-purple-500/20 max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Add Watched API</h2>
            <p className="text-sm text-slate-400 mt-1">Monitor a new external API for changes</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Provider *
            </label>
            <select
              value={formData.provider_id}
              onChange={(e) => setFormData(prev => ({ ...prev, provider_id: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">Select a provider...</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
            {errors.provider_id && (
              <p className="text-sm text-red-400 mt-1">{errors.provider_id}</p>
            )}
          </div>

          {/* Product Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              API Product *
            </label>
            <select
              value={formData.api_product_id}
              onChange={(e) => setFormData(prev => ({ ...prev, api_product_id: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
              disabled={!formData.provider_id || loading}
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
              <p className="text-sm text-red-400 mt-1">{errors.api_product_id}</p>
            )}
          </div>

          {/* Spec URL */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              OpenAPI Spec URL *
            </label>
            <input
              type="url"
              value={formData.spec_url}
              onChange={(e) => setFormData(prev => ({ ...prev, spec_url: e.target.value }))}
              placeholder="https://api.example.com/openapi.yaml"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
            />
            {errors.spec_url && (
              <p className="text-sm text-red-400 mt-1">{errors.spec_url}</p>
            )}
            <p className="text-xs text-slate-500 mt-2">
              The URL must be publicly accessible and return an OpenAPI specification (JSON or YAML)
            </p>
          </div>

          {/* Polling Frequency */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Polling Frequency
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['hourly', 'daily', 'weekly'] as const).map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, polling_frequency: freq }))}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                    formData.polling_frequency === freq
                      ? 'bg-purple-500/20 text-purple-400 border-2 border-purple-500'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              How often should we check this API for changes?
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800 bg-slate-950/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-all border border-slate-700"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Watched API
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}