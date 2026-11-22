import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-md border px-1.5 font-sans text-[11px] font-medium',
        'border-slate-900/10 bg-white/70 text-slate-600 shadow-[0_1px_0_rgb(15_23_42/0.08)]',
        'dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:shadow-[0_1px_0_rgb(0_0_0/0.4)]',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
