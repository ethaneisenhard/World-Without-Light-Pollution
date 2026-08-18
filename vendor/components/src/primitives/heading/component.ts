import type { DesignComponentMeta } from "@glassbox-studio/studio-core/browser";

/**
 * Heading — typography primitive (from BrowserUI heading vocabulary).
 * props = level / size / align / weight · slot = text
 */
export const meta = {
  id: "heading",
  title: "Heading",
  layer: "primitive",
  acceptsChildren: false,
  props: {
    level: {
      type: "enum",
      values: ["1", "2", "3", "4", "5", "6"],
      default: "1",
      title: "Level",
    },
    size: {
      type: "enum",
      values: ["xs", "sm", "md", "lg", "xl", "display"],
      default: "lg",
      title: "Size",
    },
    align: {
      type: "enum",
      values: ["left", "center", "right"],
      default: "left",
      title: "Align",
    },
    weight: {
      type: "enum",
      values: ["normal", "medium", "semibold", "bold"],
      default: "bold",
      title: "Weight",
    },
    color: {
      type: "enum",
      values: ["ink", "muted", "brand", "inherit"],
      default: "ink",
      title: "Color",
    },
  },
  slots: {
    text: {
      title: "Text",
      description: "Heading copy",
    },
  },
} as const satisfies DesignComponentMeta;

export const slotTextDefaults = {
  text: "Heading",
} as const;

export function slotsFromPlainText(
  text: Record<string, string>,
): Record<string, string> {
  return {
    text: text.text?.trim() || "Heading",
  };
}

export type { HeadingProps, HeadingSlots } from "./heading.js";
export { Heading, renderHeading } from "./heading.js";
