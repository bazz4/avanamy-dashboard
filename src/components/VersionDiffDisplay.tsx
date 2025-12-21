"use client";

import { useState } from "react";
import { DiffInfo } from "@/lib/types";

interface VersionDiffDisplayProps {
  diff: DiffInfo | null | undefined;
  summary: string | null | undefined;
  versionLabel: string;
}

export function VersionDiffDisplay({ diff, summary, versionLabel }: VersionDiffDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!diff || diff.changes.length === 0) {
    return null;
  }

  const breakingChanges = diff.changes.filter((c) =>
    ["endpoint_removed", "method_removed", "required_request_field_added", "required_response_field_removed"].includes(c.type)
  );

  const nonBreakingChanges = diff.changes.filter((c) =>
    !["endpoint_removed", "method_removed", "required_request_field_added", "required_response_field_removed"].includes(c.type)
  );

  return (
    <div className="mt-2 space-y-2">
      {/* AI Summary - Show first if available */}
      {summary && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-start gap-2">
            <span className="text-blue-600 font-semibold text-sm">🤖 AI Summary:</span>
          </div>
          <p className="text-sm text-blue-900 mt-1">{summary}</p>
        </div>
      )}

      {/* Badge */}
      <div className="flex items-center gap-2">
        {diff.breaking ? (
          <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
            ⚠️ Breaking Changes
          </span>
        ) : (
          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
            ✓ Non-Breaking
          </span>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
        >
          {isExpanded ? "Hide" : "Show"} {diff.changes.length} change{diff.changes.length !== 1 ? "s" : ""}
        </button>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs space-y-2">
          {breakingChanges.length > 0 && (
            <div>
              <div className="font-semibold text-red-700 mb-1">Breaking Changes:</div>
              <ul className="space-y-1 text-red-900">
                {breakingChanges.map((change, idx) => (
                  <li key={idx} className="font-mono">
                    {formatChange(change)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {nonBreakingChanges.length > 0 && (
            <div>
              <div className="font-semibold text-green-700 mb-1">Non-Breaking Changes:</div>
              <ul className="space-y-1 text-green-900">
                {nonBreakingChanges.map((change, idx) => (
                  <li key={idx} className="font-mono">
                    {formatChange(change)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatChange(change: any): string {
  const { type, path, method, field } = change;

  switch (type) {
    case "endpoint_added":
      return `➕ Added endpoint: ${path}`;
    case "endpoint_removed":
      return `➖ Removed endpoint: ${path}`;
    case "method_added":
      return `➕ Added method: ${method} ${path}`;
    case "method_removed":
      return `➖ Removed method: ${method} ${path}`;
    case "required_request_field_added":
      return `➕ Required request field: ${method} ${path} → ${field}`;
    case "required_request_field_removed":
      return `➖ Removed required request field: ${method} ${path} → ${field}`;
    case "required_response_field_added":
      return `➕ Required response field: ${method} ${path} → ${field}`;
    case "required_response_field_removed":
      return `➖ Removed required response field: ${method} ${path} → ${field}`;
    default:
      return `${type}: ${path}`;
  }
}
