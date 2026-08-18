/**
 * Per-tenant Host API public hostnames.
 *
 * Rule: Studio shell `{slug}.glassboxcomputer.site`
 *     → Host API `api.{slug}.glassboxcomputer.site`
 *
 * Primary dogfood shell is `auth.…site` → `api.auth.…site`
 * (not one-label `api.…site`, which is reserved / Worker-claimed).
 *
 * Twin of {@link ./workflows-hostname-pure.js} (`workflows.{slug}`).
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

/** Live Studio site zone for nested Host API hosts. */
export const DEFAULT_API_SITE_BASE_DOMAIN = "glassboxcomputer.site";

/**
 * `api.{slug}.{base}` — nested under site zone so one-label Studio
 * Worker route (`api.…`) does not claim it.
 */
export function platformApiHostname(
  slug: string,
  baseDomain: string = DEFAULT_API_SITE_BASE_DOMAIN,
): string | null {
  const s = normalizeTenantSlug(slug);
  if (!s) return null;
  const base = normalizeStudioSiteBaseDomain(baseDomain);
  return `api.${s}.${base}`;
}

export function platformApiUrl(
  slug: string,
  baseDomain: string = DEFAULT_API_SITE_BASE_DOMAIN,
): string | null {
  const host = platformApiHostname(slug, baseDomain);
  return host ? `https://${host}` : null;
}

/** Primary Studio shell (`auth.…site`) → `https://api.auth.…site`. */
export const PLATFORM_PRIMARY_API_URL =
  platformApiUrl(
    PLATFORM_STUDIO_PRIMARY_SLUG,
    DEFAULT_API_SITE_BASE_DOMAIN,
  ) ??
  `https://api.${PLATFORM_STUDIO_PRIMARY_SLUG}.${DEFAULT_API_SITE_BASE_DOMAIN}`;

/**
 * Derive Host API vanity URL from the Studio shell hostname.
 * `auth.glassboxcomputer.site` → `https://api.auth.glassboxcomputer.site`
 * `acme.glassboxcomputer.site` → `https://api.acme.glassboxcomputer.site`
 */
export function platformApiUrlFromStudioHostname(
  studioHost: string,
  baseDomain: string = DEFAULT_API_SITE_BASE_DOMAIN,
): string | null {
  const host = studioHost.trim().toLowerCase().split(":")[0] ?? "";
  if (!host) return null;
  const slug = parsePlatformStudioSlug(host, baseDomain);
  if (!slug) return null;
  // One-label reserved hosts (api, workflows, …) are not Studio shells —
  // except the primary OAuth shell `auth`.
  if (
    isReservedTenantSlug(slug) &&
    slug !== PLATFORM_STUDIO_PRIMARY_SLUG
  ) {
    return null;
  }
  return platformApiUrl(slug, baseDomain);
}

/**
 * Cloudflare DNS record name relative to the zone apex
 * (`api.{slug}` → CNAME target `{flyApp}.fly.dev`).
 */
export function platformApiDnsRecordName(slug: string): string | null {
  const s = normalizeTenantSlug(slug);
  if (!s) return null;
  return `api.${s}`;
}

/**
 * `api.{slug}.{base}` → tenant slug.
 * `https://api.auth.glassboxcomputer.site` → `auth`.
 */
export function parsePlatformApiSlug(
  hostOrUrl: string,
  baseDomain: string = DEFAULT_API_SITE_BASE_DOMAIN,
): string | null {
  const raw = hostOrUrl.trim();
  if (!raw) return null;
  let host = raw.toLowerCase().split(":")[0] ?? "";
  try {
    if (raw.includes("://")) host = new URL(raw).hostname;
  } catch {
    return null;
  }
  return parseNestedPlatformServiceSlug(host, "api", baseDomain);
}

/** Host env patch after Host vanity URL is known. */
export function hostPublicUrlEnvFromResourceUrl(
  resourceUrl: string,
): { STUDIO_HOST_PUBLIC_URL: string } | null {
  const raw = resourceUrl.trim().replace(/\/+$/, "");
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return { STUDIO_HOST_PUBLIC_URL: u.origin };
  } catch {
    return null;
  }
}
