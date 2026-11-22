import { AnimatePresence, m } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import type { Theme } from '../types';
import { cn } from '../lib/cn';

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Dark theme"
      title={`Switch to ${isDark ? 'light' : 'dark'} theme (T)`}
      onClick={onToggle}
      className={cn(
        'glass relative inline-grid size-10 place-items-center overflow-hidden rounded-2xl text-slate-700 transition-transform duration-200 hover:scale-105 active:scale-95 dark:text-slate-200',
        'focus-ring',
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={theme}
          initial={{ y: 14, opacity: 0, rotate: -60 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -14, opacity: 0, rotate: 60 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="grid place-items-center"
        >
          {isDark ? <Moon className="size-[18px]" aria-hidden /> : <Sun className="size-[18px]" aria-hidden />}
        </m.span>
      </AnimatePresence>
    </button>
  );
}
