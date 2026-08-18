import { describe, expect, it } from "vitest";
import {
  formatAskUserAnsweredPayload,
  parseAskUserInput,
  validateAskUserAnswer,
  type PendingAskUser,
} from "./ask-user-pure.js";

describe("parseAskUserInput", () => {
  it("accepts string options", () => {
    const r = parseAskUserInput(
      { question: "Ship notes where?", options: ["Chat only", "Notes MD"] },
      "demo",
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.options).toHaveLength(2);
    expect(r.options[0]?.label).toBe("Chat only");
  });

  it("rejects empty question", () => {
    const r = parseAskUserInput({ question: "  ", options: ["A"] }, "demo");
    expect(r.ok).toBe(false);
  });
});

describe("validateAskUserAnswer", () => {
  const ask: PendingAskUser = {
    id: "ask_1",
    projectId: "demo",
    question: "Pick",
    options: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ],
    allowMultiple: false,
    createdAt: 1,
  };

  it("accepts one option", () => {
    const r = validateAskUserAnswer(ask, { selectedOptionIds: ["a"] });
    expect(r.ok).toBe(true);
  });

  it("rejects unknown id", () => {
    const r = validateAskUserAnswer(ask, { selectedOptionIds: ["z"] });
    expect(r.ok).toBe(false);
  });

  it("allows cancel", () => {
    const r = validateAskUserAnswer(ask, {
      selectedOptionIds: [],
      cancelled: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.answer.cancelled).toBe(true);
  });
});

describe("formatAskUserAnsweredPayload", () => {
  it("includes selected labels", () => {
    const p = formatAskUserAnsweredPayload({
      askId: "ask_1",
      question: "Pick",
      options: [{ id: "a", label: "Alpha" }],
      answer: { selectedOptionIds: ["a"] },
    });
    expect(p.kind).toBe("ask_user_answered");
    expect(p.selected).toEqual([{ id: "a", label: "Alpha" }]);
  });
});
