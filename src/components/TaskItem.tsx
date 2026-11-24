import { memo, useState, type CSSProperties, type ReactNode } from 'react';
import { m, useIsPresent, type Variants } from 'motion/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, ChevronDown, GripVertical, Pencil, StickyNote, Trash2 } from 'lucide-react';
import type { Task, TaskPatch } from '../types';
import { PRIORITY_META } from '../lib/tasks';
import { describeDue } from '../lib/date';
import { cn } from '../lib/cn';
import { TaskEditor } from './TaskEditor';
import { NoteText } from './NoteText';

export interface TaskItemHandlers {
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onStartEdit: (id: string) => void;
  onCancelEdit: (id: string) => void;
  onSave: (id: string, patch: TaskPatch) => void;
  onTagClick: (tag: string) => void;
}

interface TaskItemProps extends TaskItemHandlers {
  task: Task;
  editing: boolean;
  dragActive: boolean;
  /** Filtered out of the current view: kept mounted (so filter switches are cheap) but not displayed. */
  hiddenByFilter: boolean;
}

const DUE_TONE: Record<string, string> = {
  overdue: 'font-semibold text-[#C8102E] dark:text-[#FF6B74]',
  today: 'font-semibold text-[#096DAA] dark:text-[#1D9BF0]',
  soon: 'text-[#536471] dark:text-[#8B98A5]',
  later: 'text-[#536471] dark:text-[#8B98A5]',
  done: 'text-[#536471] dark:text-[#8B98A5]',
};

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Enter/exit animations run only when a task is added or deleted. Filter, tag and search changes never
 * mount or unmount rows: filtered-out rows stay mounted and are simply hidden (see TaskList).
 */
const rowVariants: Variants = {
  hidden: { opacity: 0, height: 0 },
  shown: { opacity: 1, height: 'auto', transition: { duration: 0.2, ease: EASE } },
  exit: { opacity: 0, height: 0, transition: { duration: 0.18, ease: EASE } },
};

export const TaskItem = memo(function TaskItem({
  task,
  editing,
  dragActive,
  hiddenByFilter,
  ...handlers
}: TaskItemProps) {
  const { onToggle, onStartEdit } = handlers;
  const isPresent = useIsPresent();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: editing || !isPresent || hiddenByFilter,
  });
  const style: CSSProperties = { transform: CSS.Translate.toString(transform), transition };
  const titleId = `task-title-${task.id}`;

  const reorderHandle = (
    <button
      ref={setActivatorNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      aria-label={`Reorder "${task.title}"`}
      title={`Reorder "${task.title}"`}
      disabled={editing}
      className={cn(
        'inline-flex h-8 min-w-8 touch-none items-center justify-center rounded-full px-2 text-[#536471] transition-colors duration-150',
        'cursor-grab hover:bg-[#00BA7C]/10 hover:text-[#00875A] active:cursor-grabbing',
        'dark:text-[#8B98A5] dark:hover:text-[#00BA7C]',
        'focus-ring disabled:invisible',
      )}
    >
      <GripVertical className="size-4" aria-hidden />
    </button>
  );

  return (
    <m.li
      variants={rowVariants}
      initial="hidden"
      animate="shown"
      exit="exit"
      data-exiting={isPresent ? undefined : ''}
      className={cn(
        'relative',
        dragActive && isPresent ? 'overflow-visible' : 'overflow-hidden',
        isDragging && 'z-20',
        hiddenByFilter && 'hidden',
      )}
    >
      <div
        ref={setNodeRef}
        style={style}
        tabIndex={editing ? -1 : 0}
        data-task-row={isPresent && !hiddenByFilter ? '' : undefined}
        data-task-id={task.id}
        role="group"
        aria-labelledby={titleId}
        aria-describedby={`${titleId}-meta`}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget || editing) return;
          if (e.key === 'Enter') {
            e.preventDefault();
            onStartEdit(task.id);
          } else if (e.key === ' ') {
            e.preventDefault();
            onToggle(task.id);
          }
        }}
        className={cn(
          'feed-row group relative flex items-start gap-3 px-4 py-3 outline-none',
          'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1D9BF0]',
          isDragging && 'feed-row--dragging',
          task.completed && !editing && 'feed-row--done',
        )}
      >
        <TaskBody
          task={task}
          editing={editing}
          titleId={titleId}
          reorderHandle={reorderHandle}
          {...handlers}
        />
      </div>
    </m.li>
  );
});

/**
 * Row contents, memoised separately so unrelated list updates stay cheap.
 */
const TaskBody = memo(function TaskBody({
  task,
  editing,
  titleId,
  reorderHandle,
  onToggle,
  onDelete,
  onStartEdit,
  onCancelEdit,
  onSave,
  onTagClick,
}: TaskItemHandlers & { task: Task; editing: boolean; titleId: string; reorderHandle: ReactNode }) {
  const priority = PRIORITY_META[task.priority];
  const due = task.dueDate ? describeDue(task.dueDate) : null;
  const dueTone = task.completed ? 'done' : (due?.tone ?? 'later');
  // In-memory only: whether the note is shown in full. Lives here so it survives re-renders and editing.
  const [noteOpen, setNoteOpen] = useState(false);
  const hasNotes = task.notes.length > 0;
  const noteId = `${titleId}-note`;

  if (editing) {
    return <TaskEditor task={task} onSave={onSave} onCancel={() => onCancelEdit(task.id)} />;
  }

  return (
    <>
      <Checkbox checked={task.completed} title={task.title} onToggle={() => onToggle(task.id)} />

      <div className="min-w-0 flex-1">
        <div
          id={`${titleId}-meta`}
          className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] leading-4 text-[#536471] dark:text-[#8B98A5]"
        >
          <span
            className={cn(
              'inline-flex items-center gap-1.5 font-semibold',
              task.completed ? 'text-[#536471] dark:text-[#8B98A5]' : 'text-[#0F1419] dark:text-[#E7E9EA]',
            )}
          >
            <span aria-hidden className={cn('size-2 rounded-full', priority.dot, task.completed && 'opacity-50')} />
            {priority.label}
            <span className="sr-only"> priority</span>
          </span>

          {due && (
            <>
              <span aria-hidden>·</span>
              <span title={due.description} className={cn('inline-flex items-center gap-1', DUE_TONE[dueTone])}>
                <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                <span aria-hidden>{due.tone === 'overdue' && !task.completed ? `Overdue · ${due.label}` : due.label}</span>
                <span className="sr-only">{due.description}</span>
              </span>
            </>
          )}

          {task.completed && (
            <>
              <span aria-hidden>·</span>
              <span>Completed</span>
            </>
          )}
        </div>

        <p
          id={titleId}
          onDoubleClick={() => onStartEdit(task.id)}
          className={cn(
            'mt-1 break-words text-[15px] leading-[1.4] transition-colors duration-200',
            task.completed ? 'text-[#536471] dark:text-[#8B98A5]' : 'text-[#0F1419] dark:text-[#E7E9EA]',
          )}
        >
          <span className={cn('strike', task.completed && 'strike--on')}>{task.title}</span>
        </p>

        {task.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {task.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onTagClick(tag)}
                aria-label={`Filter by tag ${tag}`}
                className="tag-link rounded-sm text-[14px] font-medium focus-ring"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {hasNotes && (
          <p
            id={noteId}
            className={cn(
              'mt-1.5 break-words text-[14px] leading-5',
              task.completed ? 'text-[#536471] dark:text-[#8B98A5]/80' : 'text-[#536471] dark:text-[#8B98A5]',
              noteOpen ? 'whitespace-pre-wrap' : 'line-clamp-2 whitespace-pre-line',
            )}
          >
            <NoteText text={task.notes} />
          </p>
        )}

        <div className="mt-2 -ml-2 flex items-center gap-1 sm:gap-5">
          {hasNotes && (
            <button
              type="button"
              onClick={() => setNoteOpen((open) => !open)}
              aria-expanded={noteOpen}
              aria-controls={noteId}
              aria-label={noteOpen ? 'Hide note' : 'Show note'}
              title={noteOpen ? 'Hide note' : 'Show note'}
              className={cn(
                'inline-flex h-8 items-center gap-1 rounded-full px-2 text-[13px] font-medium transition-colors duration-150 focus-ring',
                noteOpen
                  ? 'text-[#096DAA] hover:bg-[#1D9BF0]/10 dark:text-[#1D9BF0]'
                  : 'text-[#536471] hover:bg-[#1D9BF0]/10 hover:text-[#096DAA] dark:text-[#8B98A5] dark:hover:text-[#1D9BF0]',
              )}
            >
              <StickyNote className="size-4" aria-hidden />
              <span aria-hidden>Note</span>
              <ChevronDown
                className={cn('size-3.5 transition-transform duration-200 motion-reduce:transition-none', noteOpen && 'rotate-180')}
                aria-hidden
              />
            </button>
          )}

          {reorderHandle}

          <ActionButton label={`Edit "${task.title}"`} onClick={() => onStartEdit(task.id)}>
            <Pencil className="size-4" aria-hidden />
          </ActionButton>

          <ActionButton label={`Delete "${task.title}"`} onClick={() => onDelete(task.id)} danger>
            <Trash2 className="size-4" aria-hidden />
          </ActionButton>
        </div>
      </div>
    </>
  );
});

function Checkbox({ checked, title, onToggle }: { checked: boolean; title: string; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={`Done: ${title}`}
      onClick={onToggle}
      className={cn(
        'relative mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-full border-2 transition-colors duration-150 focus-ring',
        checked
          ? 'border-[#1D9BF0] bg-[#1D9BF0]'
          : 'border-[#CFD9DE] bg-transparent hover:border-[#1D9BF0] hover:bg-[#1D9BF0]/10 dark:border-[#536471] dark:hover:border-[#1D9BF0]',
      )}
    >
      <svg viewBox="0 0 24 24" className="relative size-3.5 text-white" aria-hidden>
        <path
          d="M5 12.5l4.5 4.5L19 7.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          className={cn(
            'transition-[stroke-dashoffset,opacity] duration-200 ease-out',
            checked ? 'opacity-100 [stroke-dashoffset:0]' : 'opacity-0 [stroke-dashoffset:1]',
          )}
        />
      </svg>
    </button>
  );
}

function ActionButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-[#536471] transition-colors duration-150 focus-ring dark:text-[#8B98A5]',
        danger
          ? 'hover:bg-[#F4212E]/10 hover:text-[#C8102E] dark:hover:text-[#F4212E]'
          : 'hover:bg-[#1D9BF0]/10 hover:text-[#096DAA] dark:hover:text-[#1D9BF0]',
      )}
    >
      {children}
    </button>
  );
}
