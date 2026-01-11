'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import { RefreshCw, ArrowLeft, GitCompare, FileCode, FileText } from 'lucide-react';
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
    
    // Load both diff and impact analysis
    loadDiff();
    loadImpactAnalysis();
  }, [isLoaded, specId, versionId]);

  // Add new function after loadDiff:
  const loadImpactAnalysis = async () => {
    try {
      setImpactLoading(true);
      const impact = await getImpactAnalysis(versionId);
      setImpactAnalysis(impact);
    } catch (error) {
      console.error('Failed to load impact analysis:', error);
      // Don't show error - impact analysis is optional
      setImpactAnalysis(null);
    } finally {
      setImpactLoading(false);
    }
  };

  const loadDiff = async () => {
    try {
      setLoading(true);
      const data = await getVersionDiff(specId, versionId);
      setDiffData(data);
      setError(null);
    } catch (err) {
      setError('Failed to load diff');
      console.error(err);
    } finally {
      setLoading(false);
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
            <h1 className="text-3xl font-bold text-white">
              Version {diffData?.version} Changes
            </h1>
            {diffData && (
              <p className="text-slate-400 mt-1">
                {formatDate(diffData.created_at)}
              </p>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* View Documentation Button - NEW */}
            <button
              onClick={() => window.open(`http://localhost:8000/docs/${specId}/versions/${versionId}?format=html&raw=true`, '_blank')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg transition-all"
            >
              <FileText className="h-4 w-4" />
              View Docs
            </button>
            
            {/* View Full Schema Button */}
            <button
              onClick={() => router.push(`/specs/${specId}/versions/${versionId}/full-schema`)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg transition-all"
            >
              <FileCode className="h-4 w-4" />
              View Full Schema
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 dark:bg-red-500/10 border border-red-500/30 dark:border-red-500/30 rounded-lg text-red-400 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Diff Viewer */}
      {diffData && (
        <DiffViewer diff={diffData.diff} summary={diffData.summary} />
      )}

      {/* Impact Analysis - NEW */}
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