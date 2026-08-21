/**
 * Section primitive — page band (bg + padding on all sides).
 * Flow via Flex/Grid inside. Landmark: <section> + data-as-component="section".
 * Taste (layout.mdc): section owns full-bleed band color AND gutters
 * (sides + top/bottom). Container is max-width only — never page side pad.
 */

import { componentStamp } from "../../inspect-stamp.js";
import {
  type LayoutChrome,
  layoutRootClass,
  wrapLayoutChildren,
} from "../layout-shell.js";

export type SectionBackground =
  | "transparent"
  | "muted"
  | "brand"
  | "surface"
  /** @deprecated Use surface — maps to theme paper-raised (never inverse). */
  | "dark";

export type SectionPadding = "none" | "sm" | "md" | "lg" | "xl";
export type SectionGap = "none" | "xs" | "sm" | "md" | "lg";

export type SectionProps = {
  background?: SectionBackground;
  /** Band gutters — sides + vertical. Default lg includes side pad. */
  padding?: SectionPadding;
  gap?: SectionGap;
  instanceId?: string;
  /** Extra utilities — visitor paint that must survive Inspect-attr strip. */
  className?: string;
};

export type SectionSlots = Record<string, never>;

/**
 * Side gutters match site chrome (`px-4 md:px-8`). Vertical scales with size.
 * `none` = full-bleed edge-to-edge (rare — heroes that intentionally kiss the viewport).
 */
const SECTION_PAD: Record<SectionPadding, string> = {
  none: "",
  sm: "px-4 py-6 md:px-8",
  md: "px-4 py-10 md:px-8",
  lg: "px-4 py-16 md:px-8",
  xl: "px-4 py-24 md:px-8",
};

const SECTION_GAP: Record<SectionGap, string> = {
  none: "",
  xs: "flex flex-col gap-2",
  sm: "flex flex-col gap-4",
  md: "flex flex-col gap-6",
  lg: "flex flex-col gap-8",
};

/** Theme-relative fills only — no bg-inverse (flips wrong in .dark). */
const SECTION_BG: Record<SectionBackground, string> = {
  transparent: "",
  muted: "bg-sand text-ink",
  brand: "bg-accent text-inverse-fg",
  surface: "bg-paper-raised text-ink",
  dark: "bg-paper-raised text-ink",
};

export type SectionRenderInput = {
  props?: SectionProps;
  slots?: SectionSlots;
  children?: string;
  /** sandbox = Design Studio dashed chrome; live = site (default). */
  chrome?: LayoutChrome;
};

export function renderSection(input: SectionRenderInput | SectionProps = {}): string {
  const normalized: SectionRenderInput =
    "props" in input || "slots" in input || "children" in input || "chrome" in input
      ? (input as SectionRenderInput)
      : { props: input as SectionProps };

  const {
    background = "transparent",
    padding = "lg",
    gap = "none",
    instanceId,
    className,
  } = normalized.props ?? {};
  const chrome = normalized.chrome ?? "live";
  const children =
    normalized.children ??
    `<p class="text-sm text-ink-soft leading-relaxed">Section content</p>`;

  const cls = [
    layoutRootClass(chrome),
    SECTION_PAD[padding],
    SECTION_GAP[gap],
    SECTION_BG[background],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const stamp = componentStamp({ componentId: "section", instanceId });
  return `<section class="${cls}" ${stamp}>${wrapLayoutChildren(children, chrome)}</section>`;
}

/** @deprecated Prefer renderSection({ props, children }) */
export function Section(props: SectionProps & { children?: string } = {}): string {
  const { children, ...rest } = props;
  return renderSection({ props: rest, children });
}
