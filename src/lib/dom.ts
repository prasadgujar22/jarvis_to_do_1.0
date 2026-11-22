const ROW_SELECTOR = '[data-task-row]';

/** Visible (non-exiting) task rows in DOM order. */
export function getTaskRows(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(ROW_SELECTOR));
}

export function getFocusedTaskId(): string | null {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return null;
  return active.closest<HTMLElement>(ROW_SELECTOR)?.dataset.taskId ?? null;
}

export function focusTaskRow(id: string): void {
  // Wait a frame so React has committed any re-render/reorder first.
  requestAnimationFrame(() => {
    const row = document.querySelector<HTMLElement>(`${ROW_SELECTOR}[data-task-id="${CSS.escape(id)}"]`);
    row?.focus({ preventScroll: false });
    row?.scrollIntoView({ block: 'nearest' });
  });
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
