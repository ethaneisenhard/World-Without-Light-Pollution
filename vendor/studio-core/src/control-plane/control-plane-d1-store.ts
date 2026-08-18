/**
 * D1-backed control-plane store (tenants + deployments).
 */

import { seedDogfoodControlPlane } from "./dogfood-seed-pure.js";
import type { ControlPlaneAsyncStore } from "./control-plane-store-pure.js";
import {
  tenantShortId,
  type ControlPlaneDeployment,
  type ControlPlaneTenant,
} from "./tenant-deployment-pure.js";

export type D1DatabaseLike = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => {
      first: <T>() => Promise<T | null>;
      all: <T>() => Promise<{ results?: T[] }>;
      run: () => Promise<{ meta?: { changes?: number } }>;
    };
  };
};

type TenantRow = {
  id: string;
  slug: string;
  display_name: string;
  short_id: string;
  owner_user_id: string | null;
};

type DeploymentRow = {
  id: string;
  tenant_id: string;
  sku: string;
  label: string;
  status: string;
  sidecar_ids: string;
  resources: string;
  created_at: number;
};

function rowToTenant(row: TenantRow): ControlPlaneTenant {
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.display_name,
    shortId: row.short_id,
  };
}

function rowToDeployment(row: DeploymentRow): ControlPlaneDeployment {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    sku: row.sku as ControlPlaneDeployment["sku"],
    label: row.label,
    status: row.status as ControlPlaneDeployment["status"],
    sidecarIds: JSON.parse(row.sidecar_ids) as string[],
    resources: JSON.parse(row.resources) as ControlPlaneDeployment["resources"],
    createdAt: row.created_at,
  };
}

export async function ensureControlPlaneSchema(db: D1DatabaseLike): Promise<void> {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS cp_tenant (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        short_id TEXT NOT NULL,
        owner_user_id TEXT,
        created_at INTEGER NOT NULL
      )`,
    )
    .bind()
    .run();
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS cp_deployment (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        sku TEXT NOT NULL,
        label TEXT NOT NULL,
        status TEXT NOT NULL,
        sidecar_ids TEXT NOT NULL,
        resources TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )`,
    )
    .bind()
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS cp_tenant_owner_idx ON cp_tenant(owner_user_id)`,
    )
    .bind()
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS cp_deployment_tenant_idx ON cp_deployment(tenant_id)`,
    )
    .bind()
    .run();
}

async function seedDogfoodIfEmpty(
  db: D1DatabaseLike,
  now?: number,
): Promise<void> {
  const existing = await db
    .prepare(`SELECT id FROM cp_tenant WHERE slug = 'dogfood' LIMIT 1`)
    .bind()
    .first<{ id: string }>();
  if (existing) return;
  const seed = seedDogfoodControlPlane(now ?? Date.now());
  await db
    .prepare(
      `INSERT INTO cp_tenant (id, slug, display_name, short_id, owner_user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      seed.tenant.id,
      seed.tenant.slug,
      seed.tenant.displayName,
      seed.tenant.shortId,
      "starter-member",
      seed.deployment.createdAt,
    )
    .run();
  await db
    .prepare(
      `INSERT INTO cp_deployment
         (id, tenant_id, sku, label, status, sidecar_ids, resources, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      seed.deployment.id,
      seed.deployment.tenantId,
      seed.deployment.sku,
      seed.deployment.label,
      seed.deployment.status,
      JSON.stringify(seed.deployment.sidecarIds),
      JSON.stringify(seed.deployment.resources),
      seed.deployment.createdAt,
    )
    .run();
}

/** Rewrite collided/legacy short_ids (e.g. every signup → `tenantus`). */
async function repairTenantShortIds(db: D1DatabaseLike): Promise<void> {
  const res = await db
    .prepare(`SELECT id, short_id FROM cp_tenant`)
    .bind()
    .all<{ id: string; short_id: string }>();
  const used = new Set<string>();
  for (const row of res.results ?? []) {
    let next = tenantShortId(row.id);
    if (used.has(next)) {
      const tail = row.id.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(-4);
      next = `${next.slice(0, 4)}${tail}`.slice(0, 8);
    }
    used.add(next);
    if (next !== row.short_id) {
      await db
        .prepare(`UPDATE cp_tenant SET short_id = ? WHERE id = ?`)
        .bind(next, row.id)
        .run();
    }
  }
}

export async function openControlPlaneD1Store(
  db: D1DatabaseLike,
  opts?: { seedDogfood?: boolean; now?: number },
): Promise<ControlPlaneAsyncStore> {
  await ensureControlPlaneSchema(db);
  if (opts?.seedDogfood !== false) {
    await seedDogfoodIfEmpty(db, opts?.now);
  }
  await repairTenantShortIds(db);

  return {
    async listTenants() {
      const res = await db
        .prepare(
          `SELECT id, slug, display_name, short_id, owner_user_id FROM cp_tenant`,
        )
        .bind()
        .all<TenantRow>();
      return (res.results ?? []).map(rowToTenant);
    },
    async getTenant(id) {
      const row = await db
        .prepare(
          `SELECT id, slug, display_name, short_id, owner_user_id FROM cp_tenant WHERE id = ?`,
        )
        .bind(id)
        .first<TenantRow>();
      return row ? rowToTenant(row) : null;
    },
    async getTenantBySlug(slug) {
      const row = await db
        .prepare(
          `SELECT id, slug, display_name, short_id, owner_user_id FROM cp_tenant WHERE slug = ?`,
        )
        .bind(slug.trim().toLowerCase())
        .first<TenantRow>();
      return row ? rowToTenant(row) : null;
    },
    async getTenantByOwnerUserId(userId) {
      const row = await db
        .prepare(
          `SELECT id, slug, display_name, short_id, owner_user_id FROM cp_tenant WHERE owner_user_id = ? LIMIT 1`,
        )
        .bind(userId)
        .first<TenantRow>();
      return row ? rowToTenant(row) : null;
    },
    async upsertTenant(tenant, ownerUserId) {
      await db
        .prepare(
          `INSERT INTO cp_tenant (id, slug, display_name, short_id, owner_user_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             slug = excluded.slug,
             display_name = excluded.display_name,
             short_id = excluded.short_id,
             owner_user_id = COALESCE(excluded.owner_user_id, cp_tenant.owner_user_id)`,
        )
        .bind(
          tenant.id,
          tenant.slug,
          tenant.displayName,
          tenant.shortId,
          ownerUserId ?? null,
          Date.now(),
        )
        .run();
    },
    async listDeployments(tenantId) {
      const res = tenantId
        ? await db
            .prepare(
              `SELECT id, tenant_id, sku, label, status, sidecar_ids, resources, created_at
               FROM cp_deployment WHERE tenant_id = ?`,
            )
            .bind(tenantId)
            .all<DeploymentRow>()
        : await db
            .prepare(
              `SELECT id, tenant_id, sku, label, status, sidecar_ids, resources, created_at
               FROM cp_deployment`,
            )
            .bind()
            .all<DeploymentRow>();
      return (res.results ?? []).map(rowToDeployment);
    },
    async getDeployment(id) {
      const row = await db
        .prepare(
          `SELECT id, tenant_id, sku, label, status, sidecar_ids, resources, created_at
           FROM cp_deployment WHERE id = ?`,
        )
        .bind(id)
        .first<DeploymentRow>();
      return row ? rowToDeployment(row) : null;
    },
    async upsertDeployment(deployment) {
      await db
        .prepare(
          `INSERT INTO cp_deployment
             (id, tenant_id, sku, label, status, sidecar_ids, resources, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             tenant_id = excluded.tenant_id,
             sku = excluded.sku,
             label = excluded.label,
             status = excluded.status,
             sidecar_ids = excluded.sidecar_ids,
             resources = excluded.resources`,
        )
        .bind(
          deployment.id,
          deployment.tenantId,
          deployment.sku,
          deployment.label,
          deployment.status,
          JSON.stringify(deployment.sidecarIds),
          JSON.stringify(deployment.resources),
          deployment.createdAt,
        )
        .run();
    },
  };
}
