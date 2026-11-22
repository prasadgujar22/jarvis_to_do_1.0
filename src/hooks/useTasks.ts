import { useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { Task, TaskDraft, TaskPatch, UndoEntry } from '../types';
import { STORAGE_KEYS } from '../lib/storage';
import { createTask, normalizeNotes, sanitizeTasks } from '../lib/tasks';
import { usePersistentState } from './usePersistentState';

const EMPTY: Task[] = [];

/** Task list state. Array order is the user's manual order. */
export function useTasks() {
  const [tasks, setTasks] = usePersistentState<Task[]>(STORAGE_KEYS.tasks, EMPTY, sanitizeTasks);

  const addTask = useCallback(
    (draft: TaskDraft) => {
      const task = createTask(draft);
      setTasks((prev) => [task, ...prev]);
      return task;
    },
    [setTasks],
  );

  const updateTask = useCallback(
    (id: string, patch: TaskPatch) => {
      const next = patch.notes === undefined ? patch : { ...patch, notes: normalizeNotes(patch.notes) };
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...next } : t)));
    },
    [setTasks],
  );

  const toggleTask = useCallback(
    (id: string) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, completed: !t.completed, completedAt: t.completed ? null : Date.now() } : t,
        ),
      );
    },
    [setTasks],
  );

  const removeTasks = useCallback(
    (ids: ReadonlySet<string>) => {
      setTasks((prev) => prev.filter((t) => !ids.has(t.id)));
    },
    [setTasks],
  );

  /** Moves `activeId` to the position currently held by `overId`. */
  const reorder = useCallback(
    (activeId: string, overId: string) => {
      setTasks((prev) => {
        const from = prev.findIndex((t) => t.id === activeId);
        const to = prev.findIndex((t) => t.id === overId);
        if (from < 0 || to < 0 || from === to) return prev;
        return arrayMove(prev, from, to);
      });
    },
    [setTasks],
  );

  /** Puts previously removed tasks back at their original positions. */
  const restore = useCallback(
    (removed: UndoEntry['removed']) => {
      setTasks((prev) => {
        const next = [...prev];
        const ordered = [...removed].sort((a, b) => a.index - b.index);
        for (const { task, index } of ordered) {
          if (next.some((t) => t.id === task.id)) continue;
          next.splice(Math.min(index, next.length), 0, task);
        }
        return next;
      });
    },
    [setTasks],
  );

  return { tasks, addTask, updateTask, toggleTask, removeTasks, reorder, restore };
}
