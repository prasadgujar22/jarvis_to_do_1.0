import { AnimatePresence, m } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import type { Theme } from '../types';
import { cn } from '../lib/cn';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
  variant?: 'icon' | 'rail';
}

export function ThemeToggle({ theme, onToggle, variant = 'icon' }: ThemeToggleProps) {
  const isDark = theme === 'dark';

  if (variant === 'rail') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label="Dark theme"
        title={`Switch to ${isDark ? 'light' : 'dark'} theme (T)`}
        onClick={onToggle}
        className={cn(
          'group inline-flex items-center justify-center gap-4 rounded-full p-3 text-[19px] leading-6 text-[#0F1419] transition-colors duration-150',
          'hover:bg-[#0F1419]/10 xl:w-full xl:justify-start xl:px-4',
          'dark:text-[#E7E9EA] dark:hover:bg-[#E7E9EA]/10',
          'focus-ring',
        )}
      >
        <span className="relative grid size-6 shrink-0 place-items-center overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <m.span
              key={theme}
              initial={{ y: 12, opacity: 0, rotate: -45 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: -12, opacity: 0, rotate: 45 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="grid place-items-center"
            >
              {isDark ? <Moon className="size-[22px]" aria-hidden /> : <Sun className="size-[22px]" aria-hidden />}
            </m.span>
          </AnimatePresence>
        </span>
        <span aria-hidden className="hidden min-w-0 flex-1 truncate text-left font-normal xl:inline">
          {isDark ? 'Lights out' : 'Light mode'}
        </span>
        <span
          aria-hidden
          className={cn(
            'hidden h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-150 xl:inline-flex',
            isDark ? 'bg-[#1D9BF0]' : 'bg-[#CFD9DE]',
          )}
        >
          <span
            className={cn(
              'size-4 rounded-full bg-white shadow-sm transition-transform duration-150',
              isDark ? 'translate-x-4' : 'translate-x-0',
            )}
          />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Dark theme"
      title={`Switch to ${isDark ? 'light' : 'dark'} theme (T)`}
      onClick={onToggle}
      className={cn(
        'relative inline-grid size-9 place-items-center overflow-hidden rounded-full text-[#0F1419] transition-colors duration-150',
        'hover:bg-[#0F1419]/10 dark:text-[#E7E9EA] dark:hover:bg-[#E7E9EA]/10',
        'focus-ring',
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={theme}
          initial={{ y: 12, opacity: 0, rotate: -45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -12, opacity: 0, rotate: 45 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="grid place-items-center"
        >
          {isDark ? <Moon className="size-[18px]" aria-hidden /> : <Sun className="size-[18px]" aria-hidden />}
        </m.span>
      </AnimatePresence>
    </button>
  );
}
