import { describe, expect, it } from "vitest";
import {
  compareRecordsCell,
  normalizeRecordsPage,
  normalizeRecordsSearchQ,
  normalizeRecordsSortDir,
  rowMatchesRecordsSearch,
} from "./records-query-pure.js";

describe("normalizeRecordsSortDir", () => {
  it("accepts asc/desc", () => {
    expect(normalizeRecordsSortDir("ASC")).toBe("asc");
    expect(normalizeRecordsSortDir("desc")).toBe("desc");
  });
  it("rejects junk", () => {
    expect(normalizeRecordsSortDir("sideways")).toBeUndefined();
    expect(normalizeRecordsSortDir("")).toBeUndefined();
  });
});

describe("normalizeRecordsSearchQ", () => {
  it("trims and drops empty", () => {
    expect(normalizeRecordsSearchQ("  hi  ")).toBe("hi");
    expect(normalizeRecordsSearchQ("   ")).toBeUndefined();
  });
});

describe("normalizeRecordsPage", () => {
  it("clamps", () => {
    expect(normalizeRecordsPage({ limit: 0, offset: -1 })).toEqual({
      limit: 1,
      offset: 0,
    });
    expect(normalizeRecordsPage({ limit: 9999 })).toEqual({
      limit: 500,
      offset: 0,
    });
  });
});

describe("rowMatchesRecordsSearch", () => {
  it("matches substring across cells", () => {
    const row = { id: "1", email: "Ada@Ex.com", n: 42 };
    expect(rowMatchesRecordsSearch(row, "ada")).toBe(true);
    expect(rowMatchesRecordsSearch(row, "99")).toBe(false);
  });
});

describe("compareRecordsCell", () => {
  it("sorts numbers and nulls", () => {
    expect(compareRecordsCell(1, 2, "asc")).toBeLessThan(0);
    expect(compareRecordsCell(1, 2, "desc")).toBeGreaterThan(0);
    expect(compareRecordsCell(null, 1, "asc")).toBeLessThan(0);
  });
});
