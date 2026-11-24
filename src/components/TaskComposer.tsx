import { memo, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type RefObject } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { CalendarDays, StickyNote } from 'lucide-react';
import type { Priority, TaskDraft } from '../types';
import { MAX_NOTES_LENGTH, MAX_TITLE_LENGTH, PRIORITY_META, normalizeNotes, parseQuickAdd } from '../lib/tasks';
import { isMac } from '../lib/dom';
import { describeDue } from '../lib/date';
import { PriorityPicker } from './ui/PriorityPicker';
import { cn } from '../lib/cn';

interface TaskComposerProps {
  inputRef: RefObject<HTMLInputElement | null>;
  onAdd: (draft: TaskDraft) => void;
}

export const TaskComposer = memo(function TaskComposer({ inputRef, onAdd }: TaskComposerProps) {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const parsed = useMemo(() => parseQuickAdd(text), [text]);
  const effectivePriority = parsed.priority ?? priority;
  const canSubmit = parsed.title.length > 0;

  // Auto-grow the notes field to fit its content.
  useLayoutEffect(() => {
    const el = notesRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [notes, notesOpen]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      inputRef.current?.focus();
      return;
    }
    onAdd({
      title: parsed.title,
      tags: parsed.tags,
      priority: effectivePriority,
      dueDate: dueDate || null,
      notes: normalizeNotes(notes),
    });
    setText('');
    setNotes('');
    setNotesOpen(false);
    setDueDate('');
    setPriority('medium');
    inputRef.current?.focus();
  };

  const hasPreview = parsed.tags.length > 0 || parsed.priority !== null;

  return (
    <form
      onSubmit={submit}
      aria-label="Add a task"
      className="border-b border-[#EFF3F4] px-4 pb-3 pt-3 dark:border-[#2F3336]"
    >
      <div className="flex items-start gap-2.5 sm:gap-3">
        <div
          aria-hidden
          className="mt-1 grid size-8 shrink-0 place-items-center rounded-full border border-[#EFF3F4] bg-[#F7F9F9] text-xs font-extrabold text-[#0F1419] sm:size-10 sm:text-sm dark:border-[#2F3336] dark:bg-[#16181C] dark:text-[#E7E9EA]"
        >
          J
        </div>

        {/* CSS grid places the submit button visually on the bottom-right toolbar row while keeping it
            immediately after #composer-input in DOM order (direct sibling for Tab order and selectors). */}
        <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto]">
          <label htmlFor="composer-input" className="sr-only">
            New task
          </label>
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
            placeholder="What needs to get done?"
            autoComplete="off"
            enterKeyHint="done"
            aria-describedby="composer-hint"
            className="col-span-2 row-start-1 h-11 min-w-0 w-full bg-transparent text-[18px] leading-6 text-[#0F1419] outline-none placeholder:text-[#536471] sm:text-[20px] dark:text-[#E7E9EA] dark:placeholder:text-[#8B98A5]"
          />

          <button
            type="submit"
            disabled={!canSubmit}
            className={cn(
              'col-start-2 row-start-4 ml-2 inline-flex h-9 shrink-0 items-center justify-center self-center justify-self-end rounded-full px-4 text-[14px] font-bold transition-colors duration-150',
              'bg-[#0F1419] text-white hover:bg-[#272C30] disabled:cursor-not-allowed disabled:bg-[#0F1419]/45 disabled:text-white',
              'dark:bg-[#EFF3F4] dark:text-[#0F1419] dark:hover:bg-[#D7DBDC] dark:disabled:bg-[#EFF3F4]/45 dark:disabled:text-[#0F1419]',
              'focus-ring',
            )}
          >
            <span className="hidden sm:inline">Add task</span>
            <span className="sm:hidden">Add</span>
          </button>

          <div className="col-span-2 row-start-2 min-w-0">
            <AnimatePresence initial={false}>
              {notesOpen && (
                <m.div
                  key="notes"
                  id="composer-notes-panel"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.14 }}
                >
                  <div className="relative pt-1.5">
                    <label htmlFor="composer-notes" className="sr-only">
                      Notes
                    </label>
                    <StickyNote
                      className="pointer-events-none absolute left-3 top-4 size-3.5 text-[#536471] dark:text-[#8B98A5]"
                      aria-hidden
                    />
                    <textarea
                      id="composer-notes"
                      ref={notesRef}
                      value={notes}
                      autoFocus
                      onChange={(e) => setNotes(e.target.value)}
                      onKeyDown={(e) => {
                        // Plain Enter inserts a newline (textareas never submit); Ctrl/⌘+Enter adds the task.
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.nativeEvent.isComposing) {
                          e.preventDefault();
                          e.currentTarget.form?.requestSubmit();
                        }
                      }}
                      maxLength={MAX_NOTES_LENGTH}
                      rows={2}
                      placeholder="Add a note…"
                      aria-describedby="composer-notes-hint"
                      className="block max-h-72 min-h-16 w-full resize-none overflow-y-auto rounded-2xl border border-[#CFD9DE] bg-[#F7F9F9] py-2 pl-8 pr-3 text-[14px] leading-5 text-[#0F1419] outline-none transition-colors placeholder:text-[#536471] focus:border-[#1D9BF0] focus:bg-white motion-reduce:transition-none dark:border-[#2F3336] dark:bg-[#202327] dark:text-[#E7E9EA] dark:placeholder:text-[#8B98A5] dark:focus:border-[#1D9BF0] dark:focus:bg-black"
                    />
                    <p
                      id="composer-notes-hint"
                      className="mt-1 flex justify-between gap-2 px-1 text-[12px] text-[#536471] dark:text-[#8B98A5]"
                    >
                      <span>
                        <kbd className="font-sans">{isMac ? '⌘' : 'Ctrl'}+Enter</kbd> to add task
                      </span>
                      {notes.length > MAX_NOTES_LENGTH * 0.8 && (
                        <span className="tabular-nums">
                          {notes.length}/{MAX_NOTES_LENGTH}
                        </span>
                      )}
                    </p>
                  </div>
                </m.div>
              )}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {hasPreview && (
                <m.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.14 }}
                >
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 text-xs" aria-live="polite">
                    <span className="text-[#536471] dark:text-[#8B98A5]">Will add:</span>
                    {parsed.priority && (
                      <span className={cn('rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset', PRIORITY_META[parsed.priority].chip)}>
                        {PRIORITY_META[parsed.priority].label} priority
                      </span>
                    )}
                    {parsed.tags.map((tag) => (
                      <span key={tag} className="font-semibold text-[#096DAA] dark:text-[#1D9BF0]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>

          <div aria-hidden className="col-span-2 row-start-3 mb-2.5 mt-2 h-px bg-[#EFF3F4] dark:bg-[#2F3336]" />

          <div className="col-start-1 row-start-4 flex min-w-0 flex-wrap items-center gap-1.5">
            <PriorityPicker value={effectivePriority} onChange={setPriority} size="sm" />
            <label
              className={cn(
                'relative flex h-8 items-center gap-1 rounded-full border border-[#EFF3F4] bg-[#F7F9F9] px-2 text-xs font-medium text-[#536471] transition-colors',
                'has-[:focus-visible]:border-[#1D9BF0] has-[:focus-visible]:ring-1 has-[:focus-visible]:ring-[#1D9BF0]',
                'dark:border-[#2F3336] dark:bg-[#16181C] dark:text-[#8B98A5]',
              )}
            >
              <CalendarDays className="size-3.5 shrink-0 text-[#096DAA] dark:text-[#1D9BF0]" aria-hidden />
              <span className="sr-only">Due date</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-[6.9rem] bg-transparent text-xs text-[#0F1419] outline-none sm:w-[7.2rem] dark:text-[#E7E9EA] [&::-webkit-calendar-picker-indicator]:opacity-60"
              />
            </label>
            <button
              type="button"
              onClick={() => setNotesOpen((open) => !open)}
              aria-expanded={notesOpen}
              aria-controls="composer-notes-panel"
              aria-label={notesOpen ? 'Hide note' : 'Add note'}
              className={cn(
                'inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-xs font-semibold transition-colors duration-150 motion-reduce:transition-none focus-ring',
                notesOpen || notes.trim()
                  ? 'border-[#1D9BF0]/40 bg-[#1D9BF0]/10 text-[#096DAA] dark:text-[#1D9BF0]'
                  : 'border-[#EFF3F4] bg-[#F7F9F9] text-[#536471] hover:bg-[#1D9BF0]/10 hover:text-[#096DAA] dark:border-[#2F3336] dark:bg-[#16181C] dark:text-[#8B98A5] dark:hover:text-[#1D9BF0]',
              )}
            >
              <StickyNote className="size-3.5" aria-hidden />
              <span aria-hidden>Note</span>
            </button>
            {dueDate && (
              <span className="text-xs text-[#536471] dark:text-[#8B98A5]">{describeDue(dueDate).description}</span>
            )}
            <span id="composer-hint" className="sr-only">
              Use #tag to add a tag and !high, !med, or !low for priority.
            </span>
          </div>
        </div>
      </div>
    </form>
  );
});
