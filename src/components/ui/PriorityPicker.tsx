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
      <div className="flex rounded-full border border-[#EFF3F4] bg-[#F7F9F9] p-0.5 dark:border-[#2F3336] dark:bg-[#16181C]">
        {PRIORITIES.map((p) => {
          const meta = PRIORITY_META[p];
          const checked = value === p;
          return (
            <label
              key={p}
              className={cn(
                'relative flex cursor-pointer items-center gap-1 rounded-full font-medium transition-colors duration-150',
                'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[#1D9BF0]',
                size === 'sm' ? 'px-1.5 py-1 text-xs' : 'px-2.5 py-1 text-xs sm:text-[13px]',
                checked
                  ? 'bg-white font-semibold text-[#0F1419] shadow-[0_1px_2px_rgb(15_20_25/0.08)] dark:bg-[#2F3336] dark:text-[#E7E9EA]'
                  : 'text-[#536471] hover:text-[#0F1419] dark:text-[#8B98A5] dark:hover:text-[#E7E9EA]',
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
              <span aria-hidden className={cn('size-1.5 rounded-full', meta.dot)} />
              {meta.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
