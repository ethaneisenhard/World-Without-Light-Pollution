/** @jsxImportSource remix/ui */
import { type Handle } from "remix/ui";
import {
  LAYOUT_SHELL_ROOT_CLASS,
} from "-studio/components";
import {
  LAYOUT_DEMO_CELL_CLASS,
  LAYOUT_DEMO_CELL_SOFT_CLASS,
} from "-studio/components";
import { inspectComponentAttrs } from "../inspect-attrs.ts";

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export type GridCols = "2" | "3" | "4" | "7" | "auto";
export type GridGap = "none" | "sm" | "md" | "lg";
export type GridDemo = "calendar" | "letters" | "page" | "custom";

export type GridProps = {
  cols?: GridCols;
  gap?: GridGap;
  demo?: GridDemo;
  instanceId?: string;
};

export type GridHandleProps = GridProps & { children?: JSX.Element };

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

function Cell(props: {
  label: string;
  variant?: "dark" | "soft";
  class?: string;
}) {
  const base =
    props.variant === "soft"
      ? LAYOUT_DEMO_CELL_SOFT_CLASS
      : LAYOUT_DEMO_CELL_CLASS;
  return (
    <div class={cn(base, props.class)} data-as-layout-demo-cell>
      {props.label}
    </div>
  );
}

function DemoBody(demo: GridDemo) {
  if (demo === "calendar") {
    return (
      <>
        {Array.from({ length: 31 }, (_, i) => (
          <Cell
            label={String(i + 1)}
            class="aspect-square min-h-0 text-base"
          />
        ))}
      </>
    );
  }
  if (demo === "page") {
    return (
      <>
        <header
          class={cn(
            LAYOUT_DEMO_CELL_CLASS,
            "col-span-full min-h-16 justify-start px-4 text-base",
          )}
          data-as-layout-demo-cell
        >
          My header
        </header>
        <aside
          class={cn(
            LAYOUT_DEMO_CELL_CLASS,
            "min-h-40 items-start justify-start p-4 text-base",
          )}
          data-as-layout-demo-cell
        >
          Sidebar
        </aside>
        <main
          class="as-layout-demo-cell col-span-3 flex min-h-40 flex-col justify-start rounded-lg border border-line bg-paper-raised p-4 text-ink"
          data-as-layout-demo-cell
        >
          <p class="font-display text-lg font-semibold">
            2 column, header and footer
          </p>
          <p class="mt-2 text-sm opacity-70">
            Line-based positioning — header and footer span the grid.
          </p>
        </main>
        <footer
          class={cn(
            LAYOUT_DEMO_CELL_CLASS,
            "col-span-full min-h-16 justify-start px-4 text-base",
          )}
          data-as-layout-demo-cell
        >
          My footer
        </footer>
      </>
    );
  }
  return (
    <>
      <Cell label="A" />
      <Cell label="B" />
      <Cell label="C" />
      <Cell label="D" />
      <Cell label="E" />
      <Cell label="F" />
    </>
  );
}

export function Grid(handle: Handle<GridHandleProps>) {
  return () => {
    const demo = handle.props.demo ?? "letters";
    const cols =
      demo === "custom"
        ? (handle.props.cols ?? "3")
        : demo === "calendar"
          ? "7"
          : demo === "page"
            ? "4"
            : "3";
    const gap = handle.props.gap ?? (demo === "calendar" ? "sm" : "md");
    const instanceId = handle.props.instanceId;

    return (
      <div
        class={cn(
          LAYOUT_SHELL_ROOT_CLASS,
          "grid p-3",
          GRID_COLS[cols],
          GRID_GAP[gap],
        )}
        {...inspectComponentAttrs({ componentId: "grid", instanceId })}
        data-as-layout-shell="grid"
        data-as-grid-demo={demo}
      >
        {demo === "custom"
          ? (handle.props.children ?? (
              <>
                <Cell label="1" variant="soft" />
                <Cell label="2" variant="soft" />
                <Cell label="3" variant="soft" />
              </>
            ))
          : DemoBody(demo)}
      </div>
    );
  };
}
