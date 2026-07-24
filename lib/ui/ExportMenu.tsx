'use client';

import { useEffect, useRef, useState } from 'react';

type ExportMenuProps = {
  disabled?: boolean;
  exporting?: boolean;
  onCustomize: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
  className?: string;
};

export function ExportMenu({
  disabled = false,
  exporting = false,
  onCustomize,
  onExportExcel,
  onExportPdf,
  className = '',
}: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  useEffect(() => {
    if (exporting) setOpen(false);
  }, [exporting]);

  const isDisabled = disabled || exporting;

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-app bg-app-surface-2 px-3 py-2 text-sm font-medium text-app-soft hover:bg-app-surface-3 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {exporting ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-app-primary/30 border-t-app-primary" />
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
          </svg>
        )}
        {exporting ? 'Exporting…' : 'Export'}
        <svg className="h-3.5 w-3.5 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1 w-52 overflow-hidden rounded-lg border border-app bg-app-panel shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-app-soft hover:bg-app-surface-2"
            onClick={() => {
              setOpen(false);
              onCustomize();
            }}
          >
            <svg className="h-4 w-4 text-app-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h10M4 14h16M4 18h10" />
            </svg>
            Customize columns
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-app-soft hover:bg-app-surface-2"
            onClick={() => {
              setOpen(false);
              onExportExcel();
            }}
          >
            <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h6m0 0l-3-3m3 3l-3 3M5 7h4a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" />
            </svg>
            Export as Excel
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-app-soft hover:bg-app-surface-2"
            onClick={() => {
              setOpen(false);
              onExportPdf();
            }}
          >
            <svg className="h-4 w-4 text-app-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zm7 0v5h5" />
            </svg>
            Export as PDF
          </button>
        </div>
      )}
    </div>
  );
}
