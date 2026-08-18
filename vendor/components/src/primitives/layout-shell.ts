/**
 * Layout chrome for Design sandbox vs Live site.
 * Sandbox = dashed preview shell. Live = token layout only (no demo outline).
 */

export type LayoutChrome = "sandbox" | "live";

/** Design Studio sandbox — dashed outline + inset well. */
export const LAYOUT_SHELL_ROOT_CLASS =
  "as-ds-shell relative w-full min-h-40 rounded-xl border-2 border-dashed border-accent bg-paper-raised p-5";

export const LAYOUT_SHELL_CHILDREN_CLASS =
  "as-ds-shell__children relative min-h-24 w-full rounded-lg border border-dashed border-line bg-paper px-6 py-5 text-ink";

/** Live / prod — no preview chrome. */
export const LAYOUT_LIVE_ROOT_CLASS = "as-layout relative w-full";

export function wrapLayoutShellChildren(children: string): string {
  return `<div class="${LAYOUT_SHELL_CHILDREN_CLASS}" data-as-layout-shell-children>${children}</div>`;
}

export function layoutRootClass(chrome: LayoutChrome = "live"): string {
  return chrome === "sandbox" ? LAYOUT_SHELL_ROOT_CLASS : LAYOUT_LIVE_ROOT_CLASS;
}

export function wrapLayoutChildren(
  children: string,
  chrome: LayoutChrome = "live",
): string {
  if (chrome === "sandbox") return wrapLayoutShellChildren(children);
  return children;
}
