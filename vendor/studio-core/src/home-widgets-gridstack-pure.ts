/**
 * Home widgets ↔ GridStack node adapter (pure).
 * Maps our layout SoT ↔ GridStack widget fields. No physics / packing policy.
 */

import {
  clampWidgetSize,
  homeWidgetSizeBounds,
  homeWidgetSizeToContent,
} from "./home-widget-registry-pure.js";
import type { HomeWidgetInstance } from "./home-widgets-pure.js";

/** GridStack widget fields we persist (subset). */
export type HomeGridStackNode = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW: number;
  minH: number;
  maxW: number;
  maxH: number;
  /** GridStack sizeToContent — peeks use maxH cap. */
  sizeToContent?: boolean | number;
};

export function homeWidgetSizeLimits(widgetId: string): {
  minW: number;
  minH: number;
  maxW: number;
  maxH: number;
} {
  return (
    homeWidgetSizeBounds(widgetId) ?? {
      minW: 1,
      minH: 1,
      maxW: 4,
      maxH: 8,
    }
  );
}

export function homeWidgetToGridStackNode(
  widget: HomeWidgetInstance,
): HomeGridStackNode {
  const limits = homeWidgetSizeLimits(widget.widgetId);
  const sizeToContent = homeWidgetSizeToContent(widget.widgetId)
    ? limits.maxH
    : false;
  return {
    id: widget.instanceId,
    x: widget.col,
    y: widget.row,
    w: widget.w,
    h: widget.h,
    ...limits,
    sizeToContent,
  };
}

export function homeWidgetsToGridStackNodes(
  widgets: readonly HomeWidgetInstance[],
): HomeGridStackNode[] {
  return widgets.map((w) => homeWidgetToGridStackNode(w));
}

/**
 * Merge GridStack save() nodes back onto prior instances (keeps widgetId/props).
 */
export function gridStackNodesToHomeWidgets(
  nodes: readonly {
    id?: string | number;
    x?: number;
    y?: number;
    w?: number;
    h?: number;
  }[],
  previous: readonly HomeWidgetInstance[],
): HomeWidgetInstance[] {
  const byId = new Map(previous.map((w) => [w.instanceId, w]));
  const out: HomeWidgetInstance[] = [];
  for (const n of nodes) {
    const id = n.id != null ? String(n.id) : "";
    const prev = byId.get(id);
    if (!prev) continue;
    const rawW = typeof n.w === "number" ? n.w : prev.w;
    const rawH = typeof n.h === "number" ? n.h : prev.h;
    const { w, h } = clampWidgetSize(prev.widgetId, rawW, rawH);
    out.push({
      ...prev,
      col: typeof n.x === "number" ? n.x : prev.col,
      row: typeof n.y === "number" ? n.y : prev.row,
      w,
      h,
      ...(prev.props ? { props: { ...prev.props } } : {}),
    });
  }
  return out;
}

/** Sync key for host load vs machine (ids + geometry). */
export function homeGridStackSyncKey(
  widgets: readonly HomeWidgetInstance[],
): string {
  return widgets
    .map((w) => `${w.instanceId}:${w.col},${w.row},${w.w}x${w.h}`)
    .join("|");
}
