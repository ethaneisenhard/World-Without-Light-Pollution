import { describe, expect, it } from "vitest";
import {
  normalizeProjectWritePath,
  shouldAutoOpenLiveAfterWrite,
} from "./live-agent-refresh-pure.js";

describe("normalizeProjectWritePath", () => {
  it("strips leading ./ and backslashes", () => {
    expect(normalizeProjectWritePath(".\\src\\index.ts")).toBe("src/index.ts");
    expect(normalizeProjectWritePath("./content/blog/a.mdx")).toBe(
      "content/blog/a.mdx",
    );
  });
});

describe("shouldAutoOpenLiveAfterWrite", () => {
  it("opens for preview trees and markup/css", () => {
    expect(shouldAutoOpenLiveAfterWrite("src/index.ts")).toBe(true);
    expect(shouldAutoOpenLiveAfterWrite("content/pages/home.md")).toBe(true);
    expect(shouldAutoOpenLiveAfterWrite("public/as-hmr-bridge.js")).toBe(true);
    expect(shouldAutoOpenLiveAfterWrite("styles.css")).toBe(true);
    expect(shouldAutoOpenLiveAfterWrite("design/tokens.css")).toBe(true);
  });

  it("skips tests, node_modules, and config dumps", () => {
    expect(shouldAutoOpenLiveAfterWrite("src/blog-pure.test.ts")).toBe(false);
    expect(shouldAutoOpenLiveAfterWrite("node_modules/x/index.js")).toBe(false);
    expect(shouldAutoOpenLiveAfterWrite(".glassbox-studio/project.json")).toBe(
      false,
    );
    expect(shouldAutoOpenLiveAfterWrite("package.json")).toBe(false);
    expect(shouldAutoOpenLiveAfterWrite("README.md")).toBe(false);
  });

  it("rejects traversal", () => {
    expect(shouldAutoOpenLiveAfterWrite("../secrets")).toBe(false);
  });
});
