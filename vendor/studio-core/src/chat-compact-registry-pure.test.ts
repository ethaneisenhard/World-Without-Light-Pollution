import { describe, expect, it } from "vitest";
import { runCompactCascade } from "./chat-compact-registry-pure.js";
import { rebuildCanonicalMessages } from "./chat-compact-rebuild-pure.js";
import { applyToolResultCollapse } from "./chat-compact-tool-collapse-pure.js";

describe("chat-compact-registry-pure", () => {
  it("runs sliding_window when forced under budget path", () => {
    const messages = Array.from({ length: 12 }, (_, i) => ({
      role: i % 2 ? "assistant" : "user",
      content: `m${i} `.repeat(20),
      id: `id_${i}`,
    }));
    const out = runCompactCascade({
      messages,
      projectId: "p",
      order: ["sliding_window"],
      forceSlidingWindow: true,
      retainRecentMessages: 4,
    });
    expect(out.strategiesApplied).toContain("sliding_window");
    expect(out.messages[0]?.compaction?.strategyId).toBe("sliding_window");
    expect(out.messages.length).toBeLessThan(messages.length);
  });

  it("collapses bulky assistant tool output in older turns", () => {
    const blob = "x".repeat(900);
    const out = applyToolResultCollapse({
      messages: [
        { role: "user", content: "hi", id: "1" },
        {
          role: "assistant",
          content: `Tool result\n${blob}\n\nDone`,
          id: "2",
        },
        { role: "user", content: "ok", id: "3" },
        { role: "assistant", content: "short", id: "4" },
      ],
      projectId: "p",
      retainRecentMessages: 2,
    });
    expect(out.applied).toBe(true);
    expect(out.messages[1]!.content).toContain("collapsed");
  });

  it("rebuildCanonicalMessages keeps marker + uncovered", () => {
    const rebuilt = rebuildCanonicalMessages([
      { id: "a", role: "user", content: "old" },
      { id: "b", role: "assistant", content: "old a" },
      {
        id: "c",
        role: "user",
        content: "summary",
        compaction: { coveredMessageIds: ["a", "b"], strategyId: "sliding_window" },
      },
      { id: "d", role: "user", content: "recent" },
    ]);
    expect(rebuilt.map((m) => m.id)).toEqual(["c", "d"]);
  });
});
