import { describe, expect, it } from "vitest";
import {
  buildShellSafeWindowHueRemap,
  buildWindowColorStyleBlock,
  DEFAULT_WINDOW_KIND_HUES,
  DEFAULT_WINDOW_COLOR_PALETTE,
  deriveWindowHuePaint,
  kindsOwningWindowHue,
  paintMapForEffectiveHues,
  parseWindowColorOverrides,
  patchWindowColorOverride,
  resolveEffectiveWindowHue,
  resolveEffectiveWindowHueMap,
  resolveShellSafeWindowHueMap,
  windowHueCollidesWithShell,
  type WindowHueId,
} from "./window-colors-pure.js";
import {
  circularHueDistance,
  hexToHueDegrees,
  meetsContrast,
} from "./color-contrast-pure.js";

describe("window-colors-pure", () => {
  it("derives readable title ink on header fill", () => {
    const paint = deriveWindowHuePaint({ seed: "#3b82f6" });
    expect(paint).not.toBeNull();
    expect(meetsContrast(paint!.titleInk, paint!.headerBg)).toBe(true);
    expect(paint!.accent.toLowerCase()).toBe("#3b82f6");
  });

  it("honors explicit paint overrides", () => {
    const paint = deriveWindowHuePaint({
      seed: "#3b82f6",
      overrides: { headerBg: "#112233", titleInk: "#abcdef" },
    });
    expect(paint?.headerBg.toLowerCase()).toBe("#112233");
    expect(paint?.titleInk.toLowerCase()).toBe("#abcdef");
  });

  it("resolves project → global → default", () => {
    expect(resolveEffectiveWindowHue("code")).toBe("blue");
    expect(
      resolveEffectiveWindowHue("code", { global: { code: "rose" } }),
    ).toBe("rose");
    expect(
      resolveEffectiveWindowHue("code", {
        global: { code: "rose" },
        project: { code: "lime" },
      }),
    ).toBe("lime");
  });

  it("lists kinds owning a hue for picker labels", () => {
    const effective = resolveEffectiveWindowHueMap({
      global: { chat: "blue", terminal: "blue" },
    });
    const owners = kindsOwningWindowHue("blue", effective);
    expect(owners).toContain("code");
    expect(owners).toContain("chat");
    expect(owners).toContain("terminal");
  });

  it("builds style block with CSS vars per kind", () => {
    const paints = paintMapForEffectiveHues(DEFAULT_WINDOW_KIND_HUES);
    const css = buildWindowColorStyleBlock(paints);
    expect(css).toContain("--studio-win-accent:");
    expect(css).toContain(".studio-win--code");
    expect(css).toContain("--studio-win-header-bg:");
    expect(css).toContain(".studio-canvas-tab");
    expect(css).toContain("--studio-tab-title: var(--studio-win-title)");
    // Kind hue is tab-only — never solid-fill DeskPane titlebars.
    expect(css).not.toContain(".dp-header");
    expect(css).not.toContain("background: var(--studio-win-header-bg)");
  });

  it("parses and patches override maps", () => {
    expect(parseWindowColorOverrides({ code: "blue", nope: "x" })).toEqual({
      code: "blue",
    });
    expect(patchWindowColorOverride({ code: "rose" }, "code", null)).toEqual(
      {},
    );
    expect(patchWindowColorOverride({}, "chat", "amber")).toEqual({
      chat: "amber",
    });
  });

  it("remaps emerald/cyan away from green shell accent", () => {
    const green = "#22c55e";
    expect(windowHueCollidesWithShell("#10b981", green)).toBe(true);
    expect(windowHueCollidesWithShell("#06b6d4", green)).toBe(true);
    expect(windowHueCollidesWithShell("#3b82f6", green)).toBe(false);

    const remap = buildShellSafeWindowHueRemap(green);
    expect(remap.emerald).not.toBe("emerald");
    expect(remap.cyan).not.toBe("cyan");
    expect(remap.rose).toBe("rose");

    const seedFor = (id: WindowHueId) =>
      DEFAULT_WINDOW_COLOR_PALETTE.find((h) => h.id === id)!.seed;
    expect(windowHueCollidesWithShell(seedFor(remap.emerald), green)).toBe(
      false,
    );

    const safe = resolveShellSafeWindowHueMap(DEFAULT_WINDOW_KIND_HUES, green);
    expect(safe.live).not.toBe("emerald");
    expect(safe.home).not.toBe("cyan");
    expect(safe.media).toBe("rose");

    const paints = paintMapForEffectiveHues(DEFAULT_WINDOW_KIND_HUES, {
      shellAccent: green,
    });
    const greenHue = hexToHueDegrees(green)!;
    const liveHue = hexToHueDegrees(paints.live.accent)!;
    expect(circularHueDistance(liveHue, greenHue)).toBeGreaterThanOrEqual(50);
  });

  it("remaps yellow family away from yellow shell", () => {
    const yellow = "#eab308";
    const remap = buildShellSafeWindowHueRemap(yellow);
    expect(remap.yellow).not.toBe("yellow");
    expect(remap.amber).not.toBe("amber");
    expect(remap.blue).toBe("blue");
  });

  it("identity remap when shellAccent missing", () => {
    const remap = buildShellSafeWindowHueRemap(null);
    expect(remap.emerald).toBe("emerald");
    const paints = paintMapForEffectiveHues(DEFAULT_WINDOW_KIND_HUES);
    expect(paints.live.accent.toLowerCase()).toBe("#10b981");
  });
});
