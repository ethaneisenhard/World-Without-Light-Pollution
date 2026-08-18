import { describe, expect, it } from "vitest";
import {
  coalesceProposalsByPath,
  proposalIdsNewestFirst,
} from "./proposal-coalesce-pure.js";

describe("coalesceProposalsByPath", () => {
  it("merges same path to earliest before + latest after", () => {
    const coalesced = coalesceProposalsByPath([
      { id: "a", path: "home.md", before: "v0", after: "v1" },
      { id: "b", path: "home.md", before: "v1", after: "v2" },
      { id: "c", path: "about.md", before: null, after: "x" },
    ]);
    expect(coalesced).toEqual([
      {
        path: "home.md",
        before: "v0",
        after: "v2",
        ids: ["a", "b"],
      },
      {
        path: "about.md",
        before: null,
        after: "x",
        ids: ["c"],
      },
    ]);
  });

  it("returns empty for no proposals", () => {
    expect(coalesceProposalsByPath([])).toEqual([]);
  });
});

describe("proposalIdsNewestFirst", () => {
  it("reverses arrival order for Undo All", () => {
    expect(
      proposalIdsNewestFirst([
        { id: "a", path: "x", before: "0", after: "1" },
        { id: "b", path: "x", before: "1", after: "2" },
      ]),
    ).toEqual(["b", "a"]);
  });
});
