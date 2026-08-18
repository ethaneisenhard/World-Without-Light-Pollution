/**
 * Provision Fly apps from catalog row + tenant short id.
 * Deps-injected — dry-run or real `fly apps create`.
 */

import { getSidecarCatalogRow } from "./sidecar-catalog-registry-pure.js";
import {
  controlPlaneFlyAppName,
  controlPlaneResourceName,
  type ControlPlaneDeployment,
  type LegacyResourceRef,
  mergeDeploymentResources,
} from "./tenant-deployment-pure.js";

export type FlyCreateAppResult = {
  appName: string;
  /** Public hostname when known (else derived). */
  hostname?: string;
  created: boolean;
  /** Already existed — attach only. */
  attached?: boolean;
};

export type ProvisionFlyDeps = {
  createApp: (input: {
    appName: string;
    org?: string;
  }) => Promise<FlyCreateAppResult>;
  org?: string;
};

export type ProvisionFlyInput = {
  tenantShortId: string;
  sidecarId: string;
  deployment: ControlPlaneDeployment;
  /** Skip real create — CI / local without Fly token. */
  dryRun?: boolean;
};

export type ProvisionFlyOutcome =
  | {
      ok: true;
      dryRun: boolean;
      resourceName: string;
      flyApp: string;
      resource: LegacyResourceRef;
      deployment: ControlPlaneDeployment;
    }
  | { ok: false; error: string };

export async function provisionFlySidecarOrchestrator(
  deps: ProvisionFlyDeps,
  input: ProvisionFlyInput,
): Promise<ProvisionFlyOutcome> {
  const row = getSidecarCatalogRow(input.sidecarId);
  if (!row) return { ok: false, error: "unknown_sidecar" };
  if (row.provider !== "fly") return { ok: false, error: "not_fly_sidecar" };

  const resourceName = controlPlaneResourceName(
    input.tenantShortId,
    input.sidecarId,
  );
  const flyApp = controlPlaneFlyAppName(input.tenantShortId, input.sidecarId);

  if (input.dryRun) {
    const resource: LegacyResourceRef = {
      sidecarId: input.sidecarId,
      url: `https://${flyApp}.fly.dev`,
      flyApp,
    };
    return {
      ok: true,
      dryRun: true,
      resourceName,
      flyApp,
      resource,
      deployment: mergeDeploymentResources(input.deployment, [resource]),
    };
  }

  const result = await deps.createApp({
    appName: flyApp,
    org: deps.org,
  });
  const hostname =
    result.hostname ?? `${result.appName}.fly.dev`;
  const resource: LegacyResourceRef = {
    sidecarId: input.sidecarId,
    url: hostname.startsWith("http") ? hostname : `https://${hostname}`,
    flyApp: result.appName,
  };
  return {
    ok: true,
    dryRun: false,
    resourceName,
    flyApp: result.appName,
    resource,
    deployment: mergeDeploymentResources(input.deployment, [resource]),
  };
}
