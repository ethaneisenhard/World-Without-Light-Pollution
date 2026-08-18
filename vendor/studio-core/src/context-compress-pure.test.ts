import { describe, expect, it } from "vitest";
import {
  applyContextCompress,
  shouldCompressContext,
} from "./context-compress-pure.js";

describe("context-compress-pure", () => {
  it("decides on message threshold", () => {
    expect(
      shouldCompressContext({ messageCount: 30, historyChars: 100 }),
    ).toMatchObject({ compress: true, reason: "message_count" });
  });

  it("applies summary + keepLast", () => {
    const messages = Array.from({ length: 12 }, (_, i) => ({
      role: i % 2 ? "assistant" : "user",
      content: `m${i}`,
    }));
    const out = applyContextCompress({
      messages,
      keepLast: 4,
      projectId: "p",
    });
    expect(out.compressed).toBe(true);
    expect(out.droppedCount).toBe(8);
    expect(out.messages[0]!.content).toContain("Compressed prior context");
    expect(out.messages.length).toBe(5);
  });
});
