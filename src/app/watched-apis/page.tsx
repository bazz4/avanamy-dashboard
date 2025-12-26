'use client';

import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw, Radio, AlertCircle, Activity, Clock, X } from 'lucide-react';
import { getWatchedAPIs, triggerPoll, deleteWatchedAPI } from '@/lib/api';
import type { WatchedAPI } from '@/lib/types';
import { PollStatusBadge } from '@/components/PollStatusBadge';
import { AddWatchedAPIModal } from '@/components/AddWatchedAPIModal';
import { EditWatchedAPIModal } from '@/components/EditWatchedAPIModal';

import { ConfirmDialog } from '@/components/ConfirmationDialog';
import { Search, Edit2, Trash2, GitBranch } from 'lucide-react';

export default function WatchedAPIsPage() {
  const [watchedAPIs, setWatchedAPIs] = useState<WatchedAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAPI, setSelectedAPI] = useState<WatchedAPI | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [apiToDelete, setApiToDelete] = useState<WatchedAPI | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWatchedAPIs(true); // Show loading spinner on initial load
    
    // Auto-refresh every 10 seconds (no loading spinner)
    const interval = setInterval(() => {
      loadWatchedAPIs(false);
    }, 10000);
    
    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  const loadWatchedAPIs = async (showLoadingSpinner = false) => {
    try {
      setRefreshing(true);
      if (showLoadingSpinner) {
        setLoading(true);
      }
      const data = await getWatchedAPIs();
      setWatchedAPIs(data);
      setError(null);
    } catch (err) {
      setError('Failed to load watched APIs');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const handleDelete = async (api: WatchedAPI) => {
    setApiToDelete(api);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!apiToDelete) return;
    
    try {
      await deleteWatchedAPI(apiToDelete.id);
      await loadWatchedAPIs();
    } catch (err) {
      console.error('Failed to delete watched API:', err);
      alert('Failed to delete watched API');
    }
  };

  const handleEdit = (api: WatchedAPI) => {
    setSelectedAPI(api);
    setShowEditModal(true);
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
    healthy: watchedAPIs.filter(api => api.consecutive_failures === 0).length,
    alerts: watchedAPIs.reduce((sum, api) => sum + (api.consecutive_failures || 0), 0),
  };

  // Filter watched APIs based on search query
  const filteredAPIs = watchedAPIs.filter(api => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      api.provider_name?.toLowerCase().includes(searchLower) ||
      api.product_name?.toLowerCase().includes(searchLower) ||
      api.spec_url.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Home</span>
            <span>›</span>
            <span className="text-cyan-600 dark:text-cyan-400">Watched APIs</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {refreshing ? (
              <>
                <RefreshCw className="h-3 w-3 text-cyan-600 dark:text-cyan-400 animate-spin" />
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Updating...</span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-slate-500">Auto-updating every 10s</span>
              </>
            )}
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Watched APIs</h1>
        <p className="text-slate-600 dark:text-slate-400">Monitor external APIs for changes and breaking updates</p>
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
          onClick={() => loadWatchedAPIs()}
          disabled={refreshing}
          className="flex items-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition-all border border-slate-300 dark:border-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh All'}
        </button>
      </div>

      {/* Search Bar */}
      {watchedAPIs.length > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by provider, product, or URL..."
            className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

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
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* API Cards */}
      <div className="space-y-6">
        {filteredAPIs.length === 0 && searchQuery ? (
          <div className="text-center py-12 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl">
            <Search className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">No Results Found</h3>
            <p className="text-slate-500 mb-4">No APIs match "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all"
            >
              Clear Search
            </button>
          </div>
        ) : filteredAPIs.length === 0 ? (
          <div className="text-center py-12 bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl">
            <Radio className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">No Watched APIs</h3>
            <p className="text-slate-500 mb-4">Get started by adding your first API to monitor</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all"
            >
              <Plus className="h-5 w-5 inline mr-2" />
              Add Your First API
            </button>
          </div>
        ) : (
          filteredAPIs.map((api) => (
            <APICard
              key={api.id}
              api={api}
              onPollNow={handlePollNow}
              formatTimestamp={formatTimestamp}
              onEdit={handleEdit}      
              onDelete={handleDelete}  
            />
          ))
        )}
      </div>

      {/* Edit Modal */}
      <EditWatchedAPIModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadWatchedAPIs}
        watchedAPI={selectedAPI}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Watched API"
        message={`Are you sure you want to delete monitoring for ${apiToDelete?.provider_name && apiToDelete?.product_name ? `${apiToDelete.provider_name} - ${apiToDelete.product_name}` : 'this API'}? This action cannot be undone.`}
        confirmText="Delete"
        confirmStyle="danger"
      />
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
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm dark:shadow-none hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-slate-500 font-medium mb-2">{label}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
          <p className="text-xs text-slate-500 dark:text-slate-600 mt-2">{change}</p>
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
  formatTimestamp,
  onEdit,     // Add this
  onDelete    // Add this
}: { 
  api: WatchedAPI; 
  onPollNow: (id: string) => void;
  formatTimestamp: (timestamp: string | null) => string;
  onEdit: (api: WatchedAPI) => void;      // Add this
  onDelete: (api: WatchedAPI) => void;    // Add this
}) {
  const [polling, setPolling] = useState(false);

  const handlePoll = async () => {
    setPolling(true);
    await onPollNow(api.id);
    setPolling(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm dark:shadow-none hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all hover:-translate-y-1">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {api.provider_name && api.product_name
              ? `${api.provider_name} - ${api.product_name}`
              : api.product_name || api.provider_name || 'Unknown API'}
          </h3>
          <p className="text-sm text-cyan-700 dark:text-cyan-400 font-mono break-all">
            {api.spec_url}
          </p>
        </div>
        <PollStatusBadge 
          consecutiveFailures={api.consecutive_failures}
          lastError={api.last_error}
        />
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-6 border-t border-b border-slate-200 dark:border-slate-800">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
            Polling Frequency
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">
            {api.polling_frequency || 'Not set'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
            Last Polled
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">
            {formatTimestamp(api.last_polled_at)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
            Current Version
          </p>
          <p className="text-sm text-purple-600 dark:text-purple-400 font-bold">
            {api.last_version_detected || 'Unknown'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
            Consecutive Failures
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">
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
        {api.api_spec_id && (
          <button 
            onClick={() => window.location.href = `/specs/${api.api_spec_id}/versions`}
            className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 font-semibold rounded-lg transition-all"
          >
            <GitBranch className="h-4 w-4 inline mr-2" />
            View Versions
          </button>
        )}
        <button 
          onClick={() => onEdit(api)}
          className="px-4 py-2 bg-slate-500/10 hover:bg-slate-500/20 text-slate-400 border border-slate-500/30 hover:border-slate-400 font-semibold rounded-lg transition-all"
        >
          <Edit2 className="h-4 w-4 inline mr-2" />
          Edit
        </button>
        <button 
          onClick={() => onDelete(api)}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-400 font-semibold rounded-lg transition-all ml-auto"
        >
          <Trash2 className="h-4 w-4 inline mr-2" />
          Delete
        </button>
      </div>
    </div>
  );
}
