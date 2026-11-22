import { useId } from 'react';
import type { Priority } from '../../types';
import { PRIORITIES, PRIORITY_META } from '../../lib/tasks';
import { cn } from '../../lib/cn';

interface PriorityPickerProps {
  value: Priority;
  onChange: (value: Priority) => void;
  size?: 'sm' | 'md';
}

/** Segmented radio group; arrow keys move between options natively. */
export function PriorityPicker({ value, onChange, size = 'md' }: PriorityPickerProps) {
  const name = useId();
  return (
    <fieldset className="flex min-w-0 items-center">
      <legend className="sr-only">Priority</legend>
      <div className="flex rounded-xl bg-slate-900/[0.05] p-0.5 ring-1 ring-slate-900/5 dark:bg-white/[0.05] dark:ring-white/5">
        {PRIORITIES.map((p) => {
          const meta = PRIORITY_META[p];
          const checked = value === p;
          return (
            <label
              key={p}
              className={cn(
                'relative flex cursor-pointer items-center gap-1.5 rounded-[10px] font-medium transition-all duration-200',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet-500',
                size === 'sm' ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-xs sm:text-[13px]',
                checked
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-white/[0.12] dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
              )}
            >
              <input
                type="radio"
                name={name}
                value={p}
                checked={checked}
                onChange={() => onChange(p)}
                className="sr-only"
              />
              <span aria-hidden className={cn('size-2 rounded-full', meta.dot)} />
              {meta.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
