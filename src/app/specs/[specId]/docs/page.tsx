'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, FileText, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { getSpecDocs } from '@/lib/api';

export default function SpecDocsPage() {
  const { isLoaded } = useAuth();
  const params = useParams();
  const specId = params.specId as string;

  const [docs, setDocs] = useState<{ markdown: string | null; html: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markdownCollapsed, setMarkdownCollapsed] = useState(false);
  const [htmlCollapsed, setHtmlCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    loadData();
  }, [specId, isLoaded]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const docsData = await getSpecDocs(specId);
      setDocs(docsData);
    } catch (err) {
      console.error('Error loading documentation:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documentation');
    } finally {
      setLoading(false);
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <p>Loading documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 space-y-6">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Link 
            href="/api-products" 
            className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            API Products
          </Link>
          <span aria-hidden="true">›</span>
          <Link 
            href={`/specs/${specId}`}
            className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            Specification
          </Link>
          <span aria-hidden="true">›</span>
          <FileText className="h-4 w-4" aria-hidden="true" />
          <span className="text-slate-900 dark:text-white font-medium">Documentation</span>
        </div>
      </nav>

      {/* Back Button */}
      <Link
        href={`/specs/${specId}`}
        className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Specification
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          API Documentation
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-500">
          Auto-generated documentation from OpenAPI specification
        </p>
      </div>

      {/* Documentation Sections - Stacked */}
      <div className="space-y-6">
        {/* Markdown Section */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <button
            onClick={() => setMarkdownCollapsed(!markdownCollapsed)}
            className="w-full p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Markdown Source
            </h2>
            {markdownCollapsed ? (
              <ChevronDown className="h-5 w-5 text-slate-500" />
            ) : (
              <ChevronUp className="h-5 w-5 text-slate-500" />
            )}
          </button>

          {!markdownCollapsed && (
            <div className="p-6">
              {docs?.markdown ? (
                <pre className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 p-4 rounded border border-slate-200 dark:border-slate-700 overflow-x-auto max-h-[600px] overflow-y-auto font-mono">
                  {docs.markdown}
                </pre>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    No markdown documentation available.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* HTML Preview Section */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <button
            onClick={() => setHtmlCollapsed(!htmlCollapsed)}
            className="w-full p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              HTML Preview
            </h2>
            {htmlCollapsed ? (
              <ChevronDown className="h-5 w-5 text-slate-500" />
            ) : (
              <ChevronUp className="h-5 w-5 text-slate-500" />
            )}
          </button>

          {!htmlCollapsed && (
            <div className="p-6">
              {docs?.html ? (
                <div className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
                  <iframe
                    srcDoc={docs.html}
                    className="w-full min-h-[600px] border-0"
                    sandbox="allow-same-origin"
                    title="HTML Documentation Preview"
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    No HTML documentation available.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}