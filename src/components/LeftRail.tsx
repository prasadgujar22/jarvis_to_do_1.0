import { memo } from 'react';
import { CheckCircle2, CircleDot, Feather, Inbox, Keyboard } from 'lucide-react';
import type { StatusFilter, TaskStats, Theme } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '../lib/cn';

interface LeftRailProps {
  status: StatusFilter;
  counts: Record<StatusFilter, number>;
  stats: TaskStats;
  theme: Theme;
  onStatusChange: (status: StatusFilter) => void;
  onToggleTheme: () => void;
  onFocusComposer: () => void;
  onOpenShortcuts: () => void;
}

const NAV_ITEMS: Array<{ value: StatusFilter; label: string; key: string; icon: typeof Inbox }> = [
  { value: 'all', label: 'All', key: '1', icon: Inbox },
  { value: 'active', label: 'Active', key: '2', icon: CircleDot },
  { value: 'done', label: 'Completed', key: '3', icon: CheckCircle2 },
];

export function JarvisMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={cn('size-7', className)} aria-hidden>
      <path
        d="M5.5 14.5L11.2 20.2L22.5 8.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22.5" cy="20.2" r="2.2" fill="#1D9BF0" />
    </svg>
  );
}

export const LeftRail = memo(function LeftRail({
  status,
  counts,
  stats,
  theme,
  onStatusChange,
  onToggleTheme,
  onFocusComposer,
  onOpenShortcuts,
}: LeftRailProps) {
  return (
    <aside
      aria-label="Primary navigation"
      className="hidden shrink-0 lg:flex lg:w-[88px] xl:w-[275px]"
    >
      <div className="sticky top-0 flex h-dvh w-full flex-col justify-between px-3 py-3 xl:px-4">
        <div className="flex flex-col items-center gap-1 xl:items-stretch">
          <div className="mb-1 flex items-center gap-3 px-2 py-2 xl:px-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full text-[#0F1419] dark:text-[#E7E9EA]">
              <JarvisMark />
            </div>
            <span className="hidden text-[20px] font-extrabold tracking-[-0.03em] text-[#0F1419] xl:inline dark:text-[#E7E9EA]">
              Jarvis
            </span>
          </div>

          <nav aria-label="Task views" className="flex flex-col items-center gap-0.5 xl:items-stretch">
            {NAV_ITEMS.map(({ value, label, key, icon: Icon }) => {
              const active = status === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  aria-label={`${label} tasks (${counts[value]})`}
                  title={`${label} (${key})`}
                  onClick={() => onStatusChange(value)}
                  className={cn(
                    'group relative inline-flex items-center justify-center gap-4 rounded-full p-3 text-[19px] leading-6 transition-colors duration-150',
                    'hover:bg-[#0F1419]/10 xl:w-full xl:justify-start xl:px-4',
                    'dark:hover:bg-[#E7E9EA]/10',
                    'focus-ring',
                    active
                      ? 'font-bold text-[#0F1419] dark:text-[#E7E9EA]'
                      : 'font-normal text-[#0F1419] dark:text-[#E7E9EA]',
                  )}
                >
                  <span className="relative grid size-6 shrink-0 place-items-center">
                    <Icon
                      className="size-[22px]"
                      strokeWidth={active ? 2.5 : 1.85}
                      aria-hidden
                    />
                    {active && (
                      <span
                        aria-hidden
                        className="absolute -right-1 -top-0.5 size-2 rounded-full bg-[#1D9BF0]"
                      />
                    )}
                  </span>
                  <span aria-hidden className="hidden min-w-0 flex-1 truncate text-left xl:inline">
                    {label}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      'hidden text-[13px] tabular-nums xl:inline',
                      active
                        ? 'font-semibold text-[#0F1419] dark:text-[#E7E9EA]'
                        : 'text-[#536471] dark:text-[#8B98A5]',
                    )}
                  >
                    {counts[value]}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="my-1.5 border-t border-[#EFF3F4] dark:border-[#2F3336]" aria-hidden />

          <ThemeToggle theme={theme} onToggle={onToggleTheme} variant="rail" />

          <button
            type="button"
            onClick={onOpenShortcuts}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
            className={cn(
              'inline-flex items-center justify-center gap-4 rounded-full p-3 text-[19px] leading-6 font-normal text-[#0F1419] transition-colors duration-150',
              'hover:bg-[#0F1419]/10 xl:w-full xl:justify-start xl:px-4',
              'dark:text-[#E7E9EA] dark:hover:bg-[#E7E9EA]/10',
              'focus-ring',
            )}
          >
            <Keyboard className="size-[22px] shrink-0" strokeWidth={1.85} aria-hidden />
            <span aria-hidden className="hidden truncate xl:inline">
              Shortcuts
            </span>
          </button>

          <button
            type="button"
            onClick={onFocusComposer}
            aria-label="New Task"
            title="New task (N)"
            className={cn(
              'mt-4 inline-flex size-12 items-center justify-center rounded-full font-bold transition-colors duration-150',
              'bg-[#0F1419] text-white hover:bg-[#272C30]',
              'dark:bg-[#EFF3F4] dark:text-[#0F1419] dark:hover:bg-[#D7DBDC]',
              'xl:h-[50px] xl:w-full xl:px-6 xl:text-[16px]',
              'focus-ring',
            )}
          >
            <Feather className="size-5 xl:hidden" aria-hidden />
            <span className="hidden xl:inline">New Task</span>
          </button>
        </div>

        <div className="hidden items-center gap-3 rounded-full px-3 py-2.5 xl:flex">
          <div
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-full border border-[#EFF3F4] bg-[#F7F9F9] text-xs font-bold text-[#0F1419] dark:border-[#2F3336] dark:bg-[#16181C] dark:text-[#E7E9EA]"
          >
            J
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold leading-5 text-[#0F1419] dark:text-[#E7E9EA]">
              Local workspace
            </p>
            <p className="truncate text-[13px] leading-4 text-[#536471] dark:text-[#8B98A5]">
              {stats.total} {stats.total === 1 ? 'task' : 'tasks'} · browser storage
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
});
