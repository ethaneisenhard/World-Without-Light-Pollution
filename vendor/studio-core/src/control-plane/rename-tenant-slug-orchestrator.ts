/**
 * Persist tenant slug rename + rewrite Studio UI resource URL.
 */

import {
  proposeTenantSlugRename,
  type RenameTenantSlugErr,
  type RenameTenantSlugOk,
} from "./rename-tenant-slug-pure.js";
import type { ControlPlaneAsyncStore } from "./control-plane-store-pure.js";

export type RenameTenantSlugDeps = {
  store: ControlPlaneAsyncStore;
  studioSiteBaseDomain?: string;
};

export type RenameTenantSlugOrchestratorInput = {
  ownerUserId: string;
  desiredStem: string;
};

export async function renameTenantSlugOrchestrator(
  deps: RenameTenantSlugDeps,
  input: RenameTenantSlugOrchestratorInput,
): Promise<RenameTenantSlugOk | RenameTenantSlugErr> {
  const tenant = await deps.store.getTenantByOwnerUserId(input.ownerUserId);
  if (!tenant) {
    return {
      ok: false,
      error: "invalid_slug",
      message: "No tenant for this account.",
    };
  }

  const depsList = await deps.store.listDeployments(tenant.id);
  const deployment = depsList[0] ?? null;

  // Probe candidate slug for collision (same uid suffix → only stem clash risk).
  const probe = proposeTenantSlugRename({
    tenant,
    desiredStem: input.desiredStem,
    slugTaken: false,
    studioSiteBaseDomain: deps.studioSiteBaseDomain,
    deployment,
  });
  if (!probe.ok) return probe;

  const other = await deps.store.getTenantBySlug(probe.tenant.slug);
  if (other && other.id !== tenant.id) {
    return {
      ok: false,
      error: "slug_taken",
      message: "That name is taken — pick another stem.",
    };
  }

  const proposed = proposeTenantSlugRename({
    tenant,
    desiredStem: input.desiredStem,
    slugTaken: false,
    studioSiteBaseDomain: deps.studioSiteBaseDomain,
    deployment,
  });
  if (!proposed.ok) return proposed;

  await deps.store.upsertTenant(proposed.tenant, input.ownerUserId);
  if (proposed.deployment) {
    await deps.store.upsertDeployment(proposed.deployment);
  }
  return proposed;
}
