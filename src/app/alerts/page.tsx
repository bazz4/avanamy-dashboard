'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Bell, Plus, Mail, Webhook, MessageSquare, Play, Trash2, Power, PowerOff } from 'lucide-react';
import { getAlertConfigs, deleteAlertConfig, updateAlertConfig, testAlertConfig } from '@/lib/api';
import type { AlertConfig } from '@/lib/types';
import { AddAlertConfigModal } from '@/components/AddAlertConfigModal';

export default function AlertConfigsPage() {
  const [alertConfigs, setAlertConfigs] = useState<AlertConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadAlertConfigs();
  }, []);

  const loadAlertConfigs = async () => {
    try {
      setLoading(true);
      const data = await getAlertConfigs();
      setAlertConfigs(data);
      setError(null);
    } catch (err) {
      setError('Failed to load alert configurations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this alert configuration?')) return;

    try {
      await deleteAlertConfig(id);
      await loadAlertConfigs();
    } catch (err) {
      console.error('Failed to delete alert config:', err);
      alert('Failed to delete alert configuration');
    }
  };

  const handleToggleEnabled = async (config: AlertConfig) => {
    try {
      await updateAlertConfig(config.id, { enabled: !config.enabled });
      await loadAlertConfigs();
    } catch (err) {
      console.error('Failed to update alert config:', err);
      alert('Failed to update alert configuration');
    }
  };

  const handleTest = async (id: string) => {
    try {
      const result = await testAlertConfig(id);
      alert(`Test result: ${result.message}`);
    } catch (err) {
      console.error('Failed to test alert:', err);
      alert('Failed to send test alert');
    }
  };

  // Calculate stats
  const stats = {
    total: alertConfigs.length,
    enabled: alertConfigs.filter(c => c.enabled).length,
    email: alertConfigs.filter(c => c.alert_type === 'email').length,
    webhook: alertConfigs.filter(c => c.alert_type === 'webhook').length,
    slack: alertConfigs.filter(c => c.alert_type === 'slack').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading alert configurations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <span>Home</span>
          <span>›</span>
          <span className="text-cyan-400">Alert Configurations</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Alert Configurations</h1>
        <p className="text-slate-400">Manage alert rules and notification channels</p>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5"
        >
          <Plus className="h-5 w-5" />
          Add Alert Config
        </button>
        <button 
          onClick={loadAlertConfigs}
          className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-all border border-slate-700"
        >
          <RefreshCw className="h-5 w-5" />
          Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          label="Total Configs"
          value={stats.total}
          icon={<Bell className="h-5 w-5" />}
          color="purple"
        />
        <StatCard
          label="Enabled"
          value={stats.enabled}
          icon={<Power className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          label="Email"
          value={stats.email}
          icon={<Mail className="h-5 w-5" />}
          color="cyan"
        />
        <StatCard
          label="Webhook"
          value={stats.webhook}
          icon={<Webhook className="h-5 w-5" />}
          color="slate"
        />
        <StatCard
          label="Slack"
          value={stats.slack}
          icon={<MessageSquare className="h-5 w-5" />}
          color="slate"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Alert Config Cards */}
      <div className="space-y-6">
        {alertConfigs.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/30 border border-slate-800 rounded-xl">
            <Bell className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">No Alert Configurations</h3>
            <p className="text-slate-500 mb-4">Create your first alert configuration to get notified</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all"
            >
              <Plus className="h-5 w-5 inline mr-2" />
              Add Alert Config
            </button>
          </div>
        ) : (
          alertConfigs.map((config) => (
            <AlertConfigCard 
              key={config.id} 
              config={config}
              onDelete={handleDelete}
              onToggleEnabled={handleToggleEnabled}
              onTest={handleTest}
            />
          ))
        )}
      </div>

      {/* Add Config Modal */}
      <AddAlertConfigModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadAlertConfigs}
      />
    </div>
  );
}

// Stats Card Component
function StatCard({ 
  label, 
  value, 
  icon, 
  color 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string;
}) {
  const colorClasses = {
    purple: 'bg-purple-500/10 text-purple-400',
    green: 'bg-green-500/10 text-green-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
    slate: 'bg-slate-500/10 text-slate-400',
  }[color];

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium mb-2">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Alert Config Card Component
function AlertConfigCard({ 
  config,
  onDelete,
  onToggleEnabled,
  onTest
}: { 
  config: AlertConfig;
  onDelete: (id: string) => void;
  onToggleEnabled: (config: AlertConfig) => void;
  onTest: (id: string) => void;
}) {
  const [testing, setTesting] = useState(false);

  const getAlertTypeIcon = () => {
    switch (config.alert_type) {
      case 'email':
        return <Mail className="h-5 w-5 text-cyan-400" />;
      case 'webhook':
        return <Webhook className="h-5 w-5 text-purple-400" />;
      case 'slack':
        return <MessageSquare className="h-5 w-5 text-green-400" />;
    }
  };

  const handleTest = async () => {
    setTesting(true);
    await onTest(config.id);
    setTesting(false);
  };

  return (
    <div className={`bg-slate-900/50 border rounded-xl p-6 transition-all ${
      config.enabled 
        ? 'border-slate-800 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10' 
        : 'border-slate-800 opacity-60'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4 flex-1">
          <div className="p-3 bg-slate-800 rounded-lg">
            {getAlertTypeIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-white">
                {config.alert_type.charAt(0).toUpperCase() + config.alert_type.slice(1)} Alert
              </h3>
              {config.enabled ? (
                <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold">
                  ENABLED
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-slate-500/10 border border-slate-500/30 text-slate-400 text-xs font-bold">
                  DISABLED
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 font-mono">{config.destination}</p>
          </div>
        </div>
      </div>

      {/* Alert Triggers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-6 border-t border-b border-slate-800">
        <TriggerBadge enabled={config.alert_on_breaking_changes} label="Breaking Changes" />
        <TriggerBadge enabled={config.alert_on_non_breaking_changes} label="Non-Breaking Changes" />
        <TriggerBadge enabled={config.alert_on_endpoint_failures} label="Endpoint Failures" />
        <TriggerBadge enabled={config.alert_on_endpoint_recovery} label="Endpoint Recovery" />
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleTest}
          disabled={testing || !config.enabled}
          className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:border-purple-400 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className={`h-4 w-4 inline mr-2 ${testing ? 'animate-pulse' : ''}`} />
          {testing ? 'Testing...' : 'Test Alert'}
        </button>
        <button
          onClick={() => onToggleEnabled(config)}
          className={`px-4 py-2 font-semibold rounded-lg transition-all border ${
            config.enabled
              ? 'bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 border-slate-500/30 hover:border-slate-400'
              : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/30 hover:border-green-400'
          }`}
        >
          {config.enabled ? (
            <>
              <PowerOff className="h-4 w-4 inline mr-2" />
              Disable
            </>
          ) : (
            <>
              <Power className="h-4 w-4 inline mr-2" />
              Enable
            </>
          )}
        </button>
        <button
          onClick={() => onDelete(config.id)}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-400 font-semibold rounded-lg transition-all ml-auto"
        >
          <Trash2 className="h-4 w-4 inline mr-2" />
          Delete
        </button>
      </div>
    </div>
  );
}

// Trigger Badge Component
function TriggerBadge({ enabled, label }: { enabled: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      enabled 
        ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
        : 'bg-slate-800 text-slate-500 border border-slate-700'
    }`}>
      <div className={`h-2 w-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-slate-600'}`} />
      <span className="text-xs font-semibold">{label}</span>
    </div>
  );
}