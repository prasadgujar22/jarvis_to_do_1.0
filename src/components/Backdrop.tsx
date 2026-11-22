/**
 * Decorative aurora gradients, grid and film grain behind the app.
 * Intentionally static: animating these blobs forced every backdrop-filter (glass) surface above them
 * to be re-blurred on every frame, roughly halving the frame budget for the actual UI.
 */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -left-40 -top-48 size-[42rem] rounded-full bg-violet-400/35 blur-[120px] dark:bg-violet-600/25" />
      <div className="absolute -right-40 top-1/4 size-[36rem] rounded-full bg-cyan-300/35 blur-[120px] dark:bg-cyan-500/15" />
      <div className="absolute -bottom-56 left-1/4 size-[40rem] rounded-full bg-fuchsia-300/30 blur-[130px] dark:bg-fuchsia-600/15" />
      <div className="bg-grid absolute inset-0" />
      <div className="bg-noise absolute inset-0 opacity-[0.06] mix-blend-overlay dark:opacity-[0.08]" />
    </div>
  );
}
