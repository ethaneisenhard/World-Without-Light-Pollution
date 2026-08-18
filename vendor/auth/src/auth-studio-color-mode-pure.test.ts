import { describe, expect, it } from "vitest";
import {
  STUDIO_AUTH_COLOR_MODE_STORAGE_KEY,
  studioAuthColorModeClientScript,
  studioAuthColorModeControlsHtml,
} from "./auth-studio-color-mode-pure.js";

describe("studio auth color mode", () => {
  it("matches shell storage key", () => {
    expect(STUDIO_AUTH_COLOR_MODE_STORAGE_KEY).toBe("glassbox-studio:color-mode");
  });

  it("renders one shell-style sun/moon toggle button", () => {
    const html = studioAuthColorModeControlsHtml();
    expect(html).toContain("data-as-auth-color-mode-toggle");
    expect(html).toContain('data-as-color-mode-icon="sun"');
    expect(html).toContain('data-as-color-mode-icon="moon"');
    expect(html).not.toContain('data-as-color-mode="light"');
    expect(html).not.toContain('data-as-color-mode="dark"');
    expect(html.match(/<button/g)?.length).toBe(1);
    expect(html).toContain("<svg");
  });

  it("client script defaults to system and toggles light/dark like shell", () => {
    const js = studioAuthColorModeClientScript();
    expect(js).toContain(STUDIO_AUTH_COLOR_MODE_STORAGE_KEY);
    expect(js).toContain('return "system"');
    expect(js).toContain('apply(dark ? "light" : "dark")');
  });
});
