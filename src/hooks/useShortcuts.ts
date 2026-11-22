import { useEffect, useRef } from 'react';
import { isTypingTarget } from '../lib/dom';

export interface Shortcut {
  /** Compared case-insensitively with KeyboardEvent.key. */
  key: string;
  alt?: boolean;
  /** Ctrl on Windows/Linux, ⌘ on macOS. */
  mod?: boolean;
  allowInInput?: boolean;
  allowRepeat?: boolean;
  /** Extra guard; the shortcut is skipped (and the event left alone) when it returns false. */
  when?: (event: KeyboardEvent) => boolean;
  handler: (event: KeyboardEvent) => void;
}

function matches(s: Shortcut, e: KeyboardEvent): boolean {
  return (
    e.key.toLowerCase() === s.key.toLowerCase() &&
    Boolean(s.alt) === e.altKey &&
    Boolean(s.mod) === (e.metaKey || e.ctrlKey)
  );
}

/** Global keyboard shortcuts. Disabled while a modal dialog is open or `enabled` is false. */
export function useShortcuts(shortcuts: Shortcut[], enabled = true): void {
  const ref = useRef(shortcuts);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    ref.current = shortcuts;
    enabledRef.current = enabled;
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!enabledRef.current || event.defaultPrevented || event.isComposing) return;
      if (document.querySelector('dialog[open]')) return;
      const typing = isTypingTarget(event.target);
      for (const shortcut of ref.current) {
        if (!matches(shortcut, event)) continue;
        if (typing && !shortcut.allowInInput) continue;
        if (event.repeat && !shortcut.allowRepeat) continue;
        if (shortcut.when && !shortcut.when(event)) continue;
        event.preventDefault();
        shortcut.handler(event);
        return;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
