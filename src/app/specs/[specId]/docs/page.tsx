'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { getSpecDocs } from '@/lib/api';

export default function SpecDocsPage() {
  const { isLoaded } = useAuth();
  const params = useParams();
  const specId = params.specId as string;
  
  const [docs, setDocs] = useState<{ markdown: string | null; html: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    loadDocs();
  }, [specId, isLoaded]);

  async function loadDocs() {
    try {
      setLoading(true);
      const data = await getSpecDocs(specId);
      setDocs(data);
    } catch (err) {
      console.error('Error loading docs:', err);
      setError('Failed to load documentation');
    } finally {
      setLoading(false);
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 text-slate-500">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <p>Loading documentation...</p>
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 space-y-6">
      <div className="text-sm text-gray-600 dark:text-slate-400">
        <Link href="/api-products" className="text-purple-600 dark:text-purple-400 hover:underline">
          API Products
        </Link>{" "}
        /{" "}
        <Link href={`/specs/${specId}`} className="text-purple-600 dark:text-purple-400 hover:underline">
          Specification
        </Link>{" "}
        / <span className="text-gray-900 dark:text-white font-medium">Documentation</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">API Documentation</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Markdown */}
        <div className="rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Markdown</h2>
          {docs?.markdown ? (
            <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-slate-200 bg-gray-50 dark:bg-slate-800/50 p-3 rounded border border-gray-200 dark:border-slate-700 max-h-[600px] overflow-y-auto">
              {docs.markdown}
            </pre>
          ) : (
            <p className="text-gray-600 dark:text-slate-400 text-sm">No markdown available.</p>
          )}
        </div>

        {/* HTML - IN IFRAME TO PREVENT CSS CONFLICTS */}
        <div className="rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">HTML Preview</h2>
          {docs?.html ? (
            <div className="rounded border border-gray-200 dark:border-slate-700 overflow-hidden bg-white">
              <iframe
                srcDoc={docs.html}
                className="w-full min-h-[600px] border-0"
                sandbox="allow-same-origin"
                title="HTML Documentation Preview"
              />
            </div>
          ) : (
            <p className="text-gray-600 dark:text-slate-400 text-sm">No HTML available.</p>
          )}
        </div>
      </div>
    </div>
  );
}