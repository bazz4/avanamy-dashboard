'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function ConfidenceHelpSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <span className="text-blue-800 dark:text-blue-300 font-medium text-sm">
            About Confidence Scores
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        )}
      </button>

      {/* Expandable content */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-3 text-sm text-blue-900 dark:text-blue-200">
          <p>
            Our scanner analyzes your code to detect API endpoint usage. Each detection is assigned a confidence level:
          </p>

          <div className="space-y-2">
            {/* Confirmed */}
            <div className="flex items-start gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 flex-shrink-0">
                <span>✓</span>
                <span>Confirmed</span>
              </span>
              <span className="text-xs leading-5">
                Direct API calls like <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded">fetch('/api/users')</code> or <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded">axios.get('/api/orders')</code>
              </span>
            </div>

            {/* Likely */}
            <div className="flex items-start gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 flex-shrink-0">
                <span>⚠</span>
                <span>Likely</span>
              </span>
              <span className="text-xs leading-5">
                Template literals with variables like <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded">{"`/api/users/${id}`"}</code> - verify the actual endpoint
              </span>
            </div>

            {/* Review Needed */}
            <div className="flex items-start gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 flex-shrink-0">
                <span>?</span>
                <span>Review Needed</span>
              </span>
              <span className="text-xs leading-5">
                Complex URL construction or config-based calls - requires manual inspection
              </span>
            </div>
          </div>

          <p className="text-xs text-blue-700 dark:text-blue-300 pt-2 border-t border-blue-200 dark:border-blue-700">
            <strong>Note:</strong> The scanner uses regex pattern matching for speed. Future versions will include AST parsing for improved accuracy.
          </p>
        </div>
      )}
    </div>
  );
}