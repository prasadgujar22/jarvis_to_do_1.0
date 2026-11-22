import type { RefObject } from 'react';
import { motion } from 'motion/react';
import { Search, X } from 'lucide-react';
import type { StatusFilter, TagCount } from '../types';
import { Kbd } from './ui/Kbd';
import { cn } from '../lib/cn';

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string; key: string }> = [
  { value: 'all', label: 'All', key: '1' },
  { value: 'active', label: 'Active', key: '2' },
  { value: 'done', label: 'Done', key: '3' },
];

interface FilterBarProps {
  status: StatusFilter;
  counts: Record<StatusFilter, number>;
  onStatusChange: (status: StatusFilter) => void;
  query: string;
  onQueryChange: (query: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  tags: TagCount[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
}

export function FilterBar({
  status,
  counts,
  onStatusChange,
  query,
  onQueryChange,
  searchRef,
  tags,
  activeTag,
  onTagChange,
}: FilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div
          role="group"
          aria-label="Filter by status"
          className="glass flex shrink-0 rounded-2xl p-1"
        >
          {STATUS_OPTIONS.map((option) => {
            const selected = status === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                title={`${option.label} (${option.key})`}
                onClick={() => onStatusChange(option.value)}
                className={cn(
                  'relative flex flex-1 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors duration-200 sm:flex-none',
                  selected ? 'text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
                  'focus-ring',
                )}
              >
                {selected && (
                  <motion.span
                    layoutId="status-pill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-500 shadow-md shadow-indigo-500/30"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">{option.label}</span>
                <span
                  className={cn(
                    'relative min-w-5 rounded-md px-1 text-[11px] tabular-nums',
                    selected ? 'bg-white/20 text-white' : 'bg-slate-900/[0.06] dark:bg-white/[0.08]',
                  )}
                >
                  {counts[option.value]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="glass group/search relative flex h-11 w-full min-w-0 items-center sm:flex-1 rounded-2xl focus-within:ring-2 focus-within:ring-violet-500/70">
          <Search className="pointer-events-none ml-3.5 size-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
          <label htmlFor="search-input" className="sr-only">
            Search tasks
          </label>
          <input
            ref={searchRef}
            id="search-input"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                if (query) onQueryChange('');
                else e.currentTarget.blur();
              }
            }}
            placeholder="Search tasks or #tags"
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-500 dark:text-white dark:placeholder:text-slate-400 [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                onQueryChange('');
                searchRef.current?.focus();
              }}
              aria-label="Clear search"
              className="mr-2 grid size-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-900/5 hover:text-slate-900 focus-ring dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : (
            <span className="mr-3 hidden sm:inline-flex group-focus-within/search:hidden" aria-hidden>
              <Kbd>/</Kbd>
            </span>
          )}
        </div>
      </div>

      {tags.length > 0 && (
        <div role="group" aria-label="Filter by tag" className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5 lg:hidden">
          <TagChip label="All tags" selected={activeTag === null} onClick={() => onTagChange(null)} />
          {tags.map(({ tag, count }) => (
            <TagChip
              key={tag}
              label={`#${tag}`}
              count={count}
              selected={activeTag === tag}
              onClick={() => onTagChange(activeTag === tag ? null : tag)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TagChip({ label, count, selected, onClick }: { label: string; count?: number; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors duration-200 focus-ring',
        selected
          ? 'bg-violet-600 text-white ring-violet-600 dark:bg-violet-500 dark:ring-violet-500'
          : 'bg-white/60 text-slate-700 ring-slate-900/10 hover:bg-white dark:bg-white/[0.05] dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/10',
      )}
    >
      {label}
      {count !== undefined && <span className="tabular-nums opacity-70">{count}</span>}
    </button>
  );
}
