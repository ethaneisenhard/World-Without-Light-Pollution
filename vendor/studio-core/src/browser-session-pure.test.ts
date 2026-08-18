import { describe, expect, it } from "vitest";
import {
  mapScreencastClickToViewport,
  normalizeBrowserUrl,
  parseBrowserClickInput,
  parseBrowserNavigateInput,
  resolveBrowserHeaded,
  screencastFrameSize,
} from "./browser-session-pure.js";

describe("browser-session-pure", () => {
  it("scales screencast frames for Retina", () => {
    expect(
      screencastFrameSize({
        viewportWidth: 1280,
        viewportHeight: 800,
        deviceScaleFactor: 2,
      }),
    ).toEqual({ maxWidth: 2560, maxHeight: 1600 });
  });

  it("defaults headed on darwin", () => {
    expect(resolveBrowserHeaded({}, "darwin")).toBe(true);
    expect(resolveBrowserHeaded({ AS_BROWSER_HEADED: "0" }, "darwin")).toBe(
      false,
    );
    expect(resolveBrowserHeaded({}, "linux")).toBe(false);
    expect(resolveBrowserHeaded({ DISPLAY: ":0" }, "linux")).toBe(true);
  });

  it("normalizes bare hosts to https", () => {
    expect(normalizeBrowserUrl("example.com")).toEqual({
      ok: true,
      url: "https://example.com/",
    });
  });

  it("rejects unsupported protocols", () => {
    expect(normalizeBrowserUrl("file:///etc/passwd").ok).toBe(false);
  });

  it("parses navigate + click", () => {
    expect(parseBrowserNavigateInput({ url: "https://a.test" }).ok).toBe(true);
    const click = parseBrowserClickInput({ x: 10, y: 20 });
    expect(click).toEqual({
      ok: true,
      value: { x: 10, y: 20, button: "left", clickCount: 1 },
    });
  });

  it("maps screencast click to viewport", () => {
    expect(
      mapScreencastClickToViewport({
        clientX: 640,
        clientY: 400,
        displayWidth: 1280,
        displayHeight: 800,
        viewportWidth: 1280,
        viewportHeight: 800,
      }),
    ).toEqual({ x: 640, y: 400 });
  });
});
