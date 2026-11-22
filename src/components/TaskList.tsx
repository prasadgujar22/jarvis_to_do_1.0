import { useMemo, useState } from 'react';
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
  tasks: Task[];
  editingId: string | null;
  onReorder: (activeId: string, overId: string) => void;
  onDragActiveChange: (active: boolean) => void;
}

const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

export function TaskList({ tasks, editingId, onReorder, onDragActiveChange, ...handlers }: TaskListProps) {
  const [dragActive, setDragActive] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = useMemo(() => tasks.map((t) => t.id), [tasks]);

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
        <ul aria-label="Tasks" className="flex flex-col">
          <AnimatePresence initial={false}>
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} editing={editingId === task.id} dragActive={dragActive} {...handlers} />
            ))}
          </AnimatePresence>
        </ul>
      </SortableContext>
    </DndContext>
  );
}
