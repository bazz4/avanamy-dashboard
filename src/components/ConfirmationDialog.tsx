'use client';

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmStyle?: 'danger' | 'primary';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmStyle = 'danger'
}: ConfirmDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      closeButtonRef.current?.focus();
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              confirmStyle === 'danger'
                ? 'bg-red-500/10 text-red-400'
                : 'bg-purple-500/10 text-purple-400'
            }`}>
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 id="confirm-dialog-title" className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5 text-slate-600 dark:text-slate-400" aria-hidden="true" />
          </button>
        </div>

        {/* Message */}
        <div className="p-6">
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition-all border border-slate-300 dark:border-slate-700"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`px-6 py-3 font-semibold rounded-lg transition-all shadow-lg ${
              confirmStyle === 'danger'
                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-red-500/30 hover:shadow-red-500/50'
                : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-purple-500/30 hover:shadow-purple-500/50'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}