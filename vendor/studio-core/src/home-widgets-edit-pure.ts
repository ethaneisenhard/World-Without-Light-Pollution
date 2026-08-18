/**
 * Home widget edit geometry — cell hit-test + size snap.
 * Pure — no DOM. Client pointer sessions call these with measured rects.
 */

import {
  HOME_GRID_COLS_DESKTOP,
  getHomeWidgetDef,
  nextHomeWidgetSize,
  sizeAllowedForWidget,
  type HomeWidgetSize,
} from "./home-widget-registry-pure.js";

/** Must match GridStack `cellHeight` in home-widgets-gridstack-host. */
export const HOME_GRID_CELL_HEIGHT_PX = 72;
export const HOME_GRID_GAP_PX = 12;

export type HomeGridRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Map pointer → grid cell (top-left of span). */
export function homeGridCellFromPoint(
  rect: HomeGridRect,
  clientX: number,
  clientY: number,
  opts: {
    cols: number;
    spanW?: number;
    cellH?: number;
    gap?: number;
  },
): { col: number; row: number } | null {
  if (rect.width <= 0) return null;
  const cols = opts.cols;
  const spanW = opts.spanW ?? 1;
  const gap = opts.gap ?? HOME_GRID_GAP_PX;
  const cellH = opts.cellH ?? HOME_GRID_CELL_HEIGHT_PX;
  const cellW = (rect.width - gap * (cols - 1)) / cols;
  if (cellW <= 0) return null;
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const col = Math.max(
    0,
    Math.min(cols - spanW, Math.floor(x / (cellW + gap))),
  );
  const row = Math.max(0, Math.floor(y / (cellH + gap)));
  return { col, row };
}

/** Inclusive bottom-right cell under the pointer (for corner resize). */
export function homeGridEndCellFromPoint(
  rect: HomeGridRect,
  clientX: number,
  clientY: number,
  opts: {
    cols: number;
    cellH?: number;
    gap?: number;
  },
): { col: number; row: number } | null {
  if (rect.width <= 0) return null;
  const cols = opts.cols;
  const gap = opts.gap ?? HOME_GRID_GAP_PX;
  const cellH = opts.cellH ?? HOME_GRID_CELL_HEIGHT_PX;
  const cellW = (rect.width - gap * (cols - 1)) / cols;
  if (cellW <= 0) return null;
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const col = Math.max(0, Math.min(cols - 1, Math.floor(x / (cellW + gap))));
  const row = Math.max(0, Math.floor(y / (cellH + gap)));
  return { col, row };
}

/**
 * Nearest allowed size for a requested span (from origin → end cell).
 * Prefers exact match; else smallest allowed size that covers the span;
 * else closest by area delta.
 */
export function snapHomeWidgetSizeToSpan(
  widgetId: string,
  originCol: number,
  originRow: number,
  endCol: number,
  endRow: number,
  cols: number = HOME_GRID_COLS_DESKTOP,
): HomeWidgetSize | null {
  const def = getHomeWidgetDef(widgetId);
  if (!def) return null;
  const wantW = Math.max(1, endCol - originCol + 1);
  const wantH = Math.max(1, endRow - originRow + 1);
  const maxW = Math.max(1, cols - originCol);
  const clampedW = Math.min(wantW, maxW);
  const clampedH = wantH;

  if (sizeAllowedForWidget(widgetId, clampedW, clampedH)) {
    return { w: clampedW, h: clampedH };
  }

  let best: HomeWidgetSize | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const s of def.sizes) {
    if (s.w > maxW) continue;
    const coverPenalty =
      s.w < clampedW || s.h < clampedH ? 1000 : 0;
    const areaDelta = Math.abs(s.w * s.h - clampedW * clampedH);
    const dimDelta = Math.abs(s.w - clampedW) + Math.abs(s.h - clampedH);
    const score = coverPenalty + areaDelta * 10 + dimDelta;
    if (score < bestScore) {
      bestScore = score;
      best = { w: s.w, h: s.h };
    }
  }
  return best;
}

/** Cycle helper re-export seam for hosts / MCP docs. */
export function cycleHomeWidgetSize(
  widgetId: string,
  w: number,
  h: number,
): HomeWidgetSize | null {
  return nextHomeWidgetSize(widgetId, w, h);
}
