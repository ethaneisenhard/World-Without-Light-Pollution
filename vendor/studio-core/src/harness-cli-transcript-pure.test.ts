import { describe, expect, it } from "vitest";
import {
  buildHarnessHandoffBlock,
  foldChatTranscriptForCliPrompt,
  historyModeForHarness,
  prepareChatMessagesForHarnessHistory,
} from "./harness-cli-transcript-pure.js";

describe("historyModeForHarness", () => {
  it("maps API peers to messages and CLI peers to prompt-transcript", () => {
    expect(historyModeForHarness("studio")).toBe("messages");
    expect(historyModeForHarness("kody")).toBe("messages");
    expect(historyModeForHarness("cursor")).toBe("prompt-transcript");
    expect(historyModeForHarness("hermes")).toBe("prompt-transcript");
    expect(historyModeForHarness("grok")).toBe("prompt-transcript");
    expect(historyModeForHarness("agent-room")).toBe("none");
  });

  it("defaults unknown harness to none", () => {
    expect(historyModeForHarness("openclaw")).toBe("none");
  });
});

describe("foldChatTranscriptForCliPrompt", () => {
  it("returns empty when only the current user turn exists", () => {
    expect(
      foldChatTranscriptForCliPrompt([
        { role: "user", content: "verify this" },
      ]),
    ).toBe("");
  });

  it("includes prior assistant + user turns for verify-this class prompts", () => {
    const prior = foldChatTranscriptForCliPrompt([
      { role: "user", content: "compact the footer" },
      {
        role: "assistant",
        content: "Change `apps/studio/client/studio-ui-classes.ts` ~932.",
      },
      { role: "user", content: "verify this" },
    ]);
    expect(prior).toContain("# Prior conversation");
    expect(prior).toContain("compact the footer");
    expect(prior).toContain("studio-ui-classes.ts");
    expect(prior).not.toContain("verify this");
  });

  it("respects maxPriorChars", () => {
    const prior = foldChatTranscriptForCliPrompt(
      [
        { role: "user", content: "AAAA".repeat(200) },
        { role: "assistant", content: "BBBB".repeat(200) },
        { role: "user", content: "now" },
      ],
      { maxPriorChars: 120 },
    );
    expect(prior.length).toBeLessThanOrEqual(120);
    expect(prior).toMatch(/truncated/i);
  });
});

describe("prepareChatMessagesForHarnessHistory", () => {
  it("leaves studio messages untouched", () => {
    const messages = [
      { role: "user" as const, content: "a" },
      { role: "assistant" as const, content: "b" },
      { role: "user" as const, content: "c" },
    ];
    const next = prepareChatMessagesForHarnessHistory(messages, "studio");
    expect(next).toEqual(messages);
    expect(next[2]!.content).toBe("c");
  });

  it("folds prior turns into last user for cursor", () => {
    const next = prepareChatMessagesForHarnessHistory(
      [
        { role: "user", content: "compact the footer" },
        {
          role: "assistant",
          content: "Edit SHELL_FOOTER in studio-ui-classes.ts",
        },
        { role: "user", content: "verify this" },
      ],
      "cursor",
    );
    const last = next[next.length - 1]!;
    expect(last.role).toBe("user");
    expect(last.content).toContain("# Prior conversation");
    expect(last.content).toContain("SHELL_FOOTER");
    expect(last.content).toContain("# Current request");
    expect(last.content).toContain("verify this");
  });

  it("prepends harness handoff when picker changes", () => {
    expect(
      buildHarnessHandoffBlock({
        fromHarness: "studio",
        toHarness: "cursor",
      }),
    ).toMatch(/Harness handoff/);
    const next = prepareChatMessagesForHarnessHistory(
      [
        { role: "user", content: "a" },
        { role: "assistant", content: "b" },
        { role: "user", content: "continue" },
      ],
      "cursor",
      {
        handoff: {
          fromHarness: "studio",
          toHarness: "cursor",
          viewportContext: "chat focused",
        },
      },
    );
    const last = next[next.length - 1]!;
    expect(last.content).toContain("# Harness handoff");
    expect(last.content).toContain("Previous harness: studio");
    expect(last.content).toContain("chat focused");
  });

  it("folds handoff alone when thread has no prior turns", () => {
    const next = prepareChatMessagesForHarnessHistory(
      [{ role: "user", content: "first after switch" }],
      "cursor",
      {
        handoff: { fromHarness: "studio", toHarness: "cursor" },
      },
    );
    const last = next[0]!;
    expect(last.content).toContain("# Harness handoff");
    expect(last.content).toContain("# Current request");
    expect(last.content).toContain("first after switch");
    expect(last.content).not.toContain("# Prior conversation");
  });
});
