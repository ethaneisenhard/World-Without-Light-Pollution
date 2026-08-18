import { describe, expect, it } from "vitest";
import { assertPathInProject } from "./project-scope-pure.js";

describe("assertPathInProject", () => {
  it("allows nested relative paths", () => {
    expect(assertPathInProject("content/pages/home.md")).toBe(
      "content/pages/home.md",
    );
  });

  it("strips ./ segments", () => {
    expect(assertPathInProject("./src/./a.ts")).toBe("src/a.ts");
  });

  it("rejects parent escape", () => {
    expect(() => assertPathInProject("../secret")).toThrow(
      /escapes project root/,
    );
    expect(() => assertPathInProject("a/../../b")).toThrow(
      /escapes project root/,
    );
  });

  it("rejects absolute paths", () => {
    expect(() => assertPathInProject("/etc/passwd")).toThrow(
      /escapes project root/,
    );
  });
});
