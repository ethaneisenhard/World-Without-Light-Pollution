import { describe, expect, it } from "vitest";
import {
  projectPreviewChrome,
  projectPreviewChromeLightTitle,
  shouldReloadLiveOnChromePhaseChange,
} from "./project-preview-chrome-pure.js";

describe("projectPreviewChrome", () => {
  it("keeps green light when Local Host can use loopback", () => {
    const chrome = projectPreviewChrome({
      runStatus: "running",
      localUrl: "http://127.0.0.1:9889",
      pageHostname: "127.0.0.1",
      apiProxyOrigin: "http://127.0.0.1:3847",
    });
    expect(chrome.phase).toBe("ready");
    expect(chrome.lightStatus).toBe("running");
    expect(chrome.liveBase).toBe("http://127.0.0.1:9889");
    expect(chrome.siteUrl).toBe("http://127.0.0.1:9889");
  });

  it("dims light + blanks site when Cloud Host only has loopback", () => {
    const chrome = projectPreviewChrome({
      runStatus: "running",
      localUrl: "http://127.0.0.1:9889",
      pageHostname: "127.0.0.1",
      apiProxyOrigin: "https://api.desk.browserui.site",
    });
    expect(chrome.phase).toBe("awaiting_shell_url");
    expect(chrome.lightStatus).toBe("starting");
    expect(chrome.liveBase).toBe("");
    expect(chrome.siteUrl).toBe("");
    expect(projectPreviewChromeLightTitle(chrome)).toMatch(/public Host URL/i);
  });

  it("goes ready when publicUrl arrives on Cloud Host", () => {
    const chrome = projectPreviewChrome({
      runStatus: "running",
      localUrl: "http://127.0.0.1:9889",
      publicUrl: "https://starter.preview.example.com",
      pageHostname: "glassbox-studio.devbyethan.workers.dev",
    });
    expect(chrome.phase).toBe("ready");
    expect(chrome.lightStatus).toBe("running");
    expect(chrome.liveBase).toBe("https://starter.preview.example.com");
  });

  it("reloads Live when awaiting_shell_url → ready", () => {
    expect(
      shouldReloadLiveOnChromePhaseChange("awaiting_shell_url", "ready"),
    ).toBe(true);
    expect(shouldReloadLiveOnChromePhaseChange("ready", "ready")).toBe(false);
    expect(shouldReloadLiveOnChromePhaseChange(null, "ready")).toBe(false);
  });
});
