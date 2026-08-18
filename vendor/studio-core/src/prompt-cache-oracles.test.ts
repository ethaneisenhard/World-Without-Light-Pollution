/**
 * Cache Wars / prompt-cache acceptance oracles (offline).
 * Global good practice: stable prepare + provider adapter — not Anthropic-only.
 */

import { describe, expect, it } from "vitest";
import { anthropicHarnessToolDefinitions } from "./tool-catalog-pure.js";
import {
  applyPromptCache,
  resolvePromptCacheProviderId,
} from "./prompt-cache-policy-pure.js";
import {
  applyTurnPrepareToMessages,
  splitTurnPrepareContext,
} from "./turn-prepare-context-pure.js";
import {
  createConversationFreezeStore,
  resolveFrozenStableParts,
} from "./conversation-freeze-pure.js";

/** Overhead model: o = Δcontext − payload. Studio builder must not inject scaffolding. */
export function harnessOverheadTokens(input: {
  contextDeltaTokens: number;
  payloadTokens: number;
}): number {
  return input.contextDeltaTokens - input.payloadTokens;
}

describe("prompt-cache oracles (have it all)", () => {
  it("(i) anthropic adapter: 1h markers + beta; ≤4 breakpoints", () => {
    const out = applyPromptCache("anthropic", {
      system: "STABLE",
      messages: [
        { role: "user", content: "a" },
        { role: "assistant", content: "b" },
      ],
      tools: [
        { name: "t1", input_schema: {} },
        { name: "t2", input_schema: {} },
      ],
    });
    expect(out.strategy).toBe("explicit-markers");
    expect(out.headers["anthropic-beta"]).toContain("extended-cache-ttl");
    let n = 0;
    for (const b of out.system as { cache_control?: unknown }[]) {
      if (b.cache_control) n += 1;
    }
    for (const t of out.tools as { cache_control?: unknown }[]) {
      if (t.cache_control) n += 1;
    }
    for (const m of out.messages as {
      content?: { cache_control?: unknown }[];
    }[]) {
      if (Array.isArray(m.content)) {
        for (const b of m.content) {
          if (b.cache_control) n += 1;
        }
      }
    }
    expect(n).toBeLessThanOrEqual(4);
    expect(n).toBeGreaterThanOrEqual(3);
  });

  it("(iii) freeze + two viewports → identical stable system", () => {
    const store = createConversationFreezeStore();
    const splitA = splitTurnPrepareContext({
      tier: "studio-full",
      viewportContext: "vp-1",
      rulesPreamble: "RULES",
      skillsPreamble: "SKILLS",
      memorySlice: "MEM",
    });
    const first = resolveFrozenStableParts({
      sessionId: "s1",
      store,
      freshStableParts: splitA.stableParts,
    });
    const splitB = splitTurnPrepareContext({
      tier: "studio-full",
      viewportContext: "vp-2",
      rulesPreamble: "RULES-CHANGED-ON-DISK",
      skillsPreamble: "SKILLS",
      memorySlice: "MEM-VARYING",
    });
    const second = resolveFrozenStableParts({
      sessionId: "s1",
      store,
      freshStableParts: splitB.stableParts,
    });
    expect(second.fromFreeze).toBe(true);
    expect(second.stableParts.join("\n")).toBe(first.stableParts.join("\n"));

    const msgs = [{ role: "user" as const, content: "go" }];
    const a = applyTurnPrepareToMessages({
      messages: msgs,
      split: { stableParts: second.stableParts, dynamicParts: ["vp-1"] },
    });
    const b = applyTurnPrepareToMessages({
      messages: msgs,
      split: { stableParts: second.stableParts, dynamicParts: ["vp-2"] },
    });
    expect(a.stableSystemParts).toEqual(b.stableSystemParts);
    expect(a.messages[0]!.content).toContain("vp-1");
    expect(b.messages[0]!.content).toContain("vp-2");
  });

  it("(ii) Agent progressive tools stay meta-only (no catalog dump)", () => {
    const defs = anthropicHarnessToolDefinitions();
    const names = defs.map((d) => d.name).sort();
    expect(names).toEqual([
      "skills_list",
      "skills_read",
      "tools_call",
      "tools_describe",
      "tools_search",
    ]);
    expect(harnessOverheadTokens({ contextDeltaTokens: 5186, payloadTokens: 5186 })).toBe(
      0,
    );
  });

  it("global: openai + peer resolve without anthropic one-off", () => {
    expect(resolvePromptCacheProviderId("openai")).toBe("openai");
    expect(applyPromptCache("openai", { messages: [] }).strategy).toBe(
      "automatic-prefix",
    );
    expect(applyPromptCache("cursor", { messages: [] }).strategy).toBe("none");
  });
});
