import { memo, type CSSProperties, type ReactNode } from 'react';
import { m, useIsPresent, type Variants } from 'motion/react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, GripVertical, Pencil, Trash2 } from 'lucide-react';
import type { Task, TaskPatch } from '../types';
import { PRIORITY_META } from '../lib/tasks';
import { describeDue } from '../lib/date';
import { cn } from '../lib/cn';
import { TaskEditor } from './TaskEditor';

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
  overdue: 'bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:text-rose-300',
  today: 'bg-indigo-500/10 text-indigo-700 ring-indigo-500/25 dark:text-indigo-300',
  soon: 'bg-slate-900/[0.05] text-slate-700 ring-slate-900/10 dark:bg-white/[0.06] dark:text-slate-300 dark:ring-white/10',
  later: 'bg-slate-900/[0.05] text-slate-600 ring-slate-900/10 dark:bg-white/[0.06] dark:text-slate-400 dark:ring-white/10',
  done: 'bg-slate-900/[0.04] text-slate-500 ring-slate-900/5 dark:bg-white/[0.04] dark:text-slate-400 dark:ring-white/5',
};

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Enter/exit animations run only when a task is added or deleted. Filter, tag and search changes never
 * mount or unmount rows: filtered-out rows stay mounted and are simply hidden (see TaskList).
 */
const rowVariants: Variants = {
  hidden: { opacity: 0, height: 0 },
  shown: { opacity: 1, height: 'auto', transition: { duration: 0.24, ease: EASE } },
  exit: { opacity: 0, height: 0, scale: 0.97, transition: { duration: 0.24, ease: EASE } },
};

const hoverReveal = '[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100';

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
  const priority = PRIORITY_META[task.priority];
  const titleId = `task-title-${task.id}`;

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
      <div className="p-1">
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
            'task-card group relative flex items-start gap-2 rounded-2xl py-3 pl-2 pr-2 outline-none sm:gap-3 sm:pr-3',
            'focus-visible:ring-2 focus-visible:ring-violet-500',
            isDragging && 'task-card--dragging',
            task.completed && !editing && 'task-card--done',
          )}
        >
          <span
            aria-hidden
            className={cn('absolute inset-y-3 left-0 w-[3px] rounded-full bg-gradient-to-b transition-opacity', priority.bar, task.completed && 'opacity-30')}
          />

          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Reorder "${task.title}"`}
            disabled={editing}
            className={cn(
              'mt-0.5 grid h-7 w-5 shrink-0 touch-none place-items-center rounded-md text-slate-400 transition-opacity',
              'cursor-grab hover:text-slate-700 active:cursor-grabbing dark:text-slate-500 dark:hover:text-slate-200',
              'focus-ring focus-visible:opacity-100 disabled:invisible',
              hoverReveal,
            )}
          >
            <GripVertical className="size-4" aria-hidden />
          </button>

          <TaskBody task={task} editing={editing} titleId={titleId} {...handlers} />
        </div>
      </div>
    </m.li>
  );
});

/**
 * Row contents, memoised separately: dnd-kit re-renders every sortable wrapper whenever the list's
 * item ids change (e.g. on every filter switch), but the contents only re-render when the task changes.
 */
const TaskBody = memo(function TaskBody({
  task,
  editing,
  titleId,
  onToggle,
  onDelete,
  onStartEdit,
  onCancelEdit,
  onSave,
  onTagClick,
}: TaskItemHandlers & { task: Task; editing: boolean; titleId: string }) {
  const priority = PRIORITY_META[task.priority];
  const due = task.dueDate ? describeDue(task.dueDate) : null;
  const dueTone = task.completed ? 'done' : (due?.tone ?? 'later');
  return (
    <>
      {editing ? (
      <TaskEditor task={task} onSave={onSave} onCancel={() => onCancelEdit(task.id)} />
    ) : (
      <>
        <Checkbox checked={task.completed} title={task.title} onToggle={() => onToggle(task.id)} />

        <div className="min-w-0 flex-1 pt-0.5">
          <p
            id={titleId}
            onDoubleClick={() => onStartEdit(task.id)}
            className={cn(
              'break-words text-[15px] leading-6 transition-colors duration-300',
              task.completed ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-50',
            )}
          >
            <span className={cn('strike', task.completed && 'strike--on')}>{task.title}</span>
          </p>
          <div id={`${titleId}-meta`} className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ring-1 ring-inset', priority.chip, task.completed && 'opacity-60')}>
              <span aria-hidden className={cn('size-1.5 rounded-full', priority.dot)} />
              {priority.label}
              <span className="sr-only"> priority</span>
            </span>
            {due && (
              <span
                title={due.description}
                className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ring-1 ring-inset', DUE_TONE[dueTone])}
              >
                <CalendarDays className="size-3" aria-hidden />
                <span aria-hidden>{due.tone === 'overdue' && !task.completed ? `Overdue · ${due.label}` : due.label}</span>
                <span className="sr-only">{due.description}</span>
              </span>
            )}
            {task.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onTagClick(tag)}
                aria-label={`Filter by tag ${tag}`}
                className="tag-chip hover:bg-violet-500/20 focus-ring"
              >
                #{tag}
              </button>
            ))}
            {task.completed && <span className="sr-only">Completed</span>}
          </div>
        </div>

        <div className={cn('flex shrink-0 items-center gap-0.5 transition-opacity duration-150', hoverReveal)}>
          <ActionButton label={`Edit "${task.title}"`} onClick={() => onStartEdit(task.id)}>
            <Pencil className="size-4" aria-hidden />
          </ActionButton>
          <ActionButton label={`Delete "${task.title}"`} onClick={() => onDelete(task.id)} danger>
            <Trash2 className="size-4" aria-hidden />
          </ActionButton>
        </div>
      </>
    )}
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
        'relative mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors duration-200 focus-ring',
        checked
          ? 'border-transparent'
          : 'border-slate-400 hover:border-violet-500 dark:border-slate-500 dark:hover:border-violet-400',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute inset-[-2px] rounded-full bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-400 shadow-md shadow-indigo-500/40',
          'transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          checked ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
        )}
      />
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
            checked ? 'opacity-100 [stroke-dashoffset:0] delay-75' : 'opacity-0 [stroke-dashoffset:1]',
          )}
        />
      </svg>
    </button>
  );
}

function ActionButton({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'grid size-8 place-items-center rounded-lg text-slate-500 transition-colors duration-150 focus-ring dark:text-slate-400',
        danger
          ? 'hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400'
          : 'hover:bg-slate-900/[0.06] hover:text-slate-900 dark:hover:bg-white/[0.08] dark:hover:text-white',
      )}
    >
      {children}
    </button>
  );
}
