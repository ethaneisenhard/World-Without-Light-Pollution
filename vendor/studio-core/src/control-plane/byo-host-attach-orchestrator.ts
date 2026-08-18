/**
 * Attach an external (Self-host) Host URL to a deployment — no Fly provision.
 */

import {
  byoHostHealthUrl,
  isStudioHostHealthBody,
  parseByoHostUrl,
} from "./byo-host-attach-pure.js";
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

export type ByoHostAttachDeps = {
  fetch: typeof fetch;
};

export type ByoHostAttachInput = {
  jobId: string;
  tenant: ControlPlaneTenant;
  deployment: ControlPlaneDeployment;
  hostUrl: string;
  /** Skip HTTP health (tests / offline). */
  skipHealth?: boolean;
  dryRun?: boolean;
  now?: number;
};

export type ByoHostAttachOutcome =
  | {
      ok: true;
      job: ProvisionJob;
      deployment: ControlPlaneDeployment;
      hostUrl: string;
    }
  | { ok: false; job: ProvisionJob; error: string };

export async function attachByoHostOrchestrator(
  deps: ByoHostAttachDeps,
  input: ByoHostAttachInput,
): Promise<ByoHostAttachOutcome> {
  const parsed = parseByoHostUrl(input.hostUrl);
  let job = createProvisionJob({
    id: input.jobId,
    deploymentId: input.deployment.id,
    tenantId: input.tenant.id,
    sidecarId: "host",
    dryRun: input.dryRun,
    now: input.now,
    log: [
      `BYO-Host attach for tenant ${input.tenant.slug}`,
      `candidate ${String(input.hostUrl).trim()}`,
    ],
  });

  if (!parsed.ok) {
    job = markProvisionJobError(job, parsed.error, input.now);
    return { ok: false, job, error: parsed.error };
  }

  if (input.dryRun) {
    job = appendProvisionJobLog(
      job,
      "dry-run — skip health + persist",
      input.now,
    );
    job = markProvisionJobReady(job, {
      flyApp: "byo-host",
      resourceUrl: parsed.url,
      now: input.now,
      note: "BYO-Host dry-run. Real attach health-checks then stores Host URL (no Fly create).",
    });
    const deployment = mergeDeploymentResources(input.deployment, [
      { sidecarId: "host", url: parsed.url, flyApp: "byo-host" },
    ]);
    return { ok: true, job, deployment, hostUrl: parsed.url };
  }

  job = markProvisionJobRunning(job, input.now);

  if (!input.skipHealth) {
    const healthUrl = byoHostHealthUrl(parsed.url);
    job = appendProvisionJobLog(job, `GET ${healthUrl}`, input.now);
    let res: Response;
    try {
      res = await deps.fetch(healthUrl, {
        headers: { Accept: "application/json" },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      job = markProvisionJobError(job, `health_unreachable: ${msg}`, input.now);
      return { ok: false, job, error: job.error ?? "health_unreachable" };
    }
    if (!res.ok) {
      job = markProvisionJobError(
        job,
        `health_http_${res.status}`,
        input.now,
      );
      return { ok: false, job, error: job.error ?? `health_http_${res.status}` };
    }
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    if (!isStudioHostHealthBody(body)) {
      job = markProvisionJobError(job, "health_not_studio_host", input.now);
      return { ok: false, job, error: "health_not_studio_host" };
    }
    job = appendProvisionJobLog(job, "health ok", input.now);
  } else {
    job = appendProvisionJobLog(job, "skip health check", input.now);
  }

  job = markProvisionJobReady(job, {
    flyApp: "byo-host",
    resourceUrl: parsed.url,
    now: input.now,
    note: "BYO-Host attached. Provision Studio UI Worker next for {slug}.browserui.site. Customer owns Host contents.",
  });
  const deployment = mergeDeploymentResources(input.deployment, [
    { sidecarId: "host", url: parsed.url, flyApp: "byo-host" },
  ]);
  return { ok: true, job, deployment, hostUrl: parsed.url };
}
