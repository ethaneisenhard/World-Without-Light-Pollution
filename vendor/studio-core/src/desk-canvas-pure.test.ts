import { describe, expect, it } from "vitest";
import {
  DEFAULT_DESK_CANVAS_BG,
  deskCanvasCssVars,
  parseDeskCanvasConfig,
} from "./desk-canvas-pure.js";

describe("desk-canvas-pure", () => {
  it("parses solid + image + dots", () => {
    expect(parseDeskCanvasConfig({ kind: "solid", color: "#1a1512" })).toEqual({
      kind: "solid",
      color: "#1a1512",
    });
    expect(
      parseDeskCanvasConfig({
        kind: "image",
        imageUrl: "/assets/desk.png",
      }),
    ).toEqual({ kind: "image", imageUrl: "/assets/desk.png" });
    expect(parseDeskCanvasConfig({ kind: "dots" })?.kind).toBe("dots");
  });

  it("rejects junk", () => {
    expect(parseDeskCanvasConfig({ kind: "neon" })).toBeUndefined();
    expect(parseDeskCanvasConfig({ color: "red" })).toBeUndefined();
    expect(parseDeskCanvasConfig(null)).toBeUndefined();
  });

  it("default solid uses mix token; image sets cover url", () => {
    const solid = deskCanvasCssVars(undefined);
    expect(solid["--as-color-bg-desk"]).toBe(DEFAULT_DESK_CANVAS_BG);
    expect(solid["--as-desk-canvas-image"]).toBe("none");

    const img = deskCanvasCssVars({
      kind: "image",
      imageUrl: 'foo"bar.png',
    });
    expect(img["--as-desk-canvas-image"]).toContain('url("foo\\"bar.png")');
    expect(img["--as-desk-canvas-size"]).toBe("cover");
  });

  it("dots kind paints repeating grid", () => {
    const dots = deskCanvasCssVars({ kind: "dots" });
    expect(dots["--as-desk-canvas-image"]).toContain("radial-gradient");
    expect(dots["--as-desk-canvas-size"]).toBe("16px 16px");
    expect(dots["--as-desk-canvas-repeat"]).toBe("repeat");
  });
});
