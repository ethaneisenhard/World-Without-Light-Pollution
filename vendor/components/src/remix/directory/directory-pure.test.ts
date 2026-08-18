import { describe, expect, it } from "vitest";
import {
  clampDirectoryPage,
  filterDirectoryByQuery,
  mergeDirectoryClasses,
  paginateDirectory,
} from "./index.js";

describe("@glassbox-studio/components/directory", () => {
  it("paginates via studio-core pure", () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    const p1 = paginateDirectory(items, 1, 9);
    expect(p1.items).toHaveLength(9);
    expect(p1.totalPages).toBe(3);
    expect(clampDirectoryPage(99, 3)).toBe(3);
  });

  it("filters query", () => {
    expect(
      filterDirectoryByQuery(
        [{ t: "n8n" }, { t: "GitHub" }],
        "git",
        (x) => [x.t],
      ),
    ).toEqual([{ t: "GitHub" }]);
  });

  it("merges class slots", () => {
    const c = mergeDirectoryClasses({ title: "text-ink font-display text-2xl" });
    expect(c.title).toContain("text-ink");
    expect(c.shell).toBeTruthy();
  });
});
