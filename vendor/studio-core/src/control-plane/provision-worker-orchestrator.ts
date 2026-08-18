/**
 * Attach Studio UI on `{slug}.browserui.site` (shared edge Worker).
 *
 * Create path: CF routes / DNS for the platform zone (control-plane secrets).
 * This orchestrator verifies the public site URL and attaches the resource.
 * Custom CNAME / BYO nameservers later reuse the same attach shape (URL SoT).
 */

import {
  appendProvisionJobLog,
  createProvisionJob,
  markProvisionJobError,
  markProvisionJobReady,
  markProvisionJobRunning,
  type ProvisionJob,
} from "./provision-job-pure.js";
import {
  SHARED_STUDIO_EDGE_WORKER_NAME,
  controlPlaneStudioWorkerUrl,
  studioSiteBaseFromEnv,
  studioWorkerHealthMatchesHost,
  type StudioWorkerHealth,
} from "./provision-worker-pure.js";
import {
  mergeDeploymentResources,
  type ControlPlaneDeployment,
  type ControlPlaneTenant,
} from "./tenant-deployment-pure.js";

export type ProvisionWorkerDeps = {
  fetch: typeof fetch;
  /** Platform zone, default browserui.site */
  studioSiteBaseDomain: string;
};

export type ProvisionWorkerInput = {
  jobId: string;
  tenant: ControlPlaneTenant;
  deployment: ControlPlaneDeployment;
  hostUrl: string;
  dryRun?: boolean;
  now?: number;
};

export type ProvisionWorkerOutcome =
  | {
      ok: true;
      job: ProvisionJob;
      deployment: ControlPlaneDeployment;
      workerName: string;
      resourceUrl: string;
    }
  | { ok: false; job: ProvisionJob; error: string };

async function readWorkerHealth(
  fetchFn: typeof fetch,
  workerUrl: string,
): Promise<StudioWorkerHealth> {
  try {
    const res = await fetchFn(`${workerUrl.replace(/\/$/, "")}/health`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return { ok: false };
    const body = (await res.json()) as StudioWorkerHealth;
    return {
      ok: body.ok === true,
      host: body.host,
      proxy: body.proxy,
      service: body.service,
      tenantSlug: body.tenantSlug,
    };
  } catch {
    return { ok: false };
  }
}

export async function provisionWorkerOrchestrator(
  deps: ProvisionWorkerDeps,
  input: ProvisionWorkerInput,
): Promise<ProvisionWorkerOutcome> {
  const base = studioSiteBaseFromEnv(deps.studioSiteBaseDomain);
  const workerName = SHARED_STUDIO_EDGE_WORKER_NAME;
  const resourceUrl = controlPlaneStudioWorkerUrl(input.tenant.slug, base);
  let job = createProvisionJob({
    id: input.jobId,
    deploymentId: input.deployment.id,
    tenantId: input.tenant.id,
    sidecarId: "worker",
    dryRun: input.dryRun,
    now: input.now,
    log: [
      `provision Studio UI for tenant ${input.tenant.slug}`,
      `public URL ${resourceUrl} (platform subdomain on ${base})`,
      `edge Worker ${workerName} (shared; Host header routes API proxy)`,
      `host API target ${input.hostUrl}`,
      `custom DNS / BYO nameservers: later — same attach via resource URL`,
    ],
  });

  if (input.dryRun) {
    job = appendProvisionJobLog(job, "dry-run — skip health probe", input.now);
    job = markProvisionJobReady(job, {
      flyApp: workerName,
      resourceUrl,
      now: input.now,
      note: `Studio UI at ${resourceUrl} — not workers.dev, not the Fly host.`,
    });
    const deployment = mergeDeploymentResources(input.deployment, [
      { sidecarId: "worker", url: resourceUrl, flyApp: workerName },
    ]);
    return { ok: true, job, deployment, workerName, resourceUrl };
  }

  job = markProvisionJobRunning(job, input.now);
  job = appendProvisionJobLog(job, `GET ${resourceUrl}/health`, input.now);

  const health = await readWorkerHealth(deps.fetch, resourceUrl);
  if (!studioWorkerHealthMatchesHost(health, input.hostUrl)) {
    const detail = health.ok
      ? `site up but proxy mismatch (got ${health.proxy ?? "none"})`
      : `site not reachable at ${resourceUrl} — ensure *.${base} → ${workerName} and route map has this slug`;
    job = appendProvisionJobLog(job, detail, input.now);
    // Still attach the intended public URL so console Open Studio points correctly;
    // operators fix DNS/edge until health matches. Prefer fail closed for "ready".
    job = markProvisionJobError(
      job,
      `studio_site_not_ready: ${detail}`,
      input.now,
    );
    return { ok: false, job, error: job.error! };
  }

  job = appendProvisionJobLog(
    job,
    `health ok · host proxy ${health.proxy}`,
    input.now,
  );
  job = markProvisionJobReady(job, {
    flyApp: workerName,
    resourceUrl,
    now: input.now,
    note: `Open Studio UI → ${resourceUrl}`,
  });
  const deployment = mergeDeploymentResources(input.deployment, [
    { sidecarId: "worker", url: resourceUrl, flyApp: workerName },
  ]);
  return { ok: true, job, deployment, workerName, resourceUrl };
}
