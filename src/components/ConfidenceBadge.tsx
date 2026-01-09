'use client';

import { Info } from 'lucide-react';

interface ConfidenceBadgeProps {
  confidence: number;
  detectionMethod: string;
}

export function ConfidenceBadge({ confidence, detectionMethod }: ConfidenceBadgeProps) {
  // Determine badge level and styling
  const getConfidenceLevel = () => {
    if (confidence >= 0.9) {
      return {
        label: 'Confirmed',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        icon: '✓',
        description: 'Direct API call detected with clear HTTP method and path',
      };
    } else if (confidence >= 0.7) {
      return {
        label: 'Likely',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        icon: '⚠',
        description: 'API call detected but may contain variables or template literals',
      };
    } else {
      return {
        label: 'Review Needed',
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        icon: '?',
        description: 'Possible API call with complex URL construction - manual review recommended',
      };
    }
  };

  const level = getConfidenceLevel();

  return (
    <div className="flex items-center gap-1.5">
      {/* Badge */}
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${level.color}`}>
        <span>{level.icon}</span>
        <span>{level.label}</span>
      </span>

      {/* Info Icon with Tooltip */}
      <div className="group relative">
        <Info className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help" />
        
        {/* Tooltip */}
        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50 w-64">
          <div className="bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg p-3 shadow-lg">
            <div className="font-semibold mb-1">{level.label}</div>
            <div className="text-slate-300 dark:text-slate-300 mb-2">{level.description}</div>
            <div className="text-slate-400 dark:text-slate-400 text-[10px]">
              Detection: {detectionMethod} • Confidence: {Math.round(confidence * 100)}%
            </div>
            {/* Tooltip arrow */}
            <div className="absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900 dark:border-t-slate-700"></div>
          </div>
        </div>
      </div>
    </div>
  );
}