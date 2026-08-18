/**
 * Flex layout primitive — Tailwind flex utilities + visual demos.
 * Inspired by CSS-Tricks Flexbox guide patterns.
 * Tag: <div> (layout box) + data-as-component="flex".
 */

import { componentStamp } from "../../inspect-stamp.js";
import {
  type LayoutChrome,
  layoutRootClass,
} from "../layout-shell.js";
import {
  layoutDemoCellHtml,
  layoutDemoCellsHtml,
} from "../layout-demo.js";

export type FlexDirection = "row" | "column";
export type FlexWrap = "nowrap" | "wrap";
export type FlexGap = "none" | "sm" | "md" | "lg";
export type FlexJustify = "start" | "center" | "between" | "end";
export type FlexAlign = "stretch" | "start" | "center" | "end";
/** Visual patterns from CSS-Tricks / layout demos. */
export type FlexDemo = "row-wrap" | "stack" | "split" | "custom";

export type FlexProps = {
  direction?: FlexDirection;
  wrap?: FlexWrap;
  gap?: FlexGap;
  justify?: FlexJustify;
  align?: FlexAlign;
  demo?: FlexDemo;
  instanceId?: string;
};

export type FlexSlots = Record<string, never>;

const FLEX_DIR: Record<FlexDirection, string> = {
  row: "flex-row",
  column: "flex-col",
};

const FLEX_WRAP: Record<FlexWrap, string> = {
  nowrap: "flex-nowrap",
  wrap: "flex-wrap",
};

const FLEX_GAP: Record<FlexGap, string> = {
  none: "gap-0",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
};

const FLEX_JUSTIFY: Record<FlexJustify, string> = {
  start: "justify-start",
  center: "justify-center",
  between: "justify-between",
  end: "justify-end",
};

const FLEX_ALIGN: Record<FlexAlign, string> = {
  stretch: "items-stretch",
  start: "items-start",
  center: "items-center",
  end: "items-end",
};

export type FlexRenderInput = {
  props?: FlexProps;
  slots?: FlexSlots;
  children?: string;
  chrome?: LayoutChrome;
};

function demoChildren(demo: FlexDemo): string {
  if (demo === "stack") {
    return layoutDemoCellsHtml(["1", "2", "3", "4"], "accent");
  }
  if (demo === "split") {
    return (
      layoutDemoCellHtml("1", "dark", "min-w-[30%] flex-1") +
      layoutDemoCellHtml(
        "2",
        "dark",
        "min-w-[55%] flex-[2] border-l border-dashed border-line",
      )
    );
  }
  return (
    layoutDemoCellHtml("1", "soft", "w-24") +
    layoutDemoCellHtml("2", "soft", "w-24") +
    layoutDemoCellHtml("3", "soft", "w-48") +
    layoutDemoCellHtml("4", "soft", "w-24") +
    layoutDemoCellHtml("5", "soft", "w-24")
  );
}

function demoDefaults(demo: FlexDemo): Partial<FlexProps> {
  if (demo === "stack") {
    return { direction: "column", wrap: "nowrap", gap: "md", align: "stretch" };
  }
  if (demo === "split") {
    return {
      direction: "row",
      wrap: "nowrap",
      gap: "md",
      align: "stretch",
    };
  }
  if (demo === "row-wrap") {
    return {
      direction: "row",
      wrap: "wrap",
      gap: "md",
      align: "stretch",
    };
  }
  return {};
}

export function renderFlex(input: FlexRenderInput | FlexProps = {}): string {
  const normalized: FlexRenderInput =
    "props" in input || "slots" in input || "children" in input || "chrome" in input
      ? (input as FlexRenderInput)
      : { props: input as FlexProps };

  const chrome = normalized.chrome ?? "live";
  const demo = (normalized.props?.demo ?? "row-wrap") as FlexDemo;
  const defaults = demoDefaults(demo);
  const gap = (normalized.props?.gap ?? defaults.gap ?? "md") as FlexGap;
  const justify = (normalized.props?.justify ??
    defaults.justify ??
    "start") as FlexJustify;
  const align = (normalized.props?.align ??
    defaults.align ??
    "stretch") as FlexAlign;
  const direction = (
    demo === "custom"
      ? (normalized.props?.direction ?? "row")
      : (defaults.direction ?? "row")
  ) as FlexDirection;
  const wrap = (
    demo === "custom"
      ? (normalized.props?.wrap ?? "wrap")
      : (defaults.wrap ?? "wrap")
  ) as FlexWrap;

  const children =
    demo === "custom"
      ? (normalized.children ??
        layoutDemoCellsHtml(["A", "B", "C"], "soft"))
      : demoChildren(demo);

  const cls = [
    layoutRootClass(chrome),
    "flex p-3",
    FLEX_DIR[direction],
    FLEX_WRAP[wrap],
    FLEX_GAP[gap],
    FLEX_JUSTIFY[justify],
    FLEX_ALIGN[align],
    demo === "row-wrap" ? "bg-accent border-accent text-inverse-fg" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const stamp = componentStamp({
    componentId: "flex",
    instanceId: normalized.props?.instanceId,
  });
  return `<div class="${cls}" ${stamp} data-as-flex-demo="${demo}">${children}</div>`;
}

export function Flex(props: FlexProps & { children?: string } = {}): string {
  const { children, ...rest } = props;
  return renderFlex({ props: rest, children });
}
