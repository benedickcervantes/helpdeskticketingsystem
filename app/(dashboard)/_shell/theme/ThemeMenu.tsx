'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  APP_ACCENT_COLORS,
  useTheme,
  type ThemeMode,
} from '@/contexts/ThemeContext';

function PaletteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M12 2a10 10 0 0 0-7.35 16.76l.65.65a2 2 0 0 0 2.83 0l.35-.35a2 2 0 0 1 1.41-.59H12a6 6 0 0 0 0-12c1.1 0 2.12.3 3 .82" />
      <circle cx="7.5" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="10" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

type PanelCoords = {
  top: number;
  left: number;
};

export default function ThemeMenu() {
  const { theme, accentColor, setTheme, setAccentColor, resetToDefault, isDefault } =
    useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [coords, setCoords] = useState<PanelCoords | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const updateDesktopPosition = () => {
    const btn = buttonRef.current;
    if (!btn || isNarrow) return;
    const rect = btn.getBoundingClientRect();
    const panelWidth = Math.min(280, window.innerWidth - 24);
    const gap = 10;
    let left = rect.right - panelWidth;
    left = Math.max(12, Math.min(left, window.innerWidth - panelWidth - 12));
    const top = Math.min(rect.bottom + gap, window.innerHeight - 24);
    setCoords({ top, left });
  };

  useLayoutEffect(() => {
    if (!open || isNarrow) {
      setCoords(null);
      return;
    }
    updateDesktopPosition();
    const onResize = () => updateDesktopPosition();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open, isNarrow]);

  useEffect(() => {
    if (!open) return;

    // Avoid the opening click from immediately closing the panel
    let active = false;
    const activateTimer = window.setTimeout(() => {
      active = true;
    }, 0);

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!active) return;
      const target = event.target as Node;
      const inTrigger = rootRef.current?.contains(target);
      const inPanel = panelRef.current?.contains(target);
      if (!inTrigger && !inPanel) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: true });
    document.addEventListener('keydown', onKeyDown);

    const prevOverflow = document.body.style.overflow;
    if (isNarrow) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.clearTimeout(activateTimer);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, isNarrow]);

  const selectMode = (mode: ThemeMode) => {
    setTheme(mode);
  };

  const panelContent = (
    <div
      ref={panelRef}
      className={`app-theme-panel ${isNarrow ? 'app-theme-panel--mobile' : 'app-theme-panel--desktop'}`}
      role="dialog"
      aria-modal={isNarrow ? true : undefined}
      aria-labelledby={titleId}
      style={
        isNarrow
          ? undefined
          : coords
            ? { top: coords.top, left: coords.left, right: 'auto', bottom: 'auto' }
            : undefined
      }
    >
      <div className="app-theme-panel__head">
        <div className="app-theme-panel__head-row">
          <p className="app-theme-panel__title" id={titleId}>
            Theme
          </p>
          {isNarrow ? (
            <button
              type="button"
              className="app-theme-panel__close"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
        <p className="app-theme-panel__sub">
          Default is the original FPDC dark + emerald look
        </p>
      </div>

      <p className="app-theme-panel__label">COLOR</p>
      <div className="app-theme-panel__colors">
        {APP_ACCENT_COLORS.map((color) => (
          <button
            key={color.id}
            type="button"
            className={`app-theme-panel__swatch ${
              accentColor === color.value ? 'app-theme-panel__swatch--active' : ''
            }`}
            style={{ backgroundColor: color.value }}
            aria-label={color.label}
            title={color.label}
            onClick={() => setAccentColor(color.value)}
          />
        ))}
      </div>

      <p className="app-theme-panel__label">MODE</p>
      <div className="app-theme-panel__modes">
        <button
          type="button"
          className={`app-theme-panel__mode ${
            theme === 'light' ? 'app-theme-panel__mode--active' : ''
          }`}
          onClick={() => selectMode('light')}
        >
          <SunIcon />
          Light
        </button>
        <button
          type="button"
          className={`app-theme-panel__mode ${
            theme === 'dark' ? 'app-theme-panel__mode--active' : ''
          }`}
          onClick={() => selectMode('dark')}
        >
          <MoonIcon />
          Dark
        </button>
      </div>

      <button
        type="button"
        className="app-theme-panel__reset"
        onClick={resetToDefault}
        disabled={isDefault}
      >
        Reset to system default
      </button>
    </div>
  );

  const overlay =
    open && mounted
      ? createPortal(
          isNarrow ? (
            <div className="app-theme-layer app-theme-layer--mobile">
              <button
                type="button"
                className="app-theme-backdrop"
                aria-label="Close theme customizer"
                onClick={() => setOpen(false)}
              />
              {panelContent}
            </div>
          ) : coords ? (
            panelContent
          ) : null,
          document.body,
        )
      : null;

  return (
    <div className="app-theme-menu" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`app-theme-icon-btn ${open ? 'app-theme-icon-btn--active' : ''}`}
        aria-label="Customize theme"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        <PaletteIcon />
      </button>
      {overlay}
    </div>
  );
}
