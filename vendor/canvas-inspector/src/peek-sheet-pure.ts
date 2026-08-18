/**
 * Inspect peek sheet — Vaul-inspired (emilkowal.ski/ui/building-a-drawer-component).
 *
 * Contract (repeat everywhere: Studio Live + site standalone):
 * - Non-modal: page/iframe stays scrollable and clickable (Vaul `modal={false}`).
 * - Peek height, not full-screen sheet (snap ~40vh — Maps / iOS partial sheet).
 * - No opaque blocking scrim; dismiss via Close / Inspect toggle.
 * - Use Visual Viewport for keyboard later — do not invent a second “mobile bar”.
 *
 * Library reference: https://github.com/emilkowalski/vaul (React). We port the
 * UX rules into CSS/DOM so remix/ui + guest iframe share one pattern.
 */

/** Match Studio compact shell / Tailwind compact breakpoint. */
export const INSPECT_PEEK_MAX_PX = 719;

/** Default peek height as a fraction of the visual viewport (0–1). */
export const INSPECT_PEEK_SNAP = 0.42;

/** Minimum peek height in CSS px so the panel body is usable. */
export const INSPECT_PEEK_MIN_PX = 220;

export function inspectUsesPeekSheet(viewportWidth: number): boolean {
  return viewportWidth > 0 && viewportWidth <= INSPECT_PEEK_MAX_PX;
}

/** CSS `height` for the peek sheet (vh + min floor). */
export function inspectPeekHeightCss(
  snap: number = INSPECT_PEEK_SNAP,
  minPx: number = INSPECT_PEEK_MIN_PX,
): string {
  const pct = Math.round(Math.min(0.85, Math.max(0.28, snap)) * 100);
  return `max(${minPx}px, ${pct}vh)`;
}
