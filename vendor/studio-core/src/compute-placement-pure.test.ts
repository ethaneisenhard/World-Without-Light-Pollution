import { describe, expect, it } from "vitest";
import {
  DEFAULT_CREATE_COMPUTE_PLACEMENT,
  DEFAULT_LINK_COMPUTE_PLACEMENT,
  computePlacementLabel,
  normalizeProjectCompute,
  parseComputePlacement,
  resolveComputePlacement,
  resolveDefaultComputePlacement,
  withComputePlacement,
} from "./compute-placement-pure.js";

describe("compute-placement-pure", () => {
  it("defaults create hosted and link local", () => {
    expect(DEFAULT_CREATE_COMPUTE_PLACEMENT).toBe("hosted");
    expect(DEFAULT_LINK_COMPUTE_PLACEMENT).toBe("local");
  });

  it("parses and normalizes compute block", () => {
    expect(parseComputePlacement("byo")).toBe("byo");
    expect(parseComputePlacement("nope", "hosted")).toBe("hosted");
    expect(
      normalizeProjectCompute({
        placement: "local",
        runtimeHostId: " laptop ",
        root: "/Users/me/app",
      }),
    ).toEqual({
      placement: "local",
      runtimeHostId: "laptop",
      root: "/Users/me/app",
    });
  });

  it("stamps project.json via withComputePlacement", () => {
    const json = withComputePlacement(
      { id: "demo", mode: "mapped" },
      "hosted",
    );
    expect(json.compute.placement).toBe("hosted");
    expect(resolveComputePlacement(json)).toBe("hosted");
  });

  it("resolves studio/pack defaults", () => {
    expect(resolveDefaultComputePlacement()).toBe("hosted");
    expect(
      resolveDefaultComputePlacement({ packDefault: "local" }),
    ).toBe("local");
    expect(
      resolveDefaultComputePlacement({
        studioDefault: "byo",
        packDefault: "local",
      }),
    ).toBe("byo");
  });

  it("labels placements for Settings copy", () => {
    expect(computePlacementLabel("hosted").label).toMatch(/Cloud/);
    expect(computePlacementLabel("local").summary).toMatch(/Vault stays/);
  });
});
