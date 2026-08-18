import type { DesignComponentMeta } from "@glassbox-studio/studio-core/browser";

/**
 * Eyebrow — typography primitive (BrowserUI eyebrow).
 */
export const meta = {
  id: "eyebrow",
  title: "Eyebrow",
  layer: "primitive",
  acceptsChildren: false,
  props: {
    align: {
      type: "enum",
      values: ["left", "center", "right"],
      default: "left",
      title: "Align",
    },
    color: {
      type: "enum",
      values: ["ink", "muted", "brand"],
      default: "muted",
      title: "Color",
    },
  },
  slots: {
    text: {
      title: "Text",
      description: "Eyebrow label",
    },
  },
} as const satisfies DesignComponentMeta;

export const slotTextDefaults = {
  text: "Eyebrow",
} as const;

export function slotsFromPlainText(
  text: Record<string, string>,
): Record<string, string> {
  return {
    text: text.text?.trim() || "Eyebrow",
  };
}

export type { EyebrowProps, EyebrowSlots } from "./eyebrow.js";
export { Eyebrow, renderEyebrow } from "./eyebrow.js";
