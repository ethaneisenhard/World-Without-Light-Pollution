import type { DesignComponentMeta } from "@glassbox-studio/studio-core/browser";

export const meta = {
  id: "prose",
  title: "Prose",
  layer: "primitive",
  acceptsChildren: true,
  props: {
    size: {
      type: "enum",
      values: ["base", "lg"],
      default: "base",
      title: "Size",
    },
    measure: {
      type: "enum",
      values: ["sm", "md", "lg"],
      default: "md",
      title: "Measure",
    },
  },
  slots: { content: { title: "Content" } },
} as const satisfies DesignComponentMeta;

export const slotTextDefaults = { content: "Prose content" } as const;

export function slotsFromPlainText(
  text: Record<string, string>,
): Record<string, string> {
  return { content: text.content?.trim() || "Prose content" };
}

export type { ProseProps, ProseSlots } from "./prose.js";
export { Prose, renderProse } from "./prose.js";
