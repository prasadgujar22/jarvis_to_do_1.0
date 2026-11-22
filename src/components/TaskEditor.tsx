import { useState, type FormEvent } from 'react';
import { CalendarDays, Check, Hash, X } from 'lucide-react';
import type { Priority, Task, TaskPatch } from '../types';
import { MAX_TITLE_LENGTH, parseTagList } from '../lib/tasks';
import { PriorityPicker } from './ui/PriorityPicker';
import { cn } from '../lib/cn';

interface TaskEditorProps {
  task: Task;
  onSave: (id: string, patch: TaskPatch) => void;
  onCancel: () => void;
}

const fieldClass =
  'flex h-9 items-center gap-1.5 rounded-xl bg-slate-900/[0.05] px-2.5 text-xs text-slate-700 ring-1 ring-slate-900/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet-500 dark:bg-white/[0.05] dark:text-slate-300 dark:ring-white/5';

export function TaskEditor({ task, onSave, onCancel }: TaskEditorProps) {
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [tags, setTags] = useState(task.tags.map((t) => `#${t}`).join(' '));
  const trimmed = title.trim();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!trimmed) return;
    onSave(task.id, { title: trimmed, priority, dueDate: dueDate || null, tags: parseTagList(tags) });
  };

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          onCancel();
        }
      }}
      aria-label={`Edit "${task.title}"`}
      className="flex-1 space-y-2.5"
    >
      <label htmlFor={`edit-title-${task.id}`} className="sr-only">
        Title
      </label>
      <input
        id={`edit-title-${task.id}`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={MAX_TITLE_LENGTH}
        autoFocus
        onFocus={(e) => e.currentTarget.select()}
        aria-invalid={!trimmed}
        className="h-10 w-full rounded-xl bg-white/70 px-3 text-[15px] text-slate-900 outline-none ring-1 ring-slate-900/10 focus:ring-2 focus:ring-violet-500 dark:bg-white/[0.06] dark:text-white dark:ring-white/10"
      />
      <div className="flex flex-wrap items-center gap-2">
        <PriorityPicker value={priority} onChange={setPriority} size="sm" />
        <label className={fieldClass}>
          <CalendarDays className="size-3.5" aria-hidden />
          <span className="sr-only">Due date</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-[8.5rem] bg-transparent outline-none"
          />
        </label>
        <label className={cn(fieldClass, 'min-w-40 flex-1')}>
          <Hash className="size-3.5" aria-hidden />
          <span className="sr-only">Tags, separated by spaces or commas</span>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="work, home"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
          />
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-medium text-slate-600 hover:bg-slate-900/[0.06] focus-ring dark:text-slate-300 dark:hover:bg-white/[0.08]"
        >
          <X className="size-3.5" aria-hidden />
          Cancel
        </button>
        <button
          type="submit"
          disabled={!trimmed}
          className="inline-flex h-8 items-center gap-1 rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-violet-500 disabled:opacity-50 focus-ring"
        >
          <Check className="size-3.5" aria-hidden />
          Save
        </button>
      </div>
    </form>
  );
}
