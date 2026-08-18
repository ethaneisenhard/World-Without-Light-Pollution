/**
 * Thin Home layout API for MCP + chat — same ops as studio.home.patch.
 * Agents / UI call these builders; orchestrator applies via applyHomeLayoutPatch.
 */

import type { HomeLayoutPatchOp, HomeWidgetInstance } from "./home-widgets-pure.js";
import { listHomeWidgetDefs } from "./home-widget-registry-pure.js";

export function homeLayoutMoveOp(
  instanceId: string,
  col: number,
  row: number,
): HomeLayoutPatchOp {
  return { op: "move", instanceId, col, row };
}

export function homeLayoutResizeOp(
  instanceId: string,
  w: number,
  h: number,
): HomeLayoutPatchOp {
  return { op: "resize", instanceId, w, h };
}

export function homeLayoutRemoveOp(instanceId: string): HomeLayoutPatchOp {
  return { op: "remove", instanceId };
}

export function homeLayoutAddOp(
  widgetId: string,
  opts?: {
    col?: number;
    row?: number;
    w?: number;
    h?: number;
    props?: Record<string, unknown>;
    instanceId?: string;
  },
): HomeLayoutPatchOp {
  return {
    op: "add",
    widgetId,
    ...(opts?.col != null ? { col: opts.col } : {}),
    ...(opts?.row != null ? { row: opts.row } : {}),
    ...(opts?.w != null ? { w: opts.w } : {}),
    ...(opts?.h != null ? { h: opts.h } : {}),
    ...(opts?.props ? { props: opts.props } : {}),
    ...(opts?.instanceId ? { instanceId: opts.instanceId } : {}),
  };
}

export function homeLayoutSetPropsOp(
  instanceId: string,
  props: Record<string, unknown>,
): HomeLayoutPatchOp {
  return { op: "setProps", instanceId, props };
}

/** One-line summary for chat / tool results. */
export function summarizeHomeLayoutForChat(
  widgets: readonly HomeWidgetInstance[],
): string {
  if (widgets.length === 0) return "Home layout: empty";
  const parts = widgets.map(
    (w) => `${w.widgetId}@${w.col},${w.row}(${w.w}x${w.h})`,
  );
  return `Home layout (${widgets.length}): ${parts.join("; ")}`;
}

/** Catalog blurb for agents choosing widgetId. */
export function homeWidgetCatalogForChat(): string {
  return listHomeWidgetDefs()
    .map(
      (d) =>
        `${d.id} [${d.kind}] sizes=${d.sizes.map((s) => `${s.w}x${s.h}`).join(",")}`,
    )
    .join("\n");
}
