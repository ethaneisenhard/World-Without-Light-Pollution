import { describe, expect, it } from "vitest";
import {
  anthropicCacheUsageStatusData,
  createAnthropicCacheUsageAccumulator,
  normalizeAnthropicCacheUsage,
} from "./anthropic-cache-usage-pure.js";

describe("normalizeAnthropicCacheUsage", () => {
  it("parses Cache Wars style usage with 1h creation split", () => {
    const n = normalizeAnthropicCacheUsage({
      input_tokens: 100,
      output_tokens: 20,
      cache_read_input_tokens: 33_367,
      cache_creation_input_tokens: 5_191,
      cache_creation: {
        ephemeral_5m_input_tokens: 0,
        ephemeral_1h_input_tokens: 5_191,
      },
    });
    expect(n).toEqual({
      inputUncached: 100,
      cacheRead: 33_367,
      cacheCreation: 5_191,
      cacheCreation5m: 0,
      cacheCreation1h: 5_191,
      outputTokens: 20,
      inputTotal: 100 + 33_367 + 5_191,
    });
    expect(anthropicCacheUsageStatusData(n!)).toMatchObject({
      cacheRead: 33_367,
      cacheCreation1h: 5_191,
      inputUncached: 100,
    });
  });

  it("attributes unspecified creation to 5m", () => {
    const n = normalizeAnthropicCacheUsage({
      input_tokens: 10,
      cache_creation_input_tokens: 500,
    });
    expect(n?.cacheCreation5m).toBe(500);
    expect(n?.cacheCreation1h).toBe(0);
  });

  it("returns null for missing usage", () => {
    expect(normalizeAnthropicCacheUsage(null)).toBeNull();
    expect(normalizeAnthropicCacheUsage(undefined)).toBeNull();
  });
});

describe("createAnthropicCacheUsageAccumulator", () => {
  it("sums rounds", () => {
    const { accumulate, snapshot } = createAnthropicCacheUsageAccumulator();
    accumulate({
      input_tokens: 1,
      cache_read_input_tokens: 100,
      cache_creation_input_tokens: 10,
      cache_creation: { ephemeral_1h_input_tokens: 10 },
    });
    accumulate({
      input_tokens: 2,
      cache_read_input_tokens: 200,
      cache_creation_input_tokens: 0,
    });
    const s = snapshot();
    expect(s.rounds).toBe(2);
    expect(s.cacheRead).toBe(300);
    expect(s.cacheCreation1h).toBe(10);
    expect(s.inputUncached).toBe(3);
  });
});
