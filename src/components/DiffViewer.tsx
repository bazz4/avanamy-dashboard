'use client';

import React, { useState } from 'react';
import { Plus, Minus, AlertTriangle, RefreshCw, Code, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface DiffViewerProps {
  diff: any;
  summary?: string;
}

export function DiffViewer({ diff, summary }: DiffViewerProps) {
  if (!diff) {
    return (
      <div className="text-center py-12 text-slate-400 dark:text-slate-500">
        No diff data available
      </div>
    );
  }

  const hasStructuredData = diff.changes || diff.breaking !== undefined;

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      {summary && (
        <div className="bg-purple-500/10 dark:bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-purple-400 mb-1">AI Summary</h3>
              <p className="text-sm text-purple-300/80">Claude's analysis of this version</p>
            </div>
          </div>
          <div className="pl-14">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {summary}
            </p>
          </div>
        </div>
      )}

      {/* Breaking Change Alert */}
      {diff.breaking && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <div>
              <h3 className="text-lg font-bold text-red-400">Breaking Changes Detected</h3>
              <p className="text-sm text-red-300/80 mt-1">
                This version contains changes that will require updates to your integration
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Changes Section */}
      <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Code className="h-5 w-5 text-purple-500" />
              Detailed Changes
            </h3>
            {diff.changes && diff.changes.length > 0 && (
              <ChangesSummaryBadge changes={diff.changes} />
            )}
          </div>
        </div>

        <div className="p-6">
          {hasStructuredData ? (
            <div className="space-y-4">
              {diff.changes?.map((change: any, idx: number) => (
                <ChangeCardWithDiff key={idx} change={change} />
              ))}

              {(!diff.changes || diff.changes.length === 0) && diff.breaking !== undefined && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No detailed changes available</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-4 overflow-x-auto">
              <pre className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                {JSON.stringify(diff, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Changes Summary Badge Component
function ChangesSummaryBadge({ changes }: { changes: any[] }) {
  const [expanded, setExpanded] = useState(false);

  const addedCount = changes.filter(c => c.type.includes('added')).length;
  const removedCount = changes.filter(c => c.type.includes('removed')).length;
  const modifiedCount = changes.filter(c => c.type.includes('modified')).length;

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg transition-all"
      >
        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
          {changes.length} {changes.length === 1 ? 'change' : 'changes'}
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        )}
      </button>

      {expanded && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-10">
          <div className="p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Quick Summary</h4>
            
            {addedCount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-slate-700 dark:text-slate-300">Added</span>
                </div>
                <span className="font-bold text-green-600 dark:text-green-400">{addedCount}</span>
              </div>
            )}
            
            {removedCount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-slate-700 dark:text-slate-300">Removed</span>
                </div>
                <span className="font-bold text-red-600 dark:text-red-400">{removedCount}</span>
              </div>
            )}
            
            {modifiedCount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <span className="text-slate-700 dark:text-slate-300">Modified</span>
                </div>
                <span className="font-bold text-yellow-600 dark:text-yellow-400">{modifiedCount}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Combined Change Card with Expandable Diff
function ChangeCardWithDiff({ change }: { change: any }) {
  const [expanded, setExpanded] = useState(false);

  const getChangeStyle = (type: string) => {
    if (type.includes('added') || type.includes('new')) {
      return {
        icon: <Plus className="h-5 w-5" />,
        bgColor: 'bg-green-500/10 dark:bg-green-500/10',
        borderColor: 'border-green-500/30',
        textColor: 'text-green-700 dark:text-green-400',
        iconBg: 'bg-green-500/20',
        label: 'Added',
        labelColor: 'bg-green-500 text-white',
      };
    } else if (type.includes('removed') || type.includes('deleted')) {
      return {
        icon: <Minus className="h-5 w-5" />,
        bgColor: 'bg-red-500/10 dark:bg-red-500/10',
        borderColor: 'border-red-500/30',
        textColor: 'text-red-700 dark:text-red-400',
        iconBg: 'bg-red-500/20',
        label: 'Removed',
        labelColor: 'bg-red-500 text-white',
      };
    } else if (type.includes('modified') || type.includes('changed')) {
      return {
        icon: <RefreshCw className="h-5 w-5" />,
        bgColor: 'bg-yellow-500/10 dark:bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        textColor: 'text-yellow-700 dark:text-yellow-400',
        iconBg: 'bg-yellow-500/20',
        label: 'Modified',
        labelColor: 'bg-yellow-500 text-white',
      };
    } else {
      return {
        icon: <Code className="h-5 w-5" />,
        bgColor: 'bg-blue-500/10 dark:bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        textColor: 'text-blue-700 dark:text-blue-400',
        iconBg: 'bg-blue-500/20',
        label: 'Changed',
        labelColor: 'bg-blue-500 text-white',
      };
    }
  };

  const style = getChangeStyle(change.type || '');

  // Generate diff lines with proper formatting
  const generateDiffLines = () => {
    const lines: Array<{ type: 'added' | 'removed' | 'context'; content: string; lineNum: number }> = [];
    let lineNum = 0;

    lines.push({ type: 'context', content: `  "${change.path}": {`, lineNum: ++lineNum });
    lines.push({ type: 'context', content: `    "${change.method}": {`, lineNum: ++lineNum });

    if (change.type.includes('added')) {
      lines.push({ type: 'context', content: `      "responses": {`, lineNum: ++lineNum });
      lines.push({ type: 'context', content: `        "200": {`, lineNum: ++lineNum });
      lines.push({ type: 'context', content: `          "properties": {`, lineNum: ++lineNum });
      lines.push({ type: 'added', content: `            "${change.field}": {`, lineNum: ++lineNum });
      lines.push({ type: 'added', content: `              "type": "string",`, lineNum: ++lineNum });
      lines.push({ type: 'added', content: `              "required": true`, lineNum: ++lineNum });
      lines.push({ type: 'added', content: `            }`, lineNum: ++lineNum });
    } else if (change.type.includes('removed')) {
      const isRequest = change.type.includes('request');
      const section = isRequest ? 'requestBody' : 'responses';
      lines.push({ type: 'context', content: `      "${section}": {`, lineNum: ++lineNum });
      if (!isRequest) lines.push({ type: 'context', content: `        "200": {`, lineNum: ++lineNum });
      lines.push({ type: 'context', content: `          "properties": {`, lineNum: ++lineNum });
      lines.push({ type: 'removed', content: `            "${change.field}": {`, lineNum: ++lineNum });
      lines.push({ type: 'removed', content: `              "type": "string",`, lineNum: ++lineNum });
      lines.push({ type: 'removed', content: `              "required": true`, lineNum: ++lineNum });
      lines.push({ type: 'removed', content: `            }`, lineNum: ++lineNum });
    }

    lines.push({ type: 'context', content: `          }`, lineNum: ++lineNum });
    lines.push({ type: 'context', content: `        }`, lineNum: ++lineNum });
    lines.push({ type: 'context', content: `      }`, lineNum: ++lineNum });
    lines.push({ type: 'context', content: `    }`, lineNum: ++lineNum });
    lines.push({ type: 'context', content: `  }`, lineNum: ++lineNum });

    return lines;
  };

  const diffLines = generateDiffLines();

  return (
    <div className={`${style.bgColor} border ${style.borderColor} rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md`}>
      {/* Card Header/Summary */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className={`${style.iconBg} p-3 rounded-lg flex-shrink-0 ${style.textColor}`}>
            {style.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${style.labelColor}`}>
                    {style.label}
                  </span>
                  {change.type && (
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {change.type.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
                <h4 className={`font-bold ${style.textColor} text-base`}>
                  {change.method && change.path ? (
                    <>
                      <span className="font-mono">{change.method}</span>{' '}
                      <span className="font-mono">{change.path}</span>
                    </>
                  ) : (
                    <span className="font-mono">{change.field || change.endpoint || 'Change'}</span>
                  )}
                </h4>
              </div>
            </div>

            {(change.field || change.description || change.details) && (
              <div className="space-y-2">
                {change.field && (
                  <div className="text-sm">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">Field:</span>{' '}
                    <span className="font-mono text-slate-700 dark:text-slate-300">{change.field}</span>
                  </div>
                )}
                {change.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-300">{change.description}</p>
                )}
                {change.details && (
                  <p className="text-sm text-slate-600 dark:text-slate-300">{change.details}</p>
                )}
              </div>
            )}

            {change.breaking && (
              <div className="mt-3 pt-3 border-t border-red-500/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase">
                    Breaking Change
                  </span>
                </div>
              </div>
            )}

            {/* View Details Button */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-4 flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  View Details
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Diff Section */}
      {expanded && (
        <div className="border-t border-slate-200 dark:border-slate-700">
          <div className="bg-slate-50 dark:bg-slate-950/50">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <h5 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Schema Changes
              </h5>
            </div>
            <div className="font-mono text-xs overflow-x-auto">
              {diffLines.map((line, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    line.type === 'added'
                      ? 'bg-green-500/20 dark:bg-green-500/20'
                      : line.type === 'removed'
                      ? 'bg-red-500/20 dark:bg-red-500/20'
                      : ''
                  }`}
                >
                  <div className="w-12 flex-shrink-0 text-right pr-4 py-1 text-slate-400 dark:text-slate-500 select-none border-r border-slate-200 dark:border-slate-800">
                    {line.lineNum}
                  </div>
                  <div className="flex-1 px-4 py-1 flex items-start">
                    {line.type === 'added' && (
                      <Plus className="h-3 w-3 text-green-600 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                    )}
                    {line.type === 'removed' && (
                      <Minus className="h-3 w-3 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                    )}
                    <pre className={`whitespace-pre font-mono ${
                      line.type === 'added'
                        ? 'text-green-700 dark:text-green-300'
                        : line.type === 'removed'
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}>{line.content}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}