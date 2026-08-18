import { describe, expect, it } from "vitest";
import {
  formatPeerUsageLabel,
  parsePeerUsageEvent,
} from "./chat-peer-usage-pure.js";

describe("chat-peer-usage-pure", () => {
  it("parses usage SSE payloads", () => {
    expect(
      parsePeerUsageEvent({
        harness: "kody",
        input_tokens: 10,
        output_tokens: 20,
        total_tokens: 30,
      }),
    ).toEqual({
      harness: "kody",
      inputTokens: 10,
      outputTokens: 20,
      totalTokens: 30,
    });
  });

  it("returns null when no token fields (no fake numbers)", () => {
    expect(parsePeerUsageEvent({ harness: "kody" })).toBeNull();
  });

  it("formats short label", () => {
    expect(
      formatPeerUsageLabel({
        harness: "kody",
        inputTokens: 3,
        outputTokens: 5,
        totalTokens: 8,
      }),
    ).toBe("8 tok (3→5) kody");
    expect(formatPeerUsageLabel(null)).toBe("");
  });
});
