/**
 * Provision job model — commercial control plane (no I/O).
 */

export type ProvisionJobStatus =
  | "queued"
  | "running"
  | "ready"
  | "error"
  | "dry_run";

export type ProvisionJob = {
  id: string;
  deploymentId: string;
  tenantId: string;
  sidecarId: string;
  status: ProvisionJobStatus;
  flyApp?: string;
  resourceUrl?: string;
  error?: string;
  /** Human-readable step log for the console activity feed. */
  log: readonly string[];
  dryRun: boolean;
  createdAt: number;
  updatedAt: number;
};

export function createProvisionJob(input: {
  id: string;
  deploymentId: string;
  tenantId: string;
  sidecarId: string;
  dryRun?: boolean;
  now?: number;
  log?: readonly string[];
}): ProvisionJob {
  const now = input.now ?? Date.now();
  return {
    id: input.id,
    deploymentId: input.deploymentId,
    tenantId: input.tenantId,
    sidecarId: input.sidecarId,
    status: input.dryRun ? "dry_run" : "queued",
    dryRun: input.dryRun === true,
    log: input.log ?? [`queued ${input.sidecarId}`],
    createdAt: now,
    updatedAt: now,
  };
}

export function appendProvisionJobLog(
  job: ProvisionJob,
  line: string,
  now = Date.now(),
): ProvisionJob {
  const text = line.trim();
  if (!text) return job;
  return {
    ...job,
    log: [...job.log, text],
    updatedAt: now,
  };
}

export function markProvisionJobRunning(
  job: ProvisionJob,
  now = Date.now(),
): ProvisionJob {
  return appendProvisionJobLog(
    { ...job, status: "running", error: undefined, updatedAt: now },
    "running",
    now,
  );
}

export function markProvisionJobReady(
  job: ProvisionJob,
  input: { flyApp: string; resourceUrl: string; now?: number; note?: string },
): ProvisionJob {
  const now = input.now ?? Date.now();
  let next: ProvisionJob = {
    ...job,
    status: job.dryRun ? "dry_run" : "ready",
    flyApp: input.flyApp,
    resourceUrl: input.resourceUrl,
    updatedAt: now,
    error: undefined,
  };
  next = appendProvisionJobLog(
    next,
    `ready ${input.flyApp} → ${input.resourceUrl}`,
    now,
  );
  if (input.note) next = appendProvisionJobLog(next, input.note, now);
  return next;
}

export function markProvisionJobError(
  job: ProvisionJob,
  error: string,
  now = Date.now(),
): ProvisionJob {
  return appendProvisionJobLog(
    { ...job, status: "error", error, updatedAt: now },
    `error ${error}`,
    now,
  );
}
