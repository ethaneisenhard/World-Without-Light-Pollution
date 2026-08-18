import { describe, expect, it } from "vitest";
import {
  buildEditorFileUrl,
  resolveAbsoluteProjectPath,
} from "./editor-pure.js";

describe("resolveAbsoluteProjectPath", () => {
  it("joins root and relative path", () => {
    expect(
      resolveAbsoluteProjectPath("/Users/me/proj", "public/styles.css"),
    ).toBe("/Users/me/proj/public/styles.css");
  });

  it("returns absolute relative as-is", () => {
    expect(resolveAbsoluteProjectPath("/root", "/abs/file.ts")).toBe(
      "/abs/file.ts",
    );
  });
});

describe("buildEditorFileUrl", () => {
  it("builds cursor deep link", () => {
    expect(
      buildEditorFileUrl("cursor", "/Users/me/proj/public/styles.css", 1),
    ).toBe("cursor://file/Users/me/proj/public/styles.css:1");
  });

  it("builds vscode deep link", () => {
    expect(buildEditorFileUrl("vscode", "/tmp/a.ts", 12)).toBe(
      "vscode://file/tmp/a.ts:12",
    );
  });
});

describe("canvasFlagsForOpenFile", () => {
  it("opens Code on empty desk even with preserveView", async () => {
    const { canvasFlagsForOpenFile } = await import("./editor-pure.js");
    expect(
      canvasFlagsForOpenFile({
        preserveView: true,
        wantDesign: false,
        canLive: false,
        codeOpen: false,
        liveOpen: false,
        designOpen: false,
      }),
    ).toEqual({ code: true });
  });

  it("opens Code when Live already open + preserveView (file edit)", async () => {
    const { canvasFlagsForOpenFile } = await import("./editor-pure.js");
    expect(
      canvasFlagsForOpenFile({
        preserveView: true,
        wantDesign: false,
        canLive: false,
        codeOpen: false,
        liveOpen: true,
        designOpen: false,
      }),
    ).toEqual({ code: true });
  });

  it("null when Code already open + preserveView", async () => {
    const { canvasFlagsForOpenFile } = await import("./editor-pure.js");
    expect(
      canvasFlagsForOpenFile({
        preserveView: true,
        wantDesign: false,
        canLive: false,
        codeOpen: true,
        liveOpen: true,
        designOpen: false,
      }),
    ).toBeNull();
  });

  it("opens Design or Live without forcing the sibling closed", async () => {
    const { canvasFlagsForOpenFile } = await import("./editor-pure.js");
    expect(
      canvasFlagsForOpenFile({
        preserveView: false,
        wantDesign: true,
        canLive: true,
        codeOpen: false,
        liveOpen: true,
        designOpen: false,
      }),
    ).toEqual({ design: true, code: true });
    expect(
      canvasFlagsForOpenFile({
        preserveView: false,
        wantDesign: false,
        canLive: true,
        codeOpen: false,
        liveOpen: false,
        designOpen: true,
      }),
    ).toEqual({ live: true, code: true });
  });
});

describe("focusKindForOpenFile", () => {
  it("maps design / live / code", async () => {
    const { focusKindForOpenFile } = await import("./editor-pure.js");
    expect(
      focusKindForOpenFile({ wantDesign: true, canLive: false }),
    ).toBe("design");
    expect(
      focusKindForOpenFile({ wantDesign: false, canLive: true }),
    ).toBe("live");
    expect(
      focusKindForOpenFile({ wantDesign: false, canLive: false }),
    ).toBe("code");
  });
});

describe("shouldSkipOpenFileUrlSync", () => {
  it("does not skip when desk empty", async () => {
    const { shouldSkipOpenFileUrlSync } = await import("./editor-pure.js");
    expect(
      shouldSkipOpenFileUrlSync({
        pathAlready: true,
        preserveView: true,
        canLive: false,
        wantDesign: false,
        codeOpen: false,
        liveOpen: false,
        designOpen: false,
      }),
    ).toBe(false);
  });
});

describe("shouldActivateOpenFileFocus", () => {
  it("always activates when not preserveView (user open)", async () => {
    const { shouldActivateOpenFileFocus } = await import("./editor-pure.js");
    expect(
      shouldActivateOpenFileFocus({
        preserveView: false,
        urlFocus: "roadmap",
        openFileFocus: "code",
      }),
    ).toBe(true);
  });

  it("does not steal focus when URL focus differs on path restore", async () => {
    const { shouldActivateOpenFileFocus } = await import("./editor-pure.js");
    expect(
      shouldActivateOpenFileFocus({
        preserveView: true,
        urlFocus: "roadmap",
        openFileFocus: "code",
      }),
    ).toBe(false);
  });

  it("userOpen activates even when URL focus differs (Files click)", async () => {
    const { shouldActivateOpenFileFocus } = await import("./editor-pure.js");
    expect(
      shouldActivateOpenFileFocus({
        preserveView: true,
        urlFocus: "media",
        openFileFocus: "code",
        userOpen: true,
      }),
    ).toBe(true);
  });

  it("activates on preserveView when URL focus matches or is absent", async () => {
    const { shouldActivateOpenFileFocus } = await import("./editor-pure.js");
    expect(
      shouldActivateOpenFileFocus({
        preserveView: true,
        urlFocus: "code",
        openFileFocus: "code",
      }),
    ).toBe(true);
    expect(
      shouldActivateOpenFileFocus({
        preserveView: true,
        urlFocus: null,
        openFileFocus: "code",
      }),
    ).toBe(true);
  });
});
