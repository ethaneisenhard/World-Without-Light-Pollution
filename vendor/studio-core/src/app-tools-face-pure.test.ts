import { describe, expect, it } from "vitest";
import {
  APP_TOOLS_FACE,
  appToolsFaceDebtIds,
  catalogHitsForPrefixes,
} from "./app-tools-face-pure.js";
import { canvasWindowIds } from "./canvas-window-registry-pure.js";

describe("APP_TOOLS_FACE", () => {
  it("covers every canvas window id", () => {
    expect(Object.keys(APP_TOOLS_FACE).sort()).toEqual(
      [...canvasWindowIds()].sort(),
    );
  });

  it("non-debt windows have at least one catalog tool", () => {
    for (const id of canvasWindowIds()) {
      const face = APP_TOOLS_FACE[id];
      if (face.debt === "open-only") {
        expect(face.prefixes, id).toEqual([]);
        continue;
      }
      const hits = catalogHitsForPrefixes(face.prefixes);
      expect(hits.length, `${id} prefixes ${face.prefixes.join(",")}`).toBeGreaterThan(
        0,
      );
    }
  });

  it("open-only debt is empty (Design + Ops have catalog prefixes)", () => {
    expect([...appToolsFaceDebtIds()]).toEqual([]);
  });
});
