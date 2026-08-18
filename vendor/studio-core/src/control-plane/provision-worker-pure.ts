/**
 * Studio UI Worker naming + public URL on browserui.site (no I/O).
 */

import { controlPlaneFlyAppName } from "./tenant-deployment-pure.js";
import {
  DEFAULT_STUDIO_SITE_BASE_DOMAIN,
  normalizeStudioSiteBaseDomain,
  platformStudioUrl,
} from "./tenant-hostname-pure.js";

/** Shared edge Worker script name (multi-tenant Host routing). */
export const SHARED_STUDIO_EDGE_WORKER_NAME = "glassbox-studio";

/** Legacy per-tenant script name — kept for migrate/cleanup only. */
export function controlPlaneStudioWorkerName(tenantShortId: string): string {
  return controlPlaneFlyAppName(tenantShortId, "studio");
}

/**
 * Public Studio UI URL for a tenant — `{slug}.browserui.site`.
 * Not `*.workers.dev` (that was a dogfood/dev accident).
 */
export function controlPlaneStudioWorkerUrl(
  tenantSlug: string,
  siteBaseDomain: string = DEFAULT_STUDIO_SITE_BASE_DOMAIN,
): string {
  const url = platformStudioUrl(tenantSlug, siteBaseDomain);
  if (!url) {
    throw new Error(`invalid_tenant_slug:${tenantSlug}`);
  }
  return url;
}

export function studioSiteBaseFromEnv(raw?: string | null): string {
  return normalizeStudioSiteBaseDomain(
    raw ?? DEFAULT_STUDIO_SITE_BASE_DOMAIN,
  );
}

export type StudioWorkerHealth = {
  ok: boolean;
  host?: boolean;
  proxy?: string;
  service?: string;
  tenantSlug?: string;
};

/** True when Worker health proves host proxy matches the tenant host URL. */
export function studioWorkerHealthMatchesHost(
  health: StudioWorkerHealth,
  hostUrl: string,
): boolean {
  if (!health.ok || health.host !== true) return false;
  const want = hostUrl.replace(/\/$/, "").toLowerCase();
  const got = (health.proxy ?? "").replace(/\/$/, "").toLowerCase();
  return Boolean(want && got && want === got);
}
