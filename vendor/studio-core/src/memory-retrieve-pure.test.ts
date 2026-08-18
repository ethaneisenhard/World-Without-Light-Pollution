import { describe, expect, it } from "vitest";
import type { MemoryRow } from "./memory-pure.js";
import {
  MEMORY_PIN_SCORE,
  decayedMemoryScore,
  exportMemoryJson,
  isMemoryPinned,
  retrieveMemoryHotWarm,
} from "./memory-retrieve-pure.js";

function row(
  partial: Partial<MemoryRow> & Pick<MemoryRow, "id" | "content">,
): MemoryRow {
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

describe("memory-retrieve-pure", () => {
  it("pins high-score rows", () => {
    const pinned = row({ id: "p", content: "pref", score: MEMORY_PIN_SCORE });
    expect(isMemoryPinned(pinned)).toBe(true);
    expect(decayedMemoryScore(pinned)).toBeGreaterThan(MEMORY_PIN_SCORE);
  });

  it("warm matches query tokens", () => {
    const rows = [
      row({ id: "a", content: "Use Tailwind for Studio chrome", score: 1 }),
      row({ id: "b", content: "Unrelated fact", score: 50 }),
    ];
    const got = retrieveMemoryHotWarm({
      rows,
      scope: "all",
      projectId: null,
      query: "tailwind chrome",
      hotLimit: 1,
      warmLimit: 4,
    });
    expect(got.some((r) => r.id === "a")).toBe(true);
  });

  it("exports json", () => {
    const json = exportMemoryJson([row({ id: "x", content: "hi" })]);
    expect(JSON.parse(json).rows[0].id).toBe("x");
  });
});
