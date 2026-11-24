import { m } from 'motion/react';
import type { ReactNode } from 'react';
import { CheckCircle2, Inbox, Search, Sparkles } from 'lucide-react';
import { Kbd } from './ui/Kbd';

export type EmptyVariant = 'fresh' | 'all-done' | 'no-done' | 'no-results';

interface EmptyStateProps {
  variant: EmptyVariant;
  onAction?: () => void;
}

const CONTENT: Record<EmptyVariant, { title: string; body: ReactNode; action?: string; icon: typeof Inbox }> = {
  fresh: {
    title: 'A clean slate',
    body: (
      <>
        Capture your first task above, or press <Kbd>N</Kbd> anywhere to start typing.
      </>
    ),
    action: 'Add your first task',
    icon: Inbox,
  },
  'all-done': {
    title: 'All caught up',
    body: 'Nothing left on your plate. Enjoy the calm, or plan what comes next.',
    action: 'Add another task',
    icon: CheckCircle2,
  },
  'no-done': {
    title: 'Nothing completed yet',
    body: 'Tick off a task and it will show up here. Small wins count.',
    icon: Sparkles,
  },
  'no-results': {
    title: 'No matching tasks',
    body: 'Try a different search term, or clear the filters to see everything.',
    action: 'Clear filters',
    icon: Search,
  },
};

export function EmptyState({ variant, onAction }: EmptyStateProps) {
  const content = CONTENT[variant];
  const Icon = content.icon;

  return (
    <m.div
      key={variant}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto flex max-w-[360px] flex-col items-start px-6 py-14 text-left sm:py-20"
      role="status"
    >
      <div
        aria-hidden
        className="mb-4 grid size-11 place-items-center rounded-full border border-[#EFF3F4] bg-[#F7F9F9] text-[#0F1419] dark:border-[#2F3336] dark:bg-[#16181C] dark:text-[#E7E9EA]"
      >
        <Icon className="size-5" strokeWidth={2} />
      </div>
      <h2 className="text-[26px] font-extrabold leading-8 tracking-[-0.02em] text-[#0F1419] dark:text-[#E7E9EA]">
        {content.title}
      </h2>
      <p className="mt-2 text-[15px] leading-5 text-[#536471] dark:text-[#8B98A5]">{content.body}</p>
      {content.action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex h-11 items-center rounded-full bg-[#0F1419] px-6 text-[15px] font-bold text-white transition-colors hover:bg-[#272C30] focus-ring dark:bg-[#EFF3F4] dark:text-[#0F1419] dark:hover:bg-[#D7DBDC]"
        >
          {content.action}
        </button>
      )}
    </m.div>
  );
}
