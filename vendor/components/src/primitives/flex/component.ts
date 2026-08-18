import type { DesignComponentMeta } from "@glassbox-studio/studio-core/browser";

/**
 * Flex — one-dimensional layout (CSS-Tricks Flexbox patterns).
 * props = Tailwind flex knobs · demo = visual shell pattern
 */
export const meta = {
  id: "flex",
  title: "Flex",
  layer: "primitive",
  acceptsChildren: true,
  props: {
    demo: {
      type: "enum",
      values: ["row-wrap", "stack", "split", "custom"],
      default: "row-wrap",
      title: "Demo",
      description: "Visual pattern (CSS-Tricks style)",
    },
    direction: {
      type: "enum",
      values: ["row", "column"],
      default: "row",
      title: "Direction",
    },
    wrap: {
      type: "enum",
      values: ["nowrap", "wrap"],
      default: "wrap",
      title: "Wrap",
    },
    gap: {
      type: "enum",
      values: ["none", "sm", "md", "lg"],
      default: "md",
      title: "Gap",
    },
    justify: {
      type: "enum",
      values: ["start", "center", "between", "end"],
      default: "start",
      title: "Justify",
    },
    align: {
      type: "enum",
      values: ["stretch", "start", "center", "end"],
      default: "stretch",
      title: "Align",
    },
  },
} as const satisfies DesignComponentMeta;

export type { FlexProps, FlexSlots } from "./flex.js";
export { Flex, renderFlex } from "./flex.js";
