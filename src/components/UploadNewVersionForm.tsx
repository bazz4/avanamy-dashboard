"use client";

import { FormEvent, useState } from "react";
import { uploadNewSpecVersion } from "@/lib/api";

interface Props {
  specId: string;
}

export function UploadNewVersionForm({ specId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
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
      await uploadNewSpecVersion(specId, file, name || 'Updated Spec', version || 'v2');
      setMessage("New version uploaded.");
    } catch (err) {
      console.error(err);
      setMessage("Failed to upload new version.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <div className="font-semibold text-slate-900 dark:text-white">Upload New Version</div>
      
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Spec File
        </label>
        <input
          type="file"
          accept=".json,.yaml,.yml,.xml"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-slate-500 dark:text-slate-400
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:text-sm file:font-semibold
            file:bg-purple-50 file:text-purple-700
            hover:file:bg-purple-100
            dark:file:bg-purple-900/20 dark:file:text-purple-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Updated API Spec"
          className="w-full rounded border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Version
        </label>
        <input
          type="text"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder="e.g., v2, 2.0.0"
          className="w-full rounded border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !file}
        className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Uploading..." : "Upload New Version"}
      </button>
      
      {message && (
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {message}
        </div>
      )}
    </form>
  );
}