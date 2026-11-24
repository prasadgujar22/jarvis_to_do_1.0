import { memo } from 'react';
import { Keyboard } from 'lucide-react';
import type { StatusFilter, TaskStats, Theme } from '../types';
import { formatLongDate } from '../lib/date';
import { ThemeToggle } from './ThemeToggle';
import { JarvisMark } from './LeftRail';
import { cn } from '../lib/cn';

const STATUS_TABS: Array<{ value: StatusFilter; label: string; key: string }> = [
  { value: 'all', label: 'All', key: '1' },
  { value: 'active', label: 'Active', key: '2' },
  { value: 'done', label: 'Done', key: '3' },
];

interface HeaderProps {
  theme: Theme;
  stats: TaskStats;
  status: StatusFilter;
  counts: Record<StatusFilter, number>;
  onStatusChange: (status: StatusFilter) => void;
  onToggleTheme: () => void;
  onOpenShortcuts: () => void;
}

export const Header = memo(function Header({
  theme,
  stats,
  status,
  counts,
  onStatusChange,
  onToggleTheme,
  onOpenShortcuts,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#EFF3F4] bg-white/85 backdrop-blur-md dark:border-[#2F3336] dark:bg-black/75">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid size-8 shrink-0 place-items-center text-[#0F1419] lg:hidden dark:text-[#E7E9EA]">
            <JarvisMark className="size-6" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[19px] font-bold leading-6 tracking-[-0.02em] text-[#0F1419] dark:text-[#E7E9EA]">
              Jarvis To-Do
            </h1>
            <p className="truncate text-[13px] leading-4 text-[#536471] dark:text-[#8B98A5]">
              {stats.total === 0
                ? formatLongDate()
                : `${stats.active} active · ${stats.done} done · ${formatLongDate()}`}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 lg:hidden">
          <button
            type="button"
            onClick={onOpenShortcuts}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
            className="inline-grid size-9 place-items-center rounded-full text-[#0F1419] transition-colors duration-150 hover:bg-[#0F1419]/10 focus-ring dark:text-[#E7E9EA] dark:hover:bg-[#E7E9EA]/10"
          >
            <Keyboard className="size-[18px]" aria-hidden />
          </button>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} variant="icon" />
        </div>
      </div>

      <div
        role="group"
        aria-label="Filter by status"
        className="grid grid-cols-3"
      >
        {STATUS_TABS.map((tab) => {
          const selected = status === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              aria-pressed={selected}
              title={`${tab.label} (${tab.key})`}
              onClick={() => onStatusChange(tab.value)}
              className={cn(
                'relative flex h-[48px] items-center justify-center px-3 text-[15px] transition-colors duration-150 sm:h-[52px]',
                'hover:bg-[#0F1419]/[0.04] dark:hover:bg-white/[0.04]',
                'focus-ring focus-visible:outline-offset-[-2px]',
                selected
                  ? 'font-bold text-[#0F1419] dark:text-[#E7E9EA]'
                  : 'font-medium text-[#536471] dark:text-[#8B98A5]',
              )}
            >
              <span className="relative inline-flex h-full items-center gap-1.5">
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'text-[12px] tabular-nums',
                    selected
                      ? 'font-semibold text-[#536471] dark:text-[#8B98A5]'
                      : 'font-normal text-[#536471] dark:text-[#8B98A5]',
                  )}
                >
                  {counts[tab.value]}
                </span>
                {selected && (
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-1 rounded-full bg-[#1D9BF0]"
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </header>
  );
});
