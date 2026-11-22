const PREFIX = 'jarvis-todo:v1:';

export const STORAGE_KEYS = {
  tasks: `${PREFIX}tasks`,
  theme: `${PREFIX}theme`,
  filters: `${PREFIX}filters`,
} as const;

/** Reads and validates a JSON value from localStorage, falling back on any error. */
export function readStored<T>(key: string, fallback: T, sanitize: (raw: unknown) => T | null): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return sanitize(JSON.parse(raw)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStored(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be full or unavailable (private mode); the app keeps working in memory.
  }
}
