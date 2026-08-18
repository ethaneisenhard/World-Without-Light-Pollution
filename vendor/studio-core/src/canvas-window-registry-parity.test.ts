/**
 * Drift oracle — registry ids must stay covered by URL flags, View menu
 * policy, colors, and (via re-export shape) window kind record.
 */
import { describe, expect, it } from "vitest";
import {
  assertCanvasWindowRegistryInvariants,
  CANVAS_WINDOW_REGISTRY,
  canvasUrlFlagKeys,
  canvasWindowIds,
  studioWindowKindsRecord,
} from "./canvas-window-registry-pure.js";
import { viewMenuItemIds } from "./view-menu-pure.js";
import {
  DEFAULT_WINDOW_KIND_HUES,
  STUDIO_WINDOW_COLOR_KINDS,
} from "./window-colors-pure.js";

describe("canvas-window-registry parity", () => {
  it("registry invariants hold", () => {
    expect(() => assertCanvasWindowRegistryInvariants()).not.toThrow();
  });

  it("URL flags === registry urlFlag set", () => {
    expect([...canvasUrlFlagKeys()].sort()).toEqual(
      [...CANVAS_WINDOW_REGISTRY.map((d) => d.urlFlag)].sort(),
    );
  });

  it("View menu ids ⊆ registry; every viewGroup entry is in menu", () => {
    const menu = new Set(viewMenuItemIds());
    const registry = new Set(canvasWindowIds());
    for (const id of menu) {
      expect(registry.has(id)).toBe(true);
    }
    for (const d of CANVAS_WINDOW_REGISTRY) {
      if (d.viewGroup == null) {
        expect(menu.has(d.id as (typeof canvasWindowIds)[number])).toBe(false);
      } else {
        expect(menu.has(d.id as never)).toBe(true);
      }
    }
  });

  it("studioWindowKindsRecord keys === registry ids", () => {
    expect(Object.keys(studioWindowKindsRecord()).sort()).toEqual(
      [...canvasWindowIds()].sort(),
    );
  });

  it("window color kinds cover every registry id", () => {
    const colorSet = new Set(STUDIO_WINDOW_COLOR_KINDS);
    for (const id of canvasWindowIds()) {
      expect(colorSet.has(id as (typeof STUDIO_WINDOW_COLOR_KINDS)[number])).toBe(
        true,
      );
      expect(DEFAULT_WINDOW_KIND_HUES[id as keyof typeof DEFAULT_WINDOW_KIND_HUES]).toBeTruthy();
    }
  });
});
