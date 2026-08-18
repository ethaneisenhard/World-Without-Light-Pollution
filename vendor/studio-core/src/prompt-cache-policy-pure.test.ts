import { describe, expect, it } from "vitest";
import { ANTHROPIC_PROMPT_CACHE_BETA } from "./anthropic-prompt-cache-pure.js";
import {
  applyPromptCache,
  normalizePromptCacheUsage,
  PROVIDER_CACHE_ADAPTERS,
  resolvePromptCacheProviderId,
  resolveProviderCacheAdapter,
} from "./prompt-cache-policy-pure.js";

describe("prompt-cache-policy-pure", () => {
  it("aliases studio/claude → anthropic; cursor/hermes → peer", () => {
    expect(resolvePromptCacheProviderId("studio")).toBe("anthropic");
    expect(resolvePromptCacheProviderId("claude")).toBe("anthropic");
    expect(resolvePromptCacheProviderId("cursor")).toBe("peer");
    expect(resolvePromptCacheProviderId("hermes")).toBe("peer");
    expect(resolvePromptCacheProviderId("openai")).toBe("openai");
  });

  it("registry has every provider id", () => {
    for (const id of [
      "anthropic",
      "openai",
      "chat-completions",
      "peer",
      "noop",
    ] as const) {
      expect(PROVIDER_CACHE_ADAPTERS[id].id).toBe(id);
    }
  });

  it("aliases openai-compatible / deepseek → chat-completions", () => {
    expect(resolvePromptCacheProviderId("openai-compatible")).toBe(
      "chat-completions",
    );
    expect(resolvePromptCacheProviderId("deepseek")).toBe("chat-completions");
  });

  it("anthropic adapter emits markers + beta header", () => {
    const out = applyPromptCache("anthropic", {
      system: "You are Studio.",
      messages: [
        { role: "user", content: "a" },
        { role: "assistant", content: "b" },
      ],
      tools: [
        { name: "tools_search", input_schema: {} },
        { name: "tools_call", input_schema: {} },
      ],
    });
    expect(out.strategy).toBe("explicit-markers");
    expect(out.headers["anthropic-beta"]).toBe(ANTHROPIC_PROMPT_CACHE_BETA);
    expect(
      (out.system as { cache_control?: { ttl?: string } }[])[0]?.cache_control
        ?.ttl,
    ).toBe("1h");
    const tools = out.tools as { cache_control?: { ttl?: string } }[];
    expect(tools[tools.length - 1]?.cache_control?.ttl).toBe("1h");
  });

  it("openai adapter is automatic-prefix with no markers", () => {
    const out = applyPromptCache("openai", {
      system: "sys",
      messages: [{ role: "user", content: "hi" }],
      tools: [{ name: "t", input_schema: {} }],
    });
    expect(out.strategy).toBe("automatic-prefix");
    expect(out.headers).toEqual({});
    expect(out.system).toBe("sys");
    expect(
      (out.tools as { cache_control?: unknown }[])[0]?.cache_control,
    ).toBeUndefined();
  });

  it("peer adapter never marks (Cursor/Hermes own the loop)", () => {
    const out = applyPromptCache("cursor", {
      system: "x",
      messages: [{ role: "user", content: "y" }],
    });
    expect(out.providerId).toBe("peer");
    expect(out.strategy).toBe("none");
    expect(resolveProviderCacheAdapter("hermes").strategy).toBe("none");
  });

  it("normalizeUsage dispatches by provider", () => {
    const anth = normalizePromptCacheUsage("anthropic", {
      input_tokens: 1,
      cache_read_input_tokens: 50,
      cache_creation_input_tokens: 10,
      cache_creation: { ephemeral_1h_input_tokens: 10 },
    });
    expect(anth?.cacheRead).toBe(50);
    expect(anth?.cacheCreation1h).toBe(10);

    const oai = normalizePromptCacheUsage("openai", {
      prompt_tokens: 100,
      completion_tokens: 5,
      prompt_tokens_details: { cached_tokens: 80 },
    });
    expect(oai?.cacheRead).toBe(80);
    expect(oai?.inputUncached).toBe(20);

    expect(normalizePromptCacheUsage("peer", { anything: 1 })).toBeNull();
  });
});
