/**
 * Fly Machines API adapters — commercial provision (HTTPS, no fly CLI).
 * @see https://fly.io/docs/machines/api/
 */

export type FlyMachinesApiDeps = {
  fetch: typeof fetch;
  apiToken: string;
  /** Default https://api.machines.dev */
  apiBase?: string;
  orgSlug?: string;
};

/**
 * Fly access tokens: `fm2_*` / `fly tokens create` → `FlyV1`.
 * Legacy `flyctl auth token` session tokens often accept Bearer; prefer FlyV1 for fm2_.
 * Tolerates secrets stored with a `FlyV1 ` / `Bearer ` prefix or wrapping quotes.
 */
export function flyAuthHeader(token: string): string {
  let t = token.trim().replace(/^["']|["']$/g, "").trim();
  if (!t) return "";
  if (/^flyv1\s+/i.test(t)) return t.replace(/^flyv1\s+/i, "FlyV1 ");
  if (/^bearer\s+/i.test(t)) return t.replace(/^bearer\s+/i, "Bearer ");
  if (t.startsWith("fm2_") || t.startsWith("fo1_") || t.startsWith("fo2_")) {
    return `FlyV1 ${t}`;
  }
  return `Bearer ${t}`;
}

/** Collapse Fly JSON error bodies into a short stable code/message. */
export function normalizeFlyApiError(raw: string): string {
  const t = raw.trim();
  if (!t) return "fly_error";
  try {
    const parsed = JSON.parse(t) as { error?: unknown; message?: unknown };
    const err =
      typeof parsed.error === "string"
        ? parsed.error
        : typeof parsed.message === "string"
          ? parsed.message
          : null;
    if (err) {
      if (/^unauthorized$/i.test(err)) return "fly_unauthorized";
      return err;
    }
  } catch {
    /* plain text */
  }
  if (/unauthorized/i.test(t)) return "fly_unauthorized";
  return t.slice(0, 500);
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: flyAuthHeader(token),
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function readError(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  return normalizeFlyApiError(text.slice(0, 500) || `http_${res.status}`);
}

export type FlyMachineSummary = {
  id: string;
  state: string;
};

export async function flyListMachines(
  deps: FlyMachinesApiDeps,
  input: { appName: string },
): Promise<
  { ok: true; machines: FlyMachineSummary[] } | { ok: false; error: string }
> {
  const base = deps.apiBase ?? "https://api.machines.dev";
  const res = await deps.fetch(
    `${base}/v1/apps/${encodeURIComponent(input.appName)}/machines`,
    { headers: authHeaders(deps.apiToken) },
  );
  if (res.status === 404) return { ok: true, machines: [] };
  if (!res.ok) return { ok: false, error: await readError(res) };
  const body = (await res.json()) as Array<{ id?: string; state?: string }>;
  const machines = (Array.isArray(body) ? body : [])
    .filter((m): m is { id: string; state: string } => Boolean(m?.id))
    .map((m) => ({ id: m.id, state: String(m.state ?? "unknown") }));
  return { ok: true, machines };
}

export async function flyCreateApp(
  deps: FlyMachinesApiDeps,
  input: { appName: string; orgSlug?: string },
): Promise<{ ok: true; appName: string; existed?: boolean } | { ok: false; error: string }> {
  const base = deps.apiBase ?? "https://api.machines.dev";
  const org = input.orgSlug ?? deps.orgSlug ?? "personal";
  const res = await deps.fetch(`${base}/v1/apps`, {
    method: "POST",
    headers: authHeaders(deps.apiToken),
    body: JSON.stringify({ app_name: input.appName, org_slug: org }),
  });
  if (res.ok || res.status === 201) {
    return { ok: true, appName: input.appName };
  }
  const err = await readError(res);
  if (/already exists|already been taken|already taken|Conflict/i.test(err)) {
    return { ok: true, appName: input.appName, existed: true };
  }
  // Some orgs return 422 with opaque JSON — probe GET
  if (res.status === 409 || res.status === 422) {
    const probe = await deps.fetch(
      `${base}/v1/apps/${encodeURIComponent(input.appName)}`,
      { headers: authHeaders(deps.apiToken) },
    );
    if (probe.ok) {
      return { ok: true, appName: input.appName, existed: true };
    }
  }
  return { ok: false, error: err };
}

export async function flyCreateVolume(
  deps: FlyMachinesApiDeps,
  input: { appName: string; name: string; region: string; sizeGb: number },
): Promise<{ ok: true; volumeId: string } | { ok: false; error: string }> {
  const base = deps.apiBase ?? "https://api.machines.dev";
  const res = await deps.fetch(
    `${base}/v1/apps/${encodeURIComponent(input.appName)}/volumes`,
    {
      method: "POST",
      headers: authHeaders(deps.apiToken),
      body: JSON.stringify({
        name: input.name,
        region: input.region,
        size_gb: input.sizeGb,
      }),
    },
  );
  if (!res.ok) return { ok: false, error: await readError(res) };
  const body = (await res.json()) as { id?: string };
  if (!body.id) return { ok: false, error: "volume_missing_id" };
  return { ok: true, volumeId: body.id };
}

export type FlyCreateMachineInput = {
  appName: string;
  region: string;
  image: string;
  env: Record<string, string>;
  volumeId: string;
  volumeName: string;
  internalPort: number;
  cpus?: number;
  memoryMb?: number;
  /** Default true (n8n). LiteLLM API is 6PN-only — no public 80/443. */
  publicHttp?: boolean;
};

export async function flyCreateMachine(
  deps: FlyMachinesApiDeps,
  input: FlyCreateMachineInput,
): Promise<{ ok: true; machineId: string } | { ok: false; error: string }> {
  const base = deps.apiBase ?? "https://api.machines.dev";
  const res = await deps.fetch(
    `${base}/v1/apps/${encodeURIComponent(input.appName)}/machines`,
    {
      method: "POST",
      headers: authHeaders(deps.apiToken),
      body: JSON.stringify({
        region: input.region,
        config: {
          image: input.image,
          env: input.env,
          guest: {
            cpu_kind: "shared",
            cpus: input.cpus ?? 1,
            memory_mb: input.memoryMb ?? 512,
          },
          mounts: [
            {
              volume: input.volumeId,
              path: "/data",
            },
          ],
          ...(input.publicHttp === false
            ? {}
            : {
                services: [
                  {
                    protocol: "tcp",
                    internal_port: input.internalPort,
                    autostop: false,
                    autostart: true,
                    min_machines_running: 1,
                    ports: [
                      { port: 80, handlers: ["http"], force_https: true },
                      { port: 443, handlers: ["http", "tls"] },
                    ],
                  },
                ],
              }),
        },
      }),
    },
  );
  if (!res.ok) return { ok: false, error: await readError(res) };
  const body = (await res.json()) as { id?: string };
  if (!body.id) return { ok: false, error: "machine_missing_id" };
  return { ok: true, machineId: body.id };
}

export type FlyMachineDetail = {
  id: string;
  state: string;
  /** Opaque Fly machine config object (image, env, mounts, …). */
  config: Record<string, unknown>;
};

export async function flyGetMachine(
  deps: FlyMachinesApiDeps,
  input: { appName: string; machineId: string },
): Promise<{ ok: true; machine: FlyMachineDetail } | { ok: false; error: string }> {
  const base = deps.apiBase ?? "https://api.machines.dev";
  const res = await deps.fetch(
    `${base}/v1/apps/${encodeURIComponent(input.appName)}/machines/${encodeURIComponent(input.machineId)}`,
    { headers: authHeaders(deps.apiToken) },
  );
  if (!res.ok) return { ok: false, error: await readError(res) };
  const body = (await res.json()) as {
    id?: string;
    state?: string;
    config?: Record<string, unknown>;
  };
  if (!body.id || !body.config) {
    return { ok: false, error: "machine_missing_config" };
  }
  return {
    ok: true,
    machine: {
      id: body.id,
      state: String(body.state ?? "unknown"),
      config: body.config,
    },
  };
}

/**
 * Roll machine to a new image — keeps mounts/env/services from current config.
 * Volume data under /data is preserved (Host SoT); this is not a sync product.
 */
export async function flyUpdateMachineImage(
  deps: FlyMachinesApiDeps,
  input: { appName: string; machineId: string; image: string },
): Promise<{ ok: true; machineId: string } | { ok: false; error: string }> {
  const got = await flyGetMachine(deps, {
    appName: input.appName,
    machineId: input.machineId,
  });
  if (!got.ok) return got;
  const nextConfig = {
    ...got.machine.config,
    image: input.image,
  };
  const base = deps.apiBase ?? "https://api.machines.dev";
  const res = await deps.fetch(
    `${base}/v1/apps/${encodeURIComponent(input.appName)}/machines/${encodeURIComponent(input.machineId)}`,
    {
      method: "POST",
      headers: authHeaders(deps.apiToken),
      body: JSON.stringify({ config: nextConfig }),
    },
  );
  if (!res.ok) return { ok: false, error: await readError(res) };
  return { ok: true, machineId: input.machineId };
}

/** Allocate shared IPv4 (public *.fly.dev). Tries Machines IP API then GraphQL. */
export async function flyAllocateSharedIpv4(
  deps: FlyMachinesApiDeps,
  input: { appId: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const base = deps.apiBase ?? "https://api.machines.dev";
  const ipRes = await deps.fetch(
    `${base}/v1/apps/${encodeURIComponent(input.appId)}/ips`,
    {
      method: "POST",
      headers: authHeaders(deps.apiToken),
      body: JSON.stringify({ type: "shared_v4" }),
    },
  );
  if (ipRes.ok || ipRes.status === 201) return { ok: true };
  const ipErr = await readError(ipRes);
  if (/already|exists/i.test(ipErr)) return { ok: true };

  const res = await deps.fetch("https://api.fly.io/graphql", {
    method: "POST",
    headers: authHeaders(deps.apiToken),
    body: JSON.stringify({
      query: `mutation($input: AllocateIPAddressInput!) {
        allocateIpAddress(input: $input) { ipAddress { id address type } }
      }`,
      variables: {
        input: { appId: input.appId, type: "shared_v4" },
      },
    }),
  });
  if (!res.ok) return { ok: false, error: `${ipErr} | ${await readError(res)}` };
  const body = (await res.json()) as {
    errors?: { message?: string }[];
  };
  if (body.errors?.length) {
    const msg = body.errors.map((e) => e.message).join("; ");
    if (/already|exists/i.test(msg)) return { ok: true };
    return { ok: false, error: msg };
  }
  return { ok: true };
}

/**
 * Add a custom hostname certificate on a Fly app (for TLS for vanity DNS).
 * Idempotent when hostname already exists.
 * @see https://fly.io/docs/networking/custom-domain-with-fly/
 */
export async function flyAddCertificate(
  deps: FlyMachinesApiDeps,
  input: { appName: string; hostname: string },
): Promise<{ ok: true; hostname: string } | { ok: false; error: string }> {
  const hostname = input.hostname.trim().toLowerCase();
  if (!hostname) return { ok: false, error: "hostname_required" };
  const base = deps.apiBase ?? "https://api.machines.dev";
  const res = await deps.fetch(
    `${base}/v1/apps/${encodeURIComponent(input.appName)}/certificates`,
    {
      method: "POST",
      headers: authHeaders(deps.apiToken),
      body: JSON.stringify({ hostname, type: "certificate" }),
    },
  );
  if (res.ok || res.status === 201) {
    return { ok: true, hostname };
  }
  const err = await readError(res);
  if (/already|exists|taken/i.test(err)) {
    return { ok: true, hostname };
  }
  return { ok: false, error: err };
}

/**
 * Merge env keys onto an existing Fly machine config (Host N8N_BASE_URL stamp).
 */
export async function flyMergeMachineEnv(
  deps: FlyMachinesApiDeps,
  input: {
    appName: string;
    machineId: string;
    env: Record<string, string>;
  },
): Promise<{ ok: true; machineId: string } | { ok: false; error: string }> {
  const got = await flyGetMachine(deps, {
    appName: input.appName,
    machineId: input.machineId,
  });
  if (!got.ok) return got;
  const prevEnv =
    got.machine.config.env &&
    typeof got.machine.config.env === "object" &&
    !Array.isArray(got.machine.config.env)
      ? (got.machine.config.env as Record<string, string>)
      : {};
  const nextConfig = {
    ...got.machine.config,
    env: { ...prevEnv, ...input.env },
  };
  const base = deps.apiBase ?? "https://api.machines.dev";
  const res = await deps.fetch(
    `${base}/v1/apps/${encodeURIComponent(input.appName)}/machines/${encodeURIComponent(input.machineId)}`,
    {
      method: "POST",
      headers: authHeaders(deps.apiToken),
      body: JSON.stringify({ config: nextConfig }),
    },
  );
  if (!res.ok) return { ok: false, error: await readError(res) };
  return { ok: true, machineId: input.machineId };
}
