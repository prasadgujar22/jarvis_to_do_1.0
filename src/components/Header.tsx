import { Keyboard } from 'lucide-react';
import type { TaskStats, Theme } from '../types';
import { formatLongDate, greeting } from '../lib/date';
import { ThemeToggle } from './ThemeToggle';
import { ProgressRing } from './ui/ProgressRing';
import { cn } from '../lib/cn';

interface HeaderProps {
  theme: Theme;
  stats: TaskStats;
  onToggleTheme: () => void;
  onOpenShortcuts: () => void;
}

export function Header({ theme, stats, onToggleTheme, onOpenShortcuts }: HeaderProps) {
  const progress = stats.total ? stats.done / stats.total : 0;
  return (
    <header className="flex items-center gap-3 sm:gap-4">
      <div className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/30 sm:size-12">
        <svg viewBox="0 0 24 24" className="size-6 text-white" aria-hidden>
          <path d="M6 12.5l4 4L18 8" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/30" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
          Jarvis <span className="text-gradient">To-Do</span>
        </h1>
        <p className="truncate text-sm text-slate-600 dark:text-slate-400">
          {greeting()} · {formatLongDate()}
        </p>
      </div>
      <div className="lg:hidden">
        <ProgressRing value={progress} size={44} stroke={4} label={`${stats.done} of ${stats.total} tasks done`} />
      </div>
      <button
        type="button"
        onClick={onOpenShortcuts}
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts (?)"
        className={cn(
          'glass hidden size-10 place-items-center rounded-2xl text-slate-700 transition-transform duration-200 hover:scale-105 active:scale-95 sm:inline-grid dark:text-slate-200',
          'focus-ring',
        )}
      >
        <Keyboard className="size-[18px]" aria-hidden />
      </button>
      <ThemeToggle theme={theme} onToggle={onToggleTheme} />
    </header>
  );
}
