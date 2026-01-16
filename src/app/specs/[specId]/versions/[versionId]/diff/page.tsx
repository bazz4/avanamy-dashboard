'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import { RefreshCw, ArrowLeft, GitCompare, FileCode, FileText, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { getVersionDiff, getImpactAnalysis } from '@/lib/api';
import type { VersionDiff, ImpactAnalysis } from '@/lib/types';
import { DiffViewer } from '@/components/DiffViewer';
import { ImpactAnalysisPanel } from '@/components/ImpactAnalysisPanel';

export default function DiffPage() {
  const { isLoaded } = useAuth();
  const params = useParams();
  const router = useRouter();
  const specId = params.specId as string;
  const versionId = parseInt(params.versionId as string);

  const [diffData, setDiffData] = useState<VersionDiff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [impactAnalysis, setImpactAnalysis] = useState<ImpactAnalysis | null>(null);
  const [impactLoading, setImpactLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    // Load diff first, then impact analysis with the correct version_id
    loadDiff();
  }, [isLoaded, specId, versionId]);

  const loadDiff = async () => {
    try {
      setLoading(true);
      const data = await getVersionDiff(specId, versionId);
      setDiffData(data);
      setError(null);

      // After loading diff, load impact analysis with the correct version_id
      loadImpactAnalysis(data.version_id);
    } catch (err) {
      setError('Failed to load diff');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load impact analysis using version_history_id (version_id from diff response)
  const loadImpactAnalysis = async (versionHistoryId: number) => {
    try {
      setImpactLoading(true);
      const impact = await getImpactAnalysis(versionHistoryId);
      setImpactAnalysis(impact);
    } catch (error) {
      console.error('Failed to load impact analysis:', error);
      // Don't show error - impact analysis is optional
      setImpactAnalysis(null);
    } finally {
      setImpactLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if diff has breaking changes
  const hasBreakingChanges = diffData?.diff && 
    (typeof diffData.diff === 'object' && diffData.diff.breaking === true);
  
  // Count breaking changes
  // If diff.breaking is true but no individual changes are marked, treat all as breaking
  const allChanges = diffData?.diff?.changes || [];
  const changesWithBreakingFlag = allChanges.filter((c: any) => c.breaking === true);
  const changesWithoutBreakingFlag = allChanges.filter((c: any) => c.breaking === false);
  
  // If overall diff is breaking but no individual changes are marked as breaking,
  // assume all changes are breaking
  const breakingChangesCount = hasBreakingChanges && changesWithBreakingFlag.length === 0 && allChanges.length > 0
    ? allChanges.length
    : changesWithBreakingFlag.length;
  
  const nonBreakingChangesCount = hasBreakingChanges && changesWithBreakingFlag.length === 0 && allChanges.length > 0
    ? 0
    : changesWithoutBreakingFlag.length;
  
  const totalChangesCount = allChanges.length;

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-slate-400 dark:text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading diff...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Versions
        </button>

        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500 mb-2">
          <span>Home</span>
          <span>›</span>
          <span>Specs</span>
          <span>›</span>
          <span>Versions</span>
          <span>›</span>
          <span className="text-cyan-600 dark:text-cyan-400">Diff</span>
        </div>

        <div className="flex items-center gap-4 mb-2">
          <GitCompare className="h-8 w-8 text-purple-400" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Version {diffData?.version} Changes
            </h1>
            {diffData && (
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {formatDate(diffData.created_at)}
              </p>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* View Documentation Button */}
            <button
              onClick={() => window.open(`http://localhost:8000/docs/${specId}/versions/${versionId}?format=html&raw=true`, '_blank')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 dark:text-blue-400 rounded-lg transition-all"
            >
              <FileText className="h-4 w-4" />
              View Docs
            </button>
            
            {/* View Full Schema Button */}
            <button
              onClick={() => router.push(`/specs/${specId}/versions/${versionId}/full-schema`)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 dark:text-cyan-400 rounded-lg transition-all"
            >
              <FileCode className="h-4 w-4" />
              View Full Schema
            </button>
          </div>
        </div>
      </div>

      {/* ✨ NEW: Breaking Changes Status Card */}
      {diffData && diffData.diff && (
        <div className={`rounded-xl border-2 shadow-lg overflow-hidden ${
          hasBreakingChanges 
            ? 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30 border-red-400 dark:border-red-700'
            : 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30 border-green-400 dark:border-green-700'
        }`}>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 p-3 rounded-full ${
                hasBreakingChanges 
                  ? 'bg-red-500/20' 
                  : 'bg-green-500/20'
              }`}>
                {hasBreakingChanges ? (
                  <ShieldAlert className={`h-8 w-8 ${
                    hasBreakingChanges 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-green-600 dark:text-green-400'
                  }`} />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                )}
              </div>
              
              <div className="flex-1">
                <h2 className={`text-2xl font-bold mb-2 ${
                  hasBreakingChanges 
                    ? 'text-red-900 dark:text-red-200' 
                    : 'text-green-900 dark:text-green-200'
                }`}>
                  {hasBreakingChanges ? (
                    <>⚠️ Breaking Changes Detected</>
                  ) : (
                    <>✓ No Breaking Changes</>
                  )}
                </h2>
                
                <p className={`mb-4 ${
                  hasBreakingChanges 
                    ? 'text-red-800 dark:text-red-300' 
                    : 'text-green-800 dark:text-green-300'
                }`}>
                  {hasBreakingChanges ? (
                    <>This version contains changes that may require updates to your integration.</>
                  ) : (
                    <>This version is backward compatible with your existing code.</>
                  )}
                </p>
                
                {/* Change Counts */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {breakingChangesCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 dark:bg-red-900/40 rounded-lg border border-red-400 dark:border-red-600">
                      <AlertTriangle className="h-4 w-4 text-red-700 dark:text-red-400" />
                      <span className="font-bold text-red-900 dark:text-red-200">
                        {breakingChangesCount}
                      </span>
                      <span className="text-red-800 dark:text-red-300">
                        Breaking {breakingChangesCount === 1 ? 'Change' : 'Changes'}
                      </span>
                    </div>
                  )}
                  
                  {nonBreakingChangesCount > 0 && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                      hasBreakingChanges
                        ? 'bg-blue-500/10 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600'
                        : 'bg-green-500/20 dark:bg-green-900/40 border-green-400 dark:border-green-600'
                    }`}>
                      <CheckCircle2 className={`h-4 w-4 ${
                        hasBreakingChanges 
                          ? 'text-blue-700 dark:text-blue-400'
                          : 'text-green-700 dark:text-green-400'
                      }`} />
                      <span className={`font-bold ${
                        hasBreakingChanges
                          ? 'text-blue-900 dark:text-blue-200'
                          : 'text-green-900 dark:text-green-200'
                      }`}>
                        {nonBreakingChangesCount}
                      </span>
                      <span className={
                        hasBreakingChanges
                          ? 'text-blue-800 dark:text-blue-300'
                          : 'text-green-800 dark:text-green-300'
                      }>
                        Non-Breaking {nonBreakingChangesCount === 1 ? 'Change' : 'Changes'}
                      </span>
                    </div>
                  )}
                  
                  {/* Fallback when we know it's breaking but no individual counts */}
                  {hasBreakingChanges && totalChangesCount > 0 && breakingChangesCount === 0 && nonBreakingChangesCount === 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 dark:bg-red-900/40 rounded-lg border border-red-400 dark:border-red-600">
                      <AlertTriangle className="h-4 w-4 text-red-700 dark:text-red-400" />
                      <span className="text-red-800 dark:text-red-300">
                        Contains breaking changes (see details below)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 dark:bg-red-500/10 border border-red-500/30 dark:border-red-500/30 rounded-lg text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Diff Viewer */}
      {diffData && (
        <DiffViewer diff={diffData.diff} summary={diffData.summary} />
      )}

      {/* Impact Analysis */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Impact Analysis
        </h2>
        <ImpactAnalysisPanel impact={impactAnalysis} loading={impactLoading} />
      </div>

      {!diffData && !loading && !error && (
        <div className="text-center py-12 bg-slate-100 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl">
          <GitCompare className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">No Diff Available</h3>
          <p className="text-slate-500 dark:text-slate-500">This version has no change information</p>
        </div>
      )}
    </div>
  );
}