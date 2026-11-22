import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { GripVertical, Trash2 } from 'lucide-react';
import type { StatusFilter, TaskDraft, TaskPatch, UndoEntry } from './types';
import { useTheme } from './hooks/useTheme';
import { useTasks } from './hooks/useTasks';
import { usePersistentState } from './hooks/usePersistentState';
import { useShortcuts, type Shortcut } from './hooks/useShortcuts';
import { useAnnouncer } from './hooks/useAnnouncer';
import { STORAGE_KEYS } from './lib/storage';
import { DEFAULT_FILTERS, collectTags, computeStats, filterTasks, sanitizeFilters } from './lib/tasks';
import { focusTaskRow, getFocusedTaskId, getTaskRows } from './lib/dom';
import { Backdrop } from './components/Backdrop';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TaskComposer } from './components/TaskComposer';
import { FilterBar } from './components/FilterBar';
import { TaskList } from './components/TaskList';
import { EmptyState, type EmptyVariant } from './components/EmptyState';
import { UndoToast } from './components/UndoToast';
import { ShortcutsDialog } from './components/ShortcutsDialog';
import { Kbd } from './components/ui/Kbd';

const UNDO_TIMEOUT_MS = 6000;
const STATUS_LABEL: Record<StatusFilter, string> = { all: 'All tasks', active: 'Active', done: 'Completed' };

function quote(title: string): string {
  return `“${title.length > 32 ? `${title.slice(0, 31)}…` : title}”`;
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const { tasks, addTask, updateTask, toggleTask, removeTasks, reorder, restore } = useTasks();
  const [filters, setFilters] = usePersistentState(STORAGE_KEYS.filters, DEFAULT_FILTERS, sanitizeFilters);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [undoEntry, setUndoEntry] = useState<UndoEntry | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const { message, announce } = useAnnouncer();
  const composerRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const tags = useMemo(() => collectTags(tasks), [tasks]);
  const stats = useMemo(() => computeStats(tasks), [tasks]);
  const visible = useMemo(() => filterTasks(tasks, filters, query), [tasks, filters, query]);
  const counts = useMemo(() => {
    const scoped = filterTasks(tasks, { status: 'all', tag: filters.tag }, query);
    const done = scoped.filter((t) => t.completed).length;
    return { all: scoped.length, active: scoped.length - done, done };
  }, [tasks, filters.tag, query]);

  // Latest values for stable callbacks (keeps memoised task rows from re-rendering).
  const latest = useRef({ tasks, visible, undoEntry, filters, query });
  useEffect(() => {
    latest.current = { tasks, visible, undoEntry, filters, query };
  });

  // Drop a persisted tag filter once no task carries that tag any more.
  useEffect(() => {
    if (filters.tag && !tags.some((t) => t.tag === filters.tag)) setFilters((f) => ({ ...f, tag: null }));
  }, [filters.tag, tags, setFilters]);

  useEffect(() => {
    if (!undoEntry) return;
    const timer = window.setTimeout(() => setUndoEntry(null), UNDO_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [undoEntry]);

  const setStatus = useCallback((status: StatusFilter) => setFilters((f) => ({ ...f, status })), [setFilters]);
  const setTag = useCallback((tag: string | null) => setFilters((f) => ({ ...f, tag })), [setFilters]);

  const handleAdd = useCallback(
    (draft: TaskDraft) => {
      const task = addTask(draft);
      const { filters: f, query: q } = latest.current;
      // Make sure the new task is visible instead of silently vanishing behind a filter.
      if (filterTasks([task], f, q).length === 0) {
        setQuery('');
        setFilters({ status: f.status === 'done' ? 'all' : f.status, tag: f.tag && task.tags.includes(f.tag) ? f.tag : null });
      }
      announce(`Added ${quote(task.title)}`);
    },
    [addTask, announce, setFilters],
  );

  const handleToggle = useCallback(
    (id: string) => {
      const task = latest.current.tasks.find((t) => t.id === id);
      if (!task) return;
      toggleTask(id);
      announce(task.completed ? `Reopened ${quote(task.title)}` : `Completed ${quote(task.title)}`);
    },
    [toggleTask, announce],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const { tasks: all, visible: shown } = latest.current;
      const index = all.findIndex((t) => t.id === id);
      if (index < 0) return;
      const task = all[index];
      const hadFocus = getFocusedTaskId() === id;
      const shownIds = shown.map((t) => t.id);
      const pos = shownIds.indexOf(id);
      const neighbor = shownIds[pos + 1] ?? shownIds[pos - 1] ?? null;

      removeTasks(new Set([id]));
      setEditingId((current) => (current === id ? null : current));
      setUndoEntry({ id: Date.now(), message: `Deleted ${quote(task.title)}`, removed: [{ task, index }] });

      if (hadFocus) {
        if (neighbor) focusTaskRow(neighbor);
        else composerRef.current?.focus();
      }
    },
    [removeTasks],
  );

  const handleClearCompleted = useCallback(() => {
    const removed = latest.current.tasks.map((task, index) => ({ task, index })).filter(({ task }) => task.completed);
    if (removed.length === 0) return;
    removeTasks(new Set(removed.map(({ task }) => task.id)));
    setUndoEntry({
      id: Date.now(),
      message: `Cleared ${removed.length} completed task${removed.length === 1 ? '' : 's'}`,
      removed,
    });
  }, [removeTasks]);

  const handleUndo = useCallback(() => {
    const entry = latest.current.undoEntry;
    if (!entry) return;
    restore(entry.removed);
    setUndoEntry(null);
    announce(`Restored ${entry.removed.length} task${entry.removed.length === 1 ? '' : 's'}`);
  }, [restore, announce]);

  const handleStartEdit = useCallback((id: string) => setEditingId(id), []);

  const handleCancelEdit = useCallback((id: string) => {
    setEditingId(null);
    focusTaskRow(id);
  }, []);

  const handleSave = useCallback(
    (id: string, patch: TaskPatch) => {
      updateTask(id, patch);
      setEditingId(null);
      focusTaskRow(id);
      announce('Task updated');
    },
    [updateTask, announce],
  );

  const handleTagClick = useCallback((tag: string) => setTag(tag), [setTag]);

  const moveFocus = useCallback((delta: number) => {
    const rows = getTaskRows();
    if (rows.length === 0) return;
    const current = rows.findIndex((row) => row.contains(document.activeElement));
    const next = current < 0 ? (delta > 0 ? 0 : rows.length - 1) : Math.min(rows.length - 1, Math.max(0, current + delta));
    rows[next].focus();
    rows[next].scrollIntoView({ block: 'nearest' });
  }, []);

  const moveTask = useCallback(
    (delta: number) => {
      const id = getFocusedTaskId();
      if (!id) return;
      const ids = latest.current.visible.map((t) => t.id);
      const from = ids.indexOf(id);
      const target = ids[from + delta];
      if (!target) return;
      reorder(id, target);
      focusTaskRow(id);
      announce(`Moved to position ${from + delta + 1} of ${ids.length}`);
    },
    [reorder, announce],
  );

  const hasFocusedTask = () => getFocusedTaskId() !== null && editingId === null;
  const onBodyOrRow = (e: KeyboardEvent) =>
    e.target === document.body || (e.target instanceof HTMLElement && e.target.hasAttribute('data-task-row'));

  const shortcuts: Shortcut[] = [
    { key: 'n', handler: () => composerRef.current?.focus() },
    { key: '/', handler: () => searchRef.current?.focus() },
    { key: '1', handler: () => setStatus('all') },
    { key: '2', handler: () => setStatus('active') },
    { key: '3', handler: () => setStatus('done') },
    { key: 't', handler: toggleTheme },
    { key: '?', handler: () => setShortcutsOpen(true) },
    { key: 'u', when: () => latest.current.undoEntry !== null, handler: handleUndo },
    { key: 'z', mod: true, when: () => latest.current.undoEntry !== null, handler: handleUndo },
    { key: 'j', allowRepeat: true, handler: () => moveFocus(1) },
    { key: 'k', allowRepeat: true, handler: () => moveFocus(-1) },
    { key: 'ArrowDown', allowRepeat: true, when: onBodyOrRow, handler: () => moveFocus(1) },
    { key: 'ArrowUp', allowRepeat: true, when: onBodyOrRow, handler: () => moveFocus(-1) },
    { key: 'ArrowDown', alt: true, allowRepeat: true, when: hasFocusedTask, handler: () => moveTask(1) },
    { key: 'ArrowUp', alt: true, allowRepeat: true, when: hasFocusedTask, handler: () => moveTask(-1) },
    { key: 'x', when: hasFocusedTask, handler: () => handleToggle(getFocusedTaskId()!) },
    { key: 'e', when: hasFocusedTask, handler: () => handleStartEdit(getFocusedTaskId()!) },
    { key: 'Delete', when: hasFocusedTask, handler: () => handleDelete(getFocusedTaskId()!) },
    { key: 'Backspace', when: hasFocusedTask, handler: () => handleDelete(getFocusedTaskId()!) },
  ];
  useShortcuts(shortcuts, !dragging);

  const emptyVariant: EmptyVariant =
    tasks.length === 0
      ? 'fresh'
      : query || filters.tag
        ? 'no-results'
        : filters.status === 'active'
          ? 'all-done'
          : filters.status === 'done'
            ? 'no-done'
            : 'no-results';

  const handleEmptyAction = () => {
    if (emptyVariant === 'no-results') {
      setQuery('');
      setFilters((f) => ({ ...f, tag: null }));
    } else {
      composerRef.current?.focus();
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <a href="#composer-input" className="skip-link">
        Skip to new task
      </a>
      <Backdrop />
      <div className="relative isolate mx-auto flex min-h-dvh max-w-6xl flex-col px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pt-10">
        <Header theme={theme} stats={stats} onToggleTheme={toggleTheme} onOpenShortcuts={() => setShortcutsOpen(true)} />

        <div className="mt-6 grid flex-1 gap-6 sm:mt-8 lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:gap-8">
          <div className="hidden lg:block">
            <Sidebar
              stats={stats}
              tags={tags}
              activeTag={filters.tag}
              onTagChange={setTag}
              onOpenShortcuts={() => setShortcutsOpen(true)}
            />
          </div>

          <main id="main" className="min-w-0 space-y-4">
            <TaskComposer inputRef={composerRef} onAdd={handleAdd} />

            <FilterBar
              status={filters.status}
              counts={counts}
              onStatusChange={setStatus}
              query={query}
              onQueryChange={setQuery}
              searchRef={searchRef}
              tags={tags}
              activeTag={filters.tag}
              onTagChange={setTag}
            />

            <section aria-labelledby="list-title" className="glass rounded-3xl p-1.5 sm:p-2">
              <div className="flex items-center justify-between px-3 pb-1 pt-2">
                <h2 id="list-title" className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {STATUS_LABEL[filters.status]}
                  {filters.tag && <span className="normal-case tracking-normal"> · #{filters.tag}</span>}
                  <span className="ml-2 tabular-nums">{visible.length}</span>
                </h2>
                <div className="flex items-center gap-3">
                  {visible.length > 1 && (
                    <p className="hidden items-center gap-1 text-xs text-slate-500 sm:flex dark:text-slate-400">
                      <GripVertical className="size-3.5" aria-hidden /> Drag to reorder
                    </p>
                  )}
                  {stats.done > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCompleted}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-rose-500/10 hover:text-rose-600 focus-ring dark:text-slate-300 dark:hover:text-rose-400"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Clear done
                    </button>
                  )}
                </div>
              </div>
              <TaskList
                tasks={visible}
                editingId={editingId}
                onReorder={reorder}
                onDragActiveChange={setDragging}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onStartEdit={handleStartEdit}
                onCancelEdit={handleCancelEdit}
                onSave={handleSave}
                onTagClick={handleTagClick}
              />
              <AnimatePresence mode="wait" initial={false}>
                {visible.length === 0 && <EmptyState key={emptyVariant} variant={emptyVariant} onAction={handleEmptyAction} />}
              </AnimatePresence>
            </section>
          </main>
        </div>

        <footer className="mt-10 flex flex-col items-center gap-2 text-center text-xs text-slate-500 sm:flex-row sm:justify-between dark:text-slate-400">
          <p>Jarvis To-Do · Your tasks stay private, saved in this browser.</p>
          <button
            type="button"
            onClick={() => setShortcutsOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 hover:text-slate-800 focus-ring dark:hover:text-slate-200"
          >
            Press <Kbd>?</Kbd> for keyboard shortcuts
          </button>
        </footer>
      </div>

      <UndoToast entry={undoEntry} onUndo={handleUndo} onDismiss={() => setUndoEntry(null)} />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {message}
      </div>
    </MotionConfig>
  );
}
