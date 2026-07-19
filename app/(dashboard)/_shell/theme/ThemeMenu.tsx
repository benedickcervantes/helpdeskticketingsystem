'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  APP_ACCENT_COLORS,
  useTheme,
  type ThemeMode,
} from '@/contexts/ThemeContext';

/** Half-filled circle — standard appearance / theme control mark. */
function ThemeIcon() {
  return (
    <svg
      className="w-6 h-6"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8.25"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M12 3.75a8.25 8.25 0 0 0 0 16.5V3.75z"
        fill="currentColor"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

type PanelCoords = {
  top: number;
  left: number;
};

type TipCoords = {
  top: number;
  left: number;
  width: number;
  arrowLeft: number;
  placement: 'above' | 'below';
};

const THEME_TIP_KEY = 'helpdesk-theme-tip-seen';

export default function ThemeMenu() {
  const { theme, accentColor, setTheme, setAccentColor, resetToDefault, isDefault } =
    useTheme();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [coords, setCoords] = useState<PanelCoords | null>(null);
  const [showTip, setShowTip] = useState(false);
  const [tipCoords, setTipCoords] = useState<TipCoords | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const tipTitleId = useId();

  const dismissTip = () => {
    setShowTip(false);
    setTipCoords(null);
    try {
      localStorage.setItem(THEME_TIP_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // One-time coach mark after login so users discover the new theme feature.
  useEffect(() => {
    if (!mounted) return;
    try {
      if (localStorage.getItem(THEME_TIP_KEY) === '1') return;
    } catch {
      return;
    }
    const timer = window.setTimeout(() => setShowTip(true), 900);
    return () => window.clearTimeout(timer);
  }, [mounted]);

  // Keep tip inside the viewport on small phones (fixed + clamped).
  useLayoutEffect(() => {
    if (!showTip || open) {
      setTipCoords(null);
      return;
    }

    const updateTipPosition = () => {
      const btn = buttonRef.current;
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const pad = 12;
      const width = Math.min(280, window.innerWidth - pad * 2);
      let left = rect.right - width;
      left = Math.max(pad, Math.min(left, window.innerWidth - width - pad));

      const estimatedHeight = isNarrow ? 160 : 150;
      let top = rect.bottom + 10;
      let placement: TipCoords['placement'] = 'below';
      if (top + estimatedHeight > window.innerHeight - pad) {
        top = Math.max(pad, rect.top - estimatedHeight - 10);
        placement = 'above';
      }

      // Offset from tip's left edge to the theme button center.
      const buttonCenterX = rect.left + rect.width / 2;
      const arrowLeft = Math.max(
        14,
        Math.min(buttonCenterX - left - 5, width - 18),
      );

      setTipCoords({ top, left, width, arrowLeft, placement });
    };

    updateTipPosition();
    window.addEventListener('resize', updateTipPosition);
    window.addEventListener('scroll', updateTipPosition, true);
    return () => {
      window.removeEventListener('resize', updateTipPosition);
      window.removeEventListener('scroll', updateTipPosition, true);
    };
  }, [showTip, open, isNarrow]);

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
        className={`app-theme-icon-btn ${open ? 'app-theme-icon-btn--active' : ''} ${
          showTip && !open ? 'app-theme-icon-btn--tip' : ''
        }`}
        aria-label="Theme settings"
        title="Theme"
        aria-expanded={open}
        aria-describedby={showTip && !open ? tipTitleId : undefined}
        onClick={(event) => {
          event.stopPropagation();
          if (showTip) dismissTip();
          setOpen((prev) => !prev);
        }}
      >
        <ThemeIcon />
      </button>

      {showTip && !open && mounted && tipCoords
        ? createPortal(
            <div
              ref={tipRef}
              className={`app-theme-tip ${
                tipCoords.placement === 'above' ? 'app-theme-tip--above' : ''
              }`}
              role="status"
              aria-labelledby={tipTitleId}
              style={{
                top: tipCoords.top,
                left: tipCoords.left,
                width: tipCoords.width,
                ['--tip-arrow-left' as string]: `${tipCoords.arrowLeft}px`,
              }}
            >
              <span className="app-theme-tip__badge">New</span>
              <p className="app-theme-tip__title" id={tipTitleId}>
                Customize your theme
              </p>
              <p className="app-theme-tip__text">
                Switch Light or Dark mode and pick an accent color anytime from
                this button.
              </p>
              <button
                type="button"
                className="app-theme-tip__btn"
                onClick={dismissTip}
              >
                Got it
              </button>
            </div>,
            document.body,
          )
        : null}

      {overlay}
    </div>
  );
}
