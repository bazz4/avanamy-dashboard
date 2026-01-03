'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { uploadApiSpec } from '@/lib/api';
import type { ApiProduct } from '@/lib/types';

interface UploadSpecModalProps {
  product: ApiProduct;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadSpecModal({ product, onClose, onSuccess }: UploadSpecModalProps) {
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

  // Handle file selection
  function handleFileSelect(selectedFile: File) {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    
    // Auto-populate name from filename if empty - NOW INCLUDES XML
    if (!name) {
      const baseName = selectedFile.name.replace(/\.(json|yaml|yml|xml)$/i, '');
      setName(baseName);
    }
  }

  // Drag & drop handlers
  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!name.trim()) {
      setError('Spec name is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await uploadApiSpec(product.id, file, name.trim(), version.trim() || undefined);
      onSuccess();
    } catch (err: any) {
      console.error('Error uploading spec:', err);
      
      // ✅ IMPROVED: The error message from api.ts already has the parsed detail
      let errorMessage = 'Failed to upload spec';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        // Remove redundant prefixes if present
        errorMessage = errorMessage
          .replace(/^Failed to upload spec \(\d+\):?\s*/i, '')
          .replace(/^API POST \/api-specs\/upload failed:\s*\d+:?\s*/i, '')
          .trim();
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      if (!errorMessage || errorMessage === 'Failed to upload spec') {
        errorMessage = 'Upload failed. Please check your file and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="upload-spec-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 id="upload-spec-title" className="text-2xl font-bold text-slate-900 dark:text-white">
              Upload API Spec
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {product.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3" role="alert">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              OpenAPI Specification File <span className="text-red-500">*</span>
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${dragActive 
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                  : 'border-slate-300 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-600'
                }
                ${file ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : ''}
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.yaml,.yml,.xml"
                onChange={handleFileInput}
                className="hidden"
                aria-label="Upload OpenAPI specification file"
              />
              
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" aria-hidden="true" />
                  <div className="text-left">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="h-12 w-12 mx-auto text-slate-400" aria-hidden="true" />
                  <div>
                    <p className="text-base font-medium text-slate-900 dark:text-white mb-1">
                      Drop your OpenAPI spec here
                    </p>
                    <p className="text-sm text-slate-500">
                      or click to browse
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">
                    JSON, YAML, YML, or XML • Max 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Spec Name */}
          <div>
            <label htmlFor="spec-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Spec Name <span className="text-red-500">*</span>
            </label>
            <input
              id="spec-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Stripe Payments API"
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              A descriptive name for this API specification
            </p>
          </div>

          {/* Version (Optional) */}
          <div>
            <label htmlFor="spec-version" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Version <span className="text-slate-400">(Optional)</span>
            </label>
            <input
              id="spec-version"
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g., v1.0.0 or 2024.01"
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              Leave blank to auto-generate (v1, v2, v3...)
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
            >
              {loading ? 'Uploading...' : 'Upload Spec'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}