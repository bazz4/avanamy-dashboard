'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Radio, Bell, Activity, TrendingUp, Zap, Shield, Clock } from 'lucide-react';
import { AvanamyLogo } from '@/components/AvanamyLogo';
import { getWatchedAPIs, getAllHealthSummary, getAlertHistory } from '@/lib/api';
import type { WatchedAPI, WatchedAPIHealthSummary, AlertHistory } from '@/lib/types';

export default function LandingPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [watchedAPIs, setWatchedAPIs] = useState<WatchedAPI[]>([]);
  const [healthSummaries, setHealthSummaries] = useState<WatchedAPIHealthSummary[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<AlertHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect to dashboard if signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  // Load data only if signed in
  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }
    loadData();
  }, [isLoaded, isSignedIn]);

  const loadData = async () => {
    try {
      const [apis, health, alerts] = await Promise.all([
        getWatchedAPIs(),
        getAllHealthSummary(24),
        getAlertHistory({ limit: 5 })
      ]);
      setWatchedAPIs(apis);
      setHealthSummaries(health);
      setRecentAlerts(alerts);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  // If signed in, show loading while redirecting
  if (isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500">Redirecting to dashboard...</p>
      </div>
    );
  }

  // Calculate stats
  const stats = {
    totalAPIs: watchedAPIs.length,
    activeMonitoring: watchedAPIs.filter(api => api.polling_enabled).length,
    avgUptime: healthSummaries.length > 0
      ? healthSummaries.reduce((sum, s) => sum + s.uptime_percentage, 0) / healthSummaries.length
      : 100,
    recentAlerts: recentAlerts.length,
  };

  return (
    <div className="min-h-screen">
       {/* Header/Nav */}
      <header className="relative border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AvanamyLogo size={40} variant="color" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Avanamy
                </h1>
                <p className="text-xs text-slate-500">API Monitoring Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/sign-in"
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold rounded-lg transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-slate-50 to-cyan-100/30 dark:from-purple-900/20 dark:via-slate-900 dark:to-cyan-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-200/20 dark:from-purple-600/10 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-600 dark:text-purple-400 text-sm font-semibold mb-6">
              <Zap className="h-4 w-4" />
              Automated API Monitoring
            </div>

            <h1 className="text-6xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
              Never Miss an
              <span className="block mt-2 bg-gradient-to-r from-purple-600 via-cyan-500 to-purple-600 dark:from-purple-400 dark:via-cyan-400 dark:to-purple-400 bg-clip-text text-transparent">
                API Change Again
              </span>
            </h1>

            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-12">
              Avanamy automatically monitors external APIs, detects breaking changes,
              and alerts your team before issues impact production.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link
                href="/sign-up"
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold rounded-xl transition-all shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 hover:-translate-y-1 text-lg"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/sign-in"
                className="flex items-center gap-2 px-8 py-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl transition-all border border-slate-300 dark:border-slate-700 text-lg"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Quick Stats - Only show if user has data */}
          {!loading && watchedAPIs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-16">
              <QuickStatCard
                icon={<Radio className="h-6 w-6" />}
                label="APIs Monitored"
                value={stats.totalAPIs}
                color="purple"
              />
              <QuickStatCard
                icon={<Activity className="h-6 w-6" />}
                label="Active Monitoring"
                value={stats.activeMonitoring}
                color="green"
              />
              <QuickStatCard
                icon={<TrendingUp className="h-6 w-6" />}
                label="Avg Uptime"
                value={`${stats.avgUptime.toFixed(1)}%`}
                color="cyan"
              />
              <QuickStatCard
                icon={<Bell className="h-6 w-6" />}
                label="Recent Alerts"
                value={stats.recentAlerts}
                color="yellow"
              />
            </div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Powerful API Monitoring Features
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Stay ahead of breaking changes with intelligent automation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Radio className="h-8 w-8" />}
              title="Automatic Polling"
              description="Continuously monitor external APIs on your schedule - hourly, daily, or weekly."
              color="purple"
              link="/sign-up"
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Breaking Change Detection"
              description="AI-powered analysis identifies breaking changes before they impact your users."
              color="cyan"
              link="/sign-up"
            />
            <FeatureCard
              icon={<Bell className="h-8 w-8" />}
              title="Smart Alerts"
              description="Get notified via email, Slack, or webhook when issues are detected."
              color="purple"
              link="/sign-up"
            />
            <FeatureCard
              icon={<Activity className="h-8 w-8" />}
              title="Health Monitoring"
              description="Track endpoint uptime, response times, and availability metrics."
              color="green"
              link="/sign-up"
            />
            <FeatureCard
              icon={<Clock className="h-8 w-8" />}
              title="Historical Tracking"
              description="Complete audit trail of all API changes and alert history."
              color="cyan"
              link="/sign-up"
            />
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8" />}
              title="Performance Insights"
              description="Visualize trends and patterns with beautiful charts and graphs."
              color="purple"
              link="/sign-up"
            />
          </div>
        </div>
      </section>

      {/* Recent Activity - Only show if user has data */}
      {!loading && (watchedAPIs.length > 0 || recentAlerts.length > 0) && (
        <section className="py-20 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-8">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Recent Activity</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Monitored APIs */}
              <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm dark:shadow-none">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Monitored APIs</h3>
                  <Link
                    href="/watched-apis"
                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold flex items-center gap-1"
                  >
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {watchedAPIs.slice(0, 3).map((api) => (
                    <div
                      key={api.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/50 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                          {api.provider_name && api.product_name
                            ? `${api.provider_name} - ${api.product_name}`
                            : 'API Monitor'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Polling: {api.polling_frequency}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        api.status === 'healthy' || api.status === 'active'
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30'
                          : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {api.status || 'Active'}
                      </div>
                    </div>
                  ))}
                  {watchedAPIs.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <Radio className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No APIs being monitored yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Alerts */}
              <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm dark:shadow-none">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Alerts</h3>
                  <Link
                    href="/alert-history"
                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold flex items-center gap-1"
                  >
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentAlerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/50 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                          {alert.provider_name && alert.product_name
                            ? `${alert.provider_name} - ${alert.product_name}`
                            : 'Alert'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {alert.alert_reason.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                        alert.severity === 'critical'
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
                          : alert.severity === 'warning'
                          ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                      }`}>
                        {alert.severity}
                      </div>
                    </div>
                  ))}
                  {recentAlerts.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent alerts</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">
            Ready to Start Monitoring?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            Add your first API and start getting alerts about changes that matter.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold rounded-xl transition-all shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70 hover:-translate-y-1 text-lg"
          >
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

// Quick Stat Card Component
function QuickStatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number | string; 
  color: string;
}) {
  const colorClasses = {
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    green: 'bg-green-500/10 text-green-400 border-green-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  }[color];

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-purple-500/50 transition-all shadow-sm dark:shadow-none">
        <div className={`inline-flex p-3 rounded-lg mb-4 ${colorClasses} border`}>
          {icon}
        </div>
        <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{value}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{label}</p>
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ 
  icon, 
  title, 
  description, 
  color,
  link
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  color: string;
  link: string;
}) {
  const colorClasses = {
    purple: 'bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20',
    green: 'bg-green-500/10 text-green-400 group-hover:bg-green-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20',
  }[color];

  return (
    <Link href={link}>
      <div className="group relative h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-cyan-600/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl p-8 hover:border-purple-500/50 transition-all h-full shadow-sm dark:shadow-none">
          <div className={`inline-flex p-4 rounded-xl mb-6 transition-colors ${colorClasses}`}>
            {icon}
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
          <div className="mt-6 flex items-center text-purple-600 dark:text-purple-400 font-semibold text-sm group-hover:translate-x-1 transition-transform">
            Learn more
            <ArrowRight className="h-4 w-4 ml-2" />
          </div>
        </div>
      </div>
    </Link>
  );
}