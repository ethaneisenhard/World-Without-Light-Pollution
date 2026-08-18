/**
 * Per-tenant LiteLLM on Fly Machines — unique master key + vanity DNS.
 * Public URL: gateway.{slug}.glassboxcomputer.site (DNS-only → Fly).
 * Twin of n8n `workflows.{slug}`. Host may only call this tenant's gateway.
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
  DEFAULT_GATEWAY_SITE_BASE_DOMAIN,
  platformGatewayDnsRecordName,
  platformGatewayUrl,
} from "./gateway-hostname-pure.js";

/** Pin — override via FLY_LITELLM_IMAGE on control plane. */
export const DEFAULT_LITELLM_IMAGE = "ghcr.io/berriai/litellm:main-latest";

export type ProvisionLitellmDnsDeps = {
  createDnsCname: typeof createCloudflareDnsCname;
  dns: CloudflareDnsCnameDeps;
  zoneId: string;
};

export type ProvisionLitellmInput = {
  jobId: string;
  tenant: ControlPlaneTenant;
  deployment: ControlPlaneDeployment;
  image?: string;
  region?: string;
  volumeSizeGb?: number;
  memoryMb?: number;
  dryRun?: boolean;
  now?: number;
  publicUrl?: string;
  siteBaseDomain?: string;
  dns?: ProvisionLitellmDnsDeps;
};

export type ProvisionLitellmOutcome =
  | {
      ok: true;
      job: ProvisionJob;
      deployment: ControlPlaneDeployment;
      flyApp: string;
      resourceUrl: string;
      /** Unique master key for this tenant's gateway — stamp onto Host; do not log. Empty on machine reuse (do not rotate). */
      apiKey: string;
    }
  | { ok: false; job: ProvisionJob; error: string };

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function newLitellmMasterKey(): string {
  return `sk-as-${randomHex(24)}`;
}

function resolvePublicUrl(input: ProvisionLitellmInput, flyApp: string): string {
  const override = input.publicUrl?.trim();
  if (override) return override.replace(/\/+$/, "");
  const vanity = platformGatewayUrl(
    input.tenant.slug,
    input.siteBaseDomain ?? DEFAULT_GATEWAY_SITE_BASE_DOMAIN,
  );
  if (vanity) return vanity;
  return `https://${flyApp}.fly.dev`;
}

async function attachVanityDnsAndCert(
  flyDeps: FlyMachinesApiDeps,
  input: ProvisionLitellmInput,
  flyApp: string,
  resourceUrl: string,
  job: ProvisionJob,
): Promise<
  { ok: true; job: ProvisionJob } | { ok: false; job: ProvisionJob; error: string }
> {
  if (!input.dns) return { ok: true, job };
  const recordName = platformGatewayDnsRecordName(input.tenant.slug);
  if (!recordName) {
    return { ok: false, job, error: "gateway_dns_name_invalid" };
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

export async function provisionLitellmOrchestrator(
  deps: FlyMachinesApiDeps,
  input: ProvisionLitellmInput,
): Promise<ProvisionLitellmOutcome> {
  const flyApp = controlPlaneFlyAppName(input.tenant.shortId, "litellm");
  const resourceUrl = resolvePublicUrl(input, flyApp);
  const image = input.image?.trim() || DEFAULT_LITELLM_IMAGE;
  const apiKey = newLitellmMasterKey();
  let job = createProvisionJob({
    id: input.jobId,
    deploymentId: input.deployment.id,
    tenantId: input.tenant.id,
    sidecarId: "litellm",
    dryRun: input.dryRun,
    now: input.now,
    log: [
      `provision litellm for tenant ${input.tenant.slug}`,
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
      note: "LiteLLM at this URL after real provision. Unique master key stamps Host only.",
    });
    const deployment = mergeDeploymentResources(input.deployment, [
      { sidecarId: "litellm", url: resourceUrl, flyApp, image },
    ]);
    return { ok: true, job, deployment, flyApp, resourceUrl, apiKey };
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
        note: "Existing LiteLLM machine reused. Host URL stamped; master key unchanged.",
      });
      const deployment = mergeDeploymentResources(input.deployment, [
        { sidecarId: "litellm", url: resourceUrl, flyApp, image },
      ]);
      return { ok: true, job, deployment, flyApp, resourceUrl, apiKey: "" };
    }
  }

  job = appendProvisionJobLog(job, "allocate shared IPv4", input.now);
  const ip = await flyAllocateSharedIpv4(deps, { appId: flyApp });
  if (!ip.ok && !/already|exists/i.test(ip.error)) {
    job = markProvisionJobError(job, `ip: ${ip.error}`, input.now);
    return { ok: false, job, error: ip.error };
  }

  const region = input.region ?? "iad";
  job = appendProvisionJobLog(
    job,
    `create volume litellm_data in ${region}`,
    input.now,
  );
  const vol = await flyCreateVolume(deps, {
    appName: flyApp,
    name: "litellm_data",
    region,
    sizeGb: input.volumeSizeGb ?? 1,
  });
  if (!vol.ok) {
    job = markProvisionJobError(job, vol.error, input.now);
    return { ok: false, job, error: vol.error };
  }

  const saltKey = `sk-salt-${randomHex(24)}`;
  job = appendProvisionJobLog(job, "create LiteLLM machine (port 4000)", input.now);
  const machine = await flyCreateMachine(deps, {
    appName: flyApp,
    region,
    image,
    volumeId: vol.volumeId,
    volumeName: "litellm_data",
    internalPort: 4000,
    cpus: 1,
    memoryMb: input.memoryMb ?? 1024,
    publicHttp: false,
    env: {
      LITELLM_MASTER_KEY: apiKey,
      LITELLM_SALT_KEY: saltKey,
      PROXY_BASE_URL: resourceUrl,
      STORE_MODEL_IN_DB: "False",
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
    note: "Host stamped with this gateway URL + unique key. Provider keys stay on this machine.",
  });
  const deployment = mergeDeploymentResources(input.deployment, [
    { sidecarId: "litellm", url: resourceUrl, flyApp, image },
  ]);
  return { ok: true, job, deployment, flyApp, resourceUrl, apiKey };
}
