import { describe, expect, it } from "vitest";
import {
  applySessionContextFork,
  dismissContinuationBanner,
  emptyChatSessionState,
} from "./chat-session-pure.js";
import { formatContinuationBanner } from "./chat-context-fork-pure.js";

describe("session context fork", () => {
  it("creates continued session with banner meta", () => {
    const base = emptyChatSessionState(1_000);
    const parentId = base.activeId!;
    const next = applySessionContextFork(base, {
      fromSessionId: parentId,
      reason: "hard_budget",
      title: "Continued · compacted",
      seedMessages: [{ role: "user", content: "handoff" }],
      now: 2_000,
    });
    expect(next.activeId).not.toBe(parentId);
    const active = next.sessions.find((s) => s.id === next.activeId);
    expect(active?.title).toBe("Continued · compacted");
    expect(active?.continuation?.fromSessionId).toBe(parentId);
    expect(active?.continuation?.bannerDismissed).toBe(false);
    expect(active?.messages[0]?.content).toBe("handoff");
    expect(next.sessions.some((s) => s.id === parentId)).toBe(true);

    const dismissed = dismissContinuationBanner(next, next.activeId!);
    expect(
      dismissed.sessions.find((s) => s.id === next.activeId)?.continuation
        ?.bannerDismissed,
    ).toBe(true);
  });

  it("formats continuation banner", () => {
    expect(formatContinuationBanner("hard_budget")).toContain("compacted");
  });
});
