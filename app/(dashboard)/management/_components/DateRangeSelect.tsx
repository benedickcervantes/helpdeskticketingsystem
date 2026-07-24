'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  DATE_RANGE_OPTIONS,
  getDateRangeLabel,
  getDateRangeSpanLabel,
} from '@/lib/utils/analytics';

type DateRangeSelectProps = {
  value?: string | number;
  onChange?: (value: string) => void;
  className?: string;
  id?: string;
  align?: 'left' | 'right';
};

const DateRangeSelect = ({
  value = '30',
  onChange,
  className = '',
  id,
  align = 'right',
}: DateRangeSelectProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const listboxId = id || `date-range-${autoId}`;
  const current = String(value);
  const selected =
    DATE_RANGE_OPTIONS.find((opt) => opt.value === current) || DATE_RANGE_OPTIONS[1];
  const spanLabel = getDateRangeSpanLabel(current);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        id={listboxId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Period: ${getDateRangeLabel(current)}`}
        onClick={() => setOpen((prev) => !prev)}
        className={`
          group flex w-full sm:w-auto min-w-[11.5rem] items-center gap-2.5
          rounded-xl border border-app bg-app-panel px-3 py-2
          text-left shadow-sm transition-all duration-150
          hover:border-app-primary/40 hover:bg-app-surface-2/60
          focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/35
          ${open ? 'border-app-primary/45 bg-app-surface-2/70 ring-2 ring-app-primary/20' : ''}
        `}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-app-primary-soft text-app-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-app-muted">
            Period
          </span>
          <span className="block truncate text-sm font-semibold text-app leading-tight">
            {selected.label}
          </span>
          <span className="block truncate text-[11px] text-app-muted leading-tight">
            {spanLabel}
          </span>
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-app-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-labelledby={listboxId}
          className={`
            absolute z-40 mt-2 w-[min(100%,18rem)] sm:w-72 overflow-hidden
            rounded-xl border border-app bg-app-panel shadow-xl
            ${align === 'left' ? 'left-0' : 'left-0 sm:left-auto sm:right-0'}
          `}
        >
          <div className="border-b border-app bg-app-surface-2/50 px-3 py-2">
            <p className="text-[11px] font-medium text-app-muted">
              Inclusive calendar days · {spanLabel}
            </p>
          </div>
          <ul className="max-h-72 overflow-y-auto p-1.5">
            {DATE_RANGE_OPTIONS.map((opt) => {
              const isActive = opt.value === current;
              const optSpan = getDateRangeSpanLabel(opt.value);
              return (
                <li key={opt.value} role="option" aria-selected={isActive}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange?.(opt.value);
                      setOpen(false);
                    }}
                    className={`
                      flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors
                      ${
                        isActive
                          ? 'bg-app-primary-soft text-app-primary'
                          : 'text-app hover:bg-app-surface-2'
                      }
                    `}
                  >
                    <span
                      className={`
                        mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border
                        ${
                          isActive
                            ? 'border-app-primary bg-app-primary text-white'
                            : 'border-app/60 bg-transparent'
                        }
                      `}
                      aria-hidden
                    >
                      {isActive ? (
                        <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M2.5 6.2L4.8 8.5L9.5 3.5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-tight">
                        {opt.label}
                      </span>
                      <span
                        className={`block text-[11px] leading-tight mt-0.5 ${
                          isActive ? 'text-app-primary/80' : 'text-app-muted'
                        }`}
                      >
                        {optSpan}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default DateRangeSelect;
