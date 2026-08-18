/**
 * Single projector for workspace lights ↔ Website Preview ↔ topbar site host.
 * Process "running" alone is not Live-ready when the shell cannot reach the URL.
 */

import type { ProjectRunStatus } from "./project-runtime-pure.js";
import { cloudSafeLivePreviewBase } from "./preview-public-url-pure.js";

export type ProjectPreviewChromePhase =
  | "off"
  | "starting"
  | "awaiting_shell_url"
  | "ready"
  | "error";

export type ProjectPreviewChrome = {
  runStatus: ProjectRunStatus;
  /** Dot / light — never green while Preview cannot load in this shell. */
  lightStatus: ProjectRunStatus;
  phase: ProjectPreviewChromePhase;
  /** Shell-reachable Live base (empty when rejected / missing). */
  liveBase: string;
  /** Topbar Site href — same as liveBase (never Host-loopback on Cloud). */
  siteUrl: string;
};

export type ProjectPreviewUrlPair = {
  localUrl?: string | null;
  publicUrl?: string | null;
};

/**
 * Project Live/light/topbar chrome from process status + Host URLs + shell reachability.
 */
export function projectPreviewChrome(input: {
  runStatus: ProjectRunStatus;
  localUrl?: string | null;
  publicUrl?: string | null;
  pageHostname: string;
  apiProxyOrigin?: string | null;
}): ProjectPreviewChrome {
  const liveBase = cloudSafeLivePreviewBase({
    pageHostname: input.pageHostname,
    localUrl: input.localUrl,
    publicUrl: input.publicUrl,
    apiProxyOrigin: input.apiProxyOrigin,
  });
  const runStatus = input.runStatus;

  if (runStatus === "error") {
    return {
      runStatus,
      lightStatus: "error",
      phase: "error",
      liveBase,
      siteUrl: liveBase,
    };
  }
  if (runStatus === "off") {
    return {
      runStatus,
      lightStatus: "off",
      phase: "off",
      liveBase: "",
      siteUrl: "",
    };
  }
  if (runStatus === "starting") {
    return {
      runStatus,
      lightStatus: "starting",
      phase: "starting",
      liveBase,
      siteUrl: liveBase,
    };
  }
  // running
  if (!liveBase) {
    return {
      runStatus,
      lightStatus: "starting",
      phase: "awaiting_shell_url",
      liveBase: "",
      siteUrl: "",
    };
  }
  return {
    runStatus,
    lightStatus: "running",
    phase: "ready",
    liveBase,
    siteUrl: liveBase,
  };
}

/** Tooltip when light paints from {@link projectPreviewChrome}. */
export function projectPreviewChromeLightTitle(
  chrome: Pick<ProjectPreviewChrome, "phase" | "lightStatus">,
): string {
  if (chrome.phase === "awaiting_shell_url") {
    return "Dev server running — Preview needs a public Host URL (not localhost)";
  }
  if (chrome.lightStatus === "running") return "Dev server running";
  if (chrome.lightStatus === "starting") return "Dev server starting";
  if (chrome.lightStatus === "error") return "Dev server failed";
  return "Dev server off";
}

/**
 * Reload Live when chrome becomes shell-reachable (incl. publicUrl late-bind).
 */
export function shouldReloadLiveOnChromePhaseChange(
  prev: ProjectPreviewChromePhase | null,
  next: ProjectPreviewChromePhase,
): boolean {
  if (next !== "ready") return false;
  return (
    prev === "starting" ||
    prev === "awaiting_shell_url" ||
    prev === "error" ||
    prev === "off"
  );
}
