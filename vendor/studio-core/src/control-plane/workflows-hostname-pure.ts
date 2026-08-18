/**
 * Per-tenant / platform-shell n8n public hostnames.
 *
 * Rule: Studio shell `{slug}.glassboxcomputer.site`
 *     → n8n `workflows.{slug}.glassboxcomputer.site`
 *
 * Primary dogfood shell is `auth.…site` → `workflows.auth.…site`
 * (not one-label `workflows.…site`, which hits Studio Worker login).
 */

import {
  isReservedTenantSlug,
  PLATFORM_STUDIO_PRIMARY_SLUG,
} from "./reserved-tenant-slugs-pure.js";
import { normalizeTenantSlug } from "./tenant-deployment-pure.js";
import {
  normalizeStudioSiteBaseDomain,
  parsePlatformStudioSlug,
} from "./tenant-hostname-pure.js";

/** Live Studio site zone for nested workflows hosts. */
export const DEFAULT_WORKFLOWS_SITE_BASE_DOMAIN = "glassboxcomputer.site";

/**
 * Optional org-wide shared n8n on `.com` (not tied to a Studio shell label).
 * Primary dogfood shell uses {@link PLATFORM_PRIMARY_WORKFLOWS_URL} instead.
 */
export const PLATFORM_SHARED_WORKFLOWS_BASE_URL =
  "https://workflows.glassboxcomputer.com";

/**
 * @deprecated Prefer {@link PLATFORM_PRIMARY_WORKFLOWS_URL} for auth dogfood,
 * or {@link PLATFORM_SHARED_WORKFLOWS_BASE_URL} for org-shared.
 */
export const PLATFORM_WORKFLOWS_BASE_URL = PLATFORM_SHARED_WORKFLOWS_BASE_URL;

/**
 * `workflows.{slug}.{base}` — nested under site zone so one-label Studio
 * Worker route does not claim it.
 */
export function platformWorkflowsHostname(
  slug: string,
  baseDomain: string = DEFAULT_WORKFLOWS_SITE_BASE_DOMAIN,
): string | null {
  const s = normalizeTenantSlug(slug);
  if (!s) return null;
  const base = normalizeStudioSiteBaseDomain(baseDomain);
  return `workflows.${s}.${base}`;
}

export function platformWorkflowsUrl(
  slug: string,
  baseDomain: string = DEFAULT_WORKFLOWS_SITE_BASE_DOMAIN,
): string | null {
  const host = platformWorkflowsHostname(slug, baseDomain);
  return host ? `https://${host}` : null;
}

/** Primary Studio shell (`auth.…site`) → `https://workflows.auth.…site`. */
export const PLATFORM_PRIMARY_WORKFLOWS_URL =
  platformWorkflowsUrl(
    PLATFORM_STUDIO_PRIMARY_SLUG,
    DEFAULT_WORKFLOWS_SITE_BASE_DOMAIN,
  ) ?? `https://workflows.${PLATFORM_STUDIO_PRIMARY_SLUG}.${DEFAULT_WORKFLOWS_SITE_BASE_DOMAIN}`;

/**
 * Derive n8n vanity URL from the Studio shell hostname.
 * `auth.glassboxcomputer.site` → `https://workflows.auth.glassboxcomputer.site`
 * `acme.glassboxcomputer.site` → `https://workflows.acme.glassboxcomputer.site`
 */
export function platformWorkflowsUrlFromStudioHostname(
  studioHost: string,
  baseDomain: string = DEFAULT_WORKFLOWS_SITE_BASE_DOMAIN,
): string | null {
  const host = studioHost.trim().toLowerCase().split(":")[0] ?? "";
  if (!host) return null;
  const slug = parsePlatformStudioSlug(host, baseDomain);
  if (!slug) return null;
  // One-label reserved hosts (workflows, api, …) are not Studio shells —
  // except the primary OAuth shell `auth`.
  if (
    isReservedTenantSlug(slug) &&
    slug !== PLATFORM_STUDIO_PRIMARY_SLUG
  ) {
    return null;
  }
  return platformWorkflowsUrl(slug, baseDomain);
}

/**
 * Cloudflare DNS record name relative to the zone apex
 * (`workflows.{slug}` → CNAME target `{flyApp}.fly.dev`).
 */
export function platformWorkflowsDnsRecordName(slug: string): string | null {
  const s = normalizeTenantSlug(slug);
  if (!s) return null;
  return `workflows.${s}`;
}

/** Host env patch after tenant n8n provision. */
export function n8nHostEnvFromResourceUrl(
  resourceUrl: string,
): { N8N_BASE_URL: string } | null {
  const raw = resourceUrl.trim().replace(/\/+$/, "");
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return { N8N_BASE_URL: u.origin };
  } catch {
    return null;
  }
}
