'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RefreshCw, GitBranch, Eye, Calendar, FileText, Sparkles } from 'lucide-react';
import { getSpecVersions } from '@/lib/api';
import type { SpecVersion } from '@/lib/types';

export default function VersionsPage() {
  const params = useParams();
  const router = useRouter();
  const specId = params.specId as string;

  const [versions, setVersions] = useState<SpecVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
  }, [specId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const data = await getSpecVersions(specId);
      setVersions(data);
      setError(null);
    } catch (err) {
      setError('Failed to load versions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDiff = (versionId: number) => {
    router.push(`/specs/${specId}/versions/${versionId}/diff`);
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
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading versions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <span>Home</span>
          <span>›</span>
          <span>Specs</span>
          <span>›</span>
          <span className="text-cyan-400">Version History</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Version History</h1>
        <p className="text-slate-400">Track all changes to this API specification</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="Total Versions"
          value={versions.length}
          icon={<GitBranch className="h-5 w-5" />}
          color="purple"
        />
        <StatCard
          label="Latest Version"
          value={versions.length > 0 ? `v${versions[versions.length - 1].version}` : 'N/A'}
          icon={<FileText className="h-5 w-5" />}
          color="cyan"
        />
        <StatCard
          label="With Changes"
          value={versions.filter(v => v.diff).length}
          icon={<Sparkles className="h-5 w-5" />}
          color="green"
        />
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-cyan-500 to-transparent" />

        {/* Version Cards */}
        <div className="space-y-6">
          {versions.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/30 border border-slate-800 rounded-xl">
              <GitBranch className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-400 mb-2">No Versions Found</h3>
              <p className="text-slate-500">This spec has no version history yet</p>
            </div>
          ) : (
            [...versions].reverse().map((version, idx) => (
              <VersionCard
                key={version.version}
                version={version}
                isLatest={idx === 0}
                onViewDiff={handleViewDiff}
                formatDate={formatDate}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon, 
  color 
}: { 
  label: string; 
  value: number | string; 
  icon: React.ReactNode; 
  color: string;
}) {
  const colorClasses = {
    purple: 'bg-purple-500/10 text-purple-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
    green: 'bg-green-500/10 text-green-400',
  }[color];

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium mb-2">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function VersionCard({ 
  version,
  isLatest,
  onViewDiff,
  formatDate
}: { 
  version: SpecVersion;
  isLatest: boolean;
  onViewDiff: (versionId: number) => void;
  formatDate: (date: string) => string;
}) {
  return (
    <div className="relative pl-20">
      {/* Timeline Dot */}
      <div className={`absolute left-6 top-6 h-5 w-5 rounded-full border-4 border-slate-950 ${
        isLatest 
          ? 'bg-gradient-to-r from-purple-500 to-cyan-500 shadow-lg shadow-purple-500/50' 
          : 'bg-slate-700'
      }`} />

      {/* Card */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-purple-500/30 transition-all">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-white">
                Version {version.version}
              </h3>
              {isLatest && (
                <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-xs font-bold rounded-full">
                  LATEST
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Calendar className="h-4 w-4" />
              {formatDate(version.created_at)}
            </div>
          </div>
        </div>

        {/* Changelog */}
        {version.changelog && (
          <div className="mb-4">
            <p className="text-sm text-slate-300">{version.changelog}</p>
          </div>
        )}

        {/* AI Summary */}
        {version.summary && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <Sparkles className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-purple-400 mb-1">AI Summary</p>
                <p className="text-sm text-slate-300 leading-relaxed">{version.summary}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {version.diff && (
          <div className="flex gap-3">
            <button
              onClick={() => onViewDiff(version.version)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:border-purple-400 font-semibold rounded-lg transition-all"
            >
              <Eye className="h-4 w-4" />
              View Diff
            </button>
          </div>
        )}

        {!version.diff && !version.summary && (
          <div className="text-sm text-slate-500 italic">
            No change information available for this version
          </div>
        )}
      </div>
    </div>
  );
}