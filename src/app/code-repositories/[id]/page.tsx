'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, GitBranch, Users, Mail, Code, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { CodeRepositoryDetail } from '@/lib/types';
import { getCodeRepository } from '@/lib/api';
import { ConfidenceBadge } from '@/components/ConfidenceBadge';
import { ConfidenceHelpSection } from '@/components/ConfidenceHelpSection';

export default function CodeRepositoryDetailPage() {
  const { isLoaded } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [repository, setRepository] = useState<CodeRepositoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && id) {
      loadRepository();
    }
  }, [isLoaded, id]);

  async function loadRepository() {
    try {
      setLoading(true);
      const data = await getCodeRepository(id);
      setRepository(data);
    } catch (error) {
      console.log('Failed to load code repository:', error);
      toast.error('Failed to load code repository');
      router.push('/code-repositories');
    } finally {
      setLoading(false);
    }
  }

  if (loading || !repository) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600 dark:text-slate-400">Loading repository details...</div>
      </div>
    );
  }

  // Group usages by endpoint
  const endpointGroups = repository.endpoint_usages.reduce((acc, usage) => {
    const key = `${usage.http_method || 'UNKNOWN'} ${usage.endpoint_path}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(usage);
    return acc;
  }, {} as Record<string, typeof repository.endpoint_usages>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/code-repositories')}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Repositories</span>
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{repository.name}</h1>
            <a
              href={repository.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-2"
            >
              <GitBranch className="h-4 w-4" />
              {repository.url}
            </a>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {repository.total_files_scanned}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Files Scanned</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {repository.total_endpoints_found}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Endpoints Found</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {Object.keys(endpointGroups).length}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Unique Endpoints</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className={`text-2xl font-bold ${
            repository.scan_status === 'success' ? 'text-green-600' :
            repository.scan_status === 'failed' ? 'text-red-600' :
            repository.scan_status === 'scanning' ? 'text-blue-600' :
            'text-yellow-600'
          }`}>
            {repository.scan_status}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Scan Status</div>
        </div>
      </div>

      { /* Confidence Help Section */}
      <ConfidenceHelpSection />

      {/* Owner Info */}
      {(repository.owner_team || repository.owner_email) && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Ownership</h2>
          <div className="space-y-2">
            {repository.owner_team && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Users className="h-4 w-4" />
                <span>{repository.owner_team}</span>
              </div>
            )}
            {repository.owner_email && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Mail className="h-4 w-4" />
                <span>{repository.owner_email}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scan Error */}
      {repository.last_scan_error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">Scan Failed</h3>
              <p className="text-sm text-red-700 dark:text-red-400">{repository.last_scan_error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Endpoint Usage */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            API Endpoint Usage
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Detected API calls in your codebase
          </p>
        </div>

        {repository.endpoint_usages.length === 0 ? (
          <div className="p-12 text-center">
            <Code className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              No API endpoints detected yet. Trigger a scan to analyze your code.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {Object.entries(endpointGroups).map(([endpoint, usages]) => (
              <div key={endpoint} className="p-6">
                <button
                  onClick={() => setSelectedEndpoint(selectedEndpoint === endpoint ? null : endpoint)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-mono rounded ${
                        endpoint.startsWith('GET') ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        endpoint.startsWith('POST') ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        endpoint.startsWith('PUT') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        endpoint.startsWith('DELETE') ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
                      }`}>
                        {endpoint.split(' ')[0]}
                      </span>
                      <span className="font-mono text-slate-900 dark:text-white">
                        {endpoint.split(' ').slice(1).join(' ')}
                      </span>
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {usages.length} {usages.length === 1 ? 'usage' : 'usages'}
                    </span>
                  </div>
                </button>

                {selectedEndpoint === endpoint && (
                  <div className="mt-4 space-y-3">
                    {usages.map((usage, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-mono text-sm text-slate-900 dark:text-white">
                            {usage.file_path}:{usage.line_number}
                          </div>
                          <ConfidenceBadge 
                            confidence={usage.confidence} 
                            detectionMethod={usage.detection_method}
                          />
                        </div>
                        {usage.code_context && (
                          <pre className="text-xs text-slate-600 dark:text-slate-400 overflow-x-auto">
                            {usage.code_context}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}