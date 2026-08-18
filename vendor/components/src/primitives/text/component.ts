import type { DesignComponentMeta } from "@glassbox-studio/studio-core/browser";

/**
 * Text — typography primitive (BrowserUI text).
 */
export const meta = {
  id: "text",
  title: "Text",
  layer: "primitive",
  acceptsChildren: false,
  props: {
    as: {
      type: "enum",
      values: ["p", "span", "div"],
      default: "p",
      title: "Tag",
    },
    variant: {
      type: "enum",
      values: ["lead", "body", "small", "caption"],
      default: "body",
      title: "Variant",
    },
    align: {
      type: "enum",
      values: ["left", "center", "right", "justify"],
      default: "left",
      title: "Align",
    },
    weight: {
      type: "enum",
      values: ["normal", "medium", "semibold", "bold"],
      default: "normal",
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
    content: {
      title: "Content",
      description: "Body copy",
    },
  },
} as const satisfies DesignComponentMeta;

export const slotTextDefaults = {
  content: "Text",
} as const;

export function slotsFromPlainText(
  text: Record<string, string>,
): Record<string, string> {
  return {
    content: text.content?.trim() || "Text",
  };
}

export type { TextProps, TextSlots } from "./text.js";
export { Text, renderText } from "./text.js";
