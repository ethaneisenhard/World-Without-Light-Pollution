/**
 * Validate tenant slug rename (pretty hostname only — Fly apps keep shortId).
 */

import { controlPlaneStudioWorkerUrl } from "./provision-worker-pure.js";
import { normalizeStudioSiteBaseDomain } from "./tenant-hostname-pure.js";
import type {
  ControlPlaneDeployment,
  ControlPlaneTenant,
  LegacyResourceRef,
} from "./tenant-deployment-pure.js";
import {
  composeTenantSlug,
  normalizeTenantSlugStem,
  stemFromTenantSlug,
  tenantSlugUidSuffix,
} from "./tenant-slug-whimsy-pure.js";

export type RenameTenantSlugInput = {
  tenant: ControlPlaneTenant;
  /** Human-edited stem (uid re-appended). */
  desiredStem: string;
  /** Collision check — true if another tenant already has this full slug. */
  slugTaken: boolean;
  studioSiteBaseDomain?: string;
  deployment?: ControlPlaneDeployment | null;
};

export type RenameTenantSlugOk = {
  ok: true;
  previousSlug: string;
  tenant: ControlPlaneTenant;
  studioUrl: string;
  deployment: ControlPlaneDeployment | null;
  note: string;
};

export type RenameTenantSlugErr = {
  ok: false;
  error:
    | "invalid_stem"
    | "reserved"
    | "unchanged"
    | "slug_taken"
    | "invalid_slug";
  message: string;
};

export function proposeTenantSlugRename(
  input: RenameTenantSlugInput,
): RenameTenantSlugOk | RenameTenantSlugErr {
  const stem = normalizeTenantSlugStem(input.desiredStem);
  if (!stem) {
    const raw = input.desiredStem.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "");
    if (
      raw === "dogfood" ||
      raw === "www" ||
      raw === "api" ||
      raw === "app" ||
      raw === "studio"
    ) {
      return {
        ok: false,
        error: "reserved",
        message: "That name is reserved — try something more whimsical.",
      };
    }
    return {
      ok: false,
      error: "invalid_stem",
      message:
        "Use 2–32 letters/numbers (hyphens ok). We’ll keep your unique suffix.",
    };
  }

  const uid = tenantSlugUidSuffix(input.tenant.shortId || input.tenant.id);
  const nextSlug = composeTenantSlug(stem, uid);
  if (!nextSlug) {
    return { ok: false, error: "invalid_slug", message: "Could not build slug." };
  }

  if (nextSlug === input.tenant.slug) {
    return {
      ok: false,
      error: "unchanged",
      message: "That’s already your site name.",
    };
  }

  if (input.slugTaken) {
    return {
      ok: false,
      error: "slug_taken",
      message: "That name is taken — pick another stem.",
    };
  }

  const base = normalizeStudioSiteBaseDomain(input.studioSiteBaseDomain);
  const studioUrl = controlPlaneStudioWorkerUrl(nextSlug, base);
  const tenant: ControlPlaneTenant = {
    ...input.tenant,
    slug: nextSlug,
    displayName:
      input.tenant.displayName === input.tenant.slug ||
      input.tenant.displayName === stemFromTenantSlug(input.tenant.slug)
        ? nextSlug
        : input.tenant.displayName,
  };

  let deployment: ControlPlaneDeployment | null = input.deployment ?? null;
  if (deployment) {
    const resources: LegacyResourceRef[] = deployment.resources.map((r) =>
      r.sidecarId === "worker" ? { ...r, url: studioUrl } : r,
    );
    deployment = { ...deployment, resources };
  }

  return {
    ok: true,
    previousSlug: input.tenant.slug,
    tenant,
    studioUrl,
    deployment,
    note:
      "Slug is your Studio URL only. Host Fly apps keep the same shortId — no re-provision.",
  };
}
