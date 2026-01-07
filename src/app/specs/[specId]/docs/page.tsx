'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, FileText, RefreshCw, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { getSpecDocs, getSpecVersions, getVersionSchema } from '@/lib/api';
import type { SpecVersion } from '@/lib/types';

export default function SpecDocsPage() {
  const { isLoaded } = useAuth();
  const params = useParams();
  const specId = params.specId as string;

  const [docs, setDocs] = useState<{ markdown: string | null; html: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markdownCollapsed, setMarkdownCollapsed] = useState(false);
  const [htmlCollapsed, setHtmlCollapsed] = useState(false);
  const [latestVersion, setLatestVersion] = useState<SpecVersion | null>(null);
  const [rawSpec, setRawSpec] = useState<string | null>(null);
  const [rawSpecCollapsed, setRawSpecCollapsed] = useState(false);

  const normalizedHtml = useMemo(() => {
    if (!docs?.html) return null;
    return normalizeHtmlForPreview(docs.html, {
      apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
      specId,
    });
  }, [docs?.html, specId]);

  const htmlPreviewUrl = useMemo(() => {
    if (!latestVersion?.version) return null;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) return null;
    return `${apiBaseUrl}/docs/${specId}/versions/${latestVersion.version}?format=html&raw=true`;
  }, [latestVersion?.version, specId]);

  const markdownPreviewUrl = useMemo(() => {
    if (!latestVersion?.version) return null;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) return null;
    return `${apiBaseUrl}/docs/${specId}/versions/${latestVersion.version}?format=markdown&raw=true`;
  }, [latestVersion?.version, specId]);

  const rawSpecTitle = useMemo(() => {
    if (!latestVersion?.version) return 'Open API Spec';
    return `Open API Spec (v${latestVersion.version})`;
  }, [latestVersion?.version]);

  useEffect(() => {
    if (!isLoaded) return;
    loadData();
  }, [specId, isLoaded]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [docsData, versions] = await Promise.all([
        getSpecDocs(specId),
        getSpecVersions(specId).catch(() => [] as SpecVersion[]),
      ]);
      setDocs(docsData);
      const latest = versions.reduce<SpecVersion | null>((current, version) => {
        if (!current) return version;
        return version.version > current.version ? version : current;
      }, null);
      setLatestVersion(latest);
      if (latest?.version) {
        try {
          const schemaData = await getVersionSchema(specId, latest.version);
          setRawSpec(JSON.stringify(schemaData.schema, null, 2));
        } catch (schemaErr) {
          console.error('Failed to load raw spec:', schemaErr);
          setRawSpec(null);
        }
      } else {
        setRawSpec(null);
      }
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
          <div className="w-full p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-3">              
              <button
                onClick={() => setMarkdownCollapsed(!markdownCollapsed)}
                className="text-left"
                type="button"
              >
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Markdown Source
                </h2>
              </button>
              {markdownPreviewUrl ? (
                <a
                  href={markdownPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  aria-label="Open markdown in new window"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMarkdownCollapsed(!markdownCollapsed)}
                className="p-2 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                aria-label={markdownCollapsed ? 'Expand markdown source' : 'Collapse markdown source'}
                type="button"
              >
                {markdownCollapsed ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

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
          <div className="w-full p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setHtmlCollapsed(!htmlCollapsed)}
                className="text-left"
                type="button"
              >
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  HTML Preview
                </h2>
              </button>
              {htmlPreviewUrl ? (
                <a
                  href={htmlPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  aria-label="Open HTML preview in new window"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setHtmlCollapsed(!htmlCollapsed)}
                className="p-2 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                aria-label={htmlCollapsed ? 'Expand HTML preview' : 'Collapse HTML preview'}
                type="button"
              >
                {htmlCollapsed ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {!htmlCollapsed && (
            <div className="p-6">
              {docs?.html ? (
                <div className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
                  <iframe
                    srcDoc={normalizedHtml ?? docs.html}
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

        {/* OpenAPI Spec Section */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="w-full p-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRawSpecCollapsed(!rawSpecCollapsed)}
                className="text-left"
                type="button"
              >
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {rawSpecTitle}
                </h2>
              </button>
              <button
                onClick={() => openRawSpecInNewWindow(rawSpec)}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer disabled:cursor-not-allowed"
                aria-label="Open raw OpenAPI spec"
                type="button"
                disabled={!rawSpec}
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setRawSpecCollapsed(!rawSpecCollapsed)}
                className="p-2 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                aria-label={rawSpecCollapsed ? 'Expand Open API spec' : 'Collapse Open API spec'}
                type="button"
              >
                {rawSpecCollapsed ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronUp className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {!rawSpecCollapsed && (
            <div className="p-6">
              {rawSpec ? (
                <pre className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 p-4 rounded border border-slate-200 dark:border-slate-700 overflow-x-auto max-h-[600px] overflow-y-auto font-mono">
                  {rawSpec}
                </pre>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    No OpenAPI specification available.
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

function normalizeHtmlForPreview(
  rawHtml: string,
  {
    apiBaseUrl,
    specId,
  }: {
    apiBaseUrl?: string;
    specId: string;
  }
) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');
    const anchors = Array.from(doc.querySelectorAll('a[href]'));
    const docsPathPrefix = `/docs/${specId}`;

    anchors.forEach((anchor) => {
      const href = anchor.getAttribute('href') || '';
      if (!href) return;

      if (href.startsWith('#')) {
        anchor.removeAttribute('target');
        return;
      }

      const hashIndex = href.indexOf('#');
      if (hashIndex === -1) return;

      const hash = href.slice(hashIndex + 1);
      if (!hash) return;

      try {
        if (href.startsWith('/docs/')) {
          anchor.setAttribute('href', `#${hash}`);
          anchor.removeAttribute('target');
          return;
        }

        const baseForParsing = apiBaseUrl || window.location.href;
        const url = new URL(href, baseForParsing);
        const isDocsLink = url.pathname.startsWith(docsPathPrefix);
        if (isDocsLink) {
          anchor.setAttribute('href', `#${hash}`);
          anchor.removeAttribute('target');
        }
      } catch {
        // Ignore malformed URLs.
      }
    });

    return doc.documentElement.outerHTML;
  } catch {
    return rawHtml;
  }
}

function openRawSpecInNewWindow(rawSpec: string | null) {
  if (!rawSpec) return;
  const blob = new Blob([rawSpec], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
