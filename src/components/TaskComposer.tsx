import { memo, useMemo, useState, type FormEvent, type RefObject } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { CalendarDays, Plus } from 'lucide-react';
import type { Priority, TaskDraft } from '../types';
import { MAX_TITLE_LENGTH, PRIORITY_META, parseQuickAdd } from '../lib/tasks';
import { describeDue } from '../lib/date';
import { PriorityPicker } from './ui/PriorityPicker';
import { Kbd } from './ui/Kbd';
import { cn } from '../lib/cn';

interface TaskComposerProps {
  inputRef: RefObject<HTMLInputElement | null>;
  onAdd: (draft: TaskDraft) => void;
}

export const TaskComposer = memo(function TaskComposer({ inputRef, onAdd }: TaskComposerProps) {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const parsed = useMemo(() => parseQuickAdd(text), [text]);
  const effectivePriority = parsed.priority ?? priority;
  const canSubmit = parsed.title.length > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      inputRef.current?.focus();
      return;
    }
    onAdd({ title: parsed.title, tags: parsed.tags, priority: effectivePriority, dueDate: dueDate || null });
    setText('');
    setDueDate('');
    setPriority('medium');
    inputRef.current?.focus();
  };

  const hasPreview = parsed.tags.length > 0 || parsed.priority !== null;

  return (
    <form
      onSubmit={submit}
      aria-label="Add a task"
      className="glass group/composer relative rounded-3xl p-2 transition-shadow duration-300 focus-within:shadow-[0_0_0_1px_rgb(139_92_246/0.45),0_20px_60px_-20px_rgb(99_102_241/0.55)]"
    >
      <div className="flex items-center gap-2">
        <label htmlFor="composer-input" className="sr-only">
          New task
        </label>
        <span aria-hidden className="ml-2 grid size-7 shrink-0 place-items-center rounded-full border-2 border-dashed border-slate-400/60 text-slate-400 dark:border-slate-500/60">
          <Plus className="size-3.5" />
        </span>
        <input
          ref={inputRef}
          id="composer-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              if (text) setText('');
              else e.currentTarget.blur();
            }
          }}
          maxLength={MAX_TITLE_LENGTH + 80}
          placeholder="Add a task — try #work !high"
          autoComplete="off"
          enterKeyHint="done"
          aria-describedby="composer-hint"
          className="h-12 min-w-0 flex-1 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-500 sm:text-base dark:text-white dark:placeholder:text-slate-400"
        />
        <span className="mr-1 hidden sm:inline-flex group-focus-within/composer:hidden" aria-hidden>
          <Kbd>N</Kbd>
        </span>
        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            'inline-flex h-11 shrink-0 items-center gap-1.5 rounded-2xl px-4 text-sm font-semibold text-white transition-all duration-200',
            'bg-gradient-to-br from-violet-700 via-indigo-700 to-cyan-800 shadow-lg shadow-indigo-500/25',
            'hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none',
            'focus-ring',
          )}
        >
          <Plus className="size-4" aria-hidden />
          <span className="hidden sm:inline">Add task</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-2 pb-1 pt-2">
        <PriorityPicker value={effectivePriority} onChange={setPriority} size="sm" />
        <label
          className={cn(
            'relative flex h-8 items-center gap-1.5 rounded-xl bg-slate-900/[0.05] px-2.5 text-xs font-medium text-slate-600 ring-1 ring-slate-900/5',
            'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet-500 dark:bg-white/[0.05] dark:text-slate-300 dark:ring-white/5',
          )}
        >
          <CalendarDays className="size-3.5" aria-hidden />
          <span className="sr-only">Due date</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-[8.5rem] bg-transparent text-xs outline-none [&::-webkit-calendar-picker-indicator]:opacity-60"
          />
        </label>
        {dueDate && (
          <span className="text-xs text-slate-600 dark:text-slate-400">{describeDue(dueDate).description}</span>
        )}
        <p id="composer-hint" className="ml-auto hidden text-xs text-slate-500 md:block dark:text-slate-400">
          <span className="font-medium text-slate-600 dark:text-slate-300">#tag</span> to tag ·{' '}
          <span className="font-medium text-slate-600 dark:text-slate-300">!high</span> for priority
        </p>
      </div>

      <AnimatePresence initial={false}>
        {hasPreview && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-1.5 px-3 pb-2 pt-1 text-xs" aria-live="polite">
              <span className="text-slate-500 dark:text-slate-400">Will add:</span>
              {parsed.priority && (
                <span className={cn('rounded-full px-2 py-0.5 font-medium ring-1 ring-inset', PRIORITY_META[parsed.priority].chip)}>
                  {PRIORITY_META[parsed.priority].label} priority
                </span>
              )}
              {parsed.tags.map((tag) => (
                <span key={tag} className="tag-chip">
                  #{tag}
                </span>
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </form>
  );
});
