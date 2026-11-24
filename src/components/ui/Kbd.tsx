import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border px-1.5 font-sans text-[11px] font-semibold',
        'border-[#CFD9DE] bg-[#F7F9F9] text-[#536471]',
        'dark:border-[#2F3336] dark:bg-[#16181C] dark:text-[#8B98A5]',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
