import { describe, expect, it } from "vitest";
import {
  appendImageTransformQuery,
  buildOptimizedSrcSet,
  mediaHrefWithPercent,
  mediaHrefWithWidth,
  mediaMarkdownHref,
  parseImageTransformQuery,
  parseMediaHref,
  projectLiveMediaApiChildEnv,
  resolveMediaImageUrl,
  resolveStudioMediaApiOrigin,
  shouldOptimizeUploadContentType,
} from "./image-optimize-pure.js";

describe("image-optimize-pure", () => {
  it("resolveStudioMediaApiOrigin prefers public APP_ORIGIN over localhost default", () => {
    expect(resolveStudioMediaApiOrigin({})).toBe("http://127.0.0.1:3847");
    expect(
      resolveStudioMediaApiOrigin({
        APP_ORIGIN: "https://glassbox-studio.devbyethan.workers.dev/",
      }),
    ).toBe("https://glassbox-studio.devbyethan.workers.dev");
    expect(
      resolveStudioMediaApiOrigin({
        STUDIO_API_URL: "https://api.example.com",
        APP_ORIGIN: "https://ignored.example",
      }),
    ).toBe("https://api.example.com");
  });

  it("projectLiveMediaApiChildEnv pins AS_STUDIO_API_ORIGIN for Live children", () => {
    const child = projectLiveMediaApiChildEnv({
      APP_ORIGIN: "https://glassbox-studio.devbyethan.workers.dev",
      PATH: "/usr/bin",
    });
    expect(child.AS_STUDIO_API_ORIGIN).toBe(
      "https://glassbox-studio.devbyethan.workers.dev",
    );
    expect(child.PATH).toBe("/usr/bin");
  });

  it("parses transform query", () => {
    expect(
      parseImageTransformQuery({ w: "800", fm: "webp", q: "80" }),
    ).toEqual({
      width: 800,
      height: undefined,
      format: "webp",
      quality: 80,
      percent: undefined,
    });
  });

  it("parses media: and API hrefs", () => {
    expect(parseMediaHref("media:abc")).toEqual({
      kind: "media-ref",
      assetId: "abc",
    });
    expect(parseMediaHref("media://starter/abc")).toEqual({
      kind: "media-ref",
      projectId: "starter",
      assetId: "abc",
    });
    expect(parseMediaHref("/api/projects/p1/media/a1")).toEqual({
      kind: "project",
      projectId: "p1",
      assetId: "a1",
    });
  });

  it("resolves absolute Live URLs", () => {
    expect(
      resolveMediaImageUrl("media:photo", {
        apiOrigin: "http://127.0.0.1:3847",
        defaultProjectId: "glassbox-studio-template",
        transform: { width: 800, format: "webp", quality: 82 },
      }),
    ).toBe(
      "http://127.0.0.1:3847/api/projects/glassbox-studio-template/media/photo?w=800&fm=webp&q=82",
    );
  });

  it("builds srcset", () => {
    const set = buildOptimizedSrcSet("media:x", {
      defaultProjectId: "p",
      widths: [480, 800],
    });
    expect(set).toContain("/api/projects/p/media/x?w=480&fm=webp&q=82 480w");
    expect(set).toContain("800w");
  });

  it("appendImageTransformQuery keeps relative path", () => {
    expect(
      appendImageTransformQuery("/api/studio/media/a", { width: 400 }),
    ).toBe("/api/studio/media/a?w=400");
  });

  it("mediaMarkdownHref + upload gate", () => {
    expect(mediaMarkdownHref("id1", "p1")).toBe("media://p1/id1");
    expect(shouldOptimizeUploadContentType("image/png")).toBe(true);
    expect(shouldOptimizeUploadContentType("image/gif")).toBe(false);
  });

  it("parses media:id?w= and mediaHrefWithWidth", () => {
    expect(parseMediaHref("media:photo?w=480")).toEqual({
      kind: "media-ref",
      assetId: "photo",
      transform: {
        width: 480,
        height: undefined,
        format: undefined,
        quality: undefined,
        percent: undefined,
      },
    });
    expect(mediaHrefWithWidth("media:photo", 640)).toBe("media:photo?w=640");
    expect(mediaHrefWithWidth("media:photo?w=200", null)).toBe("media:photo");
    expect(
      resolveMediaImageUrl("media:photo?w=480", {
        defaultProjectId: "p",
        transform: { format: "webp", quality: 82 },
      }),
    ).toBe("/api/projects/p/media/photo?w=480&fm=webp&q=82");
  });

  it("parses media:id?pct= and resolves derived sharp w=", () => {
    expect(parseMediaHref("media:photo?pct=50")).toEqual({
      kind: "media-ref",
      assetId: "photo",
      transform: {
        width: undefined,
        height: undefined,
        format: undefined,
        quality: undefined,
        percent: 50,
      },
    });
    expect(mediaHrefWithPercent("media:photo", 40)).toBe("media:photo?pct=40");
    expect(mediaHrefWithPercent("media:photo?pct=90", null)).toBe("media:photo");
    expect(
      resolveMediaImageUrl("media:photo?pct=50", {
        defaultProjectId: "p",
        transform: { format: "webp", quality: 82 },
      }),
    ).toBe("/api/projects/p/media/photo?w=600&fm=webp&q=82");
  });
});
