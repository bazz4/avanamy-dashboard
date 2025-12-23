'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2, Bell, Mail, Webhook, MessageSquare } from 'lucide-react';
import { createAlertConfig, getWatchedAPIs } from '@/lib/api';
import type { WatchedAPI } from '@/lib/types';

interface AddAlertConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddAlertConfigModal({ isOpen, onClose, onSuccess }: AddAlertConfigModalProps) {
  const [watchedAPIs, setWatchedAPIs] = useState<WatchedAPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    watched_api_id: '',
    alert_type: 'email' as 'email' | 'webhook' | 'slack',
    destination: '',
    alert_on_breaking_changes: true,
    alert_on_non_breaking_changes: false,
    alert_on_endpoint_failures: true,
    alert_on_endpoint_recovery: false,
    enabled: true,
  });
  
  const [errors, setErrors] = useState({
    watched_api_id: '',
    destination: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadWatchedAPIs();
    }
  }, [isOpen]);

  const loadWatchedAPIs = async () => {
    try {
      setLoading(true);
      const data = await getWatchedAPIs();
      setWatchedAPIs(data);
    } catch (err) {
      console.error('Failed to load watched APIs:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {
      watched_api_id: '',
      destination: '',
    };

    if (!formData.watched_api_id) {
      newErrors.watched_api_id = 'Please select a watched API';
    }
    
    if (!formData.destination) {
      newErrors.destination = 'Destination is required';
    } else {
      // Validate based on alert type
      if (formData.alert_type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.destination)) {
          newErrors.destination = 'Please enter a valid email address';
        }
      } else if (formData.alert_type === 'webhook') {
        try {
          new URL(formData.destination);
        } catch {
          newErrors.destination = 'Please enter a valid webhook URL';
        }
      } else if (formData.alert_type === 'slack') {
        if (!formData.destination.startsWith('#') && !formData.destination.startsWith('@')) {
          newErrors.destination = 'Slack channel should start with # or @';
        }
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
      await createAlertConfig(formData);
      
      // Reset form and close
      setFormData({
        watched_api_id: '',
        alert_type: 'email',
        destination: '',
        alert_on_breaking_changes: true,
        alert_on_non_breaking_changes: false,
        alert_on_endpoint_failures: true,
        alert_on_endpoint_recovery: false,
        enabled: true,
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to create alert config:', err);
      alert('Failed to create alert configuration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getDestinationPlaceholder = () => {
    switch (formData.alert_type) {
      case 'email':
        return 'alerts@company.com';
      case 'webhook':
        return 'https://your-webhook-url.com/alerts';
      case 'slack':
        return '#alerts-channel';
      default:
        return '';
    }
  };

  const getDestinationIcon = () => {
    switch (formData.alert_type) {
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'webhook':
        return <Webhook className="h-5 w-5" />;
      case 'slack':
        return <MessageSquare className="h-5 w-5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-purple-500/20 max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Add Alert Configuration</h2>
            <p className="text-sm text-slate-400 mt-1">Configure alerts for API monitoring</p>
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
          {/* Watched API Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Watched API *
            </label>
            <select
              value={formData.watched_api_id}
              onChange={(e) => setFormData(prev => ({ ...prev, watched_api_id: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">Select a watched API...</option>
              {watchedAPIs.map((api) => (
                <option key={api.id} value={api.id}>
                  {api.provider_name && api.product_name 
                    ? `${api.provider_name} - ${api.product_name}`
                    : api.spec_url}
                </option>
              ))}
            </select>
            {errors.watched_api_id && (
              <p className="text-sm text-red-400 mt-1">{errors.watched_api_id}</p>
            )}
          </div>

          {/* Alert Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Alert Type *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['email', 'webhook', 'slack'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, alert_type: type, destination: '' }))}
                  className={`px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    formData.alert_type === type
                      ? 'bg-purple-500/20 text-purple-400 border-2 border-purple-500'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {type === 'email' && <Mail className="h-4 w-4" />}
                  {type === 'webhook' && <Webhook className="h-4 w-4" />}
                  {type === 'slack' && <MessageSquare className="h-4 w-4" />}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Destination */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">
              Destination *
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                {getDestinationIcon()}
              </div>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                placeholder={getDestinationPlaceholder()}
                className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            {errors.destination && (
              <p className="text-sm text-red-400 mt-1">{errors.destination}</p>
            )}
          </div>

          {/* Alert Triggers */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Alert Triggers
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.alert_on_breaking_changes}
                  onChange={(e) => setFormData(prev => ({ ...prev, alert_on_breaking_changes: e.target.checked }))}
                  className="w-5 h-5 rounded border-slate-600 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900"
                />
                <div className="flex-1">
                  <div className="font-semibold text-white">Breaking Changes</div>
                  <div className="text-xs text-slate-400">Alert when breaking API changes are detected</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.alert_on_non_breaking_changes}
                  onChange={(e) => setFormData(prev => ({ ...prev, alert_on_non_breaking_changes: e.target.checked }))}
                  className="w-5 h-5 rounded border-slate-600 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900"
                />
                <div className="flex-1">
                  <div className="font-semibold text-white">Non-Breaking Changes</div>
                  <div className="text-xs text-slate-400">Alert on any API spec changes</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.alert_on_endpoint_failures}
                  onChange={(e) => setFormData(prev => ({ ...prev, alert_on_endpoint_failures: e.target.checked }))}
                  className="w-5 h-5 rounded border-slate-600 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900"
                />
                <div className="flex-1">
                  <div className="font-semibold text-white">Endpoint Failures</div>
                  <div className="text-xs text-slate-400">Alert when endpoints become unhealthy</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.alert_on_endpoint_recovery}
                  onChange={(e) => setFormData(prev => ({ ...prev, alert_on_endpoint_recovery: e.target.checked }))}
                  className="w-5 h-5 rounded border-slate-600 text-purple-500 focus:ring-purple-500 focus:ring-offset-slate-900"
                />
                <div className="flex-1">
                  <div className="font-semibold text-white">Endpoint Recovery</div>
                  <div className="text-xs text-slate-400">Alert when endpoints recover from failures</div>
                </div>
              </label>
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
                Creating...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                Create Alert Config
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}