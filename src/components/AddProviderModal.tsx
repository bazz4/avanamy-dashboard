'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { createProvider } from '@/lib/api';
import type { ProviderCreate } from '@/lib/types';

interface AddProviderModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddProviderModal({ onClose, onSuccess }: AddProviderModalProps) {
  const [formData, setFormData] = useState<ProviderCreate>({
    name: '',
    slug: '',
    website: '',
    logo_url: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name
  function handleNameChange(name: string) {
    setFormData({
      ...formData,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    });
  }

  // Normalize URL - prepend https:// if no protocol
  function normalizeUrl(url: string): string {
    if (!url.trim()) return url;
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }

  // Handle website blur (normalize URL)
  function handleWebsiteBlur() {
    if (formData.website) {
      setFormData({
        ...formData,
        website: normalizeUrl(formData.website),
      });
    }
  }

  // Handle logo URL blur (normalize URL)
  function handleLogoUrlBlur() {
    if (formData.logo_url) {
      setFormData({
        ...formData,
        logo_url: normalizeUrl(formData.logo_url),
      });
    }
  }

  // Validate URL format properly
  function isValidUrl(url: string): boolean {
    if (!url.trim()) return true; // Empty is OK (optional field)
    
    const trimmed = url.trim();
    
    // Check for spaces (invalid in URLs)
    if (trimmed.includes(' ')) {
      console.log('URL has spaces:', trimmed);
      return false;
    }
    
    try {
      const parsed = new URL(trimmed);
      
      console.log('Parsed URL:', {
        href: parsed.href,
        protocol: parsed.protocol,
        hostname: parsed.hostname,
      });
      
      // Must be http or https
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        console.log('Invalid protocol:', parsed.protocol);
        return false;
      }
      
      // Must have valid hostname (no spaces)
      if (!parsed.hostname || parsed.hostname.trim() === '') {
        console.log('Empty hostname');
        return false;
      }
      
      // Hostname must have at least one dot (example.com)
      if (!parsed.hostname.includes('.')) {
        console.log('No dot in hostname:', parsed.hostname);
        return false;
      }
      
      // Hostname must not have spaces
      if (parsed.hostname.includes(' ')) {
        console.log('Hostname has spaces:', parsed.hostname);
        return false;
      }
      
      console.log('URL is valid!');
      return true;
    } catch (err) {
      console.log('URL parse error:', err);
      return false;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log('=== VALIDATION STARTING ===');
    console.log('Form data:', formData);

    // Validate required fields
    if (!formData.name.trim()) {
      console.log('❌ Name validation failed');
      setError('Provider name is required');
      setLoading(false);
      return;
    }
    console.log('✅ Name validation passed');

    if (!formData.slug.trim()) {
      console.log('❌ Slug validation failed');
      setError('Slug is required');
      setLoading(false);
      return;
    }
    console.log('✅ Slug validation passed');

    // Validate URL format if provided
    if (formData.website && formData.website.trim()) {
      console.log('Checking website URL:', formData.website);
      if (!isValidUrl(formData.website)) {
        console.log('❌ Website validation failed');
        setError('Please enter a valid website URL (e.g., https://stripe.com)');
        setLoading(false);
        return;
      }
      console.log('✅ Website validation passed');
    }

    if (formData.logo_url && formData.logo_url.trim()) {
      console.log('Checking logo URL:', formData.logo_url);
      if (!isValidUrl(formData.logo_url)) {
        console.log('❌ Logo URL validation failed');
        setError('Please enter a valid logo URL (e.g., https://example.com/logo.png)');
        setLoading(false);
        return;
      }
      console.log('✅ Logo URL validation passed');
    }

    // Clean data - remove empty strings and send null instead
    const cleanData: ProviderCreate = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      website: formData.website?.trim() || null,
      logo_url: formData.logo_url?.trim() || null,
      description: formData.description?.trim() || null,
    };

    console.log('✅ All validation passed! Sending:', cleanData);

    try {
      await createProvider(cleanData);
      onSuccess();
    } catch (err: any) {
      console.error('❌ API Error:', err);
      console.log('Error object:', {
        message: err?.message,
        detail: err?.detail,
        response: err?.response,
      });
      
      // Parse backend error for better messages
      let errorMessage = 'Failed to create provider';
      
      // Try to get the detail from the error
      if (err?.detail) {
        errorMessage = err.detail;
      } else if (err?.message) {
        // Check if message contains 'already exists'
        if (err.message.includes('already exists')) {
          errorMessage = 'A provider with this slug already exists. Please use a different slug.';
        } 
        // Try to extract JSON from error message
        else {
          // Look for JSON in the error message
          const jsonMatch = err.message.match(/\{.*\}/);
          if (jsonMatch) {
            try {
              const errorData = JSON.parse(jsonMatch[0]);
              if (errorData.detail) {
                errorMessage = errorData.detail;
              }
            } catch {
              // If JSON parsing fails, use the original message
              errorMessage = err.message
                .replace('API POST /providers failed: 400', '')
                .replace('API POST /providers failed:', '')
                .trim();
            }
          } else {
            errorMessage = err.message
              .replace('API POST /providers failed: 400', '')
              .replace('API POST /providers failed:', '')
              .trim();
          }
        }
      }
      
      // Fallback if message is empty
      if (!errorMessage || errorMessage === 'Failed to create provider') {
        errorMessage = 'Validation failed. Please check your input.';
      }
      
      console.log('Final error message:', errorMessage);
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
        aria-labelledby="add-provider-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 id="add-provider-title" className="text-2xl font-bold text-slate-900 dark:text-white">
            Add Provider
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
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Provider Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Provider Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Stripe"
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
              placeholder="e.g., stripe"
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              URL-friendly identifier (auto-generated from name)
            </p>
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Website
            </label>
            <input
              id="website"
              type="text"
              value={formData.website || ''}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              onBlur={handleWebsiteBlur}
              placeholder="stripe.com (https:// will be added automatically)"
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              https:// will be added automatically if not provided
            </p>
          </div>

          {/* Logo URL */}
          <div>
            <label htmlFor="logo_url" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Logo URL
            </label>
            <input
              id="logo_url"
              type="text"
              value={formData.logo_url || ''}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              onBlur={handleLogoUrlBlur}
              placeholder="example.com/logo.png (https:// will be added automatically)"
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              https:// will be added automatically if not provided
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
              {loading ? 'Creating...' : 'Create Provider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}