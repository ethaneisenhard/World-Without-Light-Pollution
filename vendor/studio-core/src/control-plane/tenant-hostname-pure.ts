/**
 * Tenant public hostnames for Studio UI.
 *
 * Platform default: `{slug}.browserui.site` (provisioned from browserui.org).
 * Future: custom CNAME / BYO nameservers — same resource URL SoT, different hostnameKind.
 */

import { normalizeTenantSlug } from "./tenant-deployment-pure.js";

/** Default product site zone (not workers.dev, not Ethan personal subdomain). */
export const DEFAULT_STUDIO_SITE_BASE_DOMAIN = "browserui.site";

export type StudioHostnameKind =
  | "platform_subdomain"
  | "custom_cname"
  /** Future: customer brings nameservers / full zone delegation. */
  | "custom_nameservers";

export type StudioHostnameRef = {
  kind: StudioHostnameKind;
  /** Full hostname, no scheme (e.g. eeisen11.browserui.site). */
  hostname: string;
  /** https origin for Open Studio. */
  url: string;
};

export function normalizeStudioSiteBaseDomain(raw?: string | null): string {
  const d = (raw ?? DEFAULT_STUDIO_SITE_BASE_DOMAIN)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  return d || DEFAULT_STUDIO_SITE_BASE_DOMAIN;
}

/** `{slug}.browserui.site` */
export function platformStudioHostname(
  slug: string,
  baseDomain: string = DEFAULT_STUDIO_SITE_BASE_DOMAIN,
): string | null {
  const s = normalizeTenantSlug(slug);
  if (!s) return null;
  const base = normalizeStudioSiteBaseDomain(baseDomain);
  return `${s}.${base}`;
}

export function platformStudioUrl(
  slug: string,
  baseDomain: string = DEFAULT_STUDIO_SITE_BASE_DOMAIN,
): string | null {
  const host = platformStudioHostname(slug, baseDomain);
  return host ? `https://${host}` : null;
}

export function platformStudioHostnameRef(
  slug: string,
  baseDomain: string = DEFAULT_STUDIO_SITE_BASE_DOMAIN,
): StudioHostnameRef | null {
  const hostname = platformStudioHostname(slug, baseDomain);
  if (!hostname) return null;
  return {
    kind: "platform_subdomain",
    hostname,
    url: `https://${hostname}`,
  };
}

/**
 * Parse platform subdomain → tenant slug.
 * Apex / www are not tenants. Nested labels (`a.b.browserui.site`) rejected for now
 * (custom domains use explicit resource rows later).
 */
export function parsePlatformStudioSlug(
  hostHeader: string,
  baseDomain: string = DEFAULT_STUDIO_SITE_BASE_DOMAIN,
): string | null {
  const host = hostHeader.trim().toLowerCase().split(":")[0] ?? "";
  const base = normalizeStudioSiteBaseDomain(baseDomain);
  if (!host || host === base || host === `www.${base}`) return null;
  const suffix = `.${base}`;
  if (!host.endsWith(suffix)) return null;
  const slug = host.slice(0, -suffix.length);
  if (!slug || slug.includes(".")) return null;
  return normalizeTenantSlug(slug);
}

/**
 * Nested service host `{stem}.{slug}.{base}` → tenant slug.
 * `gateway.acme.glassboxcomputer.site` + stem `gateway` → `acme`.
 * One-label `gateway.{base}` → null (reserved).
 */
export function parseNestedPlatformServiceSlug(
  hostHeader: string,
  stem: string,
  baseDomain: string = DEFAULT_STUDIO_SITE_BASE_DOMAIN,
): string | null {
  const host = hostHeader.trim().toLowerCase().split(":")[0] ?? "";
  const stemNorm = stem.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!host || !stemNorm) return null;
  const base = normalizeStudioSiteBaseDomain(baseDomain);
  const suffix = `.${base}`;
  if (!host.endsWith(suffix)) return null;
  const rest = host.slice(0, -suffix.length);
  const prefix = `${stemNorm}.`;
  if (!rest.startsWith(prefix)) return null;
  const slug = rest.slice(prefix.length);
  if (!slug || slug.includes(".")) return null;
  return normalizeTenantSlug(slug);
}

/** Prefer platform subdomain URL; allow explicit custom URL override when set. */
export function resolveStudioPublicUrl(input: {
  tenantSlug: string;
  baseDomain?: string;
  /** Attached worker resource URL if already provisioned (may be custom later). */
  attachedWorkerUrl?: string | null;
}): string | null {
  const attached = input.attachedWorkerUrl?.trim();
  if (attached) {
    try {
      const u = new URL(attached);
      if (u.protocol === "https:") return u.origin;
    } catch {
      /* fall through */
    }
  }
  return platformStudioUrl(input.tenantSlug, input.baseDomain);
}
