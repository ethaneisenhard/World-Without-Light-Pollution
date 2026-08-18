/**
 * Commercial host provision — create Fly app + volume + machine from pre-built image.
 * Public URL: api.{slug}.glassboxcomputer.site (DNS-only → Fly) — twin of n8n workflows.{slug}.
 */

import {
  createCloudflareDnsCname,
  type CloudflareDnsCnameDeps,
} from "./cloudflare-dns-cname-orchestrator.js";
import {
  DEFAULT_API_SITE_BASE_DOMAIN,
  platformApiDnsRecordName,
  platformApiUrl,
} from "./api-hostname-pure.js";
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

export type ProvisionHostDnsDeps = {
  createDnsCname: typeof createCloudflareDnsCname;
  dns: CloudflareDnsCnameDeps;
  zoneId: string;
};

export type ProvisionHostInput = {
  jobId: string;
  tenant: ControlPlaneTenant;
  deployment: ControlPlaneDeployment;
  /** registry.fly.io/glassbox-studio-host:tag */
  image: string;
  region?: string;
  volumeSizeGb?: number;
  memoryMb?: number;
  cpus?: number;
  dryRun?: boolean;
  now?: number;
  /** Public Studio UI origin for this tenant (Worker URL). */
  appOrigin: string;
  /** Override public Host origin (default: platformApiUrl). */
  publicUrl?: string;
  /** Site zone for nested hostname (default glassboxcomputer.site). */
  siteBaseDomain?: string;
  /** When set (and not dry-run), create DNS-only CNAME + Fly cert. */
  dns?: ProvisionHostDnsDeps;
};

export type ProvisionHostOutcome =
  | {
      ok: true;
      job: ProvisionJob;
      deployment: ControlPlaneDeployment;
      flyApp: string;
      resourceUrl: string;
    }
  | { ok: false; job: ProvisionJob; error: string };

const HOST_NOT_SHELL_NOTE =
  "This URL is the Studio Host API (/health). Studio UI Worker is separate and not opened here.";

function resolvePublicUrl(input: ProvisionHostInput, flyApp: string): string {
  const override = input.publicUrl?.trim();
  if (override) return override.replace(/\/+$/, "");
  const vanity = platformApiUrl(
    input.tenant.slug,
    input.siteBaseDomain ?? DEFAULT_API_SITE_BASE_DOMAIN,
  );
  if (vanity) return vanity;
  return `https://${flyApp}.fly.dev`;
}

async function attachVanityDnsAndCert(
  flyDeps: FlyMachinesApiDeps,
  input: ProvisionHostInput,
  flyApp: string,
  resourceUrl: string,
  job: ProvisionJob,
): Promise<
  { ok: true; job: ProvisionJob } | { ok: false; job: ProvisionJob; error: string }
> {
  if (!input.dns) return { ok: true, job };
  const recordName = platformApiDnsRecordName(input.tenant.slug);
  if (!recordName) {
    return { ok: false, job, error: "api_dns_name_invalid" };
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

export async function provisionHostOrchestrator(
  deps: FlyMachinesApiDeps,
  input: ProvisionHostInput,
): Promise<ProvisionHostOutcome> {
  const flyApp = controlPlaneFlyAppName(input.tenant.shortId, "host");
  const resourceUrl = resolvePublicUrl(input, flyApp);
  let job = createProvisionJob({
    id: input.jobId,
    deploymentId: input.deployment.id,
    tenantId: input.tenant.id,
    sidecarId: "host",
    dryRun: input.dryRun,
    now: input.now,
    log: [
      `provision host for tenant ${input.tenant.slug} (${input.tenant.shortId})`,
      `target app ${flyApp}`,
      `public ${resourceUrl}`,
      `image ${input.image}`,
    ],
  });

  if (input.dryRun) {
    job = appendProvisionJobLog(job, "dry-run — skip Fly Machines API", input.now);
    job = markProvisionJobReady(job, {
      flyApp,
      resourceUrl,
      now: input.now,
      note: `${HOST_NOT_SHELL_NOTE} Vanity DNS + cert when wired.`,
    });
    const deployment = mergeDeploymentResources(input.deployment, [
      {
        sidecarId: "host",
        url: resourceUrl,
        flyApp,
        image: input.image,
      },
    ]);
    return { ok: true, job, deployment, flyApp, resourceUrl };
  }

  job = markProvisionJobRunning(job, input.now);
  job = appendProvisionJobLog(job, "create Fly app (or reuse if exists)", input.now);

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

  // Re-click / re-provision: keep existing machine instead of spawning another.
  job = appendProvisionJobLog(job, "list machines", input.now);
  const listed = await flyListMachines(deps, { appName: flyApp });
  if (listed.ok) {
    const live = listed.machines.find((m) =>
      /^(started|starting|created|replacing|stopping|stopped)$/i.test(m.state),
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
        note: HOST_NOT_SHELL_NOTE,
      });
      const deployment = mergeDeploymentResources(input.deployment, [
        {
          sidecarId: "host",
          url: resourceUrl,
          flyApp,
          image: input.image,
        },
      ]);
      return { ok: true, job, deployment, flyApp, resourceUrl };
    }
    job = appendProvisionJobLog(job, "no machine yet — create volume + machine", input.now);
  } else {
    job = appendProvisionJobLog(
      job,
      `list machines failed (${listed.error}) — continue create`,
      input.now,
    );
  }

  // GraphQL allocate needs app id — use app name as appId for many Fly orgs
  job = appendProvisionJobLog(job, "allocate shared IPv4", input.now);
  const ip = await flyAllocateSharedIpv4(deps, { appId: flyApp });
  if (!ip.ok) {
    // Non-fatal if shared IP already exists on recreate; continue
    if (!/already|exists/i.test(ip.error)) {
      job = markProvisionJobError(job, `ip: ${ip.error}`, input.now);
      return { ok: false, job, error: ip.error };
    }
    job = appendProvisionJobLog(job, `ip already allocated (${ip.error})`, input.now);
  } else {
    job = appendProvisionJobLog(job, "shared IPv4 ok", input.now);
  }

  const region = input.region ?? "iad";
  job = appendProvisionJobLog(
    job,
    `create volume studio_host_data in ${region}`,
    input.now,
  );
  const vol = await flyCreateVolume(deps, {
    appName: flyApp,
    name: "studio_host_data",
    region,
    sizeGb: input.volumeSizeGb ?? 1,
  });
  if (!vol.ok) {
    job = markProvisionJobError(job, vol.error, input.now);
    return { ok: false, job, error: vol.error };
  }
  job = appendProvisionJobLog(job, `volume ${vol.volumeId}`, input.now);

  job = appendProvisionJobLog(job, "create machine (512MB / port 3847)", input.now);
  const machine = await flyCreateMachine(deps, {
    appName: flyApp,
    region,
    image: input.image,
    volumeId: vol.volumeId,
    volumeName: "studio_host_data",
    internalPort: 3847,
    cpus: input.cpus ?? 1,
    memoryMb: input.memoryMb ?? 512,
    env: {
      STUDIO_SERVE_HOST: "0.0.0.0",
      PORT: "3847",
      AGENT_STUDIO_HOME: "/data/glassbox-studio",
      APP_ORIGIN: input.appOrigin,
      STUDIO_HOST_PUBLIC_URL: resourceUrl,
      // Seed Home “Welcome in, …” from signup / tenant display name.
      STUDIO_OPERATOR_NAME: (input.tenant.displayName || input.tenant.slug).slice(
        0,
        64,
      ),
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
    note: HOST_NOT_SHELL_NOTE,
  });
  const deployment = mergeDeploymentResources(input.deployment, [
    {
      sidecarId: "host",
      url: resourceUrl,
      flyApp,
      image: input.image,
    },
  ]);
  return { ok: true, job, deployment, flyApp, resourceUrl };
}
