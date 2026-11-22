import { AlertTriangle, CalendarClock, CheckCircle2, Circle, Hash, Keyboard } from 'lucide-react';
import { memo, type ReactNode } from 'react';
import type { TagCount, TaskStats } from '../types';
import { ProgressRing } from './ui/ProgressRing';
import { Kbd } from './ui/Kbd';
import { cn } from '../lib/cn';

interface SidebarProps {
  stats: TaskStats;
  tags: TagCount[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
  onOpenShortcuts: () => void;
}

export const Sidebar = memo(function Sidebar({ stats, tags, activeTag, onTagChange, onOpenShortcuts }: SidebarProps) {
  const progress = stats.total ? stats.done / stats.total : 0;
  const message =
    stats.total === 0
      ? 'Add a task to get rolling.'
      : stats.active === 0
        ? 'Everything is done. Nice work!'
        : `${stats.active} task${stats.active === 1 ? '' : 's'} to go.`;

  return (
    <aside aria-label="Overview" className="sticky top-8 space-y-4 self-start">
      <section className="glass rounded-3xl p-5" aria-labelledby="overview-title">
        <div className="flex items-center gap-4">
          <ProgressRing value={progress} size={76} stroke={7} label={`${stats.done} of ${stats.total} tasks done`} />
          <div className="min-w-0">
            <h2 id="overview-title" className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Progress
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-2">
          <Stat icon={<Circle className="size-3.5" />} label="Active" value={stats.active} />
          <Stat icon={<CheckCircle2 className="size-3.5" />} label="Done" value={stats.done} />
          <Stat icon={<CalendarClock className="size-3.5" />} label="Due today" value={stats.dueToday} tone={stats.dueToday ? 'accent' : undefined} />
          <Stat icon={<AlertTriangle className="size-3.5" />} label="Overdue" value={stats.overdue} tone={stats.overdue ? 'danger' : undefined} />
        </dl>
      </section>

      <section className="glass rounded-3xl p-3" aria-labelledby="tags-title">
        <h2 id="tags-title" className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Tags
        </h2>
        {tags.length === 0 ? (
          <p className="px-2 pb-2 text-sm text-slate-600 dark:text-slate-400">
            Type <span className="font-medium text-slate-800 dark:text-slate-200">#something</span> in a task to create a tag.
          </p>
        ) : (
          <ul className="space-y-0.5">
            <li>
              <TagRow label="All tags" selected={activeTag === null} onClick={() => onTagChange(null)} />
            </li>
            {tags.map(({ tag, count }) => (
              <li key={tag}>
                <TagRow
                  label={tag}
                  count={count}
                  selected={activeTag === tag}
                  onClick={() => onTagChange(activeTag === tag ? null : tag)}
                  hash
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="glass rounded-3xl p-4" aria-labelledby="keys-title">
        <div className="flex items-center justify-between">
          <h2 id="keys-title" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Shortcuts
          </h2>
          <button
            type="button"
            onClick={onOpenShortcuts}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-500/10 focus-ring dark:text-violet-300"
          >
            <Keyboard className="size-3.5" aria-hidden />
            View all
          </button>
        </div>
        <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <HintRow keys={['N']} label="New task" />
          <HintRow keys={['J', 'K']} label="Move between tasks" />
          <HintRow keys={['X']} label="Complete task" />
          <HintRow keys={['?']} label="All shortcuts" />
        </ul>
      </section>
    </aside>
  );
});

function Stat({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone?: 'accent' | 'danger' }) {
  return (
    <div className="rounded-2xl bg-slate-900/[0.035] px-3 py-2.5 ring-1 ring-inset ring-slate-900/5 dark:bg-white/[0.035] dark:ring-white/5">
      <dt className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
        <span aria-hidden>{icon}</span>
        {label}
      </dt>
      <dd
        className={cn(
          'mt-0.5 font-display text-xl font-semibold tabular-nums text-slate-900 dark:text-white',
          tone === 'accent' && 'text-indigo-600 dark:text-indigo-300',
          tone === 'danger' && 'text-rose-600 dark:text-rose-400',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function TagRow({ label, count, selected, onClick, hash }: { label: string; count?: number; selected: boolean; onClick: () => void; hash?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-colors duration-150 focus-ring',
        selected
          ? 'bg-violet-500/12 font-medium text-violet-800 dark:bg-violet-400/15 dark:text-violet-200'
          : 'text-slate-700 hover:bg-slate-900/[0.05] dark:text-slate-300 dark:hover:bg-white/[0.06]',
      )}
    >
      {hash && <Hash className="size-3.5 shrink-0 opacity-60" aria-hidden />}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && <span className="text-xs tabular-nums opacity-70">{count}</span>}
    </button>
  );
}

function HintRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span>{label}</span>
      <span className="flex gap-1">
        {keys.map((k) => (
          <Kbd key={k}>{k}</Kbd>
        ))}
      </span>
    </li>
  );
}
