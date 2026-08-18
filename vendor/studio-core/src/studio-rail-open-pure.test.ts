import { describe, expect, it } from "vitest";
import {
  cloudStudioOriginFromHostProxy,
  resolvePreviewStudioOrigin,
  resolveStudioRailOpen,
  studioRailWindowCloudHref,
} from "./studio-rail-open-pure.js";

describe("studio-rail-open-pure", () => {
  it("derives Studio shell from Host API proxy", () => {
    expect(
      cloudStudioOriginFromHostProxy("https://api.auth.glassboxcomputer.site"),
    ).toBe("https://auth.glassboxcomputer.site");
    expect(
      cloudStudioOriginFromHostProxy("https://api.acme.glassboxcomputer.site"),
    ).toBe("https://acme.glassboxcomputer.site");
    expect(cloudStudioOriginFromHostProxy("http://127.0.0.1:3847")).toBe(
      "https://auth.glassboxcomputer.site",
    );
  });

  it("Cloud + loopback page opens hosted Home / Notifications / Messages", () => {
    const page = "http://127.0.0.1:4400";
    const cloud = "https://auth.glassboxcomputer.site";
    expect(
      resolveStudioRailOpen({
        itemId: "home",
        hostId: "desk",
        pageOrigin: page,
        cloudStudioOrigin: cloud,
      }),
    ).toEqual({
      mode: "external",
      href: "https://auth.glassboxcomputer.site/?home=1&focus=home",
    });
    expect(
      resolveStudioRailOpen({
        itemId: "notifications",
        hostId: "desk",
        pageOrigin: page,
        cloudStudioOrigin: cloud,
      }),
    ).toEqual({
      mode: "external",
      href: "https://auth.glassboxcomputer.site/?notifications=1&focus=notifications",
    });
    expect(
      resolveStudioRailOpen({
        itemId: "messages",
        hostId: "desk",
        pageOrigin: page,
        cloudStudioOrigin: cloud,
      }),
    ).toEqual({
      mode: "external",
      href: "https://auth.glassboxcomputer.site/?messages=1&focus=messages",
    });
  });

  it("Cloud on hosted shell keeps windows in-app", () => {
    expect(
      resolveStudioRailOpen({
        itemId: "home",
        hostId: "desk",
        pageOrigin: "https://auth.glassboxcomputer.site",
        cloudStudioOrigin: "https://auth.glassboxcomputer.site",
      }),
    ).toEqual({ mode: "in-app", window: "home" });
  });

  it("Local Host keeps windows in-app on loopback", () => {
    expect(
      resolveStudioRailOpen({
        itemId: "home",
        hostId: "laptop",
        pageOrigin: "http://127.0.0.1:4400",
        cloudStudioOrigin: "https://auth.glassboxcomputer.site",
      }),
    ).toEqual({ mode: "in-app", window: "home" });
  });

  it("Cloud services open hosted sidecars, not loopback live", () => {
    expect(
      resolveStudioRailOpen({
        itemId: "n8n",
        hostId: "desk",
        liveUrl: "http://127.0.0.1:5678/",
        pageOrigin: "http://127.0.0.1:4400",
      }),
    ).toEqual({
      mode: "external",
      href: "https://workflows.auth.glassboxcomputer.site",
    });
    expect(
      resolveStudioRailOpen({
        itemId: "litellm",
        hostId: "desk",
        liveUrl: "http://127.0.0.1:4000/ui",
        pageOrigin: "http://127.0.0.1:4400",
      }),
    ).toEqual({
      mode: "external",
      href: "https://gateway.auth.glassboxcomputer.site/ui",
    });
    expect(
      resolveStudioRailOpen({
        itemId: "voice",
        hostId: "desk",
        liveUrl: "http://127.0.0.1:7860/client",
        pageOrigin: "http://127.0.0.1:4400",
      }),
    ).toEqual({
      mode: "external",
      href: "https://voice.auth.glassboxcomputer.site",
    });
  });

  it("Local services keep laptop UIs", () => {
    expect(
      resolveStudioRailOpen({
        itemId: "litellm",
        hostId: "laptop",
        liveUrl: "http://127.0.0.1:4000/ui",
        pageOrigin: "http://127.0.0.1:4400",
      }),
    ).toEqual({
      mode: "external",
      href: "http://127.0.0.1:4000/ui",
    });
    expect(
      resolveStudioRailOpen({
        itemId: "voice",
        hostId: "laptop",
        pageOrigin: "http://127.0.0.1:4400",
      }),
    ).toEqual({ mode: "external", href: "/voice" });
  });

  it("Preview Studio origin hops to hosted shell on Cloud loopback", () => {
    expect(
      resolvePreviewStudioOrigin({
        hostId: "desk",
        pageOrigin: "http://127.0.0.1:4400",
        cloudStudioOrigin: "https://auth.glassboxcomputer.site",
      }),
    ).toBe("https://auth.glassboxcomputer.site");
    expect(
      resolvePreviewStudioOrigin({
        hostId: "laptop",
        pageOrigin: "http://127.0.0.1:4400",
        cloudStudioOrigin: "https://auth.glassboxcomputer.site",
      }),
    ).toBe("http://127.0.0.1:4400");
  });

  it("studioRailWindowCloudHref sets Global Chat tab", () => {
    expect(
      studioRailWindowCloudHref({
        origin: "https://auth.glassboxcomputer.site/",
        windowId: "chat",
      }),
    ).toBe("https://auth.glassboxcomputer.site/?chat=1&focus=chat&tab=ai");
  });
});
