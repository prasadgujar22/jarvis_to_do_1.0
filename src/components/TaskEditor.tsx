import { useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { CalendarDays, Check, Hash, StickyNote, X } from 'lucide-react';
import type { Priority, Task, TaskPatch } from '../types';
import { MAX_NOTES_LENGTH, MAX_TITLE_LENGTH, normalizeNotes, parseTagList } from '../lib/tasks';
import { isMac } from '../lib/dom';
import { PriorityPicker } from './ui/PriorityPicker';
import { cn } from '../lib/cn';

interface TaskEditorProps {
  task: Task;
  onSave: (id: string, patch: TaskPatch) => void;
  onCancel: () => void;
}

const fieldClass =
  'flex h-9 items-center gap-1.5 rounded-full border border-[#CFD9DE] bg-[#F7F9F9] px-3 text-xs text-[#0F1419] has-[:focus-visible]:border-[#1D9BF0] has-[:focus-visible]:bg-white dark:border-[#2F3336] dark:bg-[#202327] dark:text-[#E7E9EA] dark:has-[:focus-visible]:border-[#1D9BF0] dark:has-[:focus-visible]:bg-black';

export function TaskEditor({ task, onSave, onCancel }: TaskEditorProps) {
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [tags, setTags] = useState(task.tags.map((t) => `#${t}`).join(' '));
  const [notes, setNotes] = useState(task.notes);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const trimmed = title.trim();

  // Auto-grow the notes field to fit its content (also on open when a note already exists).
  useLayoutEffect(() => {
    const el = notesRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [notes]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!trimmed) return;
    onSave(task.id, {
      title: trimmed,
      priority,
      dueDate: dueDate || null,
      tags: parseTagList(tags),
      notes: normalizeNotes(notes),
    });
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
      className="min-w-0 flex-1 space-y-2.5"
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
        className="h-10 w-full rounded-xl border border-[#CFD9DE] bg-white px-3 text-[15px] text-[#0F1419] outline-none focus:border-[#1D9BF0] focus:ring-1 focus:ring-[#1D9BF0] dark:border-[#2F3336] dark:bg-black dark:text-[#E7E9EA]"
      />
      <div className="flex flex-wrap items-center gap-2">
        <PriorityPicker value={priority} onChange={setPriority} size="sm" />
        <label className={fieldClass}>
          <CalendarDays className="size-3.5 shrink-0 text-[#096DAA] dark:text-[#1D9BF0]" aria-hidden />
          <span className="sr-only">Due date</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-[8rem] bg-transparent outline-none"
          />
        </label>
        <label className={cn(fieldClass, 'min-w-40 flex-1')}>
          <Hash className="size-3.5 shrink-0 text-[#536471] dark:text-[#8B98A5]" aria-hidden />
          <span className="sr-only">Tags, separated by spaces or commas</span>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="work, home"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#536471] dark:placeholder:text-[#8B98A5]"
          />
        </label>
      </div>
      <div className="relative">
        <label htmlFor={`edit-notes-${task.id}`} className="sr-only">
          Notes
        </label>
        <StickyNote
          className="pointer-events-none absolute left-3 top-2.5 size-3.5 text-[#536471] dark:text-[#8B98A5]"
          aria-hidden
        />
        <textarea
          id={`edit-notes-${task.id}`}
          ref={notesRef}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onKeyDown={(e) => {
            // Plain Enter inserts a newline (textareas never submit); Ctrl/⌘+Enter saves.
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.nativeEvent.isComposing) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          maxLength={MAX_NOTES_LENGTH}
          rows={2}
          placeholder="Add a note…"
          aria-describedby={`edit-notes-hint-${task.id}`}
          className="block max-h-72 min-h-16 w-full resize-none overflow-y-auto rounded-2xl border border-[#CFD9DE] bg-[#F7F9F9] py-2 pl-8 pr-3 text-[14px] leading-5 text-[#0F1419] outline-none placeholder:text-[#536471] focus:border-[#1D9BF0] focus:bg-white focus:ring-1 focus:ring-[#1D9BF0] dark:border-[#2F3336] dark:bg-[#202327] dark:text-[#E7E9EA] dark:placeholder:text-[#8B98A5] dark:focus:bg-black"
        />
        <p id={`edit-notes-hint-${task.id}`} className="mt-1 flex justify-between gap-2 px-1 text-[12px] text-[#536471] dark:text-[#8B98A5]">
          <span>
            <kbd className="font-sans">{isMac ? '⌘' : 'Ctrl'}+Enter</kbd> to save
          </span>
          {notes.length > MAX_NOTES_LENGTH * 0.8 && (
            <span className="tabular-nums">
              {notes.length}/{MAX_NOTES_LENGTH}
            </span>
          )}
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-8 items-center gap-1 rounded-full border border-[#CFD9DE] px-3.5 text-xs font-bold text-[#0F1419] transition-colors hover:bg-[#0F1419]/[0.06] focus-ring dark:border-[#536471] dark:text-[#E7E9EA] dark:hover:bg-white/10"
        >
          <X className="size-3.5" aria-hidden />
          Cancel
        </button>
        <button
          type="submit"
          disabled={!trimmed}
          className="inline-flex h-8 items-center gap-1 rounded-full bg-[#0F1419] px-4 text-xs font-bold text-white transition-colors hover:bg-[#272C30] disabled:opacity-45 focus-ring dark:bg-[#EFF3F4] dark:text-[#0F1419] dark:hover:bg-[#D7DBDC]"
        >
          <Check className="size-3.5" aria-hidden />
          Save
        </button>
      </div>
    </form>
  );
}
