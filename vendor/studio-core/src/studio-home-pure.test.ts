import { describe, expect, it } from "vitest";
import {
  resolveStudioHomePath,
  STUDIO_HOME_DIRNAME_LEGACY,
  STUDIO_HOME_DIRNAME_PREFERRED,
} from "./studio-home-pure.js";

describe("resolveStudioHomePath", () => {
  it("env override wins", () => {
    expect(
      resolveStudioHomePath({
        envOverride: "/data/glassbox-studio",
        homeDir: "/Users/x",
        preferredExists: true,
        legacyExists: true,
      }),
    ).toBe("/data/glassbox-studio");
  });

  it("prefers .glassbox-studio when present", () => {
    expect(
      resolveStudioHomePath({
        homeDir: "/Users/x",
        preferredExists: true,
        legacyExists: true,
      }),
    ).toBe(`/Users/x/${STUDIO_HOME_DIRNAME_PREFERRED}`);
  });

  it("falls back to .agent-studio when preferred missing", () => {
    expect(
      resolveStudioHomePath({
        homeDir: "/Users/x",
        preferredExists: false,
        legacyExists: true,
      }),
    ).toBe(`/Users/x/${STUDIO_HOME_DIRNAME_LEGACY}`);
  });

  it("new install uses preferred dirname", () => {
    expect(
      resolveStudioHomePath({
        homeDir: "/Users/x",
        preferredExists: false,
        legacyExists: false,
      }),
    ).toBe(`/Users/x/${STUDIO_HOME_DIRNAME_PREFERRED}`);
  });
});
