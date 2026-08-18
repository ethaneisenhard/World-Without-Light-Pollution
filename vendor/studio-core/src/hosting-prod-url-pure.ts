/**
 * Public site URL (`hosting.prod_url`) — normalize + apply to project.json shape.
 * Everyday product words: public site address / Production URL.
 */

import type { ProjectConfig, ProjectHosting } from "./types.js";

export type NormalizePublicSiteUrlResult =
  | { ok: true; value: string | null }
  | { ok: false; error: string };

/**
 * Trim + coerce scheme. Empty → clear (`null`).
 * Accepts `example.com` → `https://example.com`.
 */
export function normalizePublicSiteUrl(
  raw: string | null | undefined,
): NormalizePublicSiteUrlResult {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return { ok: true, value: null };

  let candidate = trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return {
      ok: false,
      error: "Enter a full website address like https://yoursite.com",
    };
  }

  switch (parsed.protocol) {
    case "http:":
    case "https:":
      break;
    default:
      return {
        ok: false,
        error: "Use an http or https website address",
      };
  }

  if (!parsed.hostname) {
    return {
      ok: false,
      error: "Enter a full website address like https://yoursite.com",
    };
  }

  // Stable storage: origin + pathname (no trailing slash on bare origin).
  const path =
    parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "");
  const search = parsed.search || "";
  const hash = parsed.hash || "";
  return { ok: true, value: `${parsed.origin}${path}${search}${hash}` };
}

/** Merge / clear `hosting.prod_url` on a project.json-shaped config. */
export function applyHostingProdUrlToProjectConfig<
  T extends { hosting?: ProjectHosting | null },
>(config: T, prodUrl: string | null): T {
  const hosting: ProjectHosting = { ...(config.hosting ?? {}) };
  if (prodUrl == null || !prodUrl.trim()) {
    delete hosting.prod_url;
  } else {
    hosting.prod_url = prodUrl.trim();
  }
  const keys = Object.keys(hosting);
  if (keys.length === 0) {
    const { hosting: _drop, ...rest } = config as T & {
      hosting?: ProjectHosting;
    };
    return rest as T;
  }
  return { ...config, hosting };
}

/** Patch helper for workspace CRUD — no-op when prodUrl undefined. */
export function projectConfigWithOptionalProdUrl(
  config: ProjectConfig,
  prodUrl: string | null | undefined,
): ProjectConfig {
  if (prodUrl === undefined) return config;
  return applyHostingProdUrlToProjectConfig(config, prodUrl);
}
