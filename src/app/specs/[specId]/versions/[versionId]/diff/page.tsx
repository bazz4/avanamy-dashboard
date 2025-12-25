'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RefreshCw, ArrowLeft, GitCompare } from 'lucide-react';
import { getVersionDiff } from '@/lib/api';
import type { VersionDiff } from '@/lib/types';
import { DiffViewer } from '@/components/DiffViewer';

export default function DiffPage() {
  const params = useParams();
  const router = useRouter();
  const specId = params.specId as string;
  const versionId = parseInt(params.versionId as string);

  const [diffData, setDiffData] = useState<VersionDiff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDiff();
  }, [specId, versionId]);

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

  if (loading) {
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
          <GitCompare className="h-8 w-8 text-purple-400 dark:text-purple-400" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Version {diffData?.version} Changes
            </h1>
            {diffData && (
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {formatDate(diffData.created_at)}
              </p>
            )}
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