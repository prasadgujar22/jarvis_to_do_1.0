import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { SHORTCUT_GROUPS } from '../lib/shortcuts';
import { Kbd } from './ui/Kbd';

interface ShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Native modal dialog: focus trapping, Escape-to-close and inert background come for free. */
export function ShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="shortcuts-title"
      className="dialog m-auto w-[min(92vw,34rem)] rounded-3xl bg-transparent p-0 text-slate-900 backdrop:bg-slate-950/40 backdrop:backdrop-blur-sm dark:text-white"
    >
      <div className="glass-strong rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="shortcuts-title" className="font-display text-lg font-semibold">
              Keyboard shortcuts
            </h2>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">Move fast without leaving the keyboard.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-900/[0.06] hover:text-slate-900 focus-ring dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group.title} aria-labelledby={`sg-${group.title}`} className={group.title === 'Quick add' ? 'sm:col-span-2' : undefined}>
              <h3 id={`sg-${group.title}`} className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {group.title}
              </h3>
              <dl className="space-y-2">
                {group.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                    <dt className="text-slate-700 dark:text-slate-300">{item.label}</dt>
                    <dd className="flex shrink-0 items-center gap-1">
                      {item.keys.map((combo, i) => (
                        <span key={combo.join('+')} className="flex items-center gap-1">
                          {i > 0 && <span className="text-xs text-slate-400">/</span>}
                          {combo.map((k) => (
                            <Kbd key={k}>{k}</Kbd>
                          ))}
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </dialog>
  );
}
