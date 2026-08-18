/**
 * Per-tenant / platform-shell Voice public hostnames.
 *
 * Rule: Studio shell `{slug}.glassboxcomputer.site`
 *     → Voice `voice.{slug}.glassboxcomputer.site`
 *
 * Primary dogfood shell is `auth.…site` → `voice.auth.…site`
 * (not one-label `voice.…site`, which is reserved / Worker-claimed).
 *
 * Twin of {@link ./workflows-hostname-pure.js} and {@link ./api-hostname-pure.js}.
 */

import {
  isReservedTenantSlug,
  PLATFORM_STUDIO_PRIMARY_SLUG,
} from "./reserved-tenant-slugs-pure.js";
import { normalizeTenantSlug } from "./tenant-deployment-pure.js";
import {
  normalizeStudioSiteBaseDomain,
  parseNestedPlatformServiceSlug,
  parsePlatformStudioSlug,
} from "./tenant-hostname-pure.js";

/** Live Studio site zone for nested Voice hosts. */
export const DEFAULT_VOICE_SITE_BASE_DOMAIN = "glassboxcomputer.site";

/**
 * `voice.{slug}.{base}` — nested under site zone so one-label Studio
 * Worker route (`voice.…`) does not claim it.
 */
export function platformVoiceHostname(
  slug: string,
  baseDomain: string = DEFAULT_VOICE_SITE_BASE_DOMAIN,
): string | null {
  const s = normalizeTenantSlug(slug);
  if (!s) return null;
  const base = normalizeStudioSiteBaseDomain(baseDomain);
  return `voice.${s}.${base}`;
}

export function platformVoiceUrl(
  slug: string,
  baseDomain: string = DEFAULT_VOICE_SITE_BASE_DOMAIN,
): string | null {
  const host = platformVoiceHostname(slug, baseDomain);
  return host ? `https://${host}` : null;
}

/** Primary Studio shell (`auth.…site`) → `https://voice.auth.…site`. */
export const PLATFORM_PRIMARY_VOICE_URL =
  platformVoiceUrl(
    PLATFORM_STUDIO_PRIMARY_SLUG,
    DEFAULT_VOICE_SITE_BASE_DOMAIN,
  ) ??
  `https://voice.${PLATFORM_STUDIO_PRIMARY_SLUG}.${DEFAULT_VOICE_SITE_BASE_DOMAIN}`;

/**
 * Derive Voice vanity URL from the Studio shell hostname.
 * `auth.glassboxcomputer.site` → `https://voice.auth.glassboxcomputer.site`
 * `acme.glassboxcomputer.site` → `https://voice.acme.glassboxcomputer.site`
 */
export function platformVoiceUrlFromStudioHostname(
  studioHost: string,
  baseDomain: string = DEFAULT_VOICE_SITE_BASE_DOMAIN,
): string | null {
  const host = studioHost.trim().toLowerCase().split(":")[0] ?? "";
  if (!host) return null;
  const slug = parsePlatformStudioSlug(host, baseDomain);
  if (!slug) return null;
  if (
    isReservedTenantSlug(slug) &&
    slug !== PLATFORM_STUDIO_PRIMARY_SLUG
  ) {
    return null;
  }
  return platformVoiceUrl(slug, baseDomain);
}

/**
 * Cloudflare DNS record name relative to the zone apex
 * (`voice.{slug}` → CNAME / A target).
 */
export function platformVoiceDnsRecordName(slug: string): string | null {
  const s = normalizeTenantSlug(slug);
  if (!s) return null;
  return `voice.${s}`;
}

/**
 * `voice.{slug}.{base}` → tenant slug.
 * `https://voice.auth.glassboxcomputer.site` → `auth`.
 */
export function parsePlatformVoiceSlug(
  hostOrUrl: string,
  baseDomain: string = DEFAULT_VOICE_SITE_BASE_DOMAIN,
): string | null {
  const raw = hostOrUrl.trim();
  if (!raw) return null;
  let host = raw.toLowerCase().split(":")[0] ?? "";
  try {
    if (raw.includes("://")) host = new URL(raw).hostname;
  } catch {
    return null;
  }
  return parseNestedPlatformServiceSlug(host, "voice", baseDomain);
}

/** Stale BrowserUI Voice hosts — never mint tickets / WebRTC against these. */
export function isLegacyBrowseruiVoiceUrl(urlOrHost: string): boolean {
  const raw = urlOrHost.trim().toLowerCase();
  if (!raw) return false;
  let host = raw;
  try {
    if (raw.includes("://")) host = new URL(raw).hostname;
  } catch {
    host = raw.split("/")[0]?.split(":")[0] ?? raw;
  }
  return (
    host === "browserui.site" ||
    host.endsWith(".browserui.site") ||
    host === "browserui.org" ||
    host.endsWith(".browserui.org")
  );
}

/**
 * Resolve public Voice base for tickets / headless WebRTC.
 * Prefer configured URL (unless legacy BrowserUI), else derive from Studio host,
 * else primary `voice.auth.…site`.
 */
export function resolveVoicePublicBaseUrl(input: {
  configuredUrl?: string | null;
  studioHost?: string | null;
  siteBaseDomain?: string | null;
}): string {
  const baseDomain =
    input.siteBaseDomain?.trim() || DEFAULT_VOICE_SITE_BASE_DOMAIN;
  const configured = input.configuredUrl?.trim() || "";
  if (configured && !isLegacyBrowseruiVoiceUrl(configured)) {
    return configured.replace(/\/+$/, "");
  }
  const fromHost = input.studioHost
    ? platformVoiceUrlFromStudioHostname(input.studioHost, baseDomain)
    : null;
  if (fromHost) return fromHost;
  return PLATFORM_PRIMARY_VOICE_URL;
}
