'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

export type OptionPickerModalProps = {
  open: boolean;
  title: string;
  options: string[];
  selected: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  allowClear?: boolean;
  clearLabel?: string;
  /** `auth` matches the login/register gray + emerald palette */
  tone?: 'default' | 'auth';
  onClose: () => void;
  onSelect: (value: string) => void;
};

const OptionPickerModal = ({
  open,
  title,
  options,
  selected,
  searchPlaceholder = 'Search…',
  emptyMessage = 'No options match your search.',
  allowClear = false,
  clearLabel = 'Clear selection',
  tone = 'default',
  onClose,
  onSelect,
}: OptionPickerModalProps) => {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const titleId = useMemo(
    () => `option-picker-title-${title.replace(/\s+/g, '-').toLowerCase()}`,
    [title],
  );
  const isAuth = tone === 'auth';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setSearch('');
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => searchRef.current?.focus(), 50);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...options];
    if (selected && !list.includes(selected)) {
      list.unshift(selected);
    }
    if (!q) return list;
    return list.filter((name) => name.toLowerCase().includes(q));
  }, [options, search, selected]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className={`absolute inset-0 backdrop-blur-[1px] ${
          isAuth ? 'bg-black/60' : 'bg-black/55'
        }`}
        aria-label={`Close ${title}`}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex w-full max-w-md max-h-[85vh] flex-col overflow-hidden rounded-t-2xl shadow-2xl sm:rounded-2xl ${
          isAuth
            ? 'border border-gray-800 bg-gray-900'
            : 'border border-app-subtle bg-app-panel'
        }`}
      >
        <div
          className={`flex-shrink-0 px-4 py-3.5 sm:px-5 ${
            isAuth ? 'border-b border-gray-800' : 'border-b border-app-subtle'
          }`}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3
              id={titleId}
              className={`text-base sm:text-lg font-semibold ${
                isAuth ? 'text-white' : 'text-app'
              }`}
            >
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                isAuth
                  ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  : 'text-app-muted hover:bg-app-surface-2 hover:text-app'
              }`}
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
              <svg
                className={`h-4 w-4 ${isAuth ? 'text-gray-500' : 'text-app-muted'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className={
                isAuth
                  ? 'block w-full min-w-0 rounded-xl border border-gray-700 bg-gray-950/80 py-2.5 pl-8 pr-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/80 focus:border-emerald-500/50'
                  : 'app-field block w-full min-w-0 rounded-xl border py-2.5 pl-8 pr-3 text-sm focus:outline-none'
              }
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 sm:px-3">
          {filtered.length === 0 ? (
            <p
              className={`px-3 py-8 text-center text-sm ${
                isAuth ? 'text-gray-500' : 'text-app-muted'
              }`}
            >
              {emptyMessage}
            </p>
          ) : (
            <ul className="space-y-0.5" role="listbox" aria-label={title}>
              {filtered.map((item) => {
                const isSelected = item === selected;
                return (
                  <li key={item}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onSelect(item);
                        onClose();
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                        isAuth
                          ? isSelected
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                          : isSelected
                            ? 'bg-app-primary-soft text-app-primary'
                            : 'text-app-soft hover:bg-app-surface-2 hover:text-app'
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
                          isAuth
                            ? isSelected
                              ? 'border-emerald-500 bg-emerald-600 text-white'
                              : 'border-gray-600'
                            : isSelected
                              ? 'border-app-primary bg-app-primary text-app-on-primary'
                              : 'border-app'
                        }`}
                      >
                        {isSelected && (
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere] font-medium leading-snug">
                        {item}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {allowClear && (
          <div
            className={`flex-shrink-0 px-4 py-3 sm:px-5 ${
              isAuth ? 'border-t border-gray-800' : 'border-t border-app-subtle'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                onSelect('');
                onClose();
              }}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                isAuth
                  ? 'border-gray-700 bg-gray-950/80 text-gray-300 hover:bg-gray-800 hover:text-white'
                  : 'border-app bg-app-surface-2 text-app-soft hover:bg-app-surface-3'
              }`}
            >
              {clearLabel}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default OptionPickerModal;
