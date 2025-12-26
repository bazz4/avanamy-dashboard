'use client';

import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface PollStatusBadgeProps {
  consecutiveFailures: number;
  lastError?: string | null;
}

export function PollStatusBadge({ consecutiveFailures, lastError }: PollStatusBadgeProps) {
  // Derive status from consecutive failures
  const getStatus = (): 'healthy' | 'warning' | 'failed' => {
    if (consecutiveFailures === 0) return 'healthy';
    if (consecutiveFailures < 3) return 'warning';
    return 'failed';
  };

  const status = getStatus();

  const getStatusConfig = () => {
    switch (status) {
      case 'healthy':
        return {
          icon: CheckCircle,
          label: 'Healthy',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          textColor: 'text-green-600 dark:text-green-400',
          iconColor: 'text-green-600 dark:text-green-400',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          label: 'Warning',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          textColor: 'text-yellow-600 dark:text-yellow-400',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
        };
      case 'failed':
        return {
          icon: XCircle,
          label: 'Failed',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          textColor: 'text-red-600 dark:text-red-400',
          iconColor: 'text-red-600 dark:text-red-400',
        };
      default:
        return {
          icon: Clock,
          label: 'Unknown',
          bgColor: 'bg-slate-500/10',
          borderColor: 'border-slate-500/30',
          textColor: 'text-slate-600 dark:text-slate-400',
          iconColor: 'text-slate-600 dark:text-slate-400',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="relative group">
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bgColor} ${config.borderColor}`}
      >
        <Icon className={`h-4 w-4 ${config.iconColor}`} />
        <span className={`text-sm font-semibold ${config.textColor}`}>
          {config.label}
        </span>
      </div>

      {/* Error Tooltip */}
      {(status === 'warning' || status === 'failed') && lastError && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
          <div className="flex items-start gap-2 mb-2">
            <XCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-white mb-1">
                Poll Error
                {consecutiveFailures > 1 && (
                  <span className="ml-2 text-xs text-slate-400">
                    ({consecutiveFailures} consecutive failures)
                  </span>
                )}
              </h4>
              <p className="text-xs text-slate-300 font-mono break-words">
                {lastError}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}