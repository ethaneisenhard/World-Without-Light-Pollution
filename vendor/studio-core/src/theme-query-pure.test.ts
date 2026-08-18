import { describe, expect, it } from "vitest";
import {
  AS_THEME_PARAM,
  appendAsThemeParam,
  parseAsThemeParam,
  siteThemeBootInlineScript,
} from "./theme-query-pure.js";

describe("parseAsThemeParam", () => {
  it("accepts light/dark only", () => {
    expect(parseAsThemeParam("light")).toBe("light");
    expect(parseAsThemeParam("dark")).toBe("dark");
    expect(parseAsThemeParam("system")).toBeNull();
    expect(parseAsThemeParam(null)).toBeNull();
  });
});

describe("appendAsThemeParam", () => {
  it("appends to absolute URL", () => {
    expect(appendAsThemeParam("http://127.0.0.1:8789/", "dark")).toContain(
      `${AS_THEME_PARAM}=dark`,
    );
  });

  it("replaces existing as-theme", () => {
    const next = appendAsThemeParam(
      "http://127.0.0.1:8789/?as-theme=light&mode=sandbox",
      "dark",
    );
    expect(next).toContain("as-theme=dark");
    expect(next).not.toContain("as-theme=light");
    expect(next).toContain("mode=sandbox");
  });
});

describe("siteThemeBootInlineScript", () => {
  it("emits storage key and toggle selector", () => {
    const js = siteThemeBootInlineScript({
      storageKey: "demo:theme",
      toggleSelector: "[data-as-theme-toggle]",
    });
    expect(js).toContain("demo:theme");
    expect(js).toContain("data-as-theme-toggle");
    expect(js).not.toContain("textContent");
    expect(js).not.toContain("☀");
    expect(js).not.toContain("☽");
  });
});
