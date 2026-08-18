import { describe, expect, it } from "vitest";
import { shouldSkipTreeEntry } from "./tree-pure.js";

describe("shouldSkipTreeEntry", () => {
  it("skips dotfiles, node_modules, .git, dist, .wrangler", () => {
    expect(shouldSkipTreeEntry("node_modules")).toBe(true);
    expect(shouldSkipTreeEntry(".git")).toBe(true);
    expect(shouldSkipTreeEntry("dist")).toBe(true);
    expect(shouldSkipTreeEntry(".wrangler")).toBe(true);
    expect(shouldSkipTreeEntry(".env")).toBe(true);
    expect(shouldSkipTreeEntry("")).toBe(true);
  });

  it("keeps normal source paths", () => {
    expect(shouldSkipTreeEntry("src")).toBe(false);
    expect(shouldSkipTreeEntry("package.json")).toBe(false);
    expect(shouldSkipTreeEntry("content")).toBe(false);
  });
});
