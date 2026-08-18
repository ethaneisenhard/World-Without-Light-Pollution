import { describe, expect, it } from "vitest";
import {
  assertGitCommitMessage,
  assertGitPathspec,
  normalizeGitBranch,
  normalizeGitRemote,
} from "./git-tool-pure.js";

describe("git-tool-pure", () => {
  it("requires commit message", () => {
    expect(() => assertGitCommitMessage("")).toThrow(/required/);
    expect(assertGitCommitMessage("fix: x")).toBe("fix: x");
  });

  it("rejects escaping pathspecs", () => {
    expect(() => assertGitPathspec("../x")).toThrow(/escapes/);
    expect(() => assertGitPathspec("/etc/passwd")).toThrow(/absolute/);
    expect(assertGitPathspec("src/a.ts")).toBe("src/a.ts");
  });

  it("normalizes remote/branch", () => {
    expect(normalizeGitRemote(undefined)).toBe("origin");
    expect(normalizeGitBranch("")).toBeUndefined();
    expect(normalizeGitBranch("feat/x")).toBe("feat/x");
  });
});
