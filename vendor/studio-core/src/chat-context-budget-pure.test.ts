import { describe, expect, it } from "vitest";
import {
  resolveChatContextBudget,
  resolveCompactThresholdTokens,
} from "./chat-context-budget-pure.js";

describe("chat-context-budget-pure", () => {
  it("uses Claude-style 13k buffer headroom on 200k window", () => {
    expect(resolveCompactThresholdTokens(200_000)).toBe(187_000);
  });

  it("levels warn / compact / hard", () => {
    const windowTokens = 200_000;
    expect(
      resolveChatContextBudget({ usedTokens: 10_000, windowTokens }).level,
    ).toBe("ok");
    expect(
      resolveChatContextBudget({ usedTokens: 160_000, windowTokens }).level,
    ).toBe("warn");
    expect(
      resolveChatContextBudget({ usedTokens: 187_000, windowTokens }).level,
    ).toBe("compact");
    expect(
      resolveChatContextBudget(
        { usedTokens: 190_000, windowTokens },
        { bufferTokens: 0, thresholdRatio: 0.9, hardRatio: 0.95 },
      ).level,
    ).toBe("hard");
  });
});
