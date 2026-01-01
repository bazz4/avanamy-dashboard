'use client';

import { useUser } from '@clerk/nextjs';
import { User, Bell, Key, CreditCard, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Account Section */}
      <section className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Account
            </h2>
            <p className="text-sm text-slate-500">
              Your personal information
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Full Name
            </label>
            <p className="mt-1 text-slate-900 dark:text-white">
              {user.fullName || 'Not set'}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <p className="mt-1 text-slate-900 dark:text-white">
              {user.emailAddresses[0]?.emailAddress}
            </p>
          </div>

          <p className="text-sm text-slate-500 mt-4">
            To update your account details, please use the Clerk User Button in the top right.
          </p>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
            <Bell className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Notifications
            </h2>
            <p className="text-sm text-slate-500">
              Configure how you receive alerts
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Email Alerts
              </p>
              <p className="text-sm text-slate-500">
                Receive alerts via email when APIs change
              </p>
            </div>
            <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
              Enabled
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg opacity-50">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Slack Notifications
              </p>
              <p className="text-sm text-slate-500">
                Coming soon in Pro tier
              </p>
            </div>
            <div className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full text-sm font-medium">
              Pro
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg opacity-50">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Webhook Alerts
              </p>
              <p className="text-sm text-slate-500">
                Coming soon in Pro tier
              </p>
            </div>
            <div className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full text-sm font-medium">
              Pro
            </div>
          </div>
        </div>
      </section>

      {/* API Keys Section */}
      <section className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Key className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              API Keys
            </h2>
            <p className="text-sm text-slate-500">
              Manage programmatic access
            </p>
          </div>
        </div>

        <div className="text-center py-8">
          <p className="text-slate-500 mb-4">
            API key management coming soon in Team tier
          </p>
          <button
            disabled
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-500 font-semibold rounded-lg cursor-not-allowed"
          >
            Generate API Key (Coming Soon)
          </button>
        </div>
      </section>

      {/* Billing Section */}
      <section className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Billing
            </h2>
            <p className="text-sm text-slate-500">
              Manage your subscription
            </p>
          </div>
        </div>

        <div className="text-center py-8">
          <div className="inline-block px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg mb-4">
            <p className="font-semibold">Free Tier</p>
          </div>
          <p className="text-slate-500 mb-4">
            Currently on the free plan - 1 API monitored
          </p>
          <button
            disabled
            className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-500 font-semibold rounded-lg cursor-not-allowed"
          >
            Upgrade to Pro (Coming Soon)
          </button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-white dark:bg-slate-900/50 border border-red-200 dark:border-red-900/50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
              Danger Zone
            </h2>
            <p className="text-sm text-slate-500">
              Irreversible actions
            </p>
          </div>
        </div>

        <button
          disabled
          className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold rounded-lg cursor-not-allowed opacity-50"
        >
          Delete Account (Coming Soon)
        </button>
      </section>
    </div>
  );
}