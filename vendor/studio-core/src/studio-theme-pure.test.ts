import { describe, expect, it } from "vitest";
import {
  applyStudioThemeColorPatch,
  isShellChromeLayoutChatIntent,
  parseShellBackgroundChatIntent,
  parseStudioThemeColorPatch,
  resolveThemePatchForExistingShell,
  summarizeStudioThemeAccents,
} from "./studio-theme-pure.js";

describe("parseStudioThemeColorPatch", () => {
  it("accepts hex accents and defaults fillShell for chrome paint", () => {
    const r = parseStudioThemeColorPatch({
      accent: "#9333ea",
      accentDark: "#d8b4fe",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.patch.accent).toBe("#9333ea");
      expect(r.patch.accentDark).toBe("#d8b4fe");
      expect(r.patch.fillShell).toBe(true);
      expect(r.patch.color?.bg?.canvas).toMatch(/^#[0-9a-f]{6}$/);
      expect(r.patch.color?.bg?.canvas).not.toBe(r.patch.color?.bg?.surface);
      expect(r.patch.color?.bg?.sidebar).not.toBe(r.patch.color?.bg?.canvas);
    }
  });

  it("accepts named colors (model often passes yellow not #fbbf24)", () => {
    const r = parseStudioThemeColorPatch({ accent: "yellow" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.patch.accent).toBe("#fbbf24");
      expect(r.patch.accentDark).toBe("#fcd34d");
      expect(r.patch.color?.bg?.canvas).toMatch(/^#[0-9a-f]{6}$/);
      expect(r.patch.color?.bg?.canvas).not.toBe("#fbbf24");
    }
  });

  it("accepts fusion-blue named alias → #2f39ba fillShell", () => {
    const r = parseStudioThemeColorPatch({ accent: "fusion-blue" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.patch.accent).toBe("#2f39ba");
      expect(r.patch.color?.bg?.canvas).not.toBe("#2f39ba");
      expect(r.patch.color?.bg?.sidebar).not.toBe(r.patch.color?.bg?.surface);
    }
  });

  it("accepts nested bg/fg color maps", () => {
    const r = parseStudioThemeColorPatch({
      color: {
        bg: { sidebar: "#0f172a", muted: "#1e293b" },
        fg: { accent: "#10b981", onAccent: "#ffffff" },
      },
      colorDark: {
        bg: { sidebar: "#020617" },
      },
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.patch.color?.bg?.sidebar).toBe("#0f172a");
      expect(r.patch.colorDark?.bg?.sidebar).toBe("#020617");
    }
  });

  it("fillShell paints a distinct hue scale from accent (not monochrome)", () => {
    const r = parseStudioThemeColorPatch({
      accent: "#fbbf24",
      accentDark: "#fcd34d",
      fillShell: true,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const light = r.patch.color?.bg!;
      const dark = r.patch.colorDark?.bg!;
      const lightSet = new Set([light.canvas, light.surface, light.sidebar, light.muted]);
      expect(lightSet.size).toBeGreaterThanOrEqual(3);
      expect(light.canvas).not.toBe("#fbbf24");
      const darkSet = new Set([dark.canvas, dark.surface, dark.sidebar, dark.muted]);
      expect(darkSet.size).toBeGreaterThanOrEqual(3);
      // Background-text awareness — hairline + ink follow the wash hue.
      expect(r.patch.color?.border?.default).toMatch(/^#[0-9a-f]{6}$/);
      expect(r.patch.color?.fg?.primary).toBe("#0f172a");
      expect(r.patch.colorDark?.fg?.primary).toBe("#f8fafc");
    }
  });

  it("rejects fillShell without a fill source", () => {
    expect(parseStudioThemeColorPatch({ fillShell: true }).ok).toBe(false);
  });

  it("rejects unknown color names", () => {
    expect(parseStudioThemeColorPatch({ accent: "chartreuse" }).ok).toBe(false);
  });

  it("fillShell:false keeps accent-only (no bg expand)", () => {
    const r = parseStudioThemeColorPatch({
      accent: "#9333ea",
      fillShell: false,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.patch.fillShell).toBe(false);
      expect(r.patch.color?.bg).toBeUndefined();
    }
  });
});

describe("isShellChromeLayoutChatIntent", () => {
  it("flags pet next to green dot", () => {
    expect(
      isShellChromeLayoutChatIntent(
        "can you move the pet next to the green dot",
      ),
    ).toBe(true);
  });

  it("does not flag real shell recolor", () => {
    expect(
      isShellChromeLayoutChatIntent(
        "Please change the background color to yellow.",
      ),
    ).toBe(false);
  });
});

describe("parseShellBackgroundChatIntent", () => {
  it("parses natural background prompts", () => {
    const r = parseShellBackgroundChatIntent(
      "Please change the background color to yellow.",
    );
    expect(r).toMatchObject({
      accent: "#fbbf24",
      accentDark: "#fcd34d",
      fillShell: true,
      label: "yellow",
      soft: false,
    });
  });

  it("parses muted/readable workspace phrasing (no 'to yellow' trap on 'a')", () => {
    const r = parseShellBackgroundChatIntent(
      "Please update the Beehog workspace color to a yellow muted readable color.",
    );
    expect(r?.soft).toBe(true);
    expect(r?.label).toBe("muted-yellow");
    expect(r?.color?.bg?.canvas).toBe("#fefce8");
    expect(r?.color?.border?.default).toBe("#e8d9a8");
    expect(r?.colorDark?.border?.default).toBe("#3f3429");
    expect(r?.fillShell).toBeUndefined();
  });

  it("prefers target color over complaint color (still looks green → blue)", () => {
    const r = parseShellBackgroundChatIntent(
      "Still looks green. Can we change it to a blue, please?",
    );
    expect(r?.label).toBe("blue");
    expect(r?.accent).toBe("#2563eb");
  });

  it("prefers purple target when complaining about green", () => {
    const r = parseShellBackgroundChatIntent(
      "Still looks green. Could you change it back to that purple?",
    );
    expect(r?.label).toBe("purple");
  });

  it("resolves fusion blue (spaced) as fusion-blue", () => {
    const r = parseShellBackgroundChatIntent(
      "change the workspace shell to fusion blue",
    );
    expect(r?.accent).toBe("#2f39ba");
    expect(r?.label).toBe("fusion-blue");
  });

  it("does not latch 'next to the green dot' as fillShell green", () => {
    expect(
      parseShellBackgroundChatIntent(
        "can you move the pet next to the green dot",
      ),
    ).toBeNull();
  });

  it("does not latch pet placement beside connected", () => {
    expect(
      parseShellBackgroundChatIntent(
        "put the pet beside the connected status",
      ),
    ).toBeNull();
  });

  it("still parses short change-to-color without bare 'to' alone", () => {
    const r = parseShellBackgroundChatIntent("change it to green");
    expect(r?.label).toBe("green");
    expect(r?.accent).toBe("#22c55e");
  });
});

describe("applyStudioThemeColorPatch", () => {
  it("patches light and dark accents", () => {
    const next = applyStudioThemeColorPatch(
      {
        color: { fg: { accent: "#2563eb", primary: "#000" } },
        colorDark: { fg: { accent: "#4f8cff" } },
      },
      { accent: "#9333ea", accentDark: "#d8b4fe" },
    );
    expect(summarizeStudioThemeAccents(next)).toEqual({
      accent: "#9333ea",
      accentDark: "#d8b4fe",
    });
    expect(next.color?.fg?.primary).toBe("#000");
  });

  it("merges sidebar bg into tokens", () => {
    const next = applyStudioThemeColorPatch(
      { color: { bg: { sidebar: "#fff", canvas: "#f4f5f7" } } },
      { color: { bg: { sidebar: "#0f172a" } } },
    );
    expect(next.color?.bg).toEqual({ sidebar: "#0f172a", canvas: "#f4f5f7" });
  });

  it("fillShell overwrites prior purple sidebar", () => {
    const next = applyStudioThemeColorPatch(
      {
        color: { bg: { sidebar: "#f5f3ff", muted: "#ede9fe" } },
        colorDark: { bg: { sidebar: "#1e1b4b", muted: "#312e81" } },
      },
      { accent: "#fbbf24", accentDark: "#fcd34d", fillShell: true },
    );
    expect(next.color?.bg?.sidebar).not.toBe("#f5f3ff");
    expect(next.color?.bg?.sidebar).not.toBe(next.color?.bg?.canvas);
    expect(next.colorDark?.bg?.sidebar).not.toBe("#1e1b4b");
    expect(next.color?.fg?.accent).toBe("#fbbf24");
  });
});

describe("resolveThemePatchForExistingShell", () => {
  it("auto-repaints bg when shell already filled and patch is accent-only", () => {
    const patch = resolveThemePatchForExistingShell(
      { accent: "#7c3aed", accentDark: "#c084fc" },
      {
        color: { bg: { canvas: "#fbbf24", sidebar: "#fbbf24" } },
        colorDark: { bg: { canvas: "#fcd34d", sidebar: "#fbbf24" } },
      },
    );
    expect(patch.fillShell).toBe(true);
    expect(patch.color?.bg?.canvas).not.toBe("#fbbf24");
    expect(patch.color?.bg?.canvas).not.toBe(patch.color?.bg?.surface);
    expect(patch.colorDark?.bg?.canvas).not.toBe("#fcd34d");
  });

  it("does not auto-fill when shell has no painted bg", () => {
    const patch = resolveThemePatchForExistingShell(
      { accent: "#7c3aed" },
      { color: { fg: { accent: "#2563eb" } } },
    );
    expect(patch.fillShell).toBeUndefined();
    expect(patch.color?.bg).toBeUndefined();
  });
});
