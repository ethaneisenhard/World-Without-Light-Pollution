import { describe, expect, it } from "vitest";
import {
  coerceLiveViewportForCompact,
  filePathToLanguage,
  isCodePreviewPath,
  isMarkdownProsePath,
  isPreviewViewportMode,
  livePreviewUsesFillLayout,
  liveViewportModesForShell,
  liveViewportModesForIconToolbar,
  liveInspectChromeKind,
  liveViewportSwitchKind,
  normalizeLivePreviewPathInput,
  PREVIEW_ALL_VIEW_SCALE,
  PREVIEW_ALL_VIEW_STACK_AT,
  PREVIEW_VIEWPORTS,
  resolveAllViewLayout,
  resolveAllViewScale,
  resolveSingleViewScale,
  scaledPaneFootprint,
} from "./preview-pure.js";

describe("normalizeLivePreviewPathInput", () => {
  it("defaults empty to /", () => {
    expect(normalizeLivePreviewPathInput("")).toBe("/");
    expect(normalizeLivePreviewPathInput("  ")).toBe("/");
  });

  it("adds leading slash and strips trailing slash", () => {
    expect(normalizeLivePreviewPathInput("pricing")).toBe("/pricing");
    expect(normalizeLivePreviewPathInput("/pricing/")).toBe("/pricing");
  });

  it("keeps pathname only from pasted URLs", () => {
    expect(
      normalizeLivePreviewPathInput("http://127.0.0.1:8080/about?x=1#y"),
    ).toBe("/about");
    expect(normalizeLivePreviewPathInput("https://www.beehiiv.com/")).toBe("/");
  });
});

describe("filePathToLanguage", () => {
  it("maps mdx to mdx", () => {
    expect(filePathToLanguage("content/blog/hello.mdx")).toBe("mdx");
  });

  it("falls back to text", () => {
    expect(filePathToLanguage("README")).toBe("text");
  });
});

describe("isCodePreviewPath", () => {
  it("true for tsx", () => {
    expect(isCodePreviewPath("app.tsx")).toBe(true);
  });
});

describe("isMarkdownProsePath", () => {
  it("true for .md only", () => {
    expect(isMarkdownProsePath("content/pages/home.md")).toBe(true);
    expect(isMarkdownProsePath("content/blog/hello.mdx")).toBe(false);
    expect(isMarkdownProsePath("app.tsx")).toBe(false);
  });
});

describe("preview viewports (BrowserUI-aligned)", () => {
  it("desktop / tablet / mobile sizes match BrowserUI", () => {
    expect(PREVIEW_VIEWPORTS.desktop).toMatchObject({ width: 1280, height: 800 });
    expect(PREVIEW_VIEWPORTS.tablet).toMatchObject({ width: 820, height: 1180 });
    expect(PREVIEW_VIEWPORTS.mobile).toMatchObject({ width: 390, height: 844 });
  });

  it("scaledPaneFootprint shrinks clip to frame×scale", () => {
    const fp = scaledPaneFootprint(PREVIEW_VIEWPORTS.mobile, 0.5);
    expect(fp.clipWidth).toBe(195);
    expect(fp.clipHeight).toBe(422);
  });

  it("resolveSingleViewScale fits desktop into narrow canvas", () => {
    const scale = resolveSingleViewScale("desktop", 640, 900);
    expect(scale).toBeLessThan(1);
    expect(scale).toBeGreaterThanOrEqual(0.2);
    // 640 - gutter 48 = 592 / 1280 ≈ 0.4625
    expect(scale).toBeCloseTo(592 / 1280, 2);
  });

  it("resolveSingleViewScale never exceeds 1", () => {
    expect(resolveSingleViewScale("mobile", 2000, 2000)).toBe(1);
  });

  it("resolveAllViewScale caps at ALL_VIEW_SCALE when space allows", () => {
    expect(resolveAllViewScale(4000, 4000)).toBe(PREVIEW_ALL_VIEW_SCALE);
  });

  it("resolveAllViewLayout stacks at phone / skinny pane width", () => {
    expect(resolveAllViewLayout(PREVIEW_ALL_VIEW_STACK_AT)).toBe("stack");
    expect(resolveAllViewLayout(390)).toBe("stack");
    expect(resolveAllViewLayout(PREVIEW_ALL_VIEW_STACK_AT + 1)).toBe("row");
    expect(resolveAllViewLayout(undefined)).toBe("row");
  });

  it("resolveAllViewScale stack uses max device width (not row total)", () => {
    const narrow = 400;
    const stackScale = resolveAllViewScale(narrow, 2000, "stack");
    const rowScale = resolveAllViewScale(narrow, 2000, "row");
    // Stack: (400-48)/1280 ≈ 0.275; row crushes against 2526px total.
    expect(stackScale).toBeGreaterThan(rowScale);
    expect(stackScale).toBeCloseTo((narrow - 48) / 1280, 2);
  });

  it("isPreviewViewportMode accepts all", () => {
    expect(isPreviewViewportMode("all")).toBe(true);
    expect(isPreviewViewportMode("desktop")).toBe(true);
    expect(isPreviewViewportMode("nope")).toBe(false);
  });

  it("liveViewportSwitchKind: morph devices, crossfade all", () => {
    expect(liveViewportSwitchKind("desktop", "desktop")).toBe("noop");
    expect(liveViewportSwitchKind("desktop", "mobile")).toBe("morph");
    expect(liveViewportSwitchKind("tablet", "all")).toBe("crossfade");
    expect(liveViewportSwitchKind("all", "desktop")).toBe("crossfade");
  });

  it("coerceLiveViewportForCompact keeps mode on compact", () => {
    expect(coerceLiveViewportForCompact("all", true)).toBe("all");
    expect(coerceLiveViewportForCompact("desktop", true)).toBe("desktop");
    expect(coerceLiveViewportForCompact("tablet", true)).toBe("tablet");
    expect(coerceLiveViewportForCompact("all", false)).toBe("all");
  });

  it("livePreviewUsesFillLayout always false (framed preview)", () => {
    expect(livePreviewUsesFillLayout(true, "mobile")).toBe(false);
    expect(livePreviewUsesFillLayout(true, "desktop")).toBe(false);
    expect(livePreviewUsesFillLayout(true, "all")).toBe(false);
    expect(livePreviewUsesFillLayout(false, "mobile")).toBe(false);
  });

  it("liveViewportModesForShell includes All", () => {
    expect(liveViewportModesForShell(false)).toEqual([
      "desktop",
      "tablet",
      "mobile",
      "all",
    ]);
    expect(liveViewportModesForShell(true)).toContain("all");
  });

  it("liveViewportModesForIconToolbar includes All", () => {
    expect(liveViewportModesForIconToolbar()).toEqual([
      "desktop",
      "tablet",
      "mobile",
      "all",
    ]);
  });

  it("liveInspectChromeKind drawer on compact", () => {
    expect(liveInspectChromeKind(true)).toBe("drawer");
    expect(liveInspectChromeKind(false)).toBe("rail");
  });
});

