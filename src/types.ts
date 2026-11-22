export type Priority = 'low' | 'medium' | 'high';

export type StatusFilter = 'all' | 'active' | 'done';

export type Theme = 'light' | 'dark';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  /** Lower-case tag names without the leading "#". */
  tags: string[];
  /** Local calendar date in ISO format (YYYY-MM-DD), or null when there is no due date. */
  dueDate: string | null;
  /** Optional free-form multiline note; "" when there is none. Trimmed, at most MAX_NOTES_LENGTH chars. */
  notes: string;
  createdAt: number;
  completedAt: number | null;
}

/** The user-editable fields of a task. */
export type TaskDraft = Pick<Task, 'title' | 'priority' | 'tags' | 'dueDate'> & { notes?: string };

export type TaskPatch = Partial<TaskDraft>;

export interface Filters {
  status: StatusFilter;
  tag: string | null;
}

export interface TaskStats {
  total: number;
  active: number;
  done: number;
  overdue: number;
  dueToday: number;
}

export interface TagCount {
  tag: string;
  count: number;
}

/** Tasks removed by an action, with their original positions so they can be restored. */
export interface UndoEntry {
  id: number;
  message: string;
  removed: Array<{ task: Task; index: number }>;
}
