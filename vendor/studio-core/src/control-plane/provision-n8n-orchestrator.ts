/**
 * Per-tenant n8n on Fly Machines — real image + vanity DNS.
 * Public URL: workflows.{slug}.glassboxcomputer.site (DNS-only → Fly).
 */

import {
  createCloudflareDnsCname,
  type CloudflareDnsCnameDeps,
} from "./cloudflare-dns-cname-orchestrator.js";
import {
  flyAddCertificate,
  flyAllocateSharedIpv4,
  flyCreateApp,
  flyCreateMachine,
  flyCreateVolume,
  flyListMachines,
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
  controlPlaneFlyAppName,
  mergeDeploymentResources,
  type ControlPlaneDeployment,
  type ControlPlaneTenant,
} from "./tenant-deployment-pure.js";
import {
  DEFAULT_WORKFLOWS_SITE_BASE_DOMAIN,
  platformWorkflowsDnsRecordName,
  platformWorkflowsUrl,
} from "./workflows-hostname-pure.js";

/**
 * Pin — override via FLY_N8N_IMAGE on control plane.
 * Prefer a Fly-registry mirror when Docker Hub anonymous pulls 429.
 */
export const DEFAULT_N8N_IMAGE = "n8nio/n8n:1.94.1";

export type ProvisionN8nDnsDeps = {
  createDnsCname: typeof createCloudflareDnsCname;
  dns: CloudflareDnsCnameDeps;
  zoneId: string;
};

export type ProvisionN8nInput = {
  jobId: string;
  tenant: ControlPlaneTenant;
  deployment: ControlPlaneDeployment;
  image?: string;
  region?: string;
  volumeSizeGb?: number;
  memoryMb?: number;
  dryRun?: boolean;
  now?: number;
  /** Override public n8n origin (default: platformWorkflowsUrl). */
  publicUrl?: string;
  /** Site zone for nested hostname (default glassboxcomputer.site). */
  siteBaseDomain?: string;
  /** When set (and not dry-run), create DNS-only CNAME + Fly cert. */
  dns?: ProvisionN8nDnsDeps;
};

export type ProvisionN8nOutcome =
  | {
      ok: true;
      job: ProvisionJob;
      deployment: ControlPlaneDeployment;
      flyApp: string;
      resourceUrl: string;
    }
  | { ok: false; job: ProvisionJob; error: string };

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function resolvePublicUrl(input: ProvisionN8nInput, flyApp: string): string {
  const override = input.publicUrl?.trim();
  if (override) return override.replace(/\/+$/, "");
  const vanity = platformWorkflowsUrl(
    input.tenant.slug,
    input.siteBaseDomain ?? DEFAULT_WORKFLOWS_SITE_BASE_DOMAIN,
  );
  if (vanity) return vanity;
  return `https://${flyApp}.fly.dev`;
}

async function attachVanityDnsAndCert(
  flyDeps: FlyMachinesApiDeps,
  input: ProvisionN8nInput,
  flyApp: string,
  resourceUrl: string,
  job: ProvisionJob,
): Promise<
  { ok: true; job: ProvisionJob } | { ok: false; job: ProvisionJob; error: string }
> {
  if (!input.dns) return { ok: true, job };
  const recordName = platformWorkflowsDnsRecordName(input.tenant.slug);
  if (!recordName) {
    return { ok: false, job, error: "workflows_dns_name_invalid" };
  }
  let next = appendProvisionJobLog(
    job,
    `DNS CNAME ${recordName} → ${flyApp}.fly.dev (DNS-only)`,
    input.now,
  );
  const dnsOut = await input.dns.createDnsCname(input.dns.dns, {
    zoneId: input.dns.zoneId,
    name: recordName,
    content: `${flyApp}.fly.dev`,
    proxied: false,
  });
  if (!dnsOut.ok) {
    next = markProvisionJobError(next, `dns: ${dnsOut.error}`, input.now);
    return { ok: false, job: next, error: dnsOut.error };
  }
  next = appendProvisionJobLog(
    next,
    dnsOut.existed ? `DNS exists ${dnsOut.id}` : `DNS created ${dnsOut.id}`,
    input.now,
  );

  let hostname: string;
  try {
    hostname = new URL(resourceUrl).hostname;
  } catch {
    next = markProvisionJobError(next, "resource_url_invalid", input.now);
    return { ok: false, job: next, error: "resource_url_invalid" };
  }
  next = appendProvisionJobLog(next, `Fly cert ${hostname}`, input.now);
  const cert = await flyAddCertificate(flyDeps, {
    appName: flyApp,
    hostname,
  });
  if (!cert.ok) {
    next = markProvisionJobError(next, `cert: ${cert.error}`, input.now);
    return { ok: false, job: next, error: cert.error };
  }
  next = appendProvisionJobLog(next, `cert ok ${hostname}`, input.now);
  return { ok: true, job: next };
}

export async function provisionN8nOrchestrator(
  deps: FlyMachinesApiDeps,
  input: ProvisionN8nInput,
): Promise<ProvisionN8nOutcome> {
  const flyApp = controlPlaneFlyAppName(input.tenant.shortId, "n8n");
  const resourceUrl = resolvePublicUrl(input, flyApp);
  const image = input.image?.trim() || DEFAULT_N8N_IMAGE;
  let job = createProvisionJob({
    id: input.jobId,
    deploymentId: input.deployment.id,
    tenantId: input.tenant.id,
    sidecarId: "n8n",
    dryRun: input.dryRun,
    now: input.now,
    log: [
      `provision n8n for tenant ${input.tenant.slug}`,
      `target app ${flyApp}`,
      `public ${resourceUrl}`,
      `image ${image}`,
    ],
  });

  if (input.dryRun) {
    job = appendProvisionJobLog(job, "dry-run — skip Fly Machines API", input.now);
    job = markProvisionJobReady(job, {
      flyApp,
      resourceUrl,
      now: input.now,
      note: "n8n UI at this URL after real provision (DNS + cert when wired).",
    });
    const deployment = mergeDeploymentResources(input.deployment, [
      { sidecarId: "n8n", url: resourceUrl, flyApp, image },
    ]);
    return { ok: true, job, deployment, flyApp, resourceUrl };
  }

  job = markProvisionJobRunning(job, input.now);
  job = appendProvisionJobLog(job, "create Fly app (or reuse)", input.now);

  const created = await flyCreateApp(deps, { appName: flyApp });
  if (!created.ok) {
    job = markProvisionJobError(job, created.error, input.now);
    return { ok: false, job, error: created.error };
  }
  job = appendProvisionJobLog(
    job,
    created.existed ? `app exists ${flyApp}` : `app created ${flyApp}`,
    input.now,
  );

  const listed = await flyListMachines(deps, { appName: flyApp });
  if (listed.ok) {
    const live = listed.machines.find((m) =>
      /^(started|starting|created|replacing|stopped)$/i.test(m.state),
    );
    if (live) {
      job = appendProvisionJobLog(
        job,
        `reuse machine ${live.id} (${live.state})`,
        input.now,
      );
      const vanity = await attachVanityDnsAndCert(
        deps,
        input,
        flyApp,
        resourceUrl,
        job,
      );
      if (!vanity.ok) {
        return { ok: false, job: vanity.job, error: vanity.error };
      }
      job = vanity.job;
      job = markProvisionJobReady(job, {
        flyApp,
        resourceUrl,
        now: input.now,
        note: "Existing n8n machine reused.",
      });
      const deployment = mergeDeploymentResources(input.deployment, [
        { sidecarId: "n8n", url: resourceUrl, flyApp, image },
      ]);
      return { ok: true, job, deployment, flyApp, resourceUrl };
    }
  }

  job = appendProvisionJobLog(job, "allocate shared IPv4", input.now);
  const ip = await flyAllocateSharedIpv4(deps, { appId: flyApp });
  if (!ip.ok && !/already|exists/i.test(ip.error)) {
    job = markProvisionJobError(job, `ip: ${ip.error}`, input.now);
    return { ok: false, job, error: ip.error };
  }

  const region = input.region ?? "iad";
  job = appendProvisionJobLog(job, `create volume n8n_data in ${region}`, input.now);
  const vol = await flyCreateVolume(deps, {
    appName: flyApp,
    name: "n8n_data",
    region,
    sizeGb: input.volumeSizeGb ?? 1,
  });
  if (!vol.ok) {
    job = markProvisionJobError(job, vol.error, input.now);
    return { ok: false, job, error: vol.error };
  }

  const host = new URL(resourceUrl).hostname;
  const encryptionKey = randomHex(24);
  job = appendProvisionJobLog(job, "create n8n machine (port 5678)", input.now);
  const machine = await flyCreateMachine(deps, {
    appName: flyApp,
    region,
    image,
    volumeId: vol.volumeId,
    volumeName: "n8n_data",
    internalPort: 5678,
    cpus: 1,
    memoryMb: input.memoryMb ?? 512,
    env: {
      N8N_HOST: host,
      N8N_PORT: "5678",
      N8N_PROTOCOL: "https",
      WEBHOOK_URL: resourceUrl,
      N8N_EDITOR_BASE_URL: resourceUrl,
      N8N_ENCRYPTION_KEY: encryptionKey,
      N8N_USER_FOLDER: "/data",
      GENERIC_TIMEZONE: "UTC",
      NODE_ENV: "production",
    },
  });
  if (!machine.ok) {
    job = markProvisionJobError(job, machine.error, input.now);
    return { ok: false, job, error: machine.error };
  }
  job = appendProvisionJobLog(job, `machine ${machine.machineId}`, input.now);

  const vanity = await attachVanityDnsAndCert(
    deps,
    input,
    flyApp,
    resourceUrl,
    job,
  );
  if (!vanity.ok) {
    return { ok: false, job: vanity.job, error: vanity.error };
  }
  job = vanity.job;

  job = markProvisionJobReady(job, {
    flyApp,
    resourceUrl,
    now: input.now,
    note: "Open n8n URL to finish owner setup. Encryption key is on the machine env.",
  });
  const deployment = mergeDeploymentResources(input.deployment, [
    { sidecarId: "n8n", url: resourceUrl, flyApp, image },
  ]);
  return { ok: true, job, deployment, flyApp, resourceUrl };
}
