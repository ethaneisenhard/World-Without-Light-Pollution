import type { DesignComponentMeta } from "@glassbox-studio/studio-core/browser";

/**
 * Section — page band.
 * props = layout knobs · children = free-form content · no named slots
 */
export const meta = {
  id: "section",
  title: "Section",
  layer: "primitive",
  acceptsChildren: true,
  props: {
    background: {
      type: "enum",
      values: ["transparent", "muted", "brand", "surface", "dark"],
      default: "transparent",
      title: "Background",
      description:
        "Theme tokens only (paper / sand / accent). Prefer surface over dark — dark is an alias for surface.",
    },
    padding: {
      type: "enum",
      values: ["none", "sm", "md", "lg", "xl"],
      default: "lg",
      title: "Padding",
      description:
        "Band gutters — sides + top/bottom. Default includes side pad (px-4 md:px-8). none = full-bleed.",
    },
    gap: {
      type: "enum",
      values: ["none", "xs", "sm", "md", "lg"],
      default: "none",
      title: "Gap",
    },
  },
} as const satisfies DesignComponentMeta;

export type { SectionProps, SectionSlots } from "./section.js";
export { Section, renderSection } from "./section.js";
