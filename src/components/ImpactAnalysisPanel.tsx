'use client';

import { ImpactAnalysis } from '@/lib/types';
import { AlertTriangle, CheckCircle, XCircle, FileCode, ExternalLink } from 'lucide-react';

interface ImpactAnalysisPanelProps {
  impact: ImpactAnalysis | null;
  loading: boolean;
}

export function ImpactAnalysisPanel({ impact, loading }: ImpactAnalysisPanelProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
          <span className="text-slate-600 dark:text-slate-400">Loading impact analysis...</span>
        </div>
      </div>
    );
  }

  if (!impact) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <AlertTriangle className="h-5 w-5" />
          <span>No impact analysis available for this version</span>
        </div>
      </div>
    );
  }

  const severityConfig = {
    critical: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: XCircle },
    high: { color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', icon: AlertTriangle },
    medium: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: AlertTriangle },
    low: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: CheckCircle },
  };

  const config = severityConfig[impact.severity as keyof typeof severityConfig] || severityConfig.medium;
  const SeverityIcon = config.icon;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`rounded-lg border p-6 ${
        impact.has_impact 
          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      }`}>
        <div className="flex items-start gap-4">
          <SeverityIcon className={`h-6 w-6 flex-shrink-0 mt-0.5 ${config.color}`} />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {impact.has_impact ? 'Impact Detected' : 'No Impact'}
            </h3>
            
            {impact.has_impact ? (
              <div className="space-y-2">
                <p className="text-slate-700 dark:text-slate-300">
                  This version contains breaking changes that affect your code repositories.
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Affected Repositories:</span>
                    <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                      {impact.total_affected_repos}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Code Usages:</span>
                    <span className="ml-2 font-semibold text-slate-900 dark:text-white">
                      {impact.total_usages_affected}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Severity:</span>
                    <span className={`ml-2 font-semibold ${config.color}`}>
                      {impact.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-700 dark:text-slate-300">
                No code repositories are affected by these changes.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Breaking Changes Detail */}
      {impact.has_impact && impact.breaking_changes.map((change, idx) => (
        <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          {/* Change Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.color}`}>
                {change.breaking_change_type.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span className="text-sm font-mono text-slate-900 dark:text-white">
                {change.http_method} {change.endpoint_path}
              </span>
            </div>
          </div>

          {/* Affected Repositories */}
          <div className="space-y-4">
            {change.affected_repositories.map((repo, repoIdx) => (
              <div key={repoIdx} className="border-l-4 border-purple-600 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-slate-900 dark:text-white">
                      {repo.repository_name}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      ({repo.usages_count} {repo.usages_count === 1 ? 'usage' : 'usages'})
                    </span>
                  </div>
                  {repo.repository_url && (
                    <a
                      href={repo.repository_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                      View Repo
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Usages */}
                <div className="space-y-2">
                  {repo.usages.map((usage, usageIdx) => (
                    <div key={usageIdx} className="bg-slate-50 dark:bg-slate-900 rounded p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {usage.file_path}:{usage.line_number}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          usage.confidence >= 0.9 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : usage.confidence >= 0.7
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                          {Math.round(usage.confidence * 100)}% confidence
                        </span>
                      </div>
                      <pre className="text-xs text-slate-600 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap">
                        {usage.code_context}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}