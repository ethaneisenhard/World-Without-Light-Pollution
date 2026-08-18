import { describe, expect, it } from "vitest";
import {
  BOOT_SPLASH_FACE_CSS,
  defaultBootSplashParams,
  defaultStudioBootSplashConfig,
  parseBootSplashParams,
  parseStudioBootSplashConfig,
  resolveBootSplashColors,
  resolveBootSplashFaceCss,
  resolveBootSplashMountParams,
  resolveBootSplashPaletteId,
  urlWantsBootSplashHold,
  urlWantsBootSplashStill,
  urlWantsBootSplashEdit,
  BOOT_SPLASH_STATUS_COPY,
  BOOT_SPLASH_CRITICAL_CSS,
  BOOT_SPLASH_REBUILD_COPY,
  bootSplashStatusFace,
} from "./boot-splash-pure.js";

describe("boot-splash-pure", () => {
  it("urlWantsBootSplashHold reads ?splash=1|still|edit", () => {
    expect(urlWantsBootSplashHold("http://127.0.0.1:4400/?splash=1")).toBe(
      true,
    );
    expect(urlWantsBootSplashHold("/?splash=1&focus=chat")).toBe(true);
    expect(urlWantsBootSplashHold("/?splash=still")).toBe(true);
    expect(urlWantsBootSplashHold("/?splash=edit")).toBe(true);
    expect(urlWantsBootSplashHold("?ssrOnly=1")).toBe(false);
    expect(urlWantsBootSplashHold("")).toBe(false);
  });

  it("urlWantsBootSplashStill freezes glass box for favicon capture", () => {
    expect(urlWantsBootSplashStill("/?splash=still")).toBe(true);
    expect(urlWantsBootSplashStill("/?splash=1&still=1")).toBe(true);
    expect(urlWantsBootSplashStill("/?splash=1")).toBe(false);
    expect(urlWantsBootSplashStill("/?splash=edit")).toBe(false);
    expect(urlWantsBootSplashStill("")).toBe(false);
  });

  it("urlWantsBootSplashEdit opens animation toggles (not still)", () => {
    expect(urlWantsBootSplashEdit("/?splash=1")).toBe(true);
    expect(urlWantsBootSplashEdit("/?splash=edit")).toBe(true);
    expect(urlWantsBootSplashEdit("/?splash=still")).toBe(false);
    expect(urlWantsBootSplashEdit("/?splash=1&still=1")).toBe(false);
    expect(urlWantsBootSplashEdit("")).toBe(false);
  });

  it("boot splash status copy + critical CSS paint before Tailwind", () => {
    expect(BOOT_SPLASH_STATUS_COPY).toBe("Connecting to the world...");
    expect(bootSplashStatusFace("Connecting to the world")).toBe(
      "Connecting to the world...",
    );
    expect(bootSplashStatusFace("Connecting to the world...")).toBe(
      "Connecting to the world...",
    );
    expect(bootSplashStatusFace(BOOT_SPLASH_REBUILD_COPY)).toBe(
      "Updating Glass Box Studio...",
    );
    expect(BOOT_SPLASH_CRITICAL_CSS).toContain("#as-boot-splash{");
    expect(BOOT_SPLASH_CRITICAL_CSS).toContain("position:fixed");
    expect(BOOT_SPLASH_CRITICAL_CSS).toContain("z-index:400");
    expect(BOOT_SPLASH_CRITICAL_CSS).toContain(
      'html:not([data-as-boot="hydrated"]) #root',
    );
    expect(BOOT_SPLASH_CRITICAL_CSS).toContain("visibility:hidden");
    expect(BOOT_SPLASH_CRITICAL_CSS).toContain("[data-studio-mobile-dock]");
    expect(BOOT_SPLASH_CRITICAL_CSS).toContain("display:none");
    expect(BOOT_SPLASH_CRITICAL_CSS).toContain("min-height:100dvh");
    expect(BOOT_SPLASH_CRITICAL_CSS).toContain("38vmin");
    expect(BOOT_SPLASH_CRITICAL_CSS).toContain(".as-boot-splash-status");
    expect(BOOT_SPLASH_CRITICAL_CSS).toContain("data-as-boot-splash-ready");
    expect(BOOT_SPLASH_CRITICAL_CSS).toContain("as-boot-splash-status-flip");
    expect(BOOT_SPLASH_CRITICAL_CSS).toContain("attr(data-as-boot-splash-status-copy)");
    expect(BOOT_SPLASH_CRITICAL_CSS).not.toContain("as-boot-splash-status-breathe");
    expect(BOOT_SPLASH_CRITICAL_CSS).not.toContain("as-boot-splash-status-line");
    expect(BOOT_SPLASH_CRITICAL_CSS).toContain("--as-color-bg-canvas");
    expect(BOOT_SPLASH_CRITICAL_CSS).toContain("--as-splash-land");
    expect(BOOT_SPLASH_CRITICAL_CSS).toContain("--as-splash-grat-land");
    expect(BOOT_SPLASH_CRITICAL_CSS).toContain("data-as-boot-splash-still-frame");
    expect(BOOT_SPLASH_CRITICAL_CSS).not.toContain("globe-img");
  });

  it("defaultStudioBootSplashConfig is violet", () => {
    expect(defaultStudioBootSplashConfig()).toEqual({ paletteId: "violet" });
    expect(BOOT_SPLASH_FACE_CSS.bg).toBe("#0f0a1a");
    expect(BOOT_SPLASH_FACE_CSS.fg).toBe("#ede9fe");
  });

  it("resolveBootSplashFaceCss follows saved palette (not always violet)", () => {
    const ink = resolveBootSplashFaceCss({
      config: { paletteId: "ink" },
      prefersDark: false,
    });
    expect(ink.bg).toBe("#ffffff");
    expect(ink.fg).toBe("#000000");

    const forest = resolveBootSplashFaceCss({
      config: { paletteId: "forest" },
      prefersDark: false,
    });
    expect(forest.bg).toBe("#ecfdf5");
    expect(forest.fg).toBe("#052e16");
  });

  it("system → ink in light, noir in dark", () => {
    expect(resolveBootSplashPaletteId("system", false)).toBe("ink");
    expect(resolveBootSplashPaletteId("system", true)).toBe("noir");
    expect(resolveBootSplashColors({ paletteId: "system", prefersDark: false }).bg).toBe(
      "#ffffff",
    );
    expect(resolveBootSplashColors({ paletteId: "system", prefersDark: true }).bg).toBe(
      "#0a0a0a",
    );
  });

  it("default params use Violet palette + dual spin", () => {
    const light = defaultBootSplashParams(false);
    expect(light.paletteId).toBe("violet");
    expect(light.colors.bg).toBe("#0f0a1a");
    expect(light.colors.boxFront).toBe("#c4b5fd");
    expect(light.spin).toBe(true);
    expect(light.spinBox).toBe(true);

    const dark = defaultBootSplashParams(true);
    expect(dark.colors.bg).toBe("#0f0a1a");
  });

  it("parse keeps named palette and clamps config bag", () => {
    const cfg = parseStudioBootSplashConfig({
      paletteId: "violet",
      params: { spinSpeed: 0.5, spin: false },
    });
    expect(cfg.paletteId).toBe("violet");
    expect(cfg.params?.spin).toBe(false);
    expect(cfg.params?.spinSpeed).toBe(0.5);

    const mount = resolveBootSplashMountParams({
      config: cfg,
      prefersDark: true,
    });
    expect(mount.paletteId).toBe("violet");
    expect(mount.colors.boxFront).toBe("#c4b5fd");
  });

  it("custom colors stick when paletteId=custom", () => {
    const p = parseBootSplashParams(
      {
        paletteId: "custom",
        colors: { bg: "#112233", land: "#abcdef" },
      },
      false,
    );
    expect(p.paletteId).toBe("custom");
    expect(p.colors.bg).toBe("#112233");
    expect(p.colors.land).toBe("#abcdef");
  });

  it("parseStudioBootSplashConfig keeps markAsset", () => {
    const cfg = parseStudioBootSplashConfig({
      paletteId: "ink",
      markAsset: {
        scope: "studio",
        assetId: "abc",
        label: "Wordmark",
      },
    });
    expect(cfg.markAsset?.scope).toBe("studio");
    expect(cfg.markAsset?.assetId).toBe("abc");
    expect(cfg.markAsset?.label).toBe("Wordmark");

    const bad = parseStudioBootSplashConfig({
      paletteId: "ink",
      markAsset: { scope: "project", assetId: "x" },
    });
    expect(bad.markAsset).toBeNull();
  });
});
