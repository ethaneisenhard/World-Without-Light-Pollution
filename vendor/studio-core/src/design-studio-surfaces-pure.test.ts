import { describe, expect, it } from "vitest";
import {
  DESIGN_STUDIO_SURFACE_IDS,
  parseDesignStudioSurface,
  parseDesignStudioSurfaceInput,
} from "./design-studio-surfaces-pure.js";

describe("design-studio-surfaces-pure", () => {
  it("parses known surfaces and defaults unknown to home", () => {
    expect(parseDesignStudioSurface("system")).toBe("system");
    expect(parseDesignStudioSurface("nope")).toBe("home");
    expect(DESIGN_STUDIO_SURFACE_IDS).toEqual([
      "home",
      "system",
      "components",
      "chrome",
    ]);
  });

  it("strict MCP parse rejects unknown ds", () => {
    expect(parseDesignStudioSurfaceInput("chrome")).toEqual({
      ok: true,
      value: "chrome",
    });
    expect(parseDesignStudioSurfaceInput("")).toEqual({
      ok: true,
      value: "home",
    });
    expect(parseDesignStudioSurfaceInput("nope").ok).toBe(false);
  });
});
