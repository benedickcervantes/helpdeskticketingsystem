'use client';

import { useEffect, useId, useRef, useState } from 'react';

export const TEAM_SORT_OPTIONS = [
  {
    value: 'open',
    label: 'Needs help first',
    description: 'Teams with the most open / overdue work',
    iconTone: 'amber',
    iconPath: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
  },
  {
    value: 'volume',
    label: 'Most requests',
    description: 'Highest number of support tickets',
    iconTone: 'sky',
    iconPath: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  },
  {
    value: 'rate',
    label: 'Highest finish %',
    description: 'Best completion rate across teams',
    iconTone: 'emerald',
    iconPath: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
] as const;

export type TeamSortValue = (typeof TEAM_SORT_OPTIONS)[number]['value'];

const toneClass = {
  amber: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  sky: 'bg-sky-500/15 text-sky-600 border-sky-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
};

type TeamSortSelectProps = {
  value?: string;
  onChange?: (value: TeamSortValue) => void;
  className?: string;
  align?: 'left' | 'right';
};

const TeamSortSelect = ({
  value = 'open',
  onChange,
  className = '',
  align = 'right',
}: TeamSortSelectProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const listboxId = `team-sort-${autoId}`;
  const current = String(value);
  const selected =
    TEAM_SORT_OPTIONS.find((opt) => opt.value === current) || TEAM_SORT_OPTIONS[0];

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
        aria-label={`Sort teams: ${selected.label}`}
        onClick={() => setOpen((prev) => !prev)}
        className={`
          group flex w-full sm:w-auto min-w-[13rem] items-center gap-2.5
          rounded-xl border border-app bg-app-panel px-3 py-2
          text-left shadow-sm transition-all duration-150
          hover:border-app-primary/40 hover:bg-app-surface-2/60
          focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/35
          ${open ? 'border-app-primary/45 bg-app-surface-2/70 ring-2 ring-app-primary/20' : ''}
        `}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${toneClass[selected.iconTone]}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d={selected.iconPath}
            />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-app-muted">
            Sort by
          </span>
          <span className="block truncate text-sm font-semibold text-app leading-tight">
            {selected.label}
          </span>
          <span className="block truncate text-[11px] text-app-muted leading-tight">
            {selected.description}
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
            absolute z-40 mt-2 w-[min(100%,19rem)] sm:w-80 overflow-hidden
            rounded-xl border border-app bg-app-panel shadow-xl
            ${align === 'left' ? 'left-0' : 'left-0 sm:left-auto sm:right-0'}
          `}
        >
          <div className="border-b border-app bg-app-surface-2/50 px-3.5 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-app-muted">
              Order all teams
            </p>
          </div>
          <ul className="p-1.5">
            {TEAM_SORT_OPTIONS.map((opt) => {
              const isActive = opt.value === current;
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
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${toneClass[opt.iconTone]}`}
                      aria-hidden
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.75}
                          d={opt.iconPath}
                        />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1 pt-0.5">
                      <span className="flex items-center justify-between gap-2">
                        <span className="block text-sm font-semibold leading-tight">
                          {opt.label}
                        </span>
                        {isActive ? (
                          <svg className="h-4 w-4 shrink-0 text-app-primary" viewBox="0 0 12 12" fill="none" aria-hidden>
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
                      <span
                        className={`block text-[11px] leading-snug mt-0.5 ${
                          isActive ? 'text-app-primary/80' : 'text-app-muted'
                        }`}
                      >
                        {opt.description}
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

export default TeamSortSelect;
