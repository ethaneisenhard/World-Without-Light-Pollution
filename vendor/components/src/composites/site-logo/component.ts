import type { DesignComponentMeta } from "@glassbox-studio/studio-core/browser";

export const meta = {
  id: "site-logo",
  title: "Site logo",
  layer: "composite",
  acceptsChildren: false,
  props: {
    markVariant: {
      type: "enum",
      values: ["glass-box-mark", "initials", "glass-box-splash", "image"],
      default: "glass-box-mark",
      title: "Mark",
    },
  },
  slots: {
    mark: { title: "Mark", optional: true },
    wordmark: { title: "Wordmark" },
  },
} as const satisfies DesignComponentMeta;

export const slotTextDefaults = {
  mark: "A",
  wordmark: "Glass Box Studio",
} as const;

export function slotsFromPlainText(
  text: Record<string, string>,
): Record<string, string> {
  return {
    mark: text.mark?.trim() || "A",
    wordmark: text.wordmark?.trim() || "Glass Box Studio",
  };
}

export type { SiteLogoProps, SiteLogoSlots } from "./site-logo.js";
export { SiteLogo, renderSiteLogo } from "./site-logo.js";
