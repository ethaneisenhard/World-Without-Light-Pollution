import { describe, expect, it } from "vitest";
import {
  hashPromptToBotLook,
  normalizeAgentAvatar,
  parseAgentDescription,
} from "./agent-avatar-pure.js";

describe("normalizeAgentAvatar", () => {
  it("defaults to orange circle", () => {
    expect(normalizeAgentAvatar(null)).toEqual({
      kind: "bot",
      shape: "circle",
      color: "orange",
    });
  });

  it("keeps a pet face", () => {
    expect(normalizeAgentAvatar({ kind: "pet", petId: "battle-beast" })).toEqual({
      kind: "pet",
      petId: "battle-beast",
    });
  });

  it("drops a non-image upload", () => {
    expect(normalizeAgentAvatar({ kind: "upload", imageDataUrl: "http://x" })).toEqual({
      kind: "bot",
      shape: "circle",
      color: "orange",
    });
  });
});

describe("hashPromptToBotLook", () => {
  it("is stable for the same prompt", () => {
    expect(hashPromptToBotLook("inbox triage")).toEqual(
      hashPromptToBotLook("inbox triage"),
    );
  });
});

describe("parseAgentDescription", () => {
  it("trims and empties to null", () => {
    expect(parseAgentDescription("  hello  ")).toBe("hello");
    expect(parseAgentDescription("   ")).toBeNull();
  });
});
