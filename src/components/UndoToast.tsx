import { AnimatePresence, m } from 'motion/react';
import { RotateCcw, X } from 'lucide-react';
import type { UndoEntry } from '../types';

interface UndoToastProps {
  entry: UndoEntry | null;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({ entry, onUndo, onDismiss }: UndoToastProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div role="status" aria-live="polite" className="contents">
        <AnimatePresence>
          {entry && (
            <m.div
              key={entry.id}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="pointer-events-auto flex items-center gap-1 rounded-2xl bg-slate-900/90 py-1.5 pl-4 pr-1.5 text-sm text-white shadow-2xl shadow-slate-900/30 ring-1 ring-white/10 backdrop-blur-xl dark:bg-white/90 dark:text-slate-900"
            >
              <span className="mr-2">{entry.message}</span>
              <button
                type="button"
                onClick={onUndo}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-semibold text-violet-300 hover:bg-white/10 focus-ring dark:text-violet-700 dark:hover:bg-slate-900/10"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Undo
              </button>
              <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss"
                className="grid size-8 place-items-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white focus-ring dark:text-slate-500 dark:hover:bg-slate-900/10 dark:hover:text-slate-900"
              >
                <X className="size-4" aria-hidden />
              </button>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
