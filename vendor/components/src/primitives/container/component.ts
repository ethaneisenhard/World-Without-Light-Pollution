import type { DesignComponentMeta } from "@glassbox-studio/studio-core/browser";

/**
 * Container — max-width shell.
 * props = width + align · children = free-form · flow via Flex/Grid
 * Never page side gutters — those live on Section.
 */
export const meta = {
  id: "container",
  title: "Container",
  layer: "primitive",
  acceptsChildren: true,
  props: {
    width: {
      type: "enum",
      values: ["sm", "md", "lg", "xl", "full"],
      default: "xl",
      title: "Width",
      description: "max-width constraint",
    },
    align: {
      type: "enum",
      values: ["left", "center"],
      default: "center",
      title: "Align",
      description: "Horizontal placement of the width box",
    },
  },
} as const satisfies DesignComponentMeta;

export type { ContainerProps, ContainerSlots } from "./container.js";
export { Container, renderContainer } from "./container.js";
