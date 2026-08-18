import { describe, expect, it } from "vitest";
import {
  SANDBOX_CHROME_CSS,
  SANDBOX_DEFAULT_THEME_CSS,
} from "./chrome-css.js";

describe("sandbox chrome stage tokens", () => {
  it("defines light + dark stage / shell tokens", () => {
    for (const token of [
      "--as-sb-shell-bg",
      "--as-sb-stage-bg",
      "--as-sb-stage-fg",
      "--as-sb-stage-pad",
      "--as-sb-canvas-dot",
      "--as-sb-dot-size",
    ]) {
      expect(SANDBOX_DEFAULT_THEME_CSS).toContain(token);
    }
    expect(SANDBOX_DEFAULT_THEME_CSS).not.toContain("--as-sb-stage-dot");
    expect(SANDBOX_DEFAULT_THEME_CSS).toMatch(/:root\s*\{[\s\S]*--as-sb-stage-bg/);
    expect(SANDBOX_DEFAULT_THEME_CSS).toMatch(/\.dark\s*\{[\s\S]*--as-sb-stage-bg/);
  });

  it("canvas has dots; stage is solid fill only", () => {
    expect(SANDBOX_CHROME_CSS).toContain("var(--as-sb-canvas-dot");
    expect(SANDBOX_CHROME_CSS).toMatch(
      /\.as-sb-canvas\s*\{[\s\S]*?radial-gradient/,
    );
    expect(SANDBOX_CHROME_CSS).toContain("var(--as-sb-stage-bg");
    expect(SANDBOX_CHROME_CSS).toContain("var(--as-sb-stage-fg");
    expect(SANDBOX_CHROME_CSS).toContain("var(--as-sb-stage-pad");
    expect(SANDBOX_CHROME_CSS).not.toContain("--as-sb-stage-dot");
    expect(SANDBOX_CHROME_CSS).not.toMatch(
      /\.as-sb-stage\s*\{[^}]*radial-gradient/,
    );
    expect(SANDBOX_CHROME_CSS).not.toMatch(
      /\.as-sb-stage\s*\{[^}]*background:\s*#fff/,
    );
    expect(SANDBOX_CHROME_CSS).not.toMatch(
      /\.as-sb-stage\s*\{[^}]*background-color:\s*#f4f4f5/,
    );
  });
});
