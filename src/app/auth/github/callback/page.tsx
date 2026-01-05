'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GitHubCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      // Check for OAuth errors
      if (error) {
        throw new Error(`GitHub OAuth error: ${error}`);
      }

      if (!code || !state) {
        throw new Error('Missing code or state parameter');
      }

      // Exchange code for token
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/github/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to authenticate with GitHub');
      }

      const data = await response.json();

      // Store encrypted token and user info in sessionStorage
      sessionStorage.setItem('github_token', data.access_token_encrypted);
      sessionStorage.setItem('github_user', JSON.stringify(data.user_info));

      setStatus('success');
      toast.success('GitHub connected successfully!');

      // Redirect back to code repositories page
      setTimeout(() => {
        router.push('/code-repositories?github_connected=true');
      }, 1000);

    } catch (error: any) {
      console.error('GitHub OAuth callback error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Authentication failed');
      toast.error(error.message || 'Failed to connect GitHub');

      // Redirect back after showing error
      setTimeout(() => {
        router.push('/code-repositories');
      }, 3000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-8 max-w-md w-full text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="h-12 w-12 text-purple-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Connecting to GitHub...
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Please wait while we complete the authentication.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Connected Successfully!
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Redirecting you back...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="h-12 w-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              Authentication Failed
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {errorMessage}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Redirecting you back...
            </p>
          </>
        )}
      </div>
    </div>
  );
}