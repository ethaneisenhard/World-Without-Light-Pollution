/**
 * Shared visual cells for Flex / Grid layout demos (CSS-Tricks style).
 * Tokenized — uses design-system colors / radius / type.
 */

export const LAYOUT_DEMO_CELL_CLASS =
  "as-layout-demo-cell flex items-center justify-center rounded-lg border border-line bg-paper-raised text-ink font-display text-xl font-semibold min-h-14";

export const LAYOUT_DEMO_CELL_ACCENT_CLASS =
  "as-layout-demo-cell flex items-center justify-center rounded-lg border border-accent/30 bg-accent text-inverse-fg font-display text-xl font-semibold min-h-14";

export const LAYOUT_DEMO_CELL_SOFT_CLASS =
  "as-layout-demo-cell flex items-center justify-center rounded-lg border border-line bg-sand text-ink font-display text-xl font-semibold min-h-14";

export function layoutDemoCellHtml(
  label: string,
  variant: "dark" | "accent" | "soft" = "dark",
  extraClass = "",
): string {
  const cls =
    variant === "accent"
      ? LAYOUT_DEMO_CELL_ACCENT_CLASS
      : variant === "soft"
        ? LAYOUT_DEMO_CELL_SOFT_CLASS
        : LAYOUT_DEMO_CELL_CLASS;
  return `<div class="${cls}${extraClass ? ` ${extraClass}` : ""}" data-as-layout-demo-cell>${escapeHtml(label)}</div>`;
}

export function layoutDemoCellsHtml(
  labels: readonly string[],
  variant: "dark" | "accent" | "soft" = "dark",
): string {
  return labels.map((l) => layoutDemoCellHtml(l, variant)).join("");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
