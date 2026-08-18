/**
 * Grid layout primitive — Tailwind grid utilities + visual demos.
 * Inspired by CSS-Tricks CSS Grid guide patterns.
 * Tag: <div> (layout box) + data-as-component="grid".
 * Page demo uses semantic <header>/<aside>/<main>/<footer> cells.
 */

import { componentStamp } from "../../inspect-stamp.js";
import {
  type LayoutChrome,
  layoutRootClass,
} from "../layout-shell.js";
import {
  LAYOUT_DEMO_CELL_CLASS,
  layoutDemoCellHtml,
  layoutDemoCellsHtml,
} from "../layout-demo.js";

export type GridCols = "2" | "3" | "4" | "7" | "auto";
export type GridGap = "none" | "sm" | "md" | "lg";
/** Visual patterns from CSS-Tricks / layout demos. */
export type GridDemo = "calendar" | "letters" | "page" | "custom";

export type GridProps = {
  cols?: GridCols;
  gap?: GridGap;
  demo?: GridDemo;
  instanceId?: string;
};

export type GridSlots = Record<string, never>;

const GRID_COLS: Record<GridCols, string> = {
  "2": "grid-cols-2",
  "3": "grid-cols-3",
  "4": "grid-cols-4",
  "7": "grid-cols-7",
  auto: "grid-cols-[repeat(auto-fill,minmax(5rem,1fr))]",
};

const GRID_GAP: Record<GridGap, string> = {
  none: "gap-0",
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-6",
};

export type GridRenderInput = {
  props?: GridProps;
  slots?: GridSlots;
  children?: string;
  chrome?: LayoutChrome;
};

function demoChildren(demo: GridDemo): string {
  if (demo === "calendar") {
    return Array.from({ length: 31 }, (_, i) =>
      layoutDemoCellHtml(String(i + 1), "dark", "aspect-square min-h-0 text-base"),
    ).join("");
  }
  if (demo === "letters") {
    return layoutDemoCellsHtml(["A", "B", "C", "D", "E", "F"], "dark");
  }
  if (demo === "page") {
    const cell = LAYOUT_DEMO_CELL_CLASS;
    return (
      `<header class="${cell} col-span-full min-h-16 justify-start px-4 text-base" data-as-layout-demo-cell>My header</header>` +
      `<aside class="${cell} min-h-40 justify-start items-start p-4 text-base" data-as-layout-demo-cell>Sidebar</aside>` +
      `<main class="as-layout-demo-cell flex flex-col justify-start rounded-lg border border-line bg-paper-raised text-ink p-4 min-h-40 col-span-3" data-as-layout-demo-cell>
        <p class="font-display text-lg font-semibold">2 column, header and footer</p>
        <p class="mt-2 text-sm opacity-70">Line-based positioning — header and footer span the grid.</p>
      </main>` +
      `<footer class="${cell} col-span-full min-h-16 justify-start px-4 text-base" data-as-layout-demo-cell>My footer</footer>`
    );
  }
  return layoutDemoCellsHtml(["1", "2", "3", "4"], "soft");
}

function demoDefaults(demo: GridDemo): Partial<GridProps> {
  if (demo === "calendar") return { cols: "7", gap: "sm" };
  if (demo === "letters") return { cols: "3", gap: "md" };
  if (demo === "page") return { cols: "4", gap: "md" };
  return { cols: "3", gap: "md" };
}

export function renderGrid(input: GridRenderInput | GridProps = {}): string {
  const normalized: GridRenderInput =
    "props" in input || "slots" in input || "children" in input || "chrome" in input
      ? (input as GridRenderInput)
      : { props: input as GridProps };

  const chrome = normalized.chrome ?? "live";
  const demo = (normalized.props?.demo ?? "letters") as GridDemo;
  const defaults = demoDefaults(demo);
  const gap = (normalized.props?.gap ?? defaults.gap ?? "md") as GridGap;
  const cols = (
    demo === "custom"
      ? (normalized.props?.cols ?? "3")
      : (defaults.cols ?? "3")
  ) as GridCols;

  const children =
    demo === "custom"
      ? (normalized.children ?? layoutDemoCellsHtml(["1", "2", "3"], "soft"))
      : demoChildren(demo);

  const cls = [
    layoutRootClass(chrome),
    "grid p-3",
    GRID_COLS[cols],
    GRID_GAP[gap],
  ]
    .filter(Boolean)
    .join(" ");

  const stamp = componentStamp({
    componentId: "grid",
    instanceId: normalized.props?.instanceId,
  });
  return `<div class="${cls}" ${stamp} data-as-grid-demo="${demo}">${children}</div>`;
}

export function Grid(props: GridProps & { children?: string } = {}): string {
  const { children, ...rest } = props;
  return renderGrid({ props: rest, children });
}
