'use client';

import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw, Radio, AlertCircle, Activity, Clock } from 'lucide-react';
import { getWatchedAPIs, triggerPoll } from '@/lib/api';
import type { WatchedAPI } from '@/lib/types';
import { AddWatchedAPIModal } from '@/components/AddWatchedAPIModal';

export default function WatchedAPIsPage() {
  const [watchedAPIs, setWatchedAPIs] = useState<WatchedAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadWatchedAPIs();
  }, []);

  const loadWatchedAPIs = async () => {
    try {
      setLoading(true);
      const data = await getWatchedAPIs();
      setWatchedAPIs(data);
      setError(null);
    } catch (err) {
      setError('Failed to load watched APIs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePollNow = async (id: string) => {
    try {
      await triggerPoll(id);
      // Reload the list to get updated status
      await loadWatchedAPIs();
    } catch (err) {
      console.error('Failed to trigger poll:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'error':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Calculate stats
  const stats = {
    total: watchedAPIs.length,
    active: watchedAPIs.filter(api => api.polling_enabled).length,
    healthy: watchedAPIs.filter(api => api.status === 'healthy').length,
    alerts: watchedAPIs.reduce((sum, api) => sum + (api.consecutive_failures || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading watched APIs...</span>
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
          <span className="text-cyan-400">Watched APIs</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Watched APIs</h1>
        <p className="text-slate-400">Monitor external APIs for changes and breaking updates</p>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5"
        >
          <Plus className="h-5 w-5" />
          Add Watched API
        </button>
        <button 
          onClick={loadWatchedAPIs}
          className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-all border border-slate-700"
        >
          <RefreshCw className="h-5 w-5" />
          Refresh All
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Watched"
          value={stats.total}
          icon={<Radio className="h-5 w-5" />}
          color="purple"
          change="+2 this week"
        />
        <StatCard
          label="Active Monitoring"
          value={stats.active}
          icon={<Activity className="h-5 w-5" />}
          color="green"
          change="100% uptime"
        />
        <StatCard
          label="Healthy"
          value={stats.healthy}
          icon={<AlertCircle className="h-5 w-5" />}
          color="cyan"
          change={`${stats.total - stats.healthy} issues`}
        />
        <StatCard
          label="Total Failures"
          value={stats.alerts}
          icon={<Clock className="h-5 w-5" />}
          color="slate"
          change="Last 7 days"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* API Cards */}
      <div className="space-y-6">
        {watchedAPIs.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/30 border border-slate-800 rounded-xl">
            <Radio className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">No Watched APIs</h3>
            <p className="text-slate-500 mb-4">Get started by adding your first API to monitor</p>
            <button className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all">
              <Plus className="h-5 w-5 inline mr-2" />
              Add Your First API
            </button>
          </div>
        ) : (
          watchedAPIs.map((api) => (
            <APICard 
              key={api.id} 
              api={api} 
              onPollNow={handlePollNow}
              getStatusColor={getStatusColor}
              getStatusDot={getStatusDot}
              formatTimestamp={formatTimestamp}
            />
          ))
        )}
      </div>
      {/* Add API Modal */}
      <AddWatchedAPIModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadWatchedAPIs}
      />
    </div>
  );
}

// Stats Card Component
function StatCard({ 
  label, 
  value, 
  icon, 
  color, 
  change 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string;
  change: string;
}) {
  const colorClasses = {
    purple: 'bg-purple-500/10 text-purple-400',
    green: 'bg-green-500/10 text-green-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
    slate: 'bg-slate-500/10 text-slate-400',
  }[color];

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-slate-500 font-medium mb-2">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          <p className="text-xs text-slate-600 mt-2">{change}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// API Card Component
function APICard({ 
  api, 
  onPollNow,
  getStatusColor,
  getStatusDot,
  formatTimestamp
}: { 
  api: WatchedAPI; 
  onPollNow: (id: string) => void;
  getStatusColor: (status: string) => string;
  getStatusDot: (status: string) => string;
  formatTimestamp: (timestamp: string | null) => string;
}) {
  const [polling, setPolling] = useState(false);

  const handlePoll = async () => {
    setPolling(true);
    await onPollNow(api.id);
    setPolling(false);
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all hover:-translate-y-1">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">
            {api.provider_name && api.product_name 
              ? `${api.provider_name} - ${api.product_name}`
              : api.product_name || api.provider_name || 'Unknown API'}
          </h3>
          <p className="text-sm text-cyan-400 font-mono break-all">
            {api.spec_url}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-bold text-sm ${getStatusColor(api.status)}`}>
          <div className={`h-2 w-2 rounded-full ${getStatusDot(api.status)} animate-pulse`}></div>
          <span className="capitalize">{api.status || 'Unknown'}</span>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-6 border-t border-b border-slate-800">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
            Polling Frequency
          </p>
          <p className="text-sm text-slate-300 font-semibold">
            {api.polling_frequency || 'Not set'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
            Last Polled
          </p>
          <p className="text-sm text-slate-300 font-semibold">
            {formatTimestamp(api.last_polled_at)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
            Current Version
          </p>
          <p className="text-sm text-purple-400 font-bold">
            {api.last_version_detected || 'Unknown'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
            Consecutive Failures
          </p>
          <p className="text-sm text-slate-300 font-semibold">
            {api.consecutive_failures || 0}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handlePoll}
          disabled={polling}
          className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:border-purple-400 font-semibold rounded-lg transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 inline mr-2 ${polling ? 'animate-spin' : ''}`} />
          {polling ? 'Polling...' : 'Poll Now'}
        </button>
        <button className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 font-semibold rounded-lg transition-all">
          View Health
        </button>
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 font-semibold rounded-lg transition-all">
          Configure Alerts
        </button>
      </div>      
    </div>
  );
}
