import { describe, expect, it } from "vitest";
import { collapseDuplicatedAssistantText } from "./assistant-reply-collapse-pure.js";

describe("collapseDuplicatedAssistantText", () => {
  it("collapses exact double reply separated by blank line", () => {
    const once = [
      "## Double handoff",
      "",
      "That was a mistake / glitch, not intentional.",
      "",
      "## Why no MCP catalog here",
      "",
      "Probing now: this agent session's MCP catalog is empty.",
      "",
      "## Handoff",
      "",
      "**Done:** Explained the double handoff.",
      "",
      "**I'll do next:** Wait for your next ask.",
    ].join("\n");
    expect(collapseDuplicatedAssistantText(`${once}\n\n${once}`)).toBe(once);
  });

  it("collapses whitespace-normalized doubles", () => {
    const a = "Yes — chat is working.\n\nI can see you in Global scope.";
    const b = "Yes — chat is working.\n\nI can see you in  Global scope.";
    expect(collapseDuplicatedAssistantText(`${a}\n\n${b}`)).toBe(a);
  });

  it("leaves normal single replies alone", () => {
    const once =
      "Chat is working. Home focused. MCP catalog empty in this session.";
    expect(collapseDuplicatedAssistantText(once)).toBe(once);
  });

  it("leaves two different paragraphs alone", () => {
    const text =
      "First distinct block about scroll hijack during thinking.\n\nSecond distinct block about MCP catalog wiring.";
    expect(collapseDuplicatedAssistantText(text)).toBe(text);
  });

  it("collapses whitespace-corrupted doubles (mid-word newlines)", () => {
    const clean = [
      "Yes — chat is working.",
      "",
      "Studio context arrived intact: project _studio, guarded access.",
      "",
      "One caveat: MCP catalog is empty, so I cannot call studio.nav.",
      "",
      "## Handoff",
      "",
      "**Done:** Confirmed this chat thread is live.",
      "",
      "**I'll do next:** Wait for your next ask.",
    ].join("\n");
    const broken = clean.replace("studio.nav", "studio.\n\nnav");
    const doubled = `${broken}\n\n${clean}`;
    const collapsed = collapseDuplicatedAssistantText(doubled);
    // One copy only (first or second) — not the full double.
    expect(collapsed.length).toBeLessThan(doubled.length * 0.7);
    expect(normalizeWs(collapsed)).toMatch(/Yes — chat is working/);
    expect(normalizeWs(collapsed).match(/## Handoff/g)?.length ?? 0).toBe(1);
  });

  it("collapses intro + body + body (two Handoffs, markdown drift)", () => {
    // Real dogfood shape from Studio debug pack 2026-07-22.
    const intro = "Running a real ≥30s think wait so you can watch the Q.\n\nThinking…\n\n";
    const bodyBroken = [
      "Held a real wait for about **35 seconds** before answering — not a fake “I'll think hard” line.",
      "",
      "What I used that time for:",
      "",
      "- Confirmed this is a Q / long-thinking latency check, not a product task.",
      "- Re-checked scope: **",
      "",
      "Global**, project `_studio`, Home focused.",
      "- Noted peer chats are still noisy about double handoffs / empty MCP — separate from this test.",
      "- Decided the pass criterion is wall-clock wait ≥30s, then one clean reply.",
      "",
      "Result: think cycle completed past the thirty-second bar.",
      "",
      "## Handoff",
      "",
      "**Done:** Ran a ≥30s think wait (~35s) and replied once.",
      "",
      "**You:** Send the next Q probe or real task whenever.",
      "",
      "**Blocked:** None for this latency test.",
      "",
      "**I'll do next:** Wait for your next request.",
    ].join("\n");
    const bodyClean = bodyBroken.replace("**\n\nGlobal**", "**Global**");
    const doubled = `${intro}${bodyBroken}\n\n${bodyClean}`;
    const collapsed = collapseDuplicatedAssistantText(doubled);
    expect(collapsed.match(/## Handoff/g)?.length ?? 0).toBe(1);
    expect(collapsed).toContain("Running a real");
    expect(collapsed).toContain("**I'll do next:**");
    expect(collapsed.length).toBeLessThan(doubled.length * 0.75);
    // Second replay of the Held-wait opener must be gone.
    expect(
      (collapsed.match(/Held a real wait for about/g) ?? []).length,
    ).toBe(1);
  });
});

function normalizeWs(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}
