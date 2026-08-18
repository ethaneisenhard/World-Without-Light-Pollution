import { describe, expect, it } from "vitest";
import {
  cycleHomeWidgetSize,
  homeGridCellFromPoint,
  homeGridEndCellFromPoint,
  snapHomeWidgetSizeToSpan,
} from "./home-widgets-edit-pure.js";

describe("home-widgets-edit-pure", () => {
  const rect = { left: 0, top: 0, width: 400, height: 400 };

  it("maps pointer to cell for drag", () => {
    // 4 cols, gap 12 → cellW = (400 - 36) / 4 = 91
    const cell = homeGridCellFromPoint(rect, 100, 50, { cols: 4, spanW: 2 });
    expect(cell).toEqual({ col: 0, row: 0 });
    const mid = homeGridCellFromPoint(rect, 220, 120, { cols: 4, spanW: 1 });
    expect(mid?.col).toBeGreaterThanOrEqual(1);
    expect(mid?.row).toBeGreaterThanOrEqual(1);
  });

  it("maps end cell for corner resize", () => {
    const end = homeGridEndCellFromPoint(rect, 390, 200, { cols: 4 });
    expect(end?.col).toBe(3);
    expect(end?.row).toBeGreaterThanOrEqual(1);
  });

  it("snaps resize span to allowed sizes", () => {
    expect(snapHomeWidgetSizeToSpan("greeting", 0, 0, 3, 0)).toEqual({
      w: 4,
      h: 1,
    });
    // 3×3 span → clamp into launcher bounds (max 2×2)
    expect(snapHomeWidgetSizeToSpan("app-launcher", 0, 0, 2, 2)).toEqual({
      w: 2,
      h: 2,
    });
    expect(cycleHomeWidgetSize("greeting", 2, 1)).toEqual({ w: 3, h: 1 });
  });
});
