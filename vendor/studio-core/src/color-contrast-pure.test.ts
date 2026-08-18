import { describe, expect, it } from "vitest";
import {
  buildShellHueBgPalette,
  circularHueDistance,
  contrastRatio,
  deriveAccentDarkFromHex,
  deriveHairlineBorder,
  ensureReadableFg,
  hexToHueDegrees,
  meetsContrast,
  mixHex,
  parseHexRgb,
  pickReadableInk,
  relativeLuminance,
} from "./color-contrast-pure.js";

describe("color-contrast-pure", () => {
  it("parses hex", () => {
    expect(parseHexRgb("#292524")).toEqual({ r: 41, g: 37, b: 36 });
    expect(parseHexRgb("#abc")).toEqual({ r: 170, g: 187, b: 204 });
  });

  it("ranks dark surface under light ink", () => {
    const darkL = relativeLuminance("#292524")!;
    const lightL = relativeLuminance("#fef3c7")!;
    expect(darkL).toBeLessThan(0.2);
    expect(lightL).toBeGreaterThan(0.8);
    expect(contrastRatio("#fef3c7", "#292524")!).toBeGreaterThan(4.5);
  });

  it("rejects cool slate hairline awareness via mix on warm bg", () => {
    const warm = deriveHairlineBorder("#292524", "#fef3c7", 0.14)!;
    const rgb = parseHexRgb(warm)!;
    // Warm ink mix → more red than blue (not cool slate #232830).
    expect(rgb.r).toBeGreaterThan(rgb.b);
  });

  it("pickReadableInk flips on luminance", () => {
    expect(pickReadableInk("#1c1917")).toBe("#f8fafc");
    expect(pickReadableInk("#fefce8")).toBe("#0f172a");
  });

  it("ensureReadableFg upgrades muddy ink", () => {
    expect(ensureReadableFg("#292524", "#713f12")).toBe("#f8fafc");
    expect(ensureReadableFg("#292524", "#fef3c7")).toBe("#fef3c7");
  });

  it("meetsContrast AA gate", () => {
    expect(meetsContrast("#fef3c7", "#292524")).toBe(true);
    expect(meetsContrast("#713f12", "#292524")).toBe(false);
  });

  it("mixHex interpolates", () => {
    expect(mixHex("#000000", "#ffffff", 0.5)).toBe("#808080");
  });

  it("buildShellHueBgPalette keeps surfaces distinct for fusion-blue", () => {
    const light = buildShellHueBgPalette("#2f39ba", "light")!;
    const dark = buildShellHueBgPalette("#2f39ba", "dark")!;
    expect(new Set(Object.values(light)).size).toBe(4);
    expect(new Set(Object.values(dark)).size).toBe(4);
    expect(light.canvas).not.toBe("#2f39ba");
    expect(relativeLuminance(light.surface)!).toBeGreaterThan(
      relativeLuminance(light.sidebar)!,
    );
    expect(relativeLuminance(dark.canvas)!).toBeLessThan(
      relativeLuminance(dark.muted)!,
    );
  });

  it("deriveAccentDarkFromHex lightens seed", () => {
    const dark = deriveAccentDarkFromHex("#2f39ba");
    expect(dark).not.toBe("#2f39ba");
    expect(relativeLuminance(dark)!).toBeGreaterThan(
      relativeLuminance("#2f39ba")!,
    );
  });

  it("hexToHueDegrees + circularHueDistance", () => {
    expect(hexToHueDegrees("#22c55e")).toBeCloseTo(142, 0);
    expect(circularHueDistance(10, 350)).toBeCloseTo(20, 0);
    expect(circularHueDistance(0, 180)).toBeCloseTo(180, 0);
    expect(hexToHueDegrees("#808080")).toBeNull();
  });
});
