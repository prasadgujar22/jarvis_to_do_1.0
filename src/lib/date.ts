const DAY_MS = 86_400_000;

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole calendar days from today until the given date (negative when in the past). */
export function daysUntil(iso: string): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parseISODate(iso).getTime() - today.getTime()) / DAY_MS);
}

export type DueTone = 'overdue' | 'today' | 'soon' | 'later';

export interface DueInfo {
  label: string;
  /** Longer phrasing for screen readers and tooltips. */
  description: string;
  tone: DueTone;
}

function formatShort(iso: string): string {
  const date = parseISODate(iso);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export function describeDue(iso: string): DueInfo {
  const diff = daysUntil(iso);
  const full = formatShort(iso);
  if (diff < 0) {
    const label = diff === -1 ? 'Yesterday' : full;
    return { label, description: `Overdue, was due ${diff === -1 ? 'yesterday' : full}`, tone: 'overdue' };
  }
  if (diff === 0) return { label: 'Today', description: 'Due today', tone: 'today' };
  if (diff === 1) return { label: 'Tomorrow', description: 'Due tomorrow', tone: 'soon' };
  if (diff < 7) {
    const weekday = parseISODate(iso).toLocaleDateString(undefined, { weekday: 'short' });
    return { label: weekday, description: `Due ${weekday}, ${full}`, tone: 'soon' };
  }
  return { label: full, description: `Due ${full}`, tone: 'later' };
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Burning the midnight oil';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatLongDate(date = new Date()): string {
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}
