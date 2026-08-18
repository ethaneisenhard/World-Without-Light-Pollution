/**
 * First-customer / platform seed — same shape any tenant gets.
 * Slug is `auth` so Studio shell auth.…site ↔ workflows.auth.…site.
 */

import { legacyResourcesForSidecars } from "./legacy-fly-attach-pure.js";
import { PLATFORM_STUDIO_PRIMARY_SLUG } from "./reserved-tenant-slugs-pure.js";
import {
  createDeployment,
  createTenant,
  mergeDeploymentResources,
  type ControlPlaneDeployment,
  type ControlPlaneTenant,
} from "./tenant-deployment-pure.js";

export type DogfoodControlPlaneSeed = {
  tenant: ControlPlaneTenant;
  deployment: ControlPlaneDeployment;
};

/** Stable ids for local/POC — not secrets. */
export const DOGFOOD_TENANT_ID = "tenant_dogfood_001";
export const DOGFOOD_DEPLOYMENT_ID = "deploy_dogfood_studio_001";

/** Platform primary shell label — matches `auth.glassboxcomputer.site`. */
export const DOGFOOD_TENANT_SLUG = PLATFORM_STUDIO_PRIMARY_SLUG;

export function seedDogfoodControlPlane(now = Date.now()): DogfoodControlPlaneSeed {
  const tenantResult = createTenant({
    id: DOGFOOD_TENANT_ID,
    slug: DOGFOOD_TENANT_SLUG,
    displayName: "Glass Box Studio",
  });
  if ("error" in tenantResult) {
    throw new Error(`dogfood seed: ${tenantResult.error}`);
  }
  let deployment = createDeployment({
    id: DOGFOOD_DEPLOYMENT_ID,
    tenantId: tenantResult.id,
    label: "Glass Box Studio (auth dogfood)",
    dogfoodPack: true,
    now,
  });
  deployment = mergeDeploymentResources(
    deployment,
    legacyResourcesForSidecars(deployment.sidecarIds),
  );
  return { tenant: tenantResult, deployment };
}
