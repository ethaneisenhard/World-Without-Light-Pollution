import { describe, expect, it } from "vitest";
import {
  DEFAULT_HARNESS_API,
  DEFAULT_HARNESS_HOST,
  isOptionalCloudPeerHarness,
  isShippedDefaultHarnessId,
  OPTIONAL_CLOUD_PEER_HARNESS,
} from "./default-harness-policy-pure.js";
import { defaultStudioConfig } from "./studio-config-pure.js";

describe("default harness policy", () => {
  it("shipped config default is cursor, not kody", () => {
    const cfg = defaultStudioConfig();
    expect(cfg.ai.defaultHarness).toBe(DEFAULT_HARNESS_HOST);
    expect(cfg.ai.defaultHarness).not.toBe(OPTIONAL_CLOUD_PEER_HARNESS);
    expect(isShippedDefaultHarnessId("cursor")).toBe(true);
    expect(isShippedDefaultHarnessId("anthropic")).toBe(true);
    expect(isShippedDefaultHarnessId("kody")).toBe(false);
    expect(isOptionalCloudPeerHarness("kody")).toBe(true);
    expect(DEFAULT_HARNESS_API).toBe("anthropic");
  });
});
