import { describe, expect, it } from "vitest";
import { buildContextBundle } from "./context-bundle-pure.js";
import {
  buildTurnInspect,
  formatMemoryReceiptSummary,
  memoryReceiptPack,
} from "./turn-inspect-pure.js";

describe("buildTurnInspect", () => {
  it("exposes harness tools and memory ids", () => {
    const bundle = buildContextBundle({
      projectId: "demo-blog",
      harnessId: "studio",
      systemParts: ["hello"],
      allowTools: ["files.read"],
    });
    const inspect = buildTurnInspect({
      bundle,
      memoryRows: [
        {
          id: "mem_1",
          scope: "studio",
          projectId: null,
          content: "Prefers Tailwind",
          origin: "self_learn",
          status: "active",
          source: "run_1",
          why: null,
          score: 1,
          createdAt: 1,
          updatedAt: 1,
          lastUsedAt: null,
        },
        {
          id: "mem_pin",
          scope: "studio",
          projectId: null,
          content: "Pinned pref",
          origin: "hand_authored",
          status: "active",
          source: null,
          why: "pref:manual",
          score: 100,
          createdAt: 1,
          updatedAt: 1,
          lastUsedAt: null,
        },
      ],
      notePaths: ["Daily/2026-07-14.md"],
      ruleRows: [
        {
          id: "tone",
          path: "tone.md",
          enabled: true,
          title: "Tone",
          scope: "studio",
        },
        {
          id: "md",
          path: "content/**/*.md",
          enabled: true,
          title: "MD pages",
          scope: "project",
        },
      ],
    });
    expect(inspect.harnessId).toBe("studio");
    expect(inspect.memoryIds).toEqual(["mem_1", "mem_pin"]);
    expect(inspect.notePaths).toEqual(["Daily/2026-07-14.md"]);
    const memSlices = inspect.slices.filter((s) => s.kind === "memory");
    expect(memSlices[0]?.label).toMatch(/^Auto memory —/);
    expect(memSlices[1]?.label).toMatch(/^Always-on memory —/);
    const ruleSlices = inspect.slices.filter((s) => s.kind === "rules");
    expect(ruleSlices[0]?.label).toMatch(/^Always-on rule —/);
    expect(ruleSlices[1]?.label).toMatch(/^Auto rule —/);
  });
});

describe("memory receipt labels", () => {
  it("summarizes counts", () => {
    expect(formatMemoryReceiptSummary(0)).toBe("");
    expect(formatMemoryReceiptSummary(1)).toBe(" · 1 turn receipt (memory)");
    expect(formatMemoryReceiptSummary(3)).toBe(" · 3 turn receipts (memory)");
  });

  it("pins → always-on pack", () => {
    expect(
      memoryReceiptPack({
        id: "x",
        scope: "studio",
        projectId: null,
        content: "y",
        origin: "hand_authored",
        status: "active",
        source: null,
        why: null,
        score: 100,
        createdAt: 1,
        updatedAt: 1,
        lastUsedAt: null,
      }),
    ).toBe("always-on");
  });
});
