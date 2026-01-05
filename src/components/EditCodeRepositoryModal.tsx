'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { updateCodeRepository } from '@/lib/api';
import { CodeRepository, UpdateCodeRepositoryRequest } from '@/lib/types';

interface EditCodeRepositoryModalProps {
  repository: CodeRepository;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditCodeRepositoryModal({ repository, onClose, onSuccess }: EditCodeRepositoryModalProps) {
  const [formData, setFormData] = useState({
    name: repository.name,
    owner_team: repository.owner_team || '',
    owner_email: repository.owner_email || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Repository name is required';
    }

    if (formData.owner_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.owner_email)) {
      newErrors.owner_email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      // Prepare data (only include fields that changed)
      const data: UpdateCodeRepositoryRequest = {};

      if (formData.name.trim() !== repository.name) {
        data.name = formData.name.trim();
      }

      if (formData.owner_team?.trim() !== (repository.owner_team || '')) {
        data.owner_team = formData.owner_team.trim() || undefined;
      }

      if (formData.owner_email?.trim() !== (repository.owner_email || '')) {
        data.owner_email = formData.owner_email.trim() || undefined;
      }

      // Only make API call if something changed
      if (Object.keys(data).length === 0) {
        toast.info('No changes to save');
        onClose();
        return;
      }

      await updateCodeRepository(repository.id, data);
      toast.success('Code repository updated successfully');
      onSuccess();
    } catch (error: any) {
      console.log('Failed to update code repository:', error);
      const errorMessage = error?.message || 'Failed to update code repository';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Edit Code Repository
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-6 space-y-4">
            {/* Repository Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Repository Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., payments-service"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-900 dark:text-white ${
                  errors.name
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Repository URL (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Repository URL
              </label>
              <input
                type="text"
                value={repository.url}
                disabled
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                URL cannot be changed after creation
              </p>
            </div>

            {/* Owner Team */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Owner Team (Optional)
              </label>
              <input
                type="text"
                value={formData.owner_team}
                onChange={(e) => setFormData({ ...formData, owner_team: e.target.value })}
                placeholder="e.g., Payments Team"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-900 dark:text-white"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Used for impact alerts and ownership tracking
              </p>
            </div>

            {/* Owner Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Owner Email (Optional)
              </label>
              <input
                type="email"
                value={formData.owner_email}
                onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                placeholder="team@example.com"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-900 dark:text-white ${
                  errors.owner_email
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              {errors.owner_email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.owner_email}</p>
              )}
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Where to send impact notifications
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}