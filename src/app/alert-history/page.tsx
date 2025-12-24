'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, XCircle, Clock, Filter, ExternalLink } from 'lucide-react';
import { getAlertHistory } from '@/lib/api';
import type { AlertHistory } from '@/lib/types';

export default function AlertHistoryPage() {
  const [alerts, setAlerts] = useState<AlertHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadAlerts(true); // Show loading spinner on initial load
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(() => {
      loadAlerts(false); // No loading spinner on auto-refresh
    }, 15000);
    
    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [severityFilter, statusFilter]);

  const loadAlerts = async (showLoadingSpinner = false) => {
    try {
      setRefreshing(true);
      if (showLoadingSpinner) {
        setLoading(true);
      }
      const params: any = { limit: 100 };
      if (severityFilter) params.severity = severityFilter;
      if (statusFilter) params.status = statusFilter;
      
      const data = await getAlertHistory(params);
      setAlerts(data);
      setError(null);
    } catch (err) {
      setError('Failed to load alert history');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'info':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-slate-400" />;
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      breaking_change: 'Breaking Change',
      non_breaking_change: 'Non-Breaking Change',
      endpoint_down: 'Endpoint Down',
      endpoint_recovered: 'Endpoint Recovered',
      consecutive_failures: 'Consecutive Failures',
    };
    return labels[reason] || reason;
  };

  // Calculate stats
  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    sent: alerts.filter(a => a.status === 'sent').length,
    failed: alerts.filter(a => a.status === 'failed').length,
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading alert history...</span>
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
            <span className="text-cyan-400">Alert History</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {refreshing ? (
              <>
                <RefreshCw className="h-3 w-3 text-cyan-400 animate-spin" />
                <span className="text-cyan-400 font-semibold">Updating...</span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-slate-500">Auto-updating every 15s</span>
              </>
            )}
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Alert History</h1>
        <p className="text-slate-400">Review all alerts sent for your monitored APIs</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Alerts"
          value={stats.total}
          icon={<AlertCircle className="h-5 w-5" />}
          color="purple"
        />
        <StatCard
          label="Critical"
          value={stats.critical}
          icon={<AlertCircle className="h-5 w-5" />}
          color="red"
        />
        <StatCard
          label="Successfully Sent"
          value={stats.sent}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          label="Failed"
          value={stats.failed}
          icon={<XCircle className="h-5 w-5" />}
          color="slate"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
        <Filter className="h-5 w-5 text-slate-400" />
        <div className="flex gap-4 flex-1">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        
        <button
          onClick={() => loadAlerts(false)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-all border border-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Alert List */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/30 border border-slate-800 rounded-xl">
            <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">No Alerts Found</h3>
            <p className="text-slate-500">No alerts match your current filters</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} getSeverityColor={getSeverityColor} getStatusIcon={getStatusIcon} formatTimestamp={formatTimestamp} getReasonLabel={getReasonLabel} />
          ))
        )}
      </div>
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
    red: 'bg-red-500/10 text-red-400',
    green: 'bg-green-500/10 text-green-400',
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

// Alert Card Component
function AlertCard({ 
  alert,
  getSeverityColor,
  getStatusIcon,
  formatTimestamp,
  getReasonLabel
}: { 
  alert: AlertHistory;
  getSeverityColor: (severity: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  formatTimestamp: (timestamp: string | null) => string;
  getReasonLabel: (reason: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-purple-500/30 transition-all">
      {/* Header Row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-white">
              {alert.provider_name && alert.product_name 
                ? `${alert.provider_name} - ${alert.product_name}`
                : 'Unknown API'}
            </h3>
            <span className={`px-3 py-1 rounded-full border text-xs font-bold ${getSeverityColor(alert.severity)}`}>
              {alert.severity.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-slate-400">{getReasonLabel(alert.alert_reason)}</p>
          {alert.endpoint_path && (
            <p className="text-xs text-cyan-400 font-mono mt-1">
              {alert.http_method} {alert.endpoint_path}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-1">Status</p>
            <div className="flex items-center gap-2">
              {getStatusIcon(alert.status)}
              <span className="text-sm font-semibold text-white capitalize">{alert.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 py-4 border-t border-slate-800">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
            Created
          </p>
          <p className="text-sm text-slate-300 font-semibold">
            {formatTimestamp(alert.created_at)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
            Sent At
          </p>
          <p className="text-sm text-slate-300 font-semibold">
            {formatTimestamp(alert.sent_at)}
          </p>
        </div>
        {alert.error_message && (
          <div className="col-span-2 lg:col-span-1">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
              Error
            </p>
            <p className="text-sm text-red-400 font-mono">
              {alert.error_message}
            </p>
          </div>
        )}
      </div>

      {/* Expandable Details */}
      {alert.payload && (
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            {expanded ? 'Hide Details' : 'View Details'}
          </button>
          {expanded && (
            <pre className="mt-3 p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 overflow-x-auto">
              {JSON.stringify(alert.payload, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}