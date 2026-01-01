'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Radio, Building2, Package, Bell, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { isLoaded } = useAuth();
  const [stats, setStats] = useState({
    watchedApis: 0,
    providers: 0,
    apiProducts: 0,
    alerts: 0,
  });

  // TODO: Fetch real stats from API
  useEffect(() => {
    if (!isLoaded) return;
    
    // Placeholder - replace with actual API calls
    setStats({
      watchedApis: 0,
      providers: 0,
      apiProducts: 0,
      alerts: 0,
    });
  }, [isLoaded]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500" role="status" aria-live="polite">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Overview of your API monitoring
        </p>
      </header>

      {/* Stats Grid */}
      <section aria-label="Statistics overview">
        <h2 className="sr-only">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Watched APIs */}
          <Link 
            href="/watched-apis"
            className="group block focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 rounded-xl"
            aria-label={`${stats.watchedApis} watched APIs. Click to view details.`}
          >
            <article className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-purple-500 dark:hover:border-purple-500 transition-all h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                  <Radio className="h-5 w-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                </div>
                <TrendingUp className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                {stats.watchedApis}
              </p>
              <p className="text-sm text-slate-500">
                Watched APIs
              </p>
            </article>
          </Link>

          {/* Providers */}
          <Link 
            href="/providers"
            className="group block focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 rounded-xl"
            aria-label={`${stats.providers} providers. Click to view details.`}
          >
            <article className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-cyan-500 dark:hover:border-cyan-500 transition-all h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg group-hover:bg-cyan-200 dark:group-hover:bg-cyan-900/50 transition-colors">
                  <Building2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
                </div>
                <TrendingUp className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                {stats.providers}
              </p>
              <p className="text-sm text-slate-500">
                Providers
              </p>
            </article>
          </Link>

          {/* API Products */}
          <Link 
            href="/api-products"
            className="group block focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 rounded-xl"
            aria-label={`${stats.apiProducts} API products. Click to view details.`}
          >
            <article className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-orange-500 dark:hover:border-orange-500 transition-all h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                  <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" aria-hidden="true" />
                </div>
                <TrendingUp className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                {stats.apiProducts}
              </p>
              <p className="text-sm text-slate-500">
                API Products
              </p>
            </article>
          </Link>

          {/* Alerts */}
          <Link 
            href="/alert-history"
            className="group block focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 rounded-xl"
            aria-label={`${stats.alerts} recent alerts. Click to view details.`}
          >
            <article className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-green-500 dark:hover:border-green-500 transition-all h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                  <Bell className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
                </div>
                <TrendingUp className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                {stats.alerts}
              </p>
              <p className="text-sm text-slate-500">
                Recent Alerts
              </p>
            </article>
          </Link>
        </div>
      </section>

      {/* Quick Start Guide */}
      <section aria-labelledby="getting-started-heading">
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <AlertCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            </div>
            <div>
              <h2 id="getting-started-heading" className="text-xl font-bold text-slate-900 dark:text-white">
                Getting Started
              </h2>
              <p className="text-sm text-slate-500">
                Set up your first API monitoring in 3 steps
              </p>
            </div>
          </div>

          <ol className="space-y-4" aria-label="Getting started steps">
            <li className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold" aria-hidden="true">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  Add a Provider
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Create a provider for the API company you want to monitor (e.g., Stripe, Twilio)
                </p>
                <Link 
                  href="/providers"
                  className="inline-flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 rounded"
                >
                  Go to Providers →
                </Link>
              </div>
            </li>

            <li className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold" aria-hidden="true">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  Add an API Product
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Add a specific API from that provider (e.g., Stripe Payments API)
                </p>
                <Link 
                  href="/api-products"
                  className="inline-flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 rounded"
                >
                  Go to API Products →
                </Link>
              </div>
            </li>

            <li className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold" aria-hidden="true">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                  Start Monitoring
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  Upload a spec or configure polling to start monitoring for changes
                </p>
                <Link 
                  href="/watched-apis"
                  className="inline-flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 rounded"
                >
                  Go to Watched APIs →
                </Link>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* Recent Activity (Placeholder) */}
      <section aria-labelledby="recent-activity-heading">
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <h2 id="recent-activity-heading" className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="text-center py-8">
            <p className="text-slate-500">
              No recent activity yet. Start by adding your first provider!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}