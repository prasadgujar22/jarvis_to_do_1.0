import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type Modifier,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task } from '../types';
import { TaskItem, type TaskItemHandlers } from './TaskItem';

interface TaskListProps extends TaskItemHandlers {
  /** Every task, in manual order. */
  tasks: Task[];
  /** The tasks matching the current filters, in the same order. */
  visible: Task[];
  /** Identifies the current view (status, tag and search). A change swaps rows without row animations. */
  viewKey: string;
  editingId: string | null;
  onReorder: (activeId: string, overId: string) => void;
  onDragActiveChange: (active: boolean) => void;
}

const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

export function TaskList({ tasks, visible, viewKey, editingId, onReorder, onDragActiveChange, ...handlers }: TaskListProps) {
  const [dragActive, setDragActive] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);

  // A cheap, compositor-only fade of the whole list on view switches instead of per-row height animations.
  const lastViewKey = useRef(viewKey);
  useLayoutEffect(() => {
    if (lastViewKey.current === viewKey) return;
    lastViewKey.current = viewKey;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    listRef.current?.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' });
  }, [viewKey]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  // Keep the id list referentially stable while membership/order is unchanged (e.g. when a task is
  // completed in the "All" view), so dnd-kit's SortableContext doesn't re-render every row.
  const idsKey = visible.map((t) => t.id).join('\n');
  const ids = useMemo(() => (idsKey ? idsKey.split('\n') : []), [idsKey]);
  const visibleIds = useMemo(() => new Set(ids), [ids]);

  const announcements = useMemo<Announcements>(() => {
    const title = (id: UniqueIdentifier) => `"${tasks.find((t) => t.id === id)?.title ?? 'task'}"`;
    const position = (id: UniqueIdentifier) => `position ${ids.indexOf(String(id)) + 1} of ${ids.length}`;
    return {
      onDragStart: ({ active }) => `Picked up ${title(active.id)}. Use the arrow keys to move, Space to drop, Escape to cancel.`,
      onDragOver: ({ active, over }) => (over ? `${title(active.id)} moved to ${position(over.id)}.` : undefined),
      onDragEnd: ({ active, over }) => (over ? `Dropped ${title(active.id)} at ${position(over.id)}.` : `Dropped ${title(active.id)}.`),
      onDragCancel: ({ active }) => `Reordering cancelled. ${title(active.id)} returned to its place.`,
    };
  }, [tasks, ids]);

  const setActive = (active: boolean) => {
    setDragActive(active);
    onDragActiveChange(active);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActive(false);
    if (over && active.id !== over.id) onReorder(String(active.id), String(over.id));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable: 'To reorder, press Space or Enter on the handle, use the arrow keys to move, then Space to drop.',
        },
      }}
      onDragStart={() => setActive(true)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActive(false)}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul ref={listRef} aria-label="Tasks" className="flex flex-col">
          {/* All tasks stay mounted; filtered-out rows are hidden instead of unmounted, so switching
              filters is a cheap visibility toggle rather than tearing down and rebuilding dozens of rows. */}
          <AnimatePresence initial={false}>
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                editing={editingId === task.id}
                dragActive={dragActive}
                hiddenByFilter={!visibleIds.has(task.id)}
                {...handlers}
              />
            ))}
          </AnimatePresence>
        </ul>
      </SortableContext>
    </DndContext>
  );
}
