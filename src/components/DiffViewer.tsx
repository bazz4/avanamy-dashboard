'use client';

import React from 'react';
import { parseDiff, Diff, Hunk } from 'react-diff-view';
import 'react-diff-view/style/index.css';

interface DiffViewerProps {
  diff: any;
  summary?: string;
}

export function DiffViewer({ diff, summary }: DiffViewerProps) {
  if (!diff) {
    return (
      <div className="text-center py-12 text-slate-600 dark:text-slate-400" role="status">
        No diff data available
      </div>
    );
  }

  // Format diff for react-diff-view
  // The diff object should have a structure like:
  // { changes: [...], summary: "..." }
  
  return (
    <div className="space-y-6">
      {/* AI Summary */}
      {summary && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
          <h3 className="text-lg font-bold text-purple-400 mb-3 flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="Robot">🤖</span>
            AI Summary
          </h3>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Diff Details */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Changes</h3>
          
          {/* Display the diff object in a readable format */}
          <div className="space-y-4">
            {diff.endpoints_added && diff.endpoints_added.length > 0 && (
              <DiffSection
                title="Endpoints Added"
                items={diff.endpoints_added}
                color="green"
              />
            )}
            
            {diff.endpoints_removed && diff.endpoints_removed.length > 0 && (
              <DiffSection
                title="Endpoints Removed"
                items={diff.endpoints_removed}
                color="red"
              />
            )}
            
            {diff.endpoints_modified && diff.endpoints_modified.length > 0 && (
              <DiffSection
                title="Endpoints Modified"
                items={diff.endpoints_modified}
                color="yellow"
              />
            )}

            {diff.breaking_changes && diff.breaking_changes.length > 0 && (
              <DiffSection
                title="Breaking Changes"
                items={diff.breaking_changes}
                color="red"
                isBreaking
              />
            )}

            {/* If no structured diff, show raw JSON */}
            {!diff.endpoints_added && !diff.endpoints_removed && !diff.endpoints_modified && (
              <div className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-slate-700 dark:text-slate-300">
                  {JSON.stringify(diff, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Diff Section Component
function DiffSection({ 
  title, 
  items, 
  color,
  isBreaking = false
}: { 
  title: string; 
  items: any[]; 
  color: 'green' | 'red' | 'yellow';
  isBreaking?: boolean;
}) {
  const colorClasses = {
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  }[color];

  const iconMap = {
    green: { emoji: '➕', label: 'Added' },
    red: { emoji: '➖', label: 'Removed' },
    yellow: { emoji: '🔄', label: 'Modified' },
  };

  const iconData = iconMap[color];

  return (
    <div className={`border rounded-lg p-4 ${colorClasses}`}>
      <h4 className="font-bold mb-3 flex items-center gap-2">
        <span className="text-xl" role="img" aria-label={iconData.label}>{iconData.emoji}</span>
        {title}
        {isBreaking && (
          <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded uppercase">
            Breaking
          </span>
        )}
      </h4>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="text-sm font-mono">
            {typeof item === 'string' ? item : (
              <div>
                <div className="font-semibold">{item.path || item.endpoint}</div>
                {item.method && <div className="text-xs opacity-75">{item.method}</div>}
                {item.details && <div className="text-xs opacity-75 mt-1">{item.details}</div>}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}