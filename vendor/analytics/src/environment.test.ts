import { describe, expect, it } from "vitest";
import { resolveAnalyticsEnvironment, resolveWorkspaceId } from "./environment.js";

describe("resolveAnalyticsEnvironment", () => {
  it("maps local / preview / prod", () => {
    expect(resolveAnalyticsEnvironment({ isLocalDev: true })).toBe("dev");
    expect(resolveAnalyticsEnvironment({ workspaceKind: "preview" })).toBe("staging");
    expect(resolveAnalyticsEnvironment({})).toBe("production");
  });
});

describe("resolveWorkspaceId", () => {
  it("uses preview id when present", () => {
    expect(resolveWorkspaceId({ workspaceKind: "preview", workspaceId: "pr-9" })).toBe("pr-9");
    expect(resolveWorkspaceId({})).toBe("production");
  });
});
