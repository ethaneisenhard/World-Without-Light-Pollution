import { describe, expect, it } from "vitest";
import {
  listStudioShellThemeCards,
  matchStudioShellThemeCardId,
  projectShellThemeOverridesStudio,
  resolveEffectiveShellTheme,
  shellFromThemeCardId,
} from "./studio-shell-theme-cards-pure.js";

describe("studio-shell-theme-cards-pure", () => {
  it("lists soft + fill cards for each soft key", () => {
    const cards = listStudioShellThemeCards();
    expect(cards.length).toBe(8);
    expect(
      cards.every((c) => c.id.endsWith("-soft") || c.id.endsWith("-fill")),
    ).toBe(true);
  });

  it("shellFromThemeCardId builds painted soft shell", () => {
    const shell = shellFromThemeCardId("yellow-soft");
    expect(shell?.color?.bg?.canvas).toBeTruthy();
    expect(shell?.color?.fg?.accent).toBeTruthy();
  });

  it("matchStudioShellThemeCardId matches canvas", () => {
    const shell = shellFromThemeCardId("purple-fill");
    expect(matchStudioShellThemeCardId(shell)).toBe("purple-fill");
    expect(
      matchStudioShellThemeCardId({
        color: { bg: { canvas: "#abcdef" }, fg: { accent: "#111111" } },
      }),
    ).toBeNull();
  });

  it("projectShellThemeOverridesStudio detects painted shell", () => {
    expect(projectShellThemeOverridesStudio(undefined)).toBe(false);
    expect(projectShellThemeOverridesStudio({})).toBe(false);
    expect(
      projectShellThemeOverridesStudio({
        color: { bg: { canvas: "#fefce8" } },
      }),
    ).toBe(true);
  });

  it("resolveEffectiveShellTheme respects forceGlobal and inherit", () => {
    const studio = shellFromThemeCardId("yellow-soft");
    const project = shellFromThemeCardId("blue-fill");
    expect(
      resolveEffectiveShellTheme({
        studio,
        project,
        forceGlobal: true,
      }),
    ).toBe(studio);
    expect(
      resolveEffectiveShellTheme({
        studio,
        project,
        forceGlobal: false,
      }),
    ).toBe(project);
    expect(
      resolveEffectiveShellTheme({
        studio,
        project: {},
        forceGlobal: false,
      }),
    ).toBe(studio);
  });
});
