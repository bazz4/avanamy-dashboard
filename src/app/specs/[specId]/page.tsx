'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { getSpecVersions } from '@/lib/api';
import { RegenerateDocsButton } from '@/components/RegenerateDocsButton';
import { UploadNewVersionForm } from '@/components/UploadNewVersionForm';
import { VersionDiffDisplay } from '@/components/VersionDiffDisplay';
import type { SpecVersion } from '@/lib/types';

export default function SpecDetailPage() {
  const { isLoaded } = useAuth();
  const params = useParams();
  const specId = params.specId as string;
  
  const [versions, setVersions] = useState<SpecVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    loadVersions();
  }, [specId, isLoaded]);

  async function loadVersions() {
    try {
      setLoading(true);
      const data = await getSpecVersions(specId);
      setVersions(data.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (err) {
      console.error('Error loading versions:', err);
      setError('Failed to load specification');
    } finally {
      setLoading(false);
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <p>Loading specification...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const current = versions[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 space-y-6">
      <div className="text-sm text-gray-600 dark:text-slate-400">
        <Link href="/api-products" className="text-purple-600 dark:text-purple-400 hover:underline">
          API Products
        </Link>{" "}
        / <span className="text-gray-900 dark:text-white font-medium">Specification</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">API Specification</h2>
          {current && (
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Current version:{" "}
              <span className="font-mono text-sm text-purple-600 dark:text-purple-400">
                {current.label ?? `v${current.version}`}
              </span>{" "}
              • {new Date(current.created_at).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <RegenerateDocsButton specId={specId} />
          <Link
            href={`/specs/${specId}/docs`}
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            View Documentation
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow">
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Version history
          </h3>

          {versions.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-slate-400">No versions found.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {versions.map((v) => (
                <li
                  key={v.version}  // Changed from v.id to v.version
                  className="rounded border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 px-3 py-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-xs text-purple-600 dark:text-purple-400 font-semibold">
                        {v.label ?? `v${v.version}`}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-slate-400">
                        {new Date(v.created_at).toLocaleString()}
                      </div>
                      {v.changelog && (
                        <div className="mt-1 text-xs text-gray-700 dark:text-slate-300">
                          {v.changelog}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <VersionDiffDisplay 
                    diff={v.diff}
                    summary={v.summary}
                    versionLabel={v.label ?? `v${v.version}`}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <UploadNewVersionForm specId={specId} />
      </div>
    </div>
  );
}