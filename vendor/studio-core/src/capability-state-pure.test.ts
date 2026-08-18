import { describe, expect, it } from "vitest";
import {
  isHarnessCapabilityHealthy,
  mergeDesiredCapabilities,
  resolveCapabilityState,
  resolveCapabilityStates,
} from "./capability-state-pure.js";

describe("capability-state-pure", () => {
  it("healthy only when desired + installed + authOk", () => {
    const unhealthy = resolveCapabilityState(
      "harness:cursor",
      ["harness:cursor"],
      { installed: false, authOk: false, detail: "bin missing" },
    );
    expect(unhealthy?.healthy).toBe(false);
    expect(unhealthy?.desired).toBe(true);

    const healthy = resolveCapabilityState(
      "harness:anthropic",
      ["harness:anthropic"],
      { installed: true, authOk: true },
    );
    expect(healthy?.healthy).toBe(true);
  });

  it("not healthy when desired false even if probe green", () => {
    const state = resolveCapabilityState(
      "harness:anthropic",
      [],
      { installed: true, authOk: true },
    );
    expect(state?.desired).toBe(false);
    expect(state?.healthy).toBe(false);
  });

  it("blocks on unhealthy dependsOn", () => {
    const states = resolveCapabilityStates(
      ["integration:n8n", "mcp:n8n-local"],
      {
        "integration:n8n": { installed: true, authOk: true },
        "mcp:n8n-local": { installed: true, authOk: false },
      },
    );
    const integ = states.find((s) => s.id === "integration:n8n");
    expect(integ?.healthy).toBe(false);
    expect(integ?.blockedBy).toContain("mcp:n8n-local");
  });

  it("isHarnessCapabilityHealthy reads harness: prefix", () => {
    const states = resolveCapabilityStates(["harness:cursor"], {
      "harness:cursor": { installed: false, authOk: false },
    });
    expect(isHarnessCapabilityHealthy("cursor", states)).toBe(false);
  });

  it("mergeDesiredCapabilities skips unknown ids", () => {
    expect(
      mergeDesiredCapabilities(["harness:anthropic"], [
        "harness:cursor",
        "nope:x",
      ]),
    ).toEqual(["harness:anthropic", "harness:cursor"]);
  });
});
