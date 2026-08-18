import { describe, expect, it } from "vitest";
import {
  candidatesToStagedRows,
  extractMemoryCandidatesFromTurn,
} from "./memory-extract-pure.js";

describe("memory-extract-pure", () => {
  it("extracts remember / prefer lines as staged", () => {
    const c = extractMemoryCandidatesFromTurn({
      userText: 'Remember that we use Tailwind only.\nPrefer dark mode.',
      projectId: "demo-blog",
    });
    expect(c.length).toBeGreaterThanOrEqual(1);
    const rows = candidatesToStagedRows(c, {
      projectId: "demo-blog",
      source: "turn:test",
      now: 1,
    });
    expect(rows.every((r) => r.status === "staged")).toBe(true);
    expect(rows[0]!.origin).toBe("self_learn");
  });
});
