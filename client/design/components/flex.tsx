/** @jsxImportSource remix/ui */
import { type Handle } from "remix/ui";
import {
  LAYOUT_SHELL_ROOT_CLASS,
} from "-studio/components";
import {
  LAYOUT_DEMO_CELL_ACCENT_CLASS,
  LAYOUT_DEMO_CELL_CLASS,
  LAYOUT_DEMO_CELL_SOFT_CLASS,
} from "-studio/components";
import { inspectComponentAttrs } from "../inspect-attrs.ts";

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export type FlexDirection = "row" | "column";
export type FlexWrap = "nowrap" | "wrap";
export type FlexGap = "none" | "sm" | "md" | "lg";
export type FlexJustify = "start" | "center" | "between" | "end";
export type FlexAlign = "stretch" | "start" | "center" | "end";
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

export type FlexHandleProps = FlexProps & { children?: JSX.Element };

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

function Cell(props: {
  label: string;
  variant?: "dark" | "accent" | "soft";
  class?: string;
}) {
  const base =
    props.variant === "accent"
      ? LAYOUT_DEMO_CELL_ACCENT_CLASS
      : props.variant === "soft"
        ? LAYOUT_DEMO_CELL_SOFT_CLASS
        : LAYOUT_DEMO_CELL_CLASS;
  return (
    <div class={cn(base, props.class)} data-as-layout-demo-cell>
      {props.label}
    </div>
  );
}

function DemoBody(demo: FlexDemo) {
  if (demo === "stack") {
    return (
      <>
        <Cell label="1" variant="accent" />
        <Cell label="2" variant="accent" />
        <Cell label="3" variant="accent" />
        <Cell label="4" variant="accent" />
      </>
    );
  }
  if (demo === "split") {
    return (
      <>
        <Cell label="1" class="min-w-[30%] flex-1" />
        <Cell
          label="2"
          class="min-w-[55%] flex-[2] border-l border-dashed border-line"
        />
      </>
    );
  }
  return (
    <>
      <Cell label="1" variant="soft" class="w-24" />
      <Cell label="2" variant="soft" class="w-24" />
      <Cell label="3" variant="soft" class="w-48" />
      <Cell label="4" variant="soft" class="w-24" />
      <Cell label="5" variant="soft" class="w-24" />
    </>
  );
}

export function Flex(handle: Handle<FlexHandleProps>) {
  return () => {
    const demo = handle.props.demo ?? "row-wrap";
    const direction =
      demo === "custom"
        ? (handle.props.direction ?? "row")
        : demo === "stack"
          ? "column"
          : "row";
    const wrap =
      demo === "custom"
        ? (handle.props.wrap ?? "wrap")
        : demo === "row-wrap"
          ? "wrap"
          : "nowrap";
    const gap = handle.props.gap ?? "md";
    const justify = handle.props.justify ?? "start";
    const align = handle.props.align ?? "stretch";
    const instanceId = handle.props.instanceId;

    return (
      <div
        class={cn(
          LAYOUT_SHELL_ROOT_CLASS,
          "flex p-3",
          FLEX_DIR[direction],
          FLEX_WRAP[wrap],
          FLEX_GAP[gap],
          FLEX_JUSTIFY[justify],
          FLEX_ALIGN[align],
          demo === "row-wrap" && "border-accent bg-accent text-inverse-fg",
        )}
        {...inspectComponentAttrs({ componentId: "flex", instanceId })}
        data-as-layout-shell="flex"
        data-as-flex-demo={demo}
      >
        {demo === "custom"
          ? (handle.props.children ?? (
              <>
                <Cell label="A" variant="soft" />
                <Cell label="B" variant="soft" />
                <Cell label="C" variant="soft" />
              </>
            ))
          : DemoBody(demo)}
      </div>
    );
  };
}
