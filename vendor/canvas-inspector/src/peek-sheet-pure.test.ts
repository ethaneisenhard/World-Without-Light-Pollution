import { describe, expect, it } from "vitest";
import {
  INSPECT_PEEK_MAX_PX,
  inspectPeekHeightCss,
  inspectUsesPeekSheet,
} from "./peek-sheet-pure.js";

describe("inspectUsesPeekSheet", () => {
  it("true at phone widths", () => {
    expect(inspectUsesPeekSheet(390)).toBe(true);
    expect(inspectUsesPeekSheet(INSPECT_PEEK_MAX_PX)).toBe(true);
  });

  it("false on desktop", () => {
    expect(inspectUsesPeekSheet(INSPECT_PEEK_MAX_PX + 1)).toBe(false);
    expect(inspectUsesPeekSheet(1280)).toBe(false);
  });
});

describe("inspectPeekHeightCss", () => {
  it("emits max(minPx, vh)", () => {
    expect(inspectPeekHeightCss(0.42, 220)).toBe("max(220px, 42vh)");
  });

  it("clamps snap", () => {
    expect(inspectPeekHeightCss(0.1, 200)).toBe("max(200px, 28vh)");
    expect(inspectPeekHeightCss(0.99, 200)).toBe("max(200px, 85vh)");
  });
});
