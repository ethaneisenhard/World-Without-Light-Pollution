import { describe, expect, it } from "vitest";
import {
  STUDIO_SERVICE_DEFS,
  defaultStudioServiceUrls,
  getStudioServiceDef,
  isStudioLocalHostAttach,
  isStudioRailServiceId,
  listStudioServiceIds,
  projectStudioServiceUrls,
  reconcileLocalHostServiceStatus,
  resolveStudioServiceOpenUrl,
  studioServiceLocalHostBlockReason,
  studioServiceRequiresLocalHost,
} from "./studio-service-registry-pure.js";

describe("studio-service-registry-pure", () => {
  it("lists services in order", () => {
    expect(listStudioServiceIds()).toEqual(["n8n", "voice", "litellm"]);
  });

  it("LiteLLM cloud Admin UI + local compose fallback", () => {
    expect(getStudioServiceDef("litellm")?.defaultUrl).toBe(
      "https://gateway.auth.glassboxcomputer.site/ui",
    );
    expect(getStudioServiceDef("litellm")?.localUrl).toContain("4000/ui");
    expect(studioServiceRequiresLocalHost("litellm")).toBe(false);
  });

  it("Voice has cloud defaultUrl + Pipecat localUrl + /voice launch", () => {
    expect(getStudioServiceDef("voice")?.defaultUrl).toContain(
      "voice.auth.glassboxcomputer.site",
    );
    expect(getStudioServiceDef("voice")?.localUrl).toContain("7860");
    expect(getStudioServiceDef("voice")?.launchPath).toBe("/voice");
  });

  it("isStudioLocalHostAttach", () => {
    expect(isStudioLocalHostAttach("laptop")).toBe(true);
    expect(isStudioLocalHostAttach("local")).toBe(true);
    expect(isStudioLocalHostAttach("desk")).toBe(false);
    expect(isStudioLocalHostAttach(null)).toBe(false);
  });

  it("Voice Cloud → hosted vanity; Local → /voice", () => {
    expect(resolveStudioServiceOpenUrl({ serviceId: "voice" })).toBe(
      "https://voice.auth.glassboxcomputer.site",
    );
    expect(
      resolveStudioServiceOpenUrl({
        serviceId: "voice",
        hostId: "desk",
        liveUrl: "http://127.0.0.1:4410/",
      }),
    ).toBe("https://voice.auth.glassboxcomputer.site");
    expect(
      resolveStudioServiceOpenUrl({
        serviceId: "voice",
        hostId: "laptop",
        liveUrl: "http://127.0.0.1:4410/",
      }),
    ).toBe("/voice");
  });

  it("n8n Cloud → hosted; Local → loopback", () => {
    expect(
      resolveStudioServiceOpenUrl({
        serviceId: "n8n",
        hostId: "desk",
        liveUrl: "http://127.0.0.1:5678/",
      }),
    ).toBe("https://workflows.auth.glassboxcomputer.site");
    expect(
      resolveStudioServiceOpenUrl({
        serviceId: "n8n",
        hostId: "laptop",
        liveUrl: "http://127.0.0.1:5678/",
      }),
    ).toBe("http://127.0.0.1:5678");
  });

  it("projectStudioServiceUrls Voice Cloud hosted / Local /voice", () => {
    expect(
      projectStudioServiceUrls({ voice: "http://127.0.0.1:4410" }, "desk")
        .voice,
    ).toBe("https://voice.auth.glassboxcomputer.site");
    expect(
      projectStudioServiceUrls({ voice: "http://127.0.0.1:4410" }, "laptop")
        .voice,
    ).toBe("/voice");
  });

  it("guards + defaults", () => {
    expect(isStudioRailServiceId("n8n")).toBe(true);
    expect(studioServiceRequiresLocalHost("voice")).toBe(true);
    expect(
      studioServiceLocalHostBlockReason({ serviceId: "voice", hostId: "desk" }),
    ).toMatch(/Local/);
    expect(
      studioServiceLocalHostBlockReason({
        serviceId: "voice",
        hostId: "laptop",
      }),
    ).toBeNull();
    const urls = defaultStudioServiceUrls();
    expect(urls.voice).toContain("voice.auth.glassboxcomputer.site");
  });

  it("reconcileLocalHost only reshapes local-only services", () => {
    expect(
      reconcileLocalHostServiceStatus({
        serviceId: "voice",
        hostStatus: "running",
        localHealthy: false,
        hostId: "laptop",
      }),
    ).toBe("off");
    expect(
      reconcileLocalHostServiceStatus({
        serviceId: "voice",
        hostStatus: "running",
        localHealthy: false,
        hostId: "desk",
      }),
    ).toBe("running");
    expect(
      reconcileLocalHostServiceStatus({
        serviceId: "n8n",
        hostStatus: "running",
        localHealthy: false,
      }),
    ).toBe("running");
  });
});
