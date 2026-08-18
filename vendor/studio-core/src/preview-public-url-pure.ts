/**
 * Cloud-desk public Live URLs — Host maps loopback Dev ports → HTTPS preview vhosts.
 * Provider-agnostic: template string only (Caddy / Fly / Traefik adapters fill routes).
 */

import { isLoopbackHostname } from "./host-preview-url-pure.js";
import { portFromServeSource } from "./preview-port-pure.js";

/** `{projectId}` required; optional `{port}` for adapters that encode port in URL. */
export function buildCloudPreviewPublicUrl(input: {
  template: string;
  projectId: string;
  port?: number | null;
}): string | null {
  const template = input.template.trim();
  const projectId = input.projectId.trim();
  if (!template || !projectId) return null;
  if (!template.includes("{projectId}")) return null;
  // DNS / vhost labels — keep id as-is (registry ids are [a-z0-9-]).
  let out = template.split("{projectId}").join(projectId);
  if (out.includes("{port}")) {
    const port = input.port;
    if (port == null || !Number.isInteger(port)) return null;
    out = out.split("{port}").join(String(port));
  }
  try {
    const u = new URL(out);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.origin + (u.pathname === "/" ? "" : u.pathname.replace(/\/$/, ""));
  } catch {
    return null;
  }
}

export type PreviewPublishMode = "caddy" | "tailscale" | "none";

/**
 * `STUDIO_PREVIEW_PUBLISH=caddy|tailscale|none|auto`
 * auto → caddy when STUDIO_PREVIEW_BASE set, else tailscale when enabled, else none.
 */
export function resolvePreviewPublishMode(env: {
  STUDIO_PREVIEW_PUBLISH?: string;
  STUDIO_PREVIEW_BASE?: string;
  AS_TAILSCALE_SERVE?: string;
}): PreviewPublishMode {
  const raw = (env.STUDIO_PREVIEW_PUBLISH ?? "auto").trim().toLowerCase();
  if (raw === "caddy" || raw === "tailscale" || raw === "none") return raw;
  if (env.STUDIO_PREVIEW_BASE?.trim()) return "caddy";
  const ts = (env.AS_TAILSCALE_SERVE ?? "1").trim().toLowerCase();
  if (ts === "0" || ts === "false" || ts === "off" || ts === "no") return "none";
  return "tailscale";
}

/** Prefer Host publicUrl when set; else loopback Dev URL. */
export function preferRuntimePreviewUrl(input: {
  url?: string | null;
  publicUrl?: string | null;
}): string | undefined {
  const pub = input.publicUrl?.trim();
  if (pub) return pub.replace(/\/$/, "");
  const url = input.url?.trim();
  if (url) return url.replace(/\/$/, "");
  return undefined;
}

/**
 * True when Studio shell hostname is a hosted edge (Workers / Pages / site).
 * Prefer {@link shouldRejectHostLoopbackPreview} for Live URL policy.
 */
export function isStudioCloudPageHostname(hostname: string): boolean {
  const h = hostname.trim().toLowerCase();
  return (
    h.endsWith(".workers.dev") ||
    h.endsWith(".pages.dev") ||
    h.endsWith(".browserui.site")
  );
}

/**
 * Blank Host loopback Live URLs when the browser cannot reach Host localhost.
 * - Hosted shell hostnames (workers / pages / browserui.site)
 * - Or STUDIO_API_PROXY origin is non-loopback (local wrangler → desk Host)
 */
export function shouldRejectHostLoopbackPreview(input: {
  pageHostname: string;
  /** Origin of STUDIO_API_PROXY from `/health.proxy`, when known. */
  apiProxyOrigin?: string | null;
}): boolean {
  if (isStudioCloudPageHostname(input.pageHostname)) return true;
  const proxy = (input.apiProxyOrigin ?? "").trim();
  if (!proxy) return false;
  try {
    const u = new URL(proxy);
    return !isLoopbackHostname(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Never paint Host loopback into a shell that cannot reach it.
 * Prefer `publicUrl`; otherwise allow loopback only for local-Host dogfood.
 */
export function cloudSafeLivePreviewBase(input: {
  pageHostname: string;
  localUrl?: string | null;
  publicUrl?: string | null;
  /** Origin of STUDIO_API_PROXY from `/health.proxy`, when known. */
  apiProxyOrigin?: string | null;
}): string {
  if (input.publicUrl?.trim()) {
    return preferRuntimePreviewUrl({ publicUrl: input.publicUrl }) ?? "";
  }
  const preferred = preferRuntimePreviewUrl({
    url: input.localUrl,
    publicUrl: null,
  });
  if (!preferred) return "";
  const rejectLoopback = shouldRejectHostLoopbackPreview({
    pageHostname: input.pageHostname,
    apiProxyOrigin: input.apiProxyOrigin,
  });
  if (!rejectLoopback) return preferred;
  try {
    const u = new URL(preferred);
    if (isLoopbackHostname(u.hostname)) return "";
  } catch {
    return "";
  }
  return preferred;
}

export function previewRouteKey(projectId: string): string {
  return projectId.trim().toLowerCase();
}

export { portFromServeSource };
