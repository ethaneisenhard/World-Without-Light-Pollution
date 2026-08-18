/**
 * Project Tailwind + @theme token classes for Button visuals.
 * No parallel BEM (nl-cta) — tokens only.
 */

import type { ButtonVariant } from "./button.js";

const PRIMARY =
  "inline-flex items-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-inverse-fg hover:bg-accent-deep active:scale-[0.97] transition";

const SECONDARY =
  "inline-flex items-center rounded-full border border-line bg-paper-raised px-6 py-3 text-sm font-medium text-ink hover:border-ink active:scale-[0.97] transition";

const GHOST =
  "inline-flex items-center px-4 py-2 text-sm font-medium text-ink-soft active:scale-[0.97] transition";

export function buttonClassName(variant: ButtonVariant = "primary"): string {
  if (variant === "secondary") return SECONDARY;
  if (variant === "ghost") return GHOST;
  return PRIMARY;
}
