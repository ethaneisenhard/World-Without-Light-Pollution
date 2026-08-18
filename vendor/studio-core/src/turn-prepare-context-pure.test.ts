import { describe, expect, it } from "vitest";
import {
  appendDynamicContextToLastUserMessage,
  applyTurnPrepareToMessages,
  joinDynamicContextParts,
  splitTurnPrepareContext,
} from "./turn-prepare-context-pure.js";

describe("splitTurnPrepareContext", () => {
  it("studio-full: viewport + notes + presence dynamic; rules/skills/memory stable", () => {
    const split = splitTurnPrepareContext({
      tier: "studio-full",
      viewportContext: "file: a.ts",
      notesSlice: "note hit",
      rootHint: "root",
      rulesPreamble: "rules",
      skillsPreamble: "skills",
      memorySlice: "mem",
      presenceSlice: "siblings live",
      mcpFact: "mcp",
    });
    expect(split.stableParts).toEqual(["root", "rules", "skills", "mem"]);
    expect(split.dynamicParts).toEqual([
      "file: a.ts",
      "note hit",
      "siblings live",
    ]);
    expect(split.stableParts.join()).not.toContain("file:");
  });

  it("peer-minimal: mcp stable; viewport + presence dynamic", () => {
    const split = splitTurnPrepareContext({
      tier: "peer-minimal",
      viewportContext: "ui ctx",
      notesSlice: "ignored for peer system",
      rulesPreamble: "rules",
      presenceSlice: "siblings live",
      mcpFact: "Studio MCP connected",
    });
    expect(split.stableParts).toEqual(["Studio MCP connected"]);
    expect(split.dynamicParts).toEqual(["ui ctx", "siblings live"]);
  });

  it("peer-minimal + peerMemoryInject: memory dynamic", () => {
    const split = splitTurnPrepareContext({
      tier: "peer-minimal",
      viewportContext: "ui ctx",
      memorySlice: "MEM",
      presenceSlice: "siblings",
      mcpFact: "mcp",
      peerMemoryInject: true,
    });
    expect(split.stableParts).toEqual(["mcp"]);
    expect(split.dynamicParts).toEqual(["ui ctx", "siblings", "MEM"]);
  });
});

describe("appendDynamicContextToLastUserMessage", () => {
  it("two viewports → same prior user base, different dynamic footer", () => {
    const base = [
      { role: "user" as const, content: "hello" },
      { role: "assistant" as const, content: "hi" },
      { role: "user" as const, content: "next" },
    ];
    const a = appendDynamicContextToLastUserMessage(base, "viewport A");
    const b = appendDynamicContextToLastUserMessage(base, "viewport B");
    expect(a[0]).toEqual(base[0]);
    expect(a[2]!.content).toContain("viewport A");
    expect(b[2]!.content).toContain("viewport B");
    expect(a[2]!.content).not.toContain("viewport B");
  });
});

describe("applyTurnPrepareToMessages", () => {
  it("stable system identical across two dynamic viewports", () => {
    const messages = [{ role: "user" as const, content: "do work" }];
    const splitA = splitTurnPrepareContext({
      tier: "studio-full",
      viewportContext: "vp-1",
      rulesPreamble: "RULES",
      skillsPreamble: "SKILLS",
      memorySlice: "MEM",
    });
    const splitB = splitTurnPrepareContext({
      tier: "studio-full",
      viewportContext: "vp-2",
      rulesPreamble: "RULES",
      skillsPreamble: "SKILLS",
      memorySlice: "MEM",
    });
    const a = applyTurnPrepareToMessages({ messages, split: splitA });
    const b = applyTurnPrepareToMessages({ messages, split: splitB });
    expect(a.stableSystemParts.join("\n\n")).toBe(
      b.stableSystemParts.join("\n\n"),
    );
    expect(a.stableSystemParts.join("\n\n")).toBe("RULES\n\nSKILLS\n\nMEM");
    expect(a.messages[0]!.content).toContain("vp-1");
    expect(b.messages[0]!.content).toContain("vp-2");
    expect(joinDynamicContextParts(splitA.dynamicParts)).toBe("vp-1");
  });
});
