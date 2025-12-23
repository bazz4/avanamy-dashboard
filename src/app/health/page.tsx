'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, Activity, TrendingUp, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getAllHealthSummary, getWatchedAPIs } from '@/lib/api';
import type { WatchedAPIHealthSummary, WatchedAPI } from '@/lib/types';

export default function HealthDashboardPage() {
  const [healthSummaries, setHealthSummaries] = useState<WatchedAPIHealthSummary[]>([]);
  const [watchedAPIs, setWatchedAPIs] = useState<WatchedAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState(24);

  useEffect(() => {
    loadData();
  }, [timeWindow]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaries, apis] = await Promise.all([
        getAllHealthSummary(timeWindow),
        getWatchedAPIs()
      ]);
      setHealthSummaries(summaries);
      setWatchedAPIs(apis);
      setError(null);
    } catch (err) {
      setError('Failed to load health data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate overall stats
  const stats = {
    totalAPIs: watchedAPIs.length,
    healthyAPIs: healthSummaries.filter(s => s.uptime_percentage >= 99).length,
    avgUptime: healthSummaries.length > 0
      ? healthSummaries.reduce((sum, s) => sum + s.uptime_percentage, 0) / healthSummaries.length
      : 0,
    avgResponseTime: healthSummaries.length > 0
      ? healthSummaries.reduce((sum, s) => sum + (s.avg_response_time_ms || 0), 0) / healthSummaries.length
      : 0,
  };

  // Prepare chart data
  const uptimeChartData = healthSummaries.map(s => ({
    name: `${s.provider_name} - ${s.product_name}`,
    uptime: s.uptime_percentage,
  }));

  const responseTimeChartData = healthSummaries
    .filter(s => s.avg_response_time_ms)
    .map(s => ({
      name: `${s.provider_name} - ${s.product_name}`,
      responseTime: s.avg_response_time_ms,
    }));

  if (loading && healthSummaries.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading health data...</span>
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
          <span className="text-cyan-400">Health Dashboard</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Health Dashboard</h1>
            <p className="text-slate-400">Monitor endpoint health and performance across all APIs</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeWindow}
              onChange={(e) => setTimeWindow(Number(e.target.value))}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value={1}>Last 1 hour</option>
              <option value={6}>Last 6 hours</option>
              <option value={24}>Last 24 hours</option>
              <option value={168}>Last 7 days</option>
            </select>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-all border border-slate-700"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total APIs"
          value={stats.totalAPIs}
          icon={<Activity className="h-5 w-5" />}
          color="purple"
        />
        <StatCard
          label="Healthy (>99%)"
          value={stats.healthyAPIs}
          icon={<CheckCircle className="h-5 w-5" />}
          color="green"
          subtitle={`${stats.totalAPIs > 0 ? Math.round((stats.healthyAPIs / stats.totalAPIs) * 100) : 0}% of total`}
        />
        <StatCard
          label="Avg Uptime"
          value={`${stats.avgUptime.toFixed(2)}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="cyan"
        />
        <StatCard
          label="Avg Response Time"
          value={`${Math.round(stats.avgResponseTime)}ms`}
          icon={<Clock className="h-5 w-5" />}
          color="slate"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Charts */}
      {healthSummaries.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Uptime Chart */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Uptime Percentage</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={uptimeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94A3B8" 
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis 
                  stroke="#94A3B8" 
                  tick={{ fill: '#94A3B8' }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F1F5F9'
                  }}
                />
                <Bar dataKey="uptime" fill="#B800E6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Response Time Chart */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Average Response Time (ms)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={responseTimeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  stroke="#94A3B8" 
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis 
                  stroke="#94A3B8" 
                  tick={{ fill: '#94A3B8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F1F5F9'
                  }}
                />
                <Bar dataKey="responseTime" fill="#00CCFF" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-900/30 border border-slate-800 rounded-xl">
          <Activity className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">No Health Data</h3>
          <p className="text-slate-500">Start monitoring APIs to see health metrics</p>
        </div>
      )}

      {/* API Health Cards */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">API Health Status</h2>
        {healthSummaries.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/30 border border-slate-800 rounded-xl">
            <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-400 mb-2">No APIs Monitored</h3>
            <p className="text-slate-500">Add watched APIs to see their health status</p>
          </div>
        ) : (
          healthSummaries.map((summary) => (
            <HealthCard key={summary.watched_api_id} summary={summary} />
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
  color,
  subtitle
}: { 
  label: string; 
  value: number | string; 
  icon: React.ReactNode; 
  color: string;
  subtitle?: string;
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
          {subtitle && <p className="text-xs text-slate-500 mt-2">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// Health Card Component
function HealthCard({ summary }: { summary: WatchedAPIHealthSummary }) {
  const getHealthColor = (uptime: number) => {
    if (uptime >= 99) return 'text-green-400 bg-green-500/10 border-green-500/30';
    if (uptime >= 95) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    return 'text-red-400 bg-red-500/10 border-red-500/30';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-purple-500/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">
            {summary.provider_name && summary.product_name 
              ? `${summary.provider_name} - ${summary.product_name}`
              : 'Unknown API'}
          </h3>
          <p className="text-sm text-slate-400">
            {summary.healthy_endpoints} / {summary.total_endpoints} endpoints healthy
          </p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-bold text-sm ${getHealthColor(summary.uptime_percentage)}`}>
          <Activity className="h-4 w-4" />
          <span>{summary.uptime_percentage.toFixed(2)}% uptime</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
            Endpoints
          </p>
          <p className="text-lg text-white font-bold">{summary.total_endpoints}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
            Avg Response
          </p>
          <p className="text-lg text-cyan-400 font-bold">
            {summary.avg_response_time_ms ? `${Math.round(summary.avg_response_time_ms)}ms` : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
            Last Check
          </p>
          <p className="text-sm text-slate-300 font-semibold">
            {formatTimestamp(summary.last_checked)}
          </p>
        </div>
      </div>
    </div>
  );
}