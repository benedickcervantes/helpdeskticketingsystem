'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';

export type ThemeMode = 'light' | 'dark';

/** Original system accent (Tailwind emerald-600). */
export const DEFAULT_ACCENT = '#059669';
export const DEFAULT_THEME: ThemeMode = 'dark';

export const APP_ACCENT_COLORS = [
  { id: 'default', value: DEFAULT_ACCENT, label: 'Default' },
  { id: 'emerald', value: '#10b981', label: 'Emerald' },
  { id: 'blue', value: '#2563eb', label: 'Blue' },
  { id: 'cyan', value: '#06b6d4', label: 'Cyan' },
  { id: 'indigo', value: '#6366f1', label: 'Indigo' },
  { id: 'purple', value: '#8b5cf6', label: 'Purple' },
  { id: 'pink', value: '#ec4899', label: 'Pink' },
  { id: 'orange', value: '#f97316', label: 'Orange' },
  { id: 'yellow', value: '#eab308', label: 'Yellow' },
  { id: 'slate', value: '#1e293b', label: 'Slate' },
] as const;

const THEME_KEY = 'helpdesk-theme';
const ACCENT_KEY = 'helpdesk-accent';

/** Landing + auth stay on dark tokens; dashboard preference is unchanged in localStorage. */
function isDarkOnlyRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/auth' ||
    pathname.startsWith('/auth/')
  );
}

type ThemeContextValue = {
  theme: ThemeMode;
  accentColor: string;
  setTheme: (theme: ThemeMode) => void;
  setAccentColor: (color: string) => void;
  resetToDefault: () => void;
  isDefault: boolean;
  shellStyle: React.CSSProperties;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Soft accent fill — mix with opaque surface (never transparent; Android Chrome paint trails). */
function accentSoft(color: string, theme: ThemeMode) {
  const base = theme === 'dark' ? '#1f2937' : '#e3e8ef';
  return `color-mix(in srgb, ${color} 22%, ${base})`;
}

function parseHexColor(hex: string): [number, number, number] | null {
  const normalized = hex.trim().toLowerCase();
  const match = /^#([0-9a-f]{6})$/.exec(normalized);
  if (!match) return null;
  const value = match[1];
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Boost low-luminance accents on dark surfaces so they stay visible. */
function accentForTheme(accentColor: string, theme: ThemeMode): string {
  if (theme !== 'dark') return accentColor;
  const rgb = parseHexColor(accentColor);
  if (!rgb) return accentColor;
  if (relativeLuminance(...rgb) < 0.22) {
    return `color-mix(in srgb, ${accentColor} 38%, #cbd5e1)`;
  }
  return accentColor;
}

function onPrimary(accentColor: string): string {
  const rgb = parseHexColor(accentColor);
  if (!rgb) return '#ffffff';
  return relativeLuminance(...rgb) > 0.55 ? '#0f172a' : '#ffffff';
}

function chartPalette(accentColor: string, theme: ThemeMode) {
  const mixBase = theme === 'dark' ? '#475569' : 'white';
  return {
    ['--app-chart-1' as string]: accentColor,
    ['--app-chart-2' as string]: `color-mix(in srgb, ${accentColor} 72%, ${mixBase})`,
    ['--app-chart-3' as string]: `color-mix(in srgb, ${accentColor} 48%, ${mixBase})`,
    ['--app-chart-4' as string]: `color-mix(in srgb, ${accentColor} 28%, ${mixBase})`,
  };
}

function brandTokens(resolvedAccent: string, theme: ThemeMode): React.CSSProperties {
  const isSystemAccent = resolvedAccent === DEFAULT_ACCENT;
  return {
    ['--app-primary' as string]: resolvedAccent,
    ['--app-primary-soft' as string]: accentSoft(resolvedAccent, theme),
    // Original system used emerald-700 (#047857) for primary hover
    ['--app-primary-hover' as string]: isSystemAccent
      ? '#047857'
      : `color-mix(in srgb, ${resolvedAccent} 88%, black)`,
    ['--app-primary-border' as string]: `color-mix(in srgb, ${resolvedAccent} 28%, var(--app-border))`,
    ['--app-on-primary' as string]: onPrimary(resolvedAccent),
    ...chartPalette(resolvedAccent, theme),
  };
}

function applyBrandTokensToDocument(tokens: React.CSSProperties) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(tokens)) {
    if (typeof value === 'string') {
      root.style.setProperty(key, value);
    }
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const forceDark = isDarkOnlyRoute(pathname);
  const [theme, setThemeState] = useState<ThemeMode>(DEFAULT_THEME);
  const [accentColor, setAccentState] = useState(DEFAULT_ACCENT);

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY);
    const storedAccent = localStorage.getItem(ACCENT_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setThemeState(storedTheme);
    }
    if (storedAccent) {
      setAccentState(storedAccent);
    }
  }, []);

  const applyDocumentTheme = useCallback(
    (mode: ThemeMode) => {
      const root = document.documentElement;
      root.setAttribute('data-theme', forceDark ? 'dark' : mode);
      // Public pages always use the default emerald brand, not dashboard accents.
      if (forceDark) {
        root.style.removeProperty('--app-primary');
        root.style.removeProperty('--app-primary-soft');
        root.style.removeProperty('--app-primary-hover');
        root.style.removeProperty('--app-on-primary');
        root.style.removeProperty('--app-primary-border');
      }
    },
    [forceDark],
  );

  const setTheme = useCallback(
    (next: ThemeMode) => {
      setThemeState(next);
      localStorage.setItem(THEME_KEY, next);
      applyDocumentTheme(next);
    },
    [applyDocumentTheme],
  );

  useEffect(() => {
    applyDocumentTheme(theme);
  }, [applyDocumentTheme, theme]);

  const setAccentColor = useCallback((color: string) => {
    setAccentState(color);
    localStorage.setItem(ACCENT_KEY, color);
  }, []);

  const resetToDefault = useCallback(() => {
    setThemeState(DEFAULT_THEME);
    setAccentState(DEFAULT_ACCENT);
    localStorage.setItem(THEME_KEY, DEFAULT_THEME);
    localStorage.setItem(ACCENT_KEY, DEFAULT_ACCENT);
    applyDocumentTheme(DEFAULT_THEME);
  }, [applyDocumentTheme]);

  const isDefault = theme === DEFAULT_THEME && accentColor === DEFAULT_ACCENT;

  const effectiveTheme: ThemeMode = forceDark ? 'dark' : theme;

  const resolvedAccent = useMemo(
    () =>
      accentForTheme(forceDark ? DEFAULT_ACCENT : accentColor, effectiveTheme),
    [accentColor, effectiveTheme, forceDark],
  );

  const shellStyle = useMemo(
    (): React.CSSProperties => brandTokens(resolvedAccent, effectiveTheme),
    [resolvedAccent, effectiveTheme],
  );

  useEffect(() => {
    if (forceDark) {
      // Keep CSS vars on :root/[data-theme=dark] defaults for public pages.
      applyDocumentTheme(theme);
      return;
    }
    applyBrandTokensToDocument(shellStyle);
  }, [shellStyle, forceDark, applyDocumentTheme, theme]);

  const value = useMemo(
    () => ({
      theme,
      accentColor,
      setTheme,
      setAccentColor,
      resetToDefault,
      isDefault,
      shellStyle,
    }),
    [accentColor, isDefault, resetToDefault, setAccentColor, setTheme, shellStyle, theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

export function useThemeOptional() {
  return useContext(ThemeContext);
}
