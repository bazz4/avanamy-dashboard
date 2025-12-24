'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { updateWatchedAPI } from '@/lib/api';
import type { WatchedAPI } from '@/lib/types';

interface EditWatchedAPIModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  watchedAPI: WatchedAPI | null;
}

export function EditWatchedAPIModal({ isOpen, onClose, onSuccess, watchedAPI }: EditWatchedAPIModalProps) {
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    polling_frequency: 'daily' as 'hourly' | 'daily' | 'weekly',
    polling_enabled: true,
  });

  useEffect(() => {
    if (watchedAPI) {
      setFormData({
        polling_frequency: watchedAPI.polling_frequency,
        polling_enabled: watchedAPI.polling_enabled,
      });
    }
  }, [watchedAPI]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!watchedAPI) return;

    try {
      setSubmitting(true);
      await updateWatchedAPI(watchedAPI.id, formData);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to update watched API:', err);
      alert('Failed to update watched API. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !watchedAPI) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-purple-500/20 max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Edit Watched API</h2>
            <p className="text-sm text-slate-400 mt-1">
              {watchedAPI.provider_name && watchedAPI.product_name 
                ? `${watchedAPI.provider_name} - ${watchedAPI.product_name}`
                : watchedAPI.spec_url}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

          {/* Polling Enabled */}
          <div>
            <label className="flex items-center gap-3 p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors">
              <input
                type="checkbox"
                checked={formData.polling_enabled}
                onChange={(e) => setFormData(prev => ({ ...prev, polling_enabled: e.target.checked }))}
                className="w-5 h-5 rounded border-slate-600 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900"
              />
              <div className="flex-1">
                <div className="font-semibold text-white">Enable Polling</div>
                <div className="text-xs text-slate-400">Automatically poll this API on schedule</div>
              </div>
            </label>
          </div>

          {/* API Info (Read-only) */}
          <div className="pt-6 border-t border-slate-800">
            <p className="text-sm font-semibold text-slate-500 mb-3">API Information (read-only)</p>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-slate-600">Spec URL</p>
                <p className="text-sm text-slate-300 font-mono break-all">{watchedAPI.spec_url}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-xs text-slate-600">Status</p>
                  <p className="text-sm text-slate-300 capitalize">{watchedAPI.status}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Last Polled</p>
                  <p className="text-sm text-slate-300">
                    {watchedAPI.last_polled_at 
                      ? new Date(watchedAPI.last_polled_at).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
              </div>
            </div>
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
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}