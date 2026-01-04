// File: src/components/UploadSpecModal.tsx
// Complete fixed version

'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import { uploadApiSpec } from '@/lib/api';
import type { ApiProduct } from '@/lib/types';
import { uploadNewSpecVersion } from "@/lib/api";

interface UploadSpecModalProps {
  product?: ApiProduct | null;
  specId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadSpecModal({ 
  product, 
  specId,     // Add this
  onClose, 
  onSuccess 
}: UploadSpecModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [version, setVersion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file - NOW INCLUDES XML
  function validateFile(file: File): string | null {
    const validExtensions = ['.json', '.yaml', '.yml', '.xml'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(extension)) {
      return 'Invalid file type. Please upload a JSON, YAML, or XML file.';
    }
    
    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return 'File too large. Maximum size is 10MB.';
    }
    
    return null;
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const error = validateFile(selectedFile);
    if (error) {
      setError(error);
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    
    // Auto-fill name from filename if empty
    if (!name) {
      const baseName = selectedFile.name.replace(/\.(json|yaml|yml|xml)$/i, '');
      setName(baseName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!file) {
    setError('Please select a file');
    return;
  }

  const fileError = validateFile(file);
  if (fileError) {
    setError(fileError);
    return;
  }

  // Determine if we're creating new or updating existing
  const apiProductId = product?.id;
  const existingSpecId = specId;

  // If neither product nor specId, we have a problem
  if (!apiProductId && !existingSpecId) {
    setError('Missing product or spec information');
    return;
  }

  try {
    setLoading(true);
    setError(null);

    if (existingSpecId) {
      // Uploading new version to existing spec
      await uploadNewSpecVersion(existingSpecId, file, name, version);
    } else {
      // Creating new spec for product
      await uploadApiSpec(file, apiProductId!, name, version);
    }

    onSuccess();
  } catch (err: any) {
    console.error('Upload failed:', err);
    let errorMessage = 'Failed to upload specification';
    if (err?.message) {
      errorMessage = err.message;
    }
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

  // Determine title and subtitle
  const title = specId ? 'Upload New Version' : 'Upload API Spec';
  const subtitle = product?.name || (specId ? 'New specification version' : 'No product selected');

  return (
    <div 
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-spec-title"
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 id="upload-spec-title" className="text-2xl font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              OpenAPI Specification File
            </label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                  : 'border-slate-300 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-600'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.yaml,.yml,.xml"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="sr-only"
                id="spec-file-input"
              />
              
              {file ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 mx-auto text-green-500" aria-hidden="true" />
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Choose different file
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 mx-auto text-slate-400" aria-hidden="true" />
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      Choose a file
                    </button>
                    <span className="text-sm text-slate-500 dark:text-slate-400"> or drag and drop</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    JSON, YAML, or XML (max 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="spec-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Specification Name *
            </label>
            <input
              id="spec-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Payments API"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Version */}
          <div>
            <label htmlFor="spec-version" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Version (optional)
            </label>
            <input
              id="spec-version"
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g., 1.0.0"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              {loading ? 'Uploading...' : 'Upload Spec'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}