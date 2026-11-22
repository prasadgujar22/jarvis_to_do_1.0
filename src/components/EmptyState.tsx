import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Kbd } from './ui/Kbd';

export type EmptyVariant = 'fresh' | 'all-done' | 'no-done' | 'no-results';

interface EmptyStateProps {
  variant: EmptyVariant;
  onAction?: () => void;
}

const CONTENT: Record<EmptyVariant, { title: string; body: ReactNode; action?: string }> = {
  fresh: {
    title: 'A clean slate',
    body: (
      <>
        Capture your first task above, or press <Kbd>N</Kbd> anywhere to start typing.
      </>
    ),
    action: 'Add your first task',
  },
  'all-done': {
    title: 'All caught up',
    body: 'Nothing left on your plate. Enjoy the calm, or plan what comes next.',
    action: 'Add another task',
  },
  'no-done': {
    title: 'Nothing completed yet',
    body: 'Tick off a task and it will show up here. Small wins count.',
  },
  'no-results': {
    title: 'No matching tasks',
    body: 'Try a different search term, or clear the filters to see everything.',
    action: 'Clear filters',
  },
};

export function EmptyState({ variant, onAction }: EmptyStateProps) {
  const content = CONTENT[variant];
  return (
    <motion.div
      key={variant}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center px-6 py-14 text-center sm:py-20"
      role="status"
    >
      <Illustration variant={variant} />
      <h2 className="mt-6 font-display text-lg font-semibold text-slate-900 dark:text-white">{content.title}</h2>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">{content.body}</p>
      {content.action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 focus-ring dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {content.action}
        </button>
      )}
    </motion.div>
  );
}

function Illustration({ variant }: { variant: EmptyVariant }) {
  return (
    <div className="animate-float relative size-36" aria-hidden>
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-violet-500/30 via-indigo-500/20 to-cyan-400/30 blur-2xl" />
      <svg viewBox="0 0 160 160" className="relative size-full">
        <defs>
          <linearGradient id="empty-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8b5cf6" />
            <stop offset="0.6" stopColor="#6366f1" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r="64" fill="none" stroke="url(#empty-g)" strokeOpacity="0.35" strokeDasharray="3 7" strokeLinecap="round" className="origin-center animate-[spin_40s_linear_infinite]" />
        <circle cx="80" cy="80" r="46" fill="none" stroke="url(#empty-g)" strokeOpacity="0.2" />
        <circle cx="144" cy="80" r="4" fill="#22d3ee" className="origin-[80px_80px] animate-[spin_12s_linear_infinite]" />
        <rect x="48" y="50" width="64" height="60" rx="16" className="fill-white/80 stroke-slate-900/10 dark:fill-white/[0.07] dark:stroke-white/15" />
        {variant === 'no-results' ? (
          <>
            <circle cx="76" cy="77" r="12" fill="none" stroke="url(#empty-g)" strokeWidth="4" />
            <path d="M85 86l9 9" stroke="url(#empty-g)" strokeWidth="4" strokeLinecap="round" />
          </>
        ) : variant === 'all-done' ? (
          <path d="M64 80l11 11 22-23" fill="none" stroke="url(#empty-g)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <rect x="60" y="66" width="8" height="8" rx="3" fill="url(#empty-g)" />
            <rect x="74" y="67" width="26" height="6" rx="3" className="fill-slate-900/15 dark:fill-white/20" />
            <rect x="60" y="84" width="8" height="8" rx="3" className="fill-slate-900/15 dark:fill-white/20" />
            <rect x="74" y="85" width="18" height="6" rx="3" className="fill-slate-900/10 dark:fill-white/15" />
          </>
        )}
      </svg>
    </div>
  );
}
