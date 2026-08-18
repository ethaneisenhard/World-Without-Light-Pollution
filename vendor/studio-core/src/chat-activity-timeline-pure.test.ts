import { describe, expect, it } from "vitest";
import {
  coalesceThinkingNotes,
  joinThinkingFragments,
} from "./coalesce-chat-thinking-pure.js";
import {
  buildChatActivityTimeline,
  buildProcessSummaryLabel,
  projectChatProcessFace,
  shortProcessPhase,
} from "./chat-activity-timeline-pure.js";

describe("coalesceThinkingNotes", () => {
  it("joins token fragments into one block", () => {
    const text = coalesceThinkingNotes([
      "I will",
      " check",
      " the harness",
      " wiring.",
    ]);
    expect(text).toBe("I will check the harness wiring.");
  });

  it("keeps discrete notes as paragraphs", () => {
    const text = coalesceThinkingNotes([
      "First I inspect the SSE path for thinking deltas.",
      "Then I verify the process modal only shows one reasoning block.",
    ]);
    expect(text).toContain("\n\n");
    expect(text).toContain("First I inspect");
  });

  it("returns null for empty", () => {
    expect(coalesceThinkingNotes([])).toBeNull();
    expect(coalesceThinkingNotes(null)).toBeNull();
  });
});

describe("joinThinkingFragments", () => {
  it("glues punctuation without a space", () => {
    expect(joinThinkingFragments(["hello", ".", " world"])).toBe("hello. world");
  });
});

describe("projectChatProcessFace", () => {
  it("exposes coalesced reasoning and tools without duplicating notes in steps", () => {
    const face = projectChatProcessFace({
      thinking: ["Inspect", " harness"],
      tools: [
        {
          id: "t1",
          name: "shell",
          title: "Run command",
          subtitle: "pnpm test",
          state: "running",
        },
      ],
      streaming: true,
    });
    expect(face.hasReasoning).toBe(true);
    expect(face.reasoning).toMatch(/Inspect harness/);
    expect(face.tools).toHaveLength(1);
    expect(face.stepCount).toBe(2);
    expect(face.nowLine).toContain("pnpm test");
    expect(face.summaryLabel).toContain("Live");
    expect(face.summaryLabel).toContain("Reasoning");
    expect(face.summaryLabel).toContain("1 tool");
  });

  it("prefers Reasoning… over long phase dumps", () => {
    expect(
      projectChatProcessFace({
        thinking: ["plan"],
        streaming: true,
        phaseDetail: "A".repeat(100),
      }).nowLine,
    ).toBe("Reasoning…");
  });

  it("uses Working… when streaming with no tools or reasoning", () => {
    expect(
      projectChatProcessFace({
        streaming: true,
        phaseDetail: null,
      }).nowLine,
    ).toBe("Working…");
  });

  it("buildChatActivityTimeline no longer interleaves thinking into steps", () => {
    const { reasoning, steps, nowLine } = buildChatActivityTimeline({
      thinking: ["Inspect harness wiring"],
      tools: [
        {
          id: "t1",
          name: "shell",
          title: "Run command",
          subtitle: "pnpm test",
          state: "running",
        },
      ],
    });
    expect(reasoning).toBe("Inspect harness wiring");
    expect(steps.every((s) => s.kind === "tool")).toBe(true);
    expect(nowLine).toContain("pnpm test");
  });
});

describe("shortProcessPhase", () => {
  it("drops long or multiline phase detail", () => {
    expect(shortProcessPhase("A".repeat(100))).toBeNull();
    expect(shortProcessPhase("line\ntwo")).toBeNull();
    expect(shortProcessPhase("Thinking…")).toBe("Thinking…");
  });
});

describe("buildProcessSummaryLabel", () => {
  it("formats live reasoning and tools", () => {
    expect(
      buildProcessSummaryLabel({
        hasReasoning: true,
        toolCount: 3,
        streaming: true,
      }),
    ).toBe("Live · Reasoning · 3 tools");
  });
});
