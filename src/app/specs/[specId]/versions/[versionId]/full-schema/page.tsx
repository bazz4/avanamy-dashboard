'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileCode, RefreshCw, Split, Columns } from 'lucide-react';
import { compareVersions } from '@/lib/api';
import * as Diff from 'diff';

export default function FullSchemaPage() {
  const params = useParams();
  const router = useRouter();
  const specId = params.specId as string;
  const versionId = parseInt(params.versionId as string);

  const [currentSpec, setCurrentSpec] = useState<any>(null);
  const [previousSpec, setPreviousSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');

  useEffect(() => {
    loadSpecs();
  }, [specId, versionId]);

  const loadSpecs = async () => {
    try {
      setLoading(true);
      const data = await compareVersions(specId, versionId, versionId - 1);
      setCurrentSpec(data.current_spec);
      setPreviousSpec(data.previous_spec);
      setError(null);
    } catch (err) {
      setError('Failed to load specs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="h-8 w-8 text-cyan-400 animate-spin" />
            <span className="ml-3 text-slate-400">Loading schemas...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentSpec || !previousSpec) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error || 'Failed to load schemas'}
          </div>
        </div>
      </div>
    );
  }

  const previousJson = JSON.stringify(previousSpec, null, 2);
  const currentJson = JSON.stringify(currentSpec, null, 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Summary
          </button>

          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <span>Home</span>
            <span>›</span>
            <span>Specs</span>
            <span>›</span>
            <span>Versions</span>
            <span>›</span>
            <span className="text-cyan-400">Full Schema</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FileCode className="h-8 w-8 text-purple-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Full Schema Comparison
                </h1>
                <p className="text-slate-400 mt-1">
                  v{versionId - 1} → v{versionId}
                </p>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('unified')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                  viewMode === 'unified'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Split className="h-4 w-4" />
                Unified
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                  viewMode === 'split'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                <Columns className="h-4 w-4" />
                Split
              </button>
            </div>
          </div>
        </div>

        {/* Diff Display */}
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {viewMode === 'unified' ? (
            <UnifiedDiffView previousJson={previousJson} currentJson={currentJson} />
          ) : (
            <SplitDiffView previousJson={previousJson} currentJson={currentJson} />
          )}
        </div>
      </div>
    </div>
  );
}

// Unified Diff View Component
function UnifiedDiffView({ previousJson, currentJson }: { previousJson: string; currentJson: string }) {
  const diff = Diff.diffLines(previousJson, currentJson);

  return (
    <div className="font-mono text-xs">
      {diff.map((part, idx) => {
        const lines = part.value.split('\n').filter(line => line.length > 0);
        
        return lines.map((line, lineIdx) => (
          <div
            key={`${idx}-${lineIdx}`}
            className={`flex ${
              part.added
                ? 'bg-green-500/20 dark:bg-green-500/20'
                : part.removed
                ? 'bg-red-500/20 dark:bg-red-500/20'
                : ''
            }`}
          >
            <div className="w-12 flex-shrink-0 text-right pr-4 py-1 text-slate-400 dark:text-slate-500 select-none border-r border-slate-200 dark:border-slate-800">
              {idx + lineIdx + 1}
            </div>
            <div className="flex-1 px-4 py-1 flex items-start">
              {part.added && (
                <span className="text-green-600 dark:text-green-400 mr-2">+</span>
              )}
              {part.removed && (
                <span className="text-red-600 dark:text-red-400 mr-2">-</span>
              )}
              <pre
                className={`whitespace-pre font-mono ${
                  part.added
                    ? 'text-green-700 dark:text-green-300'
                    : part.removed
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {line}
              </pre>
            </div>
          </div>
        ));
      })}
    </div>
  );
}

// Split Diff View Component
function SplitDiffView({ previousJson, currentJson }: { previousJson: string; currentJson: string }) {
  const previousLines = previousJson.split('\n');
  const currentLines = currentJson.split('\n');
  
  // Use diff to identify which lines changed
  const diff = Diff.diffLines(previousJson, currentJson);
  
  // Build line-by-line change map
  const changes: Map<number, 'added' | 'removed' | 'context'> = new Map();
  let prevLineNum = 0;
  let currLineNum = 0;
  
  diff.forEach(part => {
    const lines = part.value.split('\n').filter(l => l.length > 0);
    
    if (part.removed) {
      lines.forEach(() => {
        changes.set(prevLineNum, 'removed');
        prevLineNum++;
      });
    } else if (part.added) {
      lines.forEach(() => {
        changes.set(currLineNum + 100000, 'added'); // Offset for current
        currLineNum++;
      });
    } else {
      lines.forEach(() => {
        prevLineNum++;
        currLineNum++;
      });
    }
  });

  return (
    <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800">
      {/* Previous Version */}
      <div>
        <div className="bg-slate-50 dark:bg-slate-950/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase">
            Previous Version
          </h3>
        </div>
        <div className="font-mono text-xs">
          {previousLines.map((line, idx) => {
            const isRemoved = changes.get(idx) === 'removed';
            return (
              <div 
                key={idx} 
                className={`flex ${isRemoved ? 'bg-red-500/20 dark:bg-red-500/20' : ''}`}
              >
                <div className="w-12 flex-shrink-0 text-right pr-4 py-1 text-slate-400 dark:text-slate-500 select-none border-r border-slate-200 dark:border-slate-800">
                  {idx + 1}
                </div>
                <div className="flex-1 px-4 py-1 flex items-start">
                  {isRemoved && (
                    <span className="text-red-600 dark:text-red-400 mr-2">-</span>
                  )}
                  <pre className={`whitespace-pre font-mono ${
                    isRemoved 
                      ? 'text-red-700 dark:text-red-300' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {line}
                  </pre>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Version */}
      <div>
        <div className="bg-slate-50 dark:bg-slate-950/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase">
            Current Version
          </h3>
        </div>
        <div className="font-mono text-xs">
          {currentLines.map((line, idx) => {
            const isAdded = changes.get(idx + 100000) === 'added';
            return (
              <div 
                key={idx} 
                className={`flex ${isAdded ? 'bg-green-500/20 dark:bg-green-500/20' : ''}`}
              >
                <div className="w-12 flex-shrink-0 text-right pr-4 py-1 text-slate-400 dark:text-slate-500 select-none border-r border-slate-200 dark:border-slate-800">
                  {idx + 1}
                </div>
                <div className="flex-1 px-4 py-1 flex items-start">
                  {isAdded && (
                    <span className="text-green-600 dark:text-green-400 mr-2">+</span>
                  )}
                  <pre className={`whitespace-pre font-mono ${
                    isAdded 
                      ? 'text-green-700 dark:text-green-300' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {line}
                  </pre>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}