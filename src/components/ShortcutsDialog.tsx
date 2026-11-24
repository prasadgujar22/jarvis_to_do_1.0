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
      className="dialog m-auto w-[min(92vw,34rem)] rounded-2xl bg-transparent p-0 text-[#0F1419] backdrop:bg-[#5B7083]/40 dark:text-[#E7E9EA]"
    >
      <div className="rounded-2xl border border-[#EFF3F4] bg-white p-6 shadow-2xl dark:border-[#2F3336] dark:bg-black">
        <div className="flex items-start justify-between gap-4 border-b border-[#EFF3F4] pb-4 dark:border-[#2F3336]">
          <div>
            <h2 id="shortcuts-title" className="text-[19px] font-extrabold tracking-[-0.02em] text-[#0F1419] dark:text-[#E7E9EA]">
              Keyboard shortcuts
            </h2>
            <p className="mt-0.5 text-[14px] text-[#536471] dark:text-[#8B98A5]">Move fast without leaving the keyboard.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-9 place-items-center rounded-full text-[#0F1419] transition-colors hover:bg-[#0F1419]/10 focus-ring dark:text-[#E7E9EA] dark:hover:bg-[#E7E9EA]/10"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group.title} aria-labelledby={`sg-${group.title}`} className={group.title === 'Quick add' ? 'sm:col-span-2' : undefined}>
              <h3 id={`sg-${group.title}`} className="mb-2.5 text-[12px] font-bold uppercase tracking-wider text-[#536471] dark:text-[#8B98A5]">
                {group.title}
              </h3>
              <dl className="space-y-2">
                {group.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3 text-[14px]">
                    <dt className="text-[#0F1419] dark:text-[#E7E9EA]">{item.label}</dt>
                    <dd className="flex shrink-0 items-center gap-1">
                      {item.keys.map((combo, i) => (
                        <span key={combo.join('+')} className="flex items-center gap-1">
                          {i > 0 && <span className="text-xs text-[#536471] dark:text-[#8B98A5]">/</span>}
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
