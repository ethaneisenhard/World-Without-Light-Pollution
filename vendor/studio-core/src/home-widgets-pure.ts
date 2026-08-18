/**
 * Home widget layouts — placement, collision, defaults, patch.
 * Pure — no DOM / fetch.
 */

import {
  HOME_GRID_COLS_DESKTOP,
  getHomeWidgetDef,
  isKnownHomeWidgetId,
  sizeAllowedForWidget,
} from "./home-widget-registry-pure.js";

export type HomeWidgetInstance = {
  instanceId: string;
  widgetId: string;
  col: number;
  row: number;
  w: number;
  h: number;
  props?: Record<string, unknown>;
};

export type HomeWidgetLayout = {
  widgets: HomeWidgetInstance[];
};

export type StudioHomeConfig = {
  layouts: Record<string, HomeWidgetLayout>;
};

export const DEFAULT_HOME_LAYOUT_ID = "default";

export function emptyHomeConfig(): StudioHomeConfig {
  return { layouts: { [DEFAULT_HOME_LAYOUT_ID]: defaultHomeLayout() } };
}

/**
 * Default Home layout (4-col grid).
 *
 *   [ greeting 2×1 ][ workspaces 2×1 ]
 *   [ activity 2×2 ][ calendar  2×2 ]
 *   [ chat 1×2 ][ calendar 1×2 ][ media 1×2 ][ settings 1×2 ]
 */
export function defaultHomeLayout(): HomeWidgetLayout {
  return {
    widgets: [
      {
        instanceId: "w-greeting",
        widgetId: "greeting",
        col: 0,
        row: 0,
        w: 2,
        h: 1,
      },
      {
        instanceId: "w-workspaces",
        widgetId: "workspaces",
        col: 2,
        row: 0,
        w: 2,
        h: 1,
      },
      {
        instanceId: "w-activity",
        widgetId: "activity",
        col: 0,
        row: 1,
        w: 2,
        h: 2,
      },
      {
        instanceId: "w-calendar",
        widgetId: "calendar-week",
        col: 2,
        row: 1,
        w: 2,
        h: 2,
      },
      {
        instanceId: "w-launch-chat",
        widgetId: "app-launcher",
        col: 0,
        row: 3,
        w: 1,
        h: 2,
        props: { kind: "chat", label: "Chat" },
      },
      {
        instanceId: "w-launch-calendar",
        widgetId: "app-launcher",
        col: 1,
        row: 3,
        w: 1,
        h: 2,
        props: { kind: "calendar", label: "Calendar" },
      },
      {
        instanceId: "w-launch-media",
        widgetId: "app-launcher",
        col: 2,
        row: 3,
        w: 1,
        h: 2,
        props: { kind: "media", label: "Media" },
      },
      {
        instanceId: "w-launch-settings",
        widgetId: "app-launcher",
        col: 3,
        row: 3,
        w: 1,
        h: 2,
        props: { kind: "settings", label: "Settings" },
      },
    ],
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function clampInt(n: unknown, min: number, max: number, fallback: number): number {
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export function parseHomeWidgetInstance(
  raw: unknown,
): HomeWidgetInstance | null {
  if (!isRecord(raw)) return null;
  const instanceId =
    typeof raw.instanceId === "string" && raw.instanceId.trim()
      ? raw.instanceId.trim().slice(0, 64)
      : null;
  const widgetId =
    typeof raw.widgetId === "string" && raw.widgetId.trim()
      ? raw.widgetId.trim()
      : null;
  if (!instanceId || !widgetId || !isKnownHomeWidgetId(widgetId)) return null;
  const w = clampInt(raw.w, 1, HOME_GRID_COLS_DESKTOP, 1);
  const h = clampInt(raw.h, 1, 8, 1);
  if (!sizeAllowedForWidget(widgetId, w, h)) {
    const def = getHomeWidgetDef(widgetId);
    if (!def) return null;
    return {
      instanceId,
      widgetId,
      col: clampInt(raw.col, 0, HOME_GRID_COLS_DESKTOP - 1, 0),
      row: clampInt(raw.row, 0, 64, 0),
      w: def.defaultSize.w,
      h: def.defaultSize.h,
      ...(isRecord(raw.props) ? { props: { ...raw.props } } : {}),
    };
  }
  const col = clampInt(raw.col, 0, HOME_GRID_COLS_DESKTOP - w, 0);
  const row = clampInt(raw.row, 0, 64, 0);
  const out: HomeWidgetInstance = {
    instanceId,
    widgetId,
    col,
    row,
    w,
    h,
  };
  if (isRecord(raw.props)) out.props = { ...raw.props };
  return out;
}

export function parseHomeWidgetLayout(raw: unknown): HomeWidgetLayout {
  if (!isRecord(raw) || !Array.isArray(raw.widgets)) {
    return defaultHomeLayout();
  }
  const seen = new Set<string>();
  const widgets: HomeWidgetInstance[] = [];
  for (const item of raw.widgets) {
    const inst = parseHomeWidgetInstance(item);
    if (!inst || seen.has(inst.instanceId)) continue;
    seen.add(inst.instanceId);
    widgets.push(inst);
  }
  if (widgets.length === 0) return defaultHomeLayout();
  return { widgets };
}

/** Parse ui.home — empty / invalid → defaults with layout `default`. */
export function parseStudioHomeConfig(raw: unknown): StudioHomeConfig {
  if (!isRecord(raw)) return emptyHomeConfig();
  const layoutsRaw = isRecord(raw.layouts) ? raw.layouts : null;
  if (!layoutsRaw) return emptyHomeConfig();
  const layouts: Record<string, HomeWidgetLayout> = {};
  for (const [id, layout] of Object.entries(layoutsRaw)) {
    if (typeof id !== "string" || !id.trim()) continue;
    layouts[id.trim().slice(0, 64)] = parseHomeWidgetLayout(layout);
  }
  if (!layouts[DEFAULT_HOME_LAYOUT_ID]) {
    layouts[DEFAULT_HOME_LAYOUT_ID] = defaultHomeLayout();
  }
  return { layouts };
}

export function resolveHomeLayout(
  home: StudioHomeConfig | null | undefined,
  layoutId: string = DEFAULT_HOME_LAYOUT_ID,
): HomeWidgetLayout {
  const cfg = home ?? emptyHomeConfig();
  return cfg.layouts[layoutId] ?? defaultHomeLayout();
}

/** Axis-aligned overlap (exclusive right/bottom). */
export function widgetsOverlap(
  a: Pick<HomeWidgetInstance, "col" | "row" | "w" | "h">,
  b: Pick<HomeWidgetInstance, "col" | "row" | "w" | "h">,
): boolean {
  return (
    a.col < b.col + b.w &&
    a.col + a.w > b.col &&
    a.row < b.row + b.h &&
    a.row + a.h > b.row
  );
}

export function layoutHasCollision(
  widgets: readonly HomeWidgetInstance[],
  cols: number = HOME_GRID_COLS_DESKTOP,
): boolean {
  for (let i = 0; i < widgets.length; i++) {
    const a = widgets[i]!;
    if (a.col < 0 || a.row < 0 || a.col + a.w > cols) return true;
    for (let j = i + 1; j < widgets.length; j++) {
      if (widgetsOverlap(a, widgets[j]!)) return true;
    }
  }
  return false;
}

export type HomeLayoutPatchOp =
  | {
      op: "add";
      widgetId: string;
      col?: number;
      row?: number;
      w?: number;
      h?: number;
      props?: Record<string, unknown>;
      instanceId?: string;
    }
  | {
      op: "remove";
      instanceId: string;
    }
  | {
      op: "move";
      instanceId: string;
      col: number;
      row: number;
    }
  | {
      op: "resize";
      instanceId: string;
      w: number;
      h: number;
    }
  | {
      op: "setProps";
      instanceId: string;
      props: Record<string, unknown>;
    };

function newInstanceId(): string {
  return `w-${Math.random().toString(36).slice(2, 10)}`;
}

/** First free cell for size (w×h) scanning row-major. */
export function findFreeCell(
  widgets: readonly HomeWidgetInstance[],
  w: number,
  h: number,
  cols: number = HOME_GRID_COLS_DESKTOP,
  maxRows = 32,
): { col: number; row: number } | null {
  for (let row = 0; row < maxRows; row++) {
    for (let col = 0; col <= cols - w; col++) {
      const candidate = { col, row, w, h };
      if (widgets.every((x) => !widgetsOverlap(candidate, x))) {
        return { col, row };
      }
    }
  }
  return null;
}

export function applyHomeLayoutPatch(
  layout: HomeWidgetLayout,
  ops: readonly HomeLayoutPatchOp[],
  cols: number = HOME_GRID_COLS_DESKTOP,
): { ok: true; layout: HomeWidgetLayout } | { ok: false; error: string } {
  let widgets = layout.widgets.map((w) => ({ ...w, props: w.props ? { ...w.props } : undefined }));

  for (const op of ops) {
    if (op.op === "remove") {
      widgets = widgets.filter((w) => w.instanceId !== op.instanceId);
      continue;
    }
    if (op.op === "add") {
      if (!isKnownHomeWidgetId(op.widgetId)) {
        return { ok: false, error: `Unknown widgetId: ${op.widgetId}` };
      }
      const def = getHomeWidgetDef(op.widgetId)!;
      const w = op.w ?? def.defaultSize.w;
      const h = op.h ?? def.defaultSize.h;
      if (!sizeAllowedForWidget(op.widgetId, w, h)) {
        return { ok: false, error: `Size ${w}×${h} not allowed for ${op.widgetId}` };
      }
      let col = op.col;
      let row = op.row;
      if (col == null || row == null) {
        const free = findFreeCell(widgets, w, h, cols);
        if (!free) return { ok: false, error: "No free cell for new widget" };
        col = free.col;
        row = free.row;
      }
      const instanceId =
        typeof op.instanceId === "string" && op.instanceId.trim()
          ? op.instanceId.trim().slice(0, 64)
          : newInstanceId();
      if (widgets.some((x) => x.instanceId === instanceId)) {
        return { ok: false, error: `Duplicate instanceId: ${instanceId}` };
      }
      const next: HomeWidgetInstance = {
        instanceId,
        widgetId: op.widgetId,
        col,
        row,
        w,
        h,
        ...(op.props ? { props: { ...op.props } } : {}),
      };
      if (col + w > cols || col < 0 || row < 0) {
        return { ok: false, error: "Widget out of bounds" };
      }
      if (widgets.some((x) => widgetsOverlap(next, x))) {
        return { ok: false, error: "Widget overlaps existing tile" };
      }
      widgets.push(next);
      continue;
    }
    const idx = widgets.findIndex((x) => x.instanceId === op.instanceId);
    if (idx < 0) {
      return { ok: false, error: `Unknown instanceId: ${op.instanceId}` };
    }
    const cur = widgets[idx]!;
    if (op.op === "move") {
      const next = { ...cur, col: op.col, row: op.row };
      if (next.col < 0 || next.row < 0 || next.col + next.w > cols) {
        return { ok: false, error: "Move out of bounds" };
      }
      const others = widgets.filter((_, i) => i !== idx);
      if (others.some((x) => widgetsOverlap(next, x))) {
        return { ok: false, error: "Move overlaps another tile" };
      }
      widgets[idx] = next;
      continue;
    }
    if (op.op === "resize") {
      if (!sizeAllowedForWidget(cur.widgetId, op.w, op.h)) {
        return {
          ok: false,
          error: `Size ${op.w}×${op.h} not allowed for ${cur.widgetId}`,
        };
      }
      const next = { ...cur, w: op.w, h: op.h };
      if (next.col + next.w > cols) {
        return { ok: false, error: "Resize out of bounds" };
      }
      const others = widgets.filter((_, i) => i !== idx);
      if (others.some((x) => widgetsOverlap(next, x))) {
        return { ok: false, error: "Resize overlaps another tile" };
      }
      widgets[idx] = next;
      continue;
    }
    if (op.op === "setProps") {
      widgets[idx] = { ...cur, props: { ...op.props } };
    }
  }

  return { ok: true, layout: { widgets } };
}

/** Compact layout for narrow panes — clamp col+w into `cols`. */
export function projectLayoutToCols(
  layout: HomeWidgetLayout,
  cols: number,
): HomeWidgetLayout {
  if (cols >= HOME_GRID_COLS_DESKTOP) return layout;
  const widgets: HomeWidgetInstance[] = [];
  let rowCursor = 0;
  for (const w of [...layout.widgets].sort(
    (a, b) => a.row - b.row || a.col - b.col,
  )) {
    const spanW = Math.min(w.w, cols);
    const spanH = w.h;
    const free = findFreeCell(widgets, spanW, spanH, cols, 64);
    if (free) {
      widgets.push({
        ...w,
        col: free.col,
        row: free.row,
        w: spanW,
        h: spanH,
      });
      rowCursor = Math.max(rowCursor, free.row + spanH);
    } else {
      widgets.push({
        ...w,
        col: 0,
        row: rowCursor,
        w: spanW,
        h: spanH,
      });
      rowCursor += spanH;
    }
  }
  return { widgets };
}
