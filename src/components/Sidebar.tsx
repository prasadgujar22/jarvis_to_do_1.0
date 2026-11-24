import { memo, type RefObject } from 'react';
import { m } from 'motion/react';
import { Trash2 } from 'lucide-react';
import type { TagCount, TaskStats } from '../types';
import { SearchInput } from './SearchInput';
import { Kbd } from './ui/Kbd';
import { cn } from '../lib/cn';

interface SidebarProps {
  stats: TaskStats;
  tags: TagCount[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
  query: string;
  onQueryChange: (query: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  onClearCompleted: () => void;
}

/** X.com-style right sidebar: pill search, bordered Progress & Tags cards, minimal footer. */
export const Sidebar = memo(function Sidebar({
  stats,
  tags,
  activeTag,
  onTagChange,
  query,
  onQueryChange,
  searchRef,
  onClearCompleted,
}: SidebarProps) {
  const progress = stats.total ? stats.done / stats.total : 0;
  const percent = Math.round(progress * 100);
  const summary =
    stats.total === 0
      ? 'Add a task to get started.'
      : stats.active === 0
        ? 'Everything is done. Nice work!'
        : `${stats.active} task${stats.active === 1 ? '' : 's'} remaining.`;

  return (
    <aside
      aria-label="Search and overview"
      className="hidden shrink-0 lg:block lg:w-[300px] xl:w-[350px]"
    >
      <div className="sticky top-0 flex max-h-dvh flex-col gap-4 overflow-y-auto px-5 py-3 no-scrollbar xl:px-7">
        <SearchInput query={query} onQueryChange={onQueryChange} inputRef={searchRef} />

        <section className="x-card rounded-2xl p-4" aria-labelledby="overview-title">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="overview-title" className="text-[19px] font-extrabold leading-6 tracking-[-0.02em] text-[#0F1419] dark:text-[#E7E9EA]">
              Progress
            </h2>
            <span className="text-[14px] font-bold tabular-nums text-[#096DAA] dark:text-[#1D9BF0]">
              {percent}%
            </span>
          </div>
          <p className="mt-1 text-[13px] text-[#536471] dark:text-[#8B98A5]">{summary}</p>

          <div
            role="progressbar"
            aria-label="Task completion"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#EFF3F4] dark:bg-[#2F3336]"
          >
            <m.div
              className="h-full rounded-full bg-[#1D9BF0]"
              initial={false}
              animate={{ width: `${percent}%` }}
              transition={{ type: 'spring', stiffness: 180, damping: 24 }}
            />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[#EFF3F4] pt-3.5 dark:border-[#2F3336]">
            <Stat label="Active" value={stats.active} />
            <Stat label="Done" value={stats.done} />
            <Stat label="Due today" value={stats.dueToday} tone={stats.dueToday ? 'accent' : undefined} />
            <Stat label="Overdue" value={stats.overdue} tone={stats.overdue ? 'danger' : undefined} />
          </dl>

          {stats.done > 0 && (
            <div className="mt-3.5 border-t border-[#EFF3F4] pt-3 dark:border-[#2F3336]">
              <button
                type="button"
                onClick={onClearCompleted}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold text-[#C8102E] transition-colors hover:bg-[#F4212E]/10 focus-ring dark:text-[#FF6B74]"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Clear done
              </button>
            </div>
          )}
        </section>

        <section className="x-card overflow-hidden rounded-2xl" aria-labelledby="tags-title">
          <h2 id="tags-title" className="px-4 pb-2 pt-3.5 text-[19px] font-extrabold leading-6 tracking-[-0.02em] text-[#0F1419] dark:text-[#E7E9EA]">
            Tags
          </h2>
          {tags.length === 0 ? (
            <p className="px-4 pb-4 text-[14px] leading-5 text-[#536471] dark:text-[#8B98A5]">
              Type <span className="font-semibold text-[#0F1419] dark:text-[#E7E9EA]">#something</span> in a task to track topics here.
            </p>
          ) : (
            <div role="group" aria-label="Filter by tag" className="pb-1">
              {activeTag !== null && (
                <button
                  type="button"
                  aria-pressed={false}
                  onClick={() => onTagChange(null)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-[14px] font-semibold text-[#096DAA] transition-colors hover:bg-[#0F1419]/[0.03] focus-ring focus-visible:outline-offset-[-2px] dark:text-[#1D9BF0] dark:hover:bg-white/[0.03]"
                >
                  <span>Show all tags</span>
                </button>
              )}
              {tags.map(({ tag, count }) => {
                const selected = activeTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onTagChange(selected ? null : tag)}
                    className={cn(
                      'flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors duration-150 focus-ring focus-visible:outline-offset-[-2px]',
                      selected
                        ? 'bg-[#1D9BF0]/10 dark:bg-[#1D9BF0]/15'
                        : 'hover:bg-[#0F1419]/[0.03] dark:hover:bg-white/[0.03]',
                    )}
                  >
                    <span className="min-w-0">
                      <span
                        className={cn(
                          'block truncate text-[15px] font-bold leading-5',
                          selected ? 'text-[#096DAA] dark:text-[#1D9BF0]' : 'text-[#0F1419] dark:text-[#E7E9EA]',
                        )}
                      >
                        #{tag}
                      </span>
                      <span className="block text-[13px] leading-4 text-[#536471] dark:text-[#8B98A5]">
                        {count} {count === 1 ? 'task' : 'tasks'}
                      </span>
                    </span>
                    {selected && (
                      <span aria-hidden className="size-2 shrink-0 rounded-full bg-[#1D9BF0]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <footer className="px-2 pb-4 text-[13px] leading-5 text-[#536471] dark:text-[#8B98A5]">
          <p>Jarvis To-Do · Private &amp; offline-first in this browser.</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <Kbd>N</Kbd> new
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Kbd>/</Kbd> search
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Kbd>?</Kbd> shortcuts
            </span>
          </p>
        </footer>
      </div>
    </aside>
  );
});

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'accent' | 'danger' }) {
  return (
    <div>
      <dt className="text-[13px] leading-4 text-[#536471] dark:text-[#8B98A5]">{label}</dt>
      <dd
        className={cn(
          'mt-0.5 text-[20px] font-bold leading-6 tabular-nums text-[#0F1419] dark:text-[#E7E9EA]',
          tone === 'accent' && 'text-[#096DAA] dark:text-[#1D9BF0]',
          tone === 'danger' && 'text-[#C8102E] dark:text-[#FF6B74]',
        )}
      >
        {value}
      </dd>
    </div>
  );
}
