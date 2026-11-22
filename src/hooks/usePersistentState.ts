import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { readStored, writeStored } from '../lib/storage';

/**
 * useState backed by localStorage, validated on read and kept in sync across tabs.
 * `sanitize` must be a stable (module-level) function.
 */
export function usePersistentState<T>(
  key: string,
  fallback: T,
  sanitize: (raw: unknown) => T | null,
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => readStored(key, fallback, sanitize));

  useEffect(() => {
    writeStored(key, state);
  }, [key, state]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key || event.newValue === null) return;
      try {
        const next = sanitize(JSON.parse(event.newValue));
        if (next !== null) setState(next);
      } catch {
        // Ignore malformed values written by other tabs.
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key, sanitize]);

  return [state, setState];
}
