/**
 * BrowserUI control plane — tenants + deployments (no I/O).
 * Infra names generated from tenant short + sidecar id — not Ethan hardcodes.
 */

import {
  listDefaultDogfoodSidecars,
  listRequiredSidecars,
} from "./sidecar-catalog-registry-pure.js";

export type ControlPlaneTenant = {
  id: string;
  slug: string;
  displayName: string;
  /** First 8 chars of id used in resource names (stable). */
  shortId: string;
};

export type LegacyResourceRef = {
  sidecarId: string;
  /** Existing Fly/CF hostname or URL — dogfood attach. */
  url: string;
  /** Optional Fly app name before rename migration. */
  flyApp?: string;
  /**
   * Host image tag/digest used at provision/redeploy (Hosted SKU).
   * Same artifact Self-host pulls — ADR 0014.
   */
  image?: string;
};

export type ControlPlaneDeployment = {
  id: string;
  tenantId: string;
  /** Product SKU label (Glass Box Studio). */
  sku: "glassbox-studio";
  label: string;
  status: "draft" | "attaching" | "ready" | "error";
  /** Selected sidecar catalog ids. */
  sidecarIds: readonly string[];
  /** Attached URLs (legacy Fly or provisioned). */
  resources: readonly LegacyResourceRef[];
  createdAt: number;
};

const SLUG_RE = /^[a-z0-9]([a-z0-9-]{0,46}[a-z0-9])?$/;

export function normalizeTenantSlug(raw: string): string | null {
  const slug = raw.trim().toLowerCase();
  if (!SLUG_RE.test(slug)) return null;
  return slug;
}

/**
 * Stable short token for infra names (`bu_<short>_host`).
 * Tenant ids are often `tenant_<unique>` — strip the `tenant` prefix so every
 * commercial signup does not collapse to shortId `tenantus`.
 */
export function tenantShortId(id: string): string {
  const clean = id.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const body = clean.startsWith("tenant") ? clean.slice("tenant".length) : clean;
  const core = body.length >= 4 ? body : clean;
  return (core.slice(0, 8) || "tenant00").padEnd(4, "0");
}

/** Unique deployment primary key — never derive from shortId alone. */
export function studioDeploymentId(tenantId: string): string {
  const clean = tenantId.replace(/[^a-zA-Z0-9]+/g, "").toLowerCase();
  return `deploy_${clean.slice(0, 28) || "tenant"}_studio`;
}

/** Logical resource name — `bu_<short>_<sidecar>` */
export function controlPlaneResourceName(
  tenantShort: string,
  sidecarId: string,
): string {
  const side = sidecarId.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return `bu_${tenantShort}_${side}`;
}

/** Fly app name — hyphens only (`bu-<short>-<sidecar>`). */
export function controlPlaneFlyAppName(
  tenantShort: string,
  sidecarId: string,
): string {
  return controlPlaneResourceName(tenantShort, sidecarId).replaceAll("_", "-");
}

export function createTenant(input: {
  id: string;
  slug: string;
  displayName: string;
}): ControlPlaneTenant | { error: string } {
  const slug = normalizeTenantSlug(input.slug);
  if (!slug) return { error: "invalid_slug" };
  const id = input.id.trim();
  if (!id) return { error: "invalid_id" };
  return {
    id,
    slug,
    displayName: input.displayName.trim() || slug,
    shortId: tenantShortId(id),
  };
}

export function defaultSidecarIdsForNewDeployment(opts?: {
  dogfoodPack?: boolean;
}): string[] {
  if (opts?.dogfoodPack) {
    return listDefaultDogfoodSidecars().map((r) => r.id);
  }
  return listRequiredSidecars().map((r) => r.id);
}

export function createDeployment(input: {
  id: string;
  tenantId: string;
  label?: string;
  sidecarIds?: readonly string[];
  dogfoodPack?: boolean;
  now?: number;
}): ControlPlaneDeployment {
  const sidecarIds =
    input.sidecarIds ??
    defaultSidecarIdsForNewDeployment({ dogfoodPack: input.dogfoodPack });
  return {
    id: input.id,
    tenantId: input.tenantId,
    sku: "glassbox-studio",
    label: input.label?.trim() || "Glass Box Studio",
    status: "draft",
    sidecarIds,
    resources: [],
    createdAt: input.now ?? Date.now(),
  };
}

export function mergeDeploymentResources(
  deployment: ControlPlaneDeployment,
  resources: readonly LegacyResourceRef[],
): ControlPlaneDeployment {
  const byId = new Map(deployment.resources.map((r) => [r.sidecarId, r]));
  for (const r of resources) byId.set(r.sidecarId, r);
  return {
    ...deployment,
    resources: [...byId.values()],
    status: byId.size > 0 ? "ready" : deployment.status,
  };
}
