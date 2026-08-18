import { describe, expect, it } from "vitest";
import {
  defaultDurableConfig,
  parseDurableConfig,
  resolveDurableSubstrateForIntent,
  resolveRunnableDurableSubstrate,
  substrateHasCapability,
} from "./durable-runtime-registry-pure.js";

describe("durable-runtime-registry-pure", () => {
  it("defaults match ADR roles", () => {
    const c = defaultDurableConfig();
    expect(c.substrate).toBe("inngest");
    expect(c.fallbacks.swarm).toBe("agent-room");
    expect(c.fallbacks.dag).toBe("n8n");
    expect(c.fallbacks.cron).toBe("cf-workflows");
  });

  it("routes intent kinds via config", () => {
    const c = defaultDurableConfig();
    expect(resolveDurableSubstrateForIntent("background", c)).toBe("inngest");
    expect(resolveDurableSubstrateForIntent("swarm", c)).toBe("agent-room");
    expect(resolveDurableSubstrateForIntent("dag", c)).toBe("n8n");
    expect(resolveDurableSubstrateForIntent("cron", c)).toBe("cf-workflows");
  });

  it("degrades planned substrates to fake", () => {
    const r = resolveRunnableDurableSubstrate("inngest", {
      envGet: () => undefined,
    });
    expect(r.substrate).toBe("fake");
    expect(r.degraded).toBe(true);
    expect(resolveRunnableDurableSubstrate("fake").degraded).toBe(false);
  });

  it("marks inngest ready when INNGEST_DEV=1", () => {
    const r = resolveRunnableDurableSubstrate("inngest", {
      envGet: (k) => (k === "INNGEST_DEV" ? "1" : undefined),
    });
    expect(r.substrate).toBe("inngest");
    expect(r.degraded).toBe(false);
  });

  it("agent-room substrate is ready without vendor env", () => {
    const r = resolveRunnableDurableSubstrate("agent-room", {
      envGet: () => undefined,
    });
    expect(r.substrate).toBe("agent-room");
    expect(r.degraded).toBe(false);
  });

  it("failClosed keeps desired id when planned", () => {
    const r = resolveRunnableDurableSubstrate("inngest", {
      failClosed: true,
      envGet: () => undefined,
    });
    expect(r.substrate).toBe("inngest");
    expect(r.degraded).toBe(true);
  });

  it("parses partial durable config", () => {
    const c = parseDurableConfig({
      substrate: "fake",
      fallbacks: { swarm: "agent-room" },
    });
    expect(c.substrate).toBe("fake");
    expect(c.fallbacks.dag).toBe("n8n");
  });

  it("reports capabilities", () => {
    expect(substrateHasCapability("inngest", "cron")).toBe(true);
    expect(substrateHasCapability("n8n", "dag")).toBe(true);
    expect(substrateHasCapability("fake", "swarm")).toBe(false);
  });
});
