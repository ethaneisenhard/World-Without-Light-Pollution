import { describe, expect, it } from "vitest";
import {
  filterAndSortMediaItems,
  mediaContentUrl,
  mediaCountLabel,
  mediaFileTypeBadge,
  mediaPassesDateFilter,
  mediaReadableSize,
} from "./media-library-pure.js";

const sample = [
  {
    id: "a",
    filename: "hero.png",
    contentType: "image/png",
    bytes: 2048,
    updatedAt: Date.parse("2026-07-10T12:00:00Z"),
  },
  {
    id: "b",
    filename: "note.txt",
    contentType: "text/plain",
    bytes: 8,
    updatedAt: Date.parse("2026-07-01T12:00:00Z"),
  },
  {
    id: "c",
    filename: "old.jpg",
    contentType: "image/jpeg",
    bytes: 4096,
    updatedAt: Date.parse("2025-01-01T12:00:00Z"),
  },
];

describe("media-library-pure", () => {
  it("formats size and badges", () => {
    expect(mediaReadableSize(8)).toBe("8 B");
    expect(mediaReadableSize(2048)).toBe("2 KB");
    expect(mediaFileTypeBadge(sample[0]!)).toBe("PNG");
    expect(mediaFileTypeBadge(sample[1]!)).toBe("TXT");
  });

  it("filters by type and query", () => {
    const images = filterAndSortMediaItems(sample, { typeFilter: "images" });
    expect(images.map((i) => i.id)).toEqual(["a", "c"]);
    const q = filterAndSortMediaItems(sample, { query: "note" });
    expect(q.map((i) => i.id)).toEqual(["b"]);
  });

  it("sorts by name and newest", () => {
    const byName = filterAndSortMediaItems(sample, { sortBy: "name" });
    expect(byName.map((i) => i.filename)).toEqual([
      "hero.png",
      "note.txt",
      "old.jpg",
    ]);
    const newest = filterAndSortMediaItems(sample, { sortBy: "newest" });
    expect(newest[0]?.id).toBe("a");
  });

  it("date filter respects windows", () => {
    const now = Date.parse("2026-07-11T12:00:00Z");
    expect(mediaPassesDateFilter(sample[0]!.updatedAt, "7d", now)).toBe(true);
    expect(mediaPassesDateFilter(sample[2]!.updatedAt, "7d", now)).toBe(false);
    expect(mediaPassesDateFilter(sample[2]!.updatedAt, "year", now)).toBe(
      false,
    );
  });

  it("count label and content urls", () => {
    expect(mediaCountLabel(3, 3)).toBe("3 items");
    expect(mediaCountLabel(1, 3)).toBe("1 of 3 items");
    expect(mediaContentUrl("studio", undefined, "x")).toBe(
      "/api/studio/media/x",
    );
    expect(mediaContentUrl("project", "demo-marketing", "x")).toBe(
      "/api/projects/demo-marketing/media/x",
    );
  });
});
