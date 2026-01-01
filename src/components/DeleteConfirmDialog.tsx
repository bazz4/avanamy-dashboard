'use client';

import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full"
        role="alertdialog"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        aria-modal="true"
      >
        {/* Icon */}
        <div className="p-6 pb-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>

          {/* Title */}
          <h2 id="delete-dialog-title" className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {title}
          </h2>

          {/* Message */}
          <p id="delete-dialog-description" className="text-slate-600 dark:text-slate-400">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 p-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}