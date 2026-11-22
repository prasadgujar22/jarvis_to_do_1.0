import type { Filters, Priority, StatusFilter, TagCount, Task, TaskDraft, TaskStats } from '../types';
import { createId } from './id';
import { todayISO } from './date';

export const MAX_TITLE_LENGTH = 280;
export const MAX_NOTES_LENGTH = 2000;
const MAX_TAGS = 8;
const MAX_TAG_LENGTH = 24;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const PRIORITIES: readonly Priority[] = ['high', 'medium', 'low'];

export const PRIORITY_META: Record<Priority, { label: string; dot: string; chip: string; bar: string }> = {
  high: {
    label: 'High',
    dot: 'bg-rose-500',
    chip: 'bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:text-rose-300',
    bar: 'from-rose-500 to-orange-400',
  },
  medium: {
    label: 'Medium',
    dot: 'bg-amber-500',
    chip: 'bg-amber-500/10 text-amber-800 ring-amber-500/25 dark:text-amber-300',
    bar: 'from-amber-400 to-yellow-300',
  },
  low: {
    label: 'Low',
    dot: 'bg-sky-500',
    chip: 'bg-sky-500/10 text-sky-800 ring-sky-500/25 dark:text-sky-300',
    bar: 'from-sky-400 to-cyan-300',
  },
};

export const DEFAULT_FILTERS: Filters = { status: 'all', tag: null };

export function isPriority(value: unknown): value is Priority {
  return value === 'low' || value === 'medium' || value === 'high';
}

function isStatus(value: unknown): value is StatusFilter {
  return value === 'all' || value === 'active' || value === 'done';
}

/** Normalises a tag to lower-case letters, numbers, "-" and "_"; returns "" if nothing is left. */
export function normalizeTag(raw: string): string {
  return raw
    .trim()
    .replace(/^#+/, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_-]/gu, '')
    .slice(0, MAX_TAG_LENGTH);
}

export function uniqueTags(tags: Iterable<string>): string[] {
  const out: string[] = [];
  for (const raw of tags) {
    const tag = normalizeTag(raw);
    if (tag && !out.includes(tag)) out.push(tag);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

/** Parses a free-form tag field such as "#work, home errands". */
export function parseTagList(input: string): string[] {
  return uniqueTags(input.split(/[\s,]+/));
}

const PRIORITY_ALIASES: Record<string, Priority> = {
  h: 'high', high: 'high', '1': 'high',
  m: 'medium', med: 'medium', medium: 'medium', '2': 'medium',
  l: 'low', low: 'low', '3': 'low',
};

export interface QuickAddResult {
  title: string;
  tags: string[];
  priority: Priority | null;
}

/**
 * Extracts inline metadata from a quick-add string:
 * "#tag" adds a tag and "!high" / "!med" / "!low" (or !h / !m / !l / !1-3) sets the priority.
 */
export function parseQuickAdd(input: string): QuickAddResult {
  const tags: string[] = [];
  let priority: Priority | null = null;
  const title = input
    .replace(/(^|\s)#([\p{L}\p{N}_-]+)/gu, (_match, lead: string, tag: string) => {
      tags.push(tag);
      return lead;
    })
    .replace(/(^|\s)!(high|medium|med|low|[hml123])(?=\s|$)/gi, (_match, lead: string, p: string) => {
      priority = PRIORITY_ALIASES[p.toLowerCase()] ?? priority;
      return lead;
    })
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TITLE_LENGTH);
  return { title, tags: uniqueTags(tags), priority };
}

/**
 * Normalises a note: non-strings become "", line endings become "\n", surrounding whitespace is trimmed
 * (internal newlines are kept) and the result is capped at MAX_NOTES_LENGTH characters.
 */
export function normalizeNotes(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(/\r\n?/g, '\n').trim().slice(0, MAX_NOTES_LENGTH).trimEnd();
}

export function createTask(draft: TaskDraft): Task {
  return {
    id: createId(),
    title: draft.title.trim().slice(0, MAX_TITLE_LENGTH),
    completed: false,
    priority: draft.priority,
    tags: uniqueTags(draft.tags),
    dueDate: draft.dueDate,
    notes: normalizeNotes(draft.notes),
    createdAt: Date.now(),
    completedAt: null,
  };
}

/** Validates persisted tasks, dropping anything malformed instead of failing the whole list. */
export function sanitizeTasks(raw: unknown): Task[] | null {
  if (!Array.isArray(raw)) return null;
  const seen = new Set<string>();
  const out: Task[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    if (typeof r.id !== 'string' || typeof r.title !== 'string' || seen.has(r.id)) continue;
    const title = r.title.trim().slice(0, MAX_TITLE_LENGTH);
    if (!title) continue;
    seen.add(r.id);
    out.push({
      id: r.id,
      title,
      completed: r.completed === true,
      priority: isPriority(r.priority) ? r.priority : 'medium',
      tags: Array.isArray(r.tags) ? uniqueTags(r.tags.filter((t): t is string => typeof t === 'string')) : [],
      dueDate: typeof r.dueDate === 'string' && ISO_DATE.test(r.dueDate) ? r.dueDate : null,
      // Records saved before notes existed have no `notes` key; treat them (and any non-string) as empty.
      notes: normalizeNotes(r.notes),
      createdAt: typeof r.createdAt === 'number' ? r.createdAt : Date.now(),
      completedAt: typeof r.completedAt === 'number' ? r.completedAt : null,
    });
  }
  return out;
}

export function sanitizeFilters(raw: unknown): Filters | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  return {
    status: isStatus(r.status) ? r.status : 'all',
    tag: typeof r.tag === 'string' && normalizeTag(r.tag) ? normalizeTag(r.tag) : null,
  };
}

export function filterTasks(tasks: Task[], filters: Filters, query: string): Task[] {
  const q = query.trim().toLowerCase();
  return tasks.filter((task) => {
    if (filters.status === 'active' && task.completed) return false;
    if (filters.status === 'done' && !task.completed) return false;
    if (filters.tag && !task.tags.includes(filters.tag)) return false;
    if (
      q &&
      !task.title.toLowerCase().includes(q) &&
      !task.tags.some((t) => t.includes(q.replace(/^#/, ''))) &&
      !task.notes.toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });
}

export function computeStats(tasks: Task[]): TaskStats {
  const today = todayISO();
  let done = 0;
  let overdue = 0;
  let dueToday = 0;
  for (const task of tasks) {
    if (task.completed) {
      done += 1;
      continue;
    }
    if (task.dueDate && task.dueDate < today) overdue += 1;
    else if (task.dueDate === today) dueToday += 1;
  }
  return { total: tasks.length, active: tasks.length - done, done, overdue, dueToday };
}

export function collectTags(tasks: Task[]): TagCount[] {
  const counts = new Map<string, number>();
  for (const task of tasks) for (const tag of task.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
