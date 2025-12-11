"use client";

import { useState } from "react";
import { regenerateDocs } from "@/lib/api";

interface Props {
  specId: string;
}

export function RegenerateDocsButton({ specId }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setMessage(null);
    try {
      await regenerateDocs(specId);
      setMessage("Docs regeneration triggered.");
    } catch (err) {
      console.error(err);
      setMessage("Failed to regenerate docs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-x-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Regenerating..." : "Regenerate docs"}
      </button>
      {message && (
        <span className="text-xs text-slate-500">
          {message}
        </span>
      )}
    </div>
  );
}
