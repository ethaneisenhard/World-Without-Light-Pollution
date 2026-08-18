import { describe, expect, it, vi } from "vitest";
import {
  normalizeAssistantReply,
  normalizeHarnessSendPayload,
  wrapHarnessSendNormalize,
} from "./assistant-reply-normalize-pure.js";

describe("normalizeAssistantReply", () => {
  it("LAW: harness-agnostic — collapses double Handoff + heals smashed labels", () => {
    const once = [
      "You're in Global scope",
      "",
      ", Home focused.",
      "",
      "## Handoff",
      "",
      "**Done:** Confirmed single-shot.",
      "",
      "**You",
      "",
      ":** You're good.",
      "",
      "**I'll do next (no ask):** nothing pending.",
    ].join("\n");
    const doubled = `${once}\n\n${once}`;
    const out = normalizeAssistantReply(doubled);
    expect((out.match(/^#{1,6}\s*Handoff\s*$/gim) ?? []).length).toBe(1);
    expect(out).toContain("You're in Global scope, Home focused.");
    expect(out).toContain("**You:**");
    expect(out).not.toMatch(/\*\*You\n/);
  });

  it("leaves short clean replies alone (structure preserved)", () => {
    const src = "Ping.\n\n## Handoff\n\n**Done:** Pong.\n\n**You:** —";
    expect(normalizeAssistantReply(src)).toContain("**Done:**");
  });
});

describe("wrapHarnessSendNormalize", () => {
  it("normalizes message.content for every harness id alike", () => {
    const send = vi.fn();
    const wrapped = wrapHarnessSendNormalize(send);
    const messy = "Hello scope\n\n, world.\n\nHandoff\nDone: ok.\nYou: —";
    wrapped("message", {
      role: "assistant",
      content: messy,
      harness: "cursor",
    });
    wrapped("status", { phase: "done" });
    expect(send).toHaveBeenCalledTimes(2);
    const [, msg] = send.mock.calls[0]!;
    expect(msg.harness).toBe("cursor");
    expect(msg.content).toContain("Hello scope, world.");
    expect(msg.content).toContain("## Handoff");
    expect(msg.content).toContain("**Done:**");
    expect(send.mock.calls[1]).toEqual(["status", { phase: "done" }]);
  });

  it("normalizeHarnessSendPayload is a pure no-op for non-message", () => {
    const data = { phase: "thinking" };
    expect(normalizeHarnessSendPayload("status", data)).toBe(data);
  });
});
