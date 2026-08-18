import { describe, expect, it } from "vitest";
import {
  effectiveHarnessIdAfterPrepare,
  isForbiddenHarnessHijack,
  SHELL_FIDELITY_PEER_IDS,
  visionPreparePreservesHarness,
} from "./shell-harness-fidelity-pure.js";

describe("shell harness fidelity (ADR 0008 — no silent hijack)", () => {
  it("preserves cursor / hermes / grok / anthropic through prepare (no rewrite)", () => {
    for (const id of SHELL_FIDELITY_PEER_IDS) {
      expect(effectiveHarnessIdAfterPrepare(id)).toBe(id);
      expect(isForbiddenHarnessHijack(id, id)).toBe(false);
    }
  });

  it("allows only legacy studio → anthropic alias (not a vision hijack)", () => {
    expect(effectiveHarnessIdAfterPrepare("studio")).toBe("anthropic");
    expect(isForbiddenHarnessHijack("studio", "anthropic")).toBe(false);
  });

  it("flags silent image→anthropic hijack as forbidden for every peer", () => {
    for (const id of ["cursor", "hermes", "grok", "kody"] as const) {
      expect(isForbiddenHarnessHijack(id, "anthropic")).toBe(true);
      expect(isForbiddenHarnessHijack(id, "studio")).toBe(true);
    }
  });

  it("kody + images fails on unsupported vision — stays on kody (no anthropic swap)", () => {
    const r = visionPreparePreservesHarness("kody", true);
    expect(r.harnessId).toBe("kody");
    expect(r.mustFail).toBe(true);
    expect(r.mode).toBe("unsupported");
  });

  it("cursor / hermes / grok + images stay on picked peer (mcp-vision, no fail-for-hijack)", () => {
    for (const id of ["cursor", "hermes", "grok"] as const) {
      const r = visionPreparePreservesHarness(id, true);
      expect(r.harnessId).toBe(id);
      expect(r.mustFail).toBe(false);
      expect(r.mode).toBe("mcp-vision");
    }
  });

  it("anthropic + images stays native on anthropic", () => {
    const r = visionPreparePreservesHarness("anthropic", true);
    expect(r.harnessId).toBe("anthropic");
    expect(r.mustFail).toBe(false);
    expect(r.mode).toBe("native");
  });
});
