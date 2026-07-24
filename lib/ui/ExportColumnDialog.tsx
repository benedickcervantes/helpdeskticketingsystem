'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type ExportColumnSection<T extends string> = {
  title: string;
  columns: Array<{ key: T; header: string; required?: boolean }>;
};

type ExportColumnDialogProps<T extends string> = {
  open: boolean;
  titleId: string;
  allColumnKeys: readonly T[];
  columnSections: ExportColumnSection<T>[];
  filterSummary?: string;
  exporting?: boolean;
  onClose: () => void;
  onExport: (format: 'excel' | 'pdf', columns: T[]) => void;
};

export function ExportColumnDialog<T extends string>({
  open,
  titleId,
  allColumnKeys,
  columnSections,
  filterSummary,
  exporting = false,
  onClose,
  onExport,
}: ExportColumnDialogProps<T>) {
  const [draft, setDraft] = useState<T[]>([...allColumnKeys]);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setDraft([...allColumnKeys]);
      setError('');
    }
  }, [open, allColumnKeys]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || exporting) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, exporting, onClose]);

  if (!open || !mounted) return null;

  const activeFilters =
    filterSummary && filterSummary !== 'None (all records)' ? filterSummary : undefined;
  const selectedSet = new Set(draft);
  const allSelected = draft.length === allColumnKeys.length;
  const selectedCount = draft.length;
  const totalCount = allColumnKeys.length;

  const toggleColumn = (key: T) => {
    setDraft((current) => {
      if (current.includes(key)) {
        return current.filter((item) => item !== key);
      }
      return [...current, key];
    });
    setError('');
  };

  const toggleSection = (keys: T[]) => {
    setDraft((current) => {
      const currentSet = new Set(current);
      const allInSection = keys.every((key) => currentSet.has(key));
      if (allInSection) {
        return current.filter((key) => !keys.includes(key));
      }
      const next = new Set(current);
      keys.forEach((key) => next.add(key));
      return allColumnKeys.filter((key) => next.has(key));
    });
    setError('');
  };

  const selectAll = () => {
    setDraft([...allColumnKeys]);
    setError('');
  };

  const clearAll = () => {
    setDraft([]);
    setError('');
  };

  const applyAndExport = (format: 'excel' | 'pdf') => {
    if (draft.length === 0) {
      setError('Select at least one column to export.');
      return;
    }
    const ordered = allColumnKeys.filter((key) => draft.includes(key));
    onExport(format, ordered);
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Close export options"
        onClick={exporting ? undefined : onClose}
        disabled={exporting}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92dvh] sm:max-h-[min(90vh,44rem)] w-full max-w-2xl flex-col rounded-t-2xl sm:rounded-xl border border-app bg-app-panel shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-app-subtle px-4 py-4 sm:px-5">
          <div className="flex gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-app-primary-soft text-app-primary">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h10M4 14h16M4 18h10" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-semibold text-app">
                Customize export columns
              </h2>
              <p className="mt-1 text-sm text-app-muted">
                Choose which fields to include in PDF and Excel exports. All columns are selected by default.
              </p>
              {activeFilters ? (
                <p className="mt-2 rounded-md border border-app-primary/30 bg-app-primary-soft/40 px-2.5 py-1.5 text-xs text-app-soft">
                  <span className="font-medium text-app-primary">Records to export:</span> {activeFilters}
                </p>
              ) : (
                <p className="mt-2 text-xs text-app-muted">All records will be exported (no filters active).</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={exporting}
            className="rounded-lg p-1.5 text-app-muted hover:bg-app-surface-3 hover:text-app disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-app-subtle px-4 py-3 sm:px-5">
          <p className="text-sm text-app-soft">
            <span className="font-medium text-app">{selectedCount}</span> of {totalCount} columns selected
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              disabled={exporting || allSelected}
              className="rounded-md border border-app px-2.5 py-1 text-xs font-medium text-app-soft hover:bg-app-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={exporting || selectedCount === 0}
              className="rounded-md border border-app px-2.5 py-1 text-xs font-medium text-app-soft hover:bg-app-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear all
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="space-y-5">
            {columnSections.map((section) => {
              const sectionKeys = section.columns.map((column) => column.key);
              const sectionSelected = sectionKeys.filter((key) => selectedSet.has(key)).length;
              const sectionAllSelected = sectionSelected === sectionKeys.length;

              return (
                <section key={section.title}>
                  <label className="mb-2 flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sectionAllSelected}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = sectionSelected > 0 && !sectionAllSelected;
                        }
                      }}
                      onChange={() => toggleSection(sectionKeys)}
                      disabled={exporting}
                      className="h-4 w-4 rounded border-app text-app-primary focus:ring-app-primary/40"
                    />
                    <span className="text-sm font-semibold tracking-wide text-app">{section.title}</span>
                    <span className="text-xs text-app-muted">
                      ({sectionSelected}/{sectionKeys.length})
                    </span>
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {section.columns.map((column) => (
                      <label
                        key={column.key}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-app-subtle bg-app-surface-2/40 px-3 py-2 text-sm text-app-soft hover:border-app"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSet.has(column.key)}
                          onChange={() => toggleColumn(column.key)}
                          disabled={exporting}
                          className="h-4 w-4 rounded border-app text-app-primary focus:ring-app-primary/40"
                        />
                        <span className="min-w-0 flex-1">
                          {column.header}
                          {column.required ? <span className="ml-1 text-app-primary">*</span> : null}
                        </span>
                      </label>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="mx-4 sm:mx-5 mb-0 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-app-subtle px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <button
            type="button"
            onClick={onClose}
            disabled={exporting}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-app px-4 text-sm font-medium text-app-soft hover:bg-app-surface-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => applyAndExport('excel')}
              disabled={exporting}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-600/40 bg-emerald-500/10 px-4 text-sm font-medium text-emerald-700 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-600/30 border-t-emerald-700" />
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h6m0 0l-3-3m3 3l-3 3M5 7h4a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" />
                </svg>
              )}
              Export Excel
            </button>
            <button
              type="button"
              onClick={() => applyAndExport('pdf')}
              disabled={exporting}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-app-primary px-4 text-sm font-medium text-app-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zm7 0v5h5" />
                </svg>
              )}
              Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
