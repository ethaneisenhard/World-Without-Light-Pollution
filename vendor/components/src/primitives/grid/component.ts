import type { DesignComponentMeta } from "@glassbox-studio/studio-core/browser";

/**
 * Grid — two-dimensional layout (CSS-Tricks Grid patterns).
 * props = Tailwind grid knobs · demo = visual shell pattern
 */
export const meta = {
  id: "grid",
  title: "Grid",
  layer: "primitive",
  acceptsChildren: true,
  props: {
    demo: {
      type: "enum",
      values: ["calendar", "letters", "page", "custom"],
      default: "letters",
      title: "Demo",
      description: "Visual pattern (CSS-Tricks style)",
    },
    cols: {
      type: "enum",
      values: ["2", "3", "4", "7", "auto"],
      default: "3",
      title: "Columns",
    },
    gap: {
      type: "enum",
      values: ["none", "sm", "md", "lg"],
      default: "md",
      title: "Gap",
    },
  },
} as const satisfies DesignComponentMeta;

export type { GridProps, GridSlots } from "./grid.js";
export { Grid, renderGrid } from "./grid.js";
