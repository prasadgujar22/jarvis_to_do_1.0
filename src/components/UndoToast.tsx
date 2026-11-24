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
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 460, damping: 34 }}
              className="pointer-events-auto flex items-center gap-1 rounded-xl border border-[#2F3336] bg-[#0F1419] py-2 pl-4 pr-2 text-[14px] text-white shadow-lg dark:border-[#CFD9DE] dark:bg-[#EFF3F4] dark:text-[#0F1419]"
            >
              <span className="mr-2 font-medium">{entry.message}</span>
              <button
                type="button"
                onClick={onUndo}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-bold text-[#71C9F8] transition-colors hover:bg-white/10 focus-ring dark:text-[#0B69A3] dark:hover:bg-[#0F1419]/10"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Undo
              </button>
              <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss"
                className="grid size-7 place-items-center rounded-full text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-ring dark:text-[#536471] dark:hover:bg-[#0F1419]/10 dark:hover:text-[#0F1419]"
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
