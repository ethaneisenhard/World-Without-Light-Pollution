/**
 * In-memory control-plane store (Worker / tests). Seed dogfood; signup adds tenants.
 */

import { seedDogfoodControlPlane } from "./dogfood-seed-pure.js";
import {
  createDeployment,
  createTenant,
  studioDeploymentId,
  type ControlPlaneDeployment,
  type ControlPlaneTenant,
} from "./tenant-deployment-pure.js";
import { whimsicalTenantSlug } from "./tenant-slug-whimsy-pure.js";

export type ControlPlaneStore = {
  listTenants: () => ControlPlaneTenant[];
  getTenant: (id: string) => ControlPlaneTenant | null;
  getTenantBySlug: (slug: string) => ControlPlaneTenant | null;
  getTenantByOwnerUserId: (userId: string) => ControlPlaneTenant | null;
  upsertTenant: (tenant: ControlPlaneTenant, ownerUserId?: string) => void;
  listDeployments: (tenantId?: string) => ControlPlaneDeployment[];
  getDeployment: (id: string) => ControlPlaneDeployment | null;
  upsertDeployment: (deployment: ControlPlaneDeployment) => void;
};

export function createControlPlaneMemoryStore(opts?: {
  seedDogfood?: boolean;
  now?: number;
}): ControlPlaneStore {
  const tenants = new Map<string, ControlPlaneTenant>();
  const ownerByUser = new Map<string, string>();
  const deployments = new Map<string, ControlPlaneDeployment>();

  if (opts?.seedDogfood !== false) {
    const seed = seedDogfoodControlPlane(opts?.now ?? Date.now());
    tenants.set(seed.tenant.id, seed.tenant);
    deployments.set(seed.deployment.id, seed.deployment);
  }

  return {
    listTenants: () => [...tenants.values()],
    getTenant: (id) => tenants.get(id) ?? null,
    getTenantBySlug: (slug) => {
      const want = slug.trim().toLowerCase();
      for (const t of tenants.values()) {
        if (t.slug === want) return t;
      }
      return null;
    },
    getTenantByOwnerUserId: (userId) => {
      const tid = ownerByUser.get(userId);
      return tid ? (tenants.get(tid) ?? null) : null;
    },
    upsertTenant: (tenant, ownerUserId) => {
      tenants.set(tenant.id, tenant);
      if (ownerUserId) ownerByUser.set(ownerUserId, tenant.id);
    },
    listDeployments: (tenantId) => {
      const all = [...deployments.values()];
      return tenantId ? all.filter((d) => d.tenantId === tenantId) : all;
    },
    getDeployment: (id) => deployments.get(id) ?? null,
    upsertDeployment: (deployment) => {
      deployments.set(deployment.id, deployment);
    },
  };
}

/** Create tenant + draft Glass Box Studio deployment for a new signup. */
export function onboardSignupTenant(
  store: ControlPlaneStore,
  input: {
    userId: string;
    email: string;
    displayName?: string;
    slugHint?: string;
    now?: number;
  },
):
  | { ok: true; tenant: ControlPlaneTenant; deployment: ControlPlaneDeployment }
  | { ok: false; error: string } {
  const existing = store.getTenantByOwnerUserId(input.userId);
  if (existing) {
    const deps = store.listDeployments(existing.id);
    let deployment = deps[0];
    if (!deployment) {
      deployment = createDeployment({
        id: studioDeploymentId(existing.id),
        tenantId: existing.id,
        label: "Glass Box Studio",
        now: input.now,
      });
      store.upsertDeployment(deployment);
    }
    return { ok: true, tenant: existing, deployment };
  }

  let slug = whimsicalTenantSlug({
    userId: input.userId,
    stemHint: input.slugHint,
  });
  if (store.getTenantBySlug(slug)) {
    // Extremely rare (same uid) — bump with extra hash slice.
    slug = whimsicalTenantSlug({
      userId: `${input.userId}-alt`,
      stemHint: input.slugHint,
    });
  }

  const tenantId = `tenant_${input.userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16)}`;
  const tenantResult = createTenant({
    id: tenantId,
    slug,
    displayName: input.displayName?.trim() || slug,
  });
  if ("error" in tenantResult) return { ok: false, error: tenantResult.error };

  const deployment = createDeployment({
    id: studioDeploymentId(tenantResult.id),
    tenantId: tenantResult.id,
    label: "Glass Box Studio",
    now: input.now,
  });

  store.upsertTenant(tenantResult, input.userId);
  store.upsertDeployment(deployment);
  return { ok: true, tenant: tenantResult, deployment };
}

/** Async store surface (D1 + memory adapter). */
export type ControlPlaneAsyncStore = {
  listTenants: () => Promise<ControlPlaneTenant[]>;
  getTenant: (id: string) => Promise<ControlPlaneTenant | null>;
  getTenantBySlug: (slug: string) => Promise<ControlPlaneTenant | null>;
  getTenantByOwnerUserId: (userId: string) => Promise<ControlPlaneTenant | null>;
  upsertTenant: (
    tenant: ControlPlaneTenant,
    ownerUserId?: string,
  ) => Promise<void>;
  listDeployments: (tenantId?: string) => Promise<ControlPlaneDeployment[]>;
  getDeployment: (id: string) => Promise<ControlPlaneDeployment | null>;
  upsertDeployment: (deployment: ControlPlaneDeployment) => Promise<void>;
};

export function asControlPlaneAsyncStore(
  store: ControlPlaneStore,
): ControlPlaneAsyncStore {
  return {
    listTenants: async () => store.listTenants(),
    getTenant: async (id) => store.getTenant(id),
    getTenantBySlug: async (slug) => store.getTenantBySlug(slug),
    getTenantByOwnerUserId: async (userId) =>
      store.getTenantByOwnerUserId(userId),
    upsertTenant: async (tenant, ownerUserId) => {
      store.upsertTenant(tenant, ownerUserId);
    },
    listDeployments: async (tenantId) => store.listDeployments(tenantId),
    getDeployment: async (id) => store.getDeployment(id),
    upsertDeployment: async (deployment) => {
      store.upsertDeployment(deployment);
    },
  };
}

export async function onboardSignupTenantAsync(
  store: ControlPlaneAsyncStore,
  input: {
    userId: string;
    email: string;
    displayName?: string;
    slugHint?: string;
    now?: number;
  },
): Promise<
  | { ok: true; tenant: ControlPlaneTenant; deployment: ControlPlaneDeployment }
  | { ok: false; error: string }
> {
  const existing = await store.getTenantByOwnerUserId(input.userId);
  if (existing) {
    const deps = await store.listDeployments(existing.id);
    let deployment = deps[0];
    if (!deployment) {
      deployment = createDeployment({
        id: studioDeploymentId(existing.id),
        tenantId: existing.id,
        label: "Glass Box Studio",
        now: input.now,
      });
      await store.upsertDeployment(deployment);
    }
    return { ok: true, tenant: existing, deployment };
  }

  let slug = whimsicalTenantSlug({
    userId: input.userId,
    stemHint: input.slugHint,
  });
  if (await store.getTenantBySlug(slug)) {
    slug = whimsicalTenantSlug({
      userId: `${input.userId}-alt`,
      stemHint: input.slugHint,
    });
  }

  const tenantId = `tenant_${input.userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16)}`;
  const tenantResult = createTenant({
    id: tenantId,
    slug,
    displayName: input.displayName?.trim() || slug,
  });
  if ("error" in tenantResult) return { ok: false, error: tenantResult.error };

  const deployment = createDeployment({
    id: studioDeploymentId(tenantResult.id),
    tenantId: tenantResult.id,
    label: "Glass Box Studio",
    now: input.now,
  });

  await store.upsertTenant(tenantResult, input.userId);
  await store.upsertDeployment(deployment);
  return { ok: true, tenant: tenantResult, deployment };
}
