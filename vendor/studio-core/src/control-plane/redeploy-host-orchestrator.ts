/**
 * Hosted Host image roll — update existing Fly machine image; volume SoT stays.
 * ADR 0014: not dual-Host sync; prefer backup (issue 15) before destructive ops.
 */

import {
  flyListMachines,
  flyUpdateMachineImage,
  type FlyMachinesApiDeps,
} from "./fly-machines-api-orchestrator.js";
import {
  appendProvisionJobLog,
  createProvisionJob,
  markProvisionJobError,
  markProvisionJobReady,
  markProvisionJobRunning,
  type ProvisionJob,
} from "./provision-job-pure.js";
import {
  mergeDeploymentResources,
  type ControlPlaneDeployment,
  type ControlPlaneTenant,
} from "./tenant-deployment-pure.js";

export type RedeployHostInput = {
  jobId: string;
  tenant: ControlPlaneTenant;
  deployment: ControlPlaneDeployment;
  /** Target image tag/digest (usually FLY_HOST_IMAGE). */
  image: string;
  dryRun?: boolean;
  now?: number;
};

export type RedeployHostOutcome =
  | {
      ok: true;
      job: ProvisionJob;
      deployment: ControlPlaneDeployment;
      flyApp: string;
      machineId?: string;
    }
  | { ok: false; job: ProvisionJob; error: string };

export async function redeployHostOrchestrator(
  deps: FlyMachinesApiDeps,
  input: RedeployHostInput,
): Promise<RedeployHostOutcome> {
  const host = input.deployment.resources.find((r) => r.sidecarId === "host");
  const flyApp = host?.flyApp?.trim() ?? "";
  const resourceUrl = host?.url?.trim() ?? "";

  let job = createProvisionJob({
    id: input.jobId,
    deploymentId: input.deployment.id,
    tenantId: input.tenant.id,
    sidecarId: "host",
    dryRun: input.dryRun,
    now: input.now,
    log: [
      `redeploy host image for tenant ${input.tenant.slug}`,
      `target image ${input.image}`,
      flyApp ? `fly app ${flyApp}` : "fly app missing on deployment",
    ],
  });

  if (!flyApp || !resourceUrl) {
    job = markProvisionJobError(
      job,
      "host_not_provisioned — provision Studio Host before redeploy",
      input.now,
    );
    return { ok: false, job, error: job.error ?? "host_not_provisioned" };
  }

  if (input.dryRun) {
    job = appendProvisionJobLog(
      job,
      "dry-run — skip Fly machine image update (volume /data preserved on real roll)",
      input.now,
    );
    job = markProvisionJobReady(job, {
      flyApp,
      resourceUrl,
      now: input.now,
      note: "Redeploy dry-run. Real roll updates machine image only; Host data on volume stays.",
    });
    const deployment = mergeDeploymentResources(input.deployment, [
      { ...host!, image: input.image },
    ]);
    return { ok: true, job, deployment, flyApp };
  }

  job = markProvisionJobRunning(job, input.now);
  job = appendProvisionJobLog(job, "list machines", input.now);
  const listed = await flyListMachines(deps, { appName: flyApp });
  if (!listed.ok) {
    job = markProvisionJobError(job, listed.error, input.now);
    return { ok: false, job, error: listed.error };
  }
  const live = listed.machines.find((m) =>
    /^(started|starting|created|replacing|stopping|stopped)$/i.test(m.state),
  );
  if (!live) {
    job = markProvisionJobError(job, "no_machine_to_redeploy", input.now);
    return { ok: false, job, error: "no_machine_to_redeploy" };
  }

  job = appendProvisionJobLog(
    job,
    `update machine ${live.id} → ${input.image}`,
    input.now,
  );
  const updated = await flyUpdateMachineImage(deps, {
    appName: flyApp,
    machineId: live.id,
    image: input.image,
  });
  if (!updated.ok) {
    job = markProvisionJobError(job, updated.error, input.now);
    return { ok: false, job, error: updated.error };
  }

  job = markProvisionJobReady(job, {
    flyApp,
    resourceUrl,
    now: input.now,
    note: "Host image rolled. Volume /data (registry, ledger, files) preserved — not a sync.",
  });
  const deployment = mergeDeploymentResources(input.deployment, [
    { ...host!, image: input.image },
  ]);
  return {
    ok: true,
    job,
    deployment,
    flyApp,
    machineId: live.id,
  };
}
