"use client";

import { FormEvent, useState } from "react";
import { uploadNewSpecVersion } from "@/lib/api";

interface Props {
  specId: string;
}

export function UploadNewVersionForm({ specId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [changelog, setChangelog] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await uploadNewSpecVersion(specId, file, changelog);
      setMessage("New version uploaded.");
    } catch (err) {
      console.error(err);
      setMessage("Failed to upload new version.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded border border-slate-200 bg-white p-3 text-sm">
      <div className="font-medium">Upload new spec version</div>
      <input
        type="file"
        accept=".json,.yaml,.yml"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="block w-full text-xs"
      />
      <textarea
        value={changelog}
        onChange={(e) => setChangelog(e.target.value)}
        placeholder="Changelog (optional)"
        className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
        rows={2}
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-60"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
      {message && (
        <div className="text-xs text-slate-500">
          {message}
        </div>
      )}
    </form>
  );
}
