import { describe, expect, it } from "vitest";
import {
  createMemoryId,
  formatMemoryBundleSlice,
  memoryStatusAfterApprove,
  type MemoryRow,
} from "./memory-pure.js";
import { retrieveMemoryTopK } from "./memory-retrieve-pure.js";

function row(partial: Partial<MemoryRow> & Pick<MemoryRow, "id" | "content">): MemoryRow {
  return {
    scope: "studio",
    projectId: null,
    origin: "hand_authored",
    status: "active",
    source: null,
    why: null,
    score: 1,
    createdAt: 1,
    updatedAt: 1,
    lastUsedAt: null,
    ...partial,
  };
}

describe("retrieveMemoryTopK", () => {
  it("returns only active rows capped by limit", () => {
    const rows = [
      row({ id: "a", content: "alpha", score: 5, status: "active" }),
      row({ id: "b", content: "beta", score: 9, status: "staged" }),
      row({ id: "c", content: "gamma", score: 3, status: "active" }),
    ];
    const got = retrieveMemoryTopK({
      rows,
      scope: "studio",
      projectId: null,
      limit: 1,
    });
    expect(got).toHaveLength(1);
    expect(got[0]!.id).toBe("a");
  });

  it("filters by query substring", () => {
    const rows = [
      row({ id: "a", content: "likes dark mode", score: 1 }),
      row({ id: "b", content: "prefers tabs", score: 1 }),
    ];
    const got = retrieveMemoryTopK({
      rows,
      scope: "all",
      projectId: null,
      query: "dark",
    });
    expect(got.map((r) => r.id)).toEqual(["a"]);
  });
});

describe("formatMemoryBundleSlice", () => {
  it("includes ids and origin for glass-box", () => {
    const text = formatMemoryBundleSlice([
      row({
        id: "mem_1",
        content: "Use Heroicons",
        origin: "self_learn",
        source: "run_9",
      }),
    ]);
    expect(text).toContain("mem_1");
    expect(text).toContain("self_learn");
    expect(text).toContain("run_9");
    expect(text).toContain("Use Heroicons");
  });
});

describe("memory helpers", () => {
  it("creates ids and approves staged", () => {
    expect(createMemoryId(1).startsWith("mem_")).toBe(true);
    expect(memoryStatusAfterApprove("staged")).toBe("active");
    expect(memoryStatusAfterApprove("rejected")).toBe("rejected");
  });
});
