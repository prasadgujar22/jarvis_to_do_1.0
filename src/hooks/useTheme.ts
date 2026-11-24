import { useCallback, useLayoutEffect } from 'react';
import { flushSync } from 'react-dom';
import type { Theme } from '../types';
import { STORAGE_KEYS } from '../lib/storage';
import { usePersistentState } from './usePersistentState';

const THEME_COLORS: Record<Theme, string> = { light: '#FFFFFF', dark: '#000000' };

function sanitizeTheme(raw: unknown): Theme | null {
  return raw === 'light' || raw === 'dark' ? raw : null;
}

function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = usePersistentState<Theme>(STORAGE_KEYS.theme, systemTheme(), sanitizeTheme);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion && typeof document.startViewTransition === 'function') {
      // Cross-fade the whole page between themes where the View Transitions API exists.
      document.startViewTransition(() => {
        flushSync(() => setTheme(next));
      });
    } else {
      setTheme(next);
    }
  }, [theme, setTheme]);

  return { theme, toggleTheme };
}
