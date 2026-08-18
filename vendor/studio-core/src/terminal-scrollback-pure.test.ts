import { describe, expect, it } from "vitest";
import {
  appendTrimmedScrollback,
  trimChunkBuffer,
} from "./terminal-scrollback-pure.js";

describe("appendTrimmedScrollback", () => {
  it("keeps the tail when over maxBytes", () => {
    expect(appendTrimmedScrollback("abcdef", "ghij", 8)).toBe("cdefghij");
  });
});

describe("trimChunkBuffer", () => {
  it("trims by chunk count then bytes", () => {
    const chunks = ["aaa", "bbb", "ccc", "ddd"];
    expect(trimChunkBuffer(chunks, 2, 10_000)).toEqual(["ccc", "ddd"]);
    // 12 bytes → drop until ≤6 → only last chunk remains
    expect(trimChunkBuffer(["aaaa", "bbbb", "cccc"], 10, 6)).toEqual(["cccc"]);
  });
});
