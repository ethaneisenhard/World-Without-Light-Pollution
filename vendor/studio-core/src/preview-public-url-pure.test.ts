import { describe, expect, it } from "vitest";
import {
  buildCloudPreviewPublicUrl,
  cloudSafeLivePreviewBase,
  isStudioCloudPageHostname,
  preferRuntimePreviewUrl,
  resolvePreviewPublishMode,
  shouldRejectHostLoopbackPreview,
} from "./preview-public-url-pure.js";

describe("preview-public-url-pure", () => {
  it("builds vhost URL from template", () => {
    expect(
      buildCloudPreviewPublicUrl({
        template: "https://{projectId}.preview.example.com",
        projectId: "glassbox-studio-template",
      }),
    ).toBe("https://glassbox-studio-template.preview.example.com");
  });

  it("resolves publish mode auto from STUDIO_PREVIEW_BASE", () => {
    expect(
      resolvePreviewPublishMode({
        STUDIO_PREVIEW_PUBLISH: "auto",
        STUDIO_PREVIEW_BASE: "https://{projectId}.preview.example.com",
      }),
    ).toBe("caddy");
    expect(resolvePreviewPublishMode({ STUDIO_PREVIEW_PUBLISH: "none" })).toBe(
      "none",
    );
  });

  it("prefers publicUrl over loopback", () => {
    expect(
      preferRuntimePreviewUrl({
        url: "http://127.0.0.1:9889",
        publicUrl: "https://x.preview.example.com",
      }),
    ).toBe("https://x.preview.example.com");
  });

  it("cloudSafeLivePreviewBase blanks loopback on workers.dev", () => {
    expect(isStudioCloudPageHostname("glassbox-studio.devbyethan.workers.dev")).toBe(
      true,
    );
    expect(isStudioCloudPageHostname("app.browserui.site")).toBe(true);
    expect(
      cloudSafeLivePreviewBase({
        pageHostname: "glassbox-studio.devbyethan.workers.dev",
        localUrl: "http://127.0.0.1:9889",
      }),
    ).toBe("");
    expect(
      cloudSafeLivePreviewBase({
        pageHostname: "glassbox-studio.devbyethan.workers.dev",
        localUrl: "http://127.0.0.1:9889",
        publicUrl: "https://starter.preview.example.com",
      }),
    ).toBe("https://starter.preview.example.com");
  });

  it("rejects Host loopback when local wrangler proxies to desk", () => {
    expect(
      shouldRejectHostLoopbackPreview({
        pageHostname: "127.0.0.1",
        apiProxyOrigin: "https://api.desk.browserui.site",
      }),
    ).toBe(true);
    expect(
      cloudSafeLivePreviewBase({
        pageHostname: "127.0.0.1",
        localUrl: "http://127.0.0.1:9889",
        apiProxyOrigin: "https://api.desk.browserui.site",
      }),
    ).toBe("");
    expect(
      cloudSafeLivePreviewBase({
        pageHostname: "127.0.0.1",
        localUrl: "http://127.0.0.1:9889",
        apiProxyOrigin: "http://127.0.0.1:3847",
      }),
    ).toBe("http://127.0.0.1:9889");
  });
});
