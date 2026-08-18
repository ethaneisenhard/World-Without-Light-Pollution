/**
 * After per-tenant n8n provision — stamp Host machine env N8N_BASE_URL
 * so Studio Preview / rail resolve the tenant vanity URL.
 */

import {
  flyListMachines,
  flyMergeMachineEnv,
  type FlyMachinesApiDeps,
} from "./fly-machines-api-orchestrator.js";
import type { ControlPlaneDeployment } from "./tenant-deployment-pure.js";
import { n8nHostEnvFromResourceUrl } from "./workflows-hostname-pure.js";

export type StampHostN8nEnvInput = {
  deployment: ControlPlaneDeployment;
  /** n8n public URL (vanity). */
  n8nResourceUrl: string;
  dryRun?: boolean;
};

export type StampHostN8nEnvOutcome =
  | {
      ok: true;
      hostFlyApp: string;
      machineId: string | null;
      env: { N8N_BASE_URL: string };
      dryRun?: boolean;
    }
  | { ok: false; error: string };

export async function stampHostN8nBaseUrlOrchestrator(
  deps: FlyMachinesApiDeps,
  input: StampHostN8nEnvInput,
): Promise<StampHostN8nEnvOutcome> {
  const env = n8nHostEnvFromResourceUrl(input.n8nResourceUrl);
  if (!env) return { ok: false, error: "n8n_resource_url_invalid" };

  const host = input.deployment.resources.find((r) => r.sidecarId === "host");
  const hostFlyApp = host?.flyApp?.trim();
  if (!hostFlyApp) {
    return { ok: false, error: "host_fly_app_missing" };
  }

  if (input.dryRun) {
    return {
      ok: true,
      hostFlyApp,
      machineId: null,
      env,
      dryRun: true,
    };
  }

  const listed = await flyListMachines(deps, { appName: hostFlyApp });
  if (!listed.ok) return { ok: false, error: listed.error };
  const live =
    listed.machines.find((m) =>
      /^(started|starting|created|replacing|stopped)$/i.test(m.state),
    ) ?? listed.machines[0];
  if (!live) return { ok: false, error: "host_machine_missing" };

  const merged = await flyMergeMachineEnv(deps, {
    appName: hostFlyApp,
    machineId: live.id,
    env,
  });
  if (!merged.ok) return { ok: false, error: merged.error };

  return {
    ok: true,
    hostFlyApp,
    machineId: merged.machineId,
    env,
  };
}
