import { describe, expect, it } from "vitest";
import {
  INNGEST_DURABLE_RUN_EVENT,
  inngestSubstrateReadiness,
  inngestUnconfiguredHandoff,
  isInngestConfigured,
} from "./durable-inngest-pure.js";

describe("durable-inngest-pure", () => {
  it("configured via DEV or EVENT_KEY", () => {
    expect(isInngestConfigured(() => undefined)).toBe(false);
    expect(isInngestConfigured((k) => (k === "INNGEST_DEV" ? "1" : undefined))).toBe(
      true,
    );
    expect(
      isInngestConfigured((k) => (k === "INNGEST_EVENT_KEY" ? "ek_x" : undefined)),
    ).toBe(true);
    expect(inngestSubstrateReadiness((k) => (k === "INNGEST_DEV" ? "1" : undefined))).toBe(
      "ready",
    );
  });

  it("handoff mentions env knobs", () => {
    const text = inngestUnconfiguredHandoff();
    expect(text).toContain("INNGEST_DEV");
    expect(text).toContain("INNGEST_EVENT_KEY");
    expect(INNGEST_DURABLE_RUN_EVENT).toBe("studio/durable.run.requested");
  });
});
