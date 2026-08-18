/**
 * Project runtime desired-run / caps / profiles (CONTEXT.md).
 * Pure — no spawn, no fetch.
 */

import type {
  DevServerRuntime,
  ProjectConfig,
  ProjectDevConfig,
  ProjectDevServer,
} from "./types.js";
import {
  DEFAULT_CREATE_COMPUTE_PLACEMENT,
  normalizeProjectCompute,
} from "./compute-placement-pure.js";
import {
  isAssignableLiveDevPort,
  resolveAssignedLiveDevPort,
} from "./live-dev-ports-registry-pure.js";
import { normalizeDevStartPolicy } from "./runtime-stale-process-pure.js";
import {
  classifyRuntimeStartError,
  runtimeStartErrorPlainHeader,
} from "./runtime-start-heal-pure.js";

export { classifyRuntimeStartError } from "./runtime-start-heal-pure.js";

export type NormalizeProjectConfigOptions = {
  /** Ports claimed by other registry projects — avoid collisions when remapping. */
  takenPorts?: readonly number[];
  /** Default compute.placement when missing (create=hosted, link=local). */
  defaultComputePlacement?: "hosted" | "local" | "byo";
};

export const DEFAULT_RUNTIME_CAPS: Record<DevServerRuntime, number> = {
  wrangler: 2,
  node: 10,
};

export type DesiredRunKey = {
  projectId: string;
  serverId: string;
};

export function desiredRunKey(projectId: string, serverId: string): string {
  return `${projectId}::${serverId}`;
}

export function parseDesiredRunKey(key: string): DesiredRunKey | null {
  const i = key.indexOf("::");
  if (i <= 0 || i === key.length - 2) return null;
  return { projectId: key.slice(0, i), serverId: key.slice(i + 2) };
}

/** True when value is a usable TCP port. */
export function isDevListenPort(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 65535
  );
}

/**
 * Resolve listen port: server.port → (web) dev.port → port parsed from url.
 */
export function resolveDevServerPort(
  server: Pick<ProjectDevServer, "port" | "kind" | "url">,
  dev?: Pick<ProjectDevConfig, "port"> | null,
): number | undefined {
  if (isDevListenPort(server.port)) return server.port;
  const inheritWeb =
    server.kind === "web" || server.kind === undefined || server.kind === "";
  if (inheritWeb && isDevListenPort(dev?.port)) return dev.port;
  if (server.url?.trim()) {
    try {
      const withPlaceholder = server.url.includes("{port}")
        ? server.url.replaceAll("{port}", "0")
        : server.url;
      const u = new URL(withPlaceholder);
      const p = Number(u.port);
      if (isDevListenPort(p)) return p;
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

function substitutePortToken(value: string, port: number | undefined): string {
  if (port == null || !value.includes("{port}")) return value;
  return value.replaceAll("{port}", String(port));
}

/**
 * Materialize url/command/args from explicit `port` (and optional `{port}` tokens).
 * After this, `url` is always a concrete origin for probe/iframe.
 */
export function materializeDevServer(
  server: ProjectDevServer,
  dev?: Pick<ProjectDevConfig, "port"> | null,
): ProjectDevServer {
  const port = resolveDevServerPort(server, dev);
  const rawUrl = server.url?.trim() || (port != null ? `http://localhost:{port}` : "");
  const urlWithToken = substitutePortToken(rawUrl, port);
  let url = urlWithToken;
  if (port != null) {
    try {
      const u = new URL(urlWithToken || `http://localhost:${port}`);
      u.port = String(port);
      // Keep localhost — Next.js / many apps break under 127.0.0.1 in iframes.
      if (u.hostname === "127.0.0.1" || u.hostname === "::1") {
        u.hostname = "localhost";
      }
      url = u.origin;
    } catch {
      url = `http://localhost:${port}`;
    }
  }
  return {
    ...server,
    ...(port != null ? { port } : {}),
    url,
    command: substitutePortToken(server.command, port),
    args: server.args.map((a) => substitutePortToken(a, port)),
  };
}

/**
 * Loopback preview port from `hosting.prod_url` (e.g. http://127.0.0.1:8080).
 * Remote deployed URLs are ignored — those are not local Dev servers.
 */
export function loopbackPreviewPort(
  prodUrl: string | undefined | null,
): number | undefined {
  if (!prodUrl?.trim()) return undefined;
  try {
    const u = new URL(prodUrl.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return undefined;
    const host = u.hostname.toLowerCase();
    if (host !== "localhost" && host !== "127.0.0.1" && host !== "::1") {
      return undefined;
    }
    const raw = u.port || (u.protocol === "https:" ? "443" : "80");
    const port = Number(raw);
    return isDevListenPort(port) ? port : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Attach-capable web server when only `dev.port` is declared (external Dev).
 * Spawn uses `pnpm dev` — attach-if-healthy skips spawn when the URL is up.
 */
export function synthesizeAttachWebServer(
  port: number,
  profile: string,
): ProjectDevServer {
  return materializeDevServer(
    {
      id: "web",
      label: "Web",
      kind: "web",
      port,
      runtime: "node",
      command: "pnpm",
      args: ["dev"],
      profiles: [profile],
    },
    { port },
  );
}

/** Normalize all `dev.servers` so port/url/command stay aligned. */
export function normalizeProjectDevConfig(
  dev: ProjectDevConfig | undefined | null,
): ProjectDevConfig | undefined {
  if (!dev) return undefined;
  const profile = dev.defaultProfile ?? "minimal";
  const startPolicy = normalizeDevStartPolicy(dev.startPolicy);
  if (!dev.servers?.length) {
    if (!isDevListenPort(dev.port)) {
      return { ...dev, startPolicy };
    }
    return {
      ...dev,
      startPolicy,
      servers: [synthesizeAttachWebServer(dev.port, profile)],
    };
  }
  return {
    ...dev,
    startPolicy,
    servers: dev.servers.map((s) => materializeDevServer(s, dev)),
  };
}

export function normalizeProjectConfig(
  config: ProjectConfig,
  options?: NormalizeProjectConfigOptions,
): ProjectConfig {
  const projectId = config.id?.trim() || "project";
  const fromProd = loopbackPreviewPort(config.hosting?.prod_url);
  let requested = isDevListenPort(config.dev?.port)
    ? config.dev.port
    : fromProd;
  const assigned = resolveAssignedLiveDevPort({
    projectId,
    requested,
    takenPorts: options?.takenPorts,
  });

  let dev = config.dev;
  const needsPort =
    !isDevListenPort(dev?.port) ||
    !isAssignableLiveDevPort(dev.port) ||
    dev.port !== assigned;
  if (needsPort) {
    dev = {
      ...(dev ?? {}),
      port: assigned,
      defaultProfile: dev?.defaultProfile ?? "minimal",
    };
  }

  if (dev?.servers?.length) {
    const remappedServers = dev.servers.map((server) => {
      const resolved = resolveDevServerPort(server, dev);
      if (resolved != null && !isAssignableLiveDevPort(resolved)) {
        return { ...server, port: assigned };
      }
      return server;
    });
    const changed = remappedServers.some(
      (server, i) => server !== dev!.servers![i],
    );
    if (changed) {
      dev = { ...dev, servers: remappedServers };
    }
  }

  const normalizedDev = normalizeProjectDevConfig(dev);
  const placementFallback =
    options?.defaultComputePlacement ?? DEFAULT_CREATE_COMPUTE_PLACEMENT;
  const compute = normalizeProjectCompute(config.compute, placementFallback);
  const computeChanged =
    !config.compute ||
    config.compute.placement !== compute.placement ||
    config.compute.runtimeHostId !== compute.runtimeHostId ||
    config.compute.root !== compute.root;

  if (normalizedDev === config.dev && !computeChanged) return config;
  return {
    ...config,
    ...(normalizedDev !== config.dev ? { dev: normalizedDev } : {}),
    compute,
  };
}

/** Dev servers included in a profile. */
export function serversForProfile(
  config: Pick<ProjectConfig, "dev">,
  profile: string,
): ProjectDevServer[] {
  const servers = normalizeProjectDevConfig(config.dev)?.servers ?? [];
  return servers.filter((s) => s.profiles.includes(profile));
}

export function defaultProfileFor(
  config: Pick<ProjectConfig, "dev">,
): string {
  return config.dev?.defaultProfile ?? "minimal";
}

export function findDevServer(
  config: Pick<ProjectConfig, "dev">,
  serverId: string,
): ProjectDevServer | undefined {
  return normalizeProjectDevConfig(config.dev)?.servers?.find(
    (s) => s.id === serverId,
  );
}

/** Prefer web server for the active profile; else first matching. */
export function webServerForProfile(
  config: Pick<ProjectConfig, "dev">,
  profile: string,
): ProjectDevServer | undefined {
  const list = serversForProfile(config, profile);
  return list.find((s) => s.kind === "web") ?? list[0];
}

export type RuntimeProcessUrlPick = {
  serverId: string;
  state: string;
  url: string;
  /** Host-published HTTPS preview (cloud desk / Tailscale). */
  publicUrl?: string;
  /** When present, node lite beats wrangler for Live edit speed. */
  runtime?: string;
};

export type RuntimeServerUrlPick = {
  id: string;
  kind?: string;
  url: string;
  runtime?: string;
};

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function isWebServerKind(kind: string | undefined): boolean {
  return kind === "web" || kind === "" || kind === undefined;
}

/**
 * Rank Live preview candidates: web > other; among web, **node** before wrangler
 * (disk MD reader / SSE — no generate-pages wait).
 */
export function rankLivePreviewCandidate(input: {
  kind?: string;
  runtime?: string;
}): number {
  if (!isWebServerKind(input.kind) && input.kind !== undefined) return 1000;
  const runtime = (input.runtime ?? "").toLowerCase();
  if (runtime === "node") return 0;
  if (runtime === "wrangler") return 10;
  return 20;
}

/**
 * Top web process URL pair (local + public) for Live / lights / topbar.
 * Prefer **node** over wrangler; never pick non-web sidecars.
 */
export function pickRunningWebPreviewPair(input: {
  processes?: ReadonlyArray<RuntimeProcessUrlPick> | null;
  servers?: ReadonlyArray<RuntimeServerUrlPick> | null;
}): { localUrl?: string; publicUrl?: string } {
  const servers = input.servers ?? [];
  const serverById = new Map(servers.map((s) => [s.id, s] as const));
  const isWeb = (serverId: string) => {
    const s = serverById.get(serverId);
    // Unknown id → allow (legacy payloads without servers[]).
    if (!s) return true;
    return isWebServerKind(s.kind);
  };

  const running = (input.processes ?? [])
    .filter(
      (p) =>
        (p.state === "running" || p.state === "starting") &&
        Boolean(p.publicUrl?.trim() || p.url?.trim()) &&
        isWeb(p.serverId),
    )
    .slice()
    .sort((a, b) => {
      const sa = serverById.get(a.serverId);
      const sb = serverById.get(b.serverId);
      return (
        rankLivePreviewCandidate({
          kind: sa?.kind ?? "web",
          runtime: a.runtime ?? sa?.runtime,
        }) -
        rankLivePreviewCandidate({
          kind: sb?.kind ?? "web",
          runtime: b.runtime ?? sb?.runtime,
        })
      );
    });
  const top = running[0];
  if (top) {
    const local = top.url?.trim()
      ? stripTrailingSlash(top.url)
      : undefined;
    const pub = top.publicUrl?.trim()
      ? stripTrailingSlash(top.publicUrl)
      : undefined;
    if (local || pub) return { localUrl: local, publicUrl: pub };
  }

  const declared = servers
    .filter((s) => Boolean(s.url?.trim()) && isWebServerKind(s.kind))
    .slice()
    .sort(
      (a, b) =>
        rankLivePreviewCandidate({ kind: a.kind, runtime: a.runtime }) -
        rankLivePreviewCandidate({ kind: b.kind, runtime: b.runtime }),
    );
  const declaredUrl = declared[0]?.url?.trim()
    ? stripTrailingSlash(declared[0].url)
    : undefined;
  return declaredUrl ? { localUrl: declaredUrl } : {};
}

/**
 * Live iframe base: prefer a running/starting **web** process URL.
 * Prefer **node** over wrangler when both are listed (edit-loop speed).
 * Never pick non-web sidecars (e.g. content-vite-hmr).
 */
export function pickRunningWebPreviewUrl(input: {
  processes?: ReadonlyArray<RuntimeProcessUrlPick> | null;
  servers?: ReadonlyArray<RuntimeServerUrlPick> | null;
}): string | undefined {
  const pair = pickRunningWebPreviewPair(input);
  return pair.publicUrl || pair.localUrl;
}

/**
 * Same project must not run two web servers (minimal node + full wrangler).
 * Returns server ids that conflict with starting `incoming`.
 */
export function conflictingWebServerIds(
  config: Pick<ProjectConfig, "dev">,
  incoming: ProjectDevServer,
  runningServerIds: readonly string[],
): string[] {
  if (incoming.kind !== "web") return [];
  const servers = normalizeProjectDevConfig(config.dev)?.servers ?? [];
  return runningServerIds.filter((id) => {
    if (id === incoming.id) return false;
    const s = servers.find((x) => x.id === id);
    return s?.kind === "web";
  });
}

export type CapCheck =
  | { ok: true }
  | {
      ok: false;
      reason: "cap";
      runtime: DevServerRuntime;
      limit: number;
      running: number;
    };

/** Count running processes of a runtime kind; refuse if at/over cap. */
export function checkRuntimeCap(
  runtime: DevServerRuntime,
  runningOfRuntime: number,
  caps: Record<DevServerRuntime, number> = DEFAULT_RUNTIME_CAPS,
): CapCheck {
  const limit = caps[runtime];
  if (runningOfRuntime >= limit) {
    return {
      ok: false,
      reason: "cap",
      runtime,
      limit,
      running: runningOfRuntime,
    };
  }
  return { ok: true };
}

/** True when prod_url is a non-loopback http(s) origin (Open deployed). */
export function isRemoteDeployedUrl(url: string | undefined | null): boolean {
  if (!url?.trim()) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
      return false;
    }
    if (host.endsWith(".localhost")) return false;
    return true;
  } catch {
    return false;
  }
}

export function parseSitesCsv(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export type ProjectRunStatus = "off" | "starting" | "running" | "error";

/** Aggregate Dev-server status for a project (workspace list indicator). */
export function projectRunStatus(
  processes: ReadonlyArray<{ state: string }> | undefined | null,
): ProjectRunStatus {
  if (!processes?.length) return "off";
  if (processes.some((p) => p.state === "running")) return "running";
  if (processes.some((p) => p.state === "starting")) return "starting";
  if (processes.some((p) => p.state === "error")) return "error";
  return "off";
}

/** Workspace row context-menu enablement from aggregate run status. */
export function workspaceRuntimeMenuFlags(status: ProjectRunStatus): {
  canRun: boolean;
  canStop: boolean;
  canRestart: boolean;
  /** Re-attach Terminal to running / starting / errored processes. */
  canOpenTerminal: boolean;
} {
  const canOpenTerminal =
    status === "running" || status === "starting" || status === "error";
  return {
    canRun: status === "off" || status === "error",
    // Error = zombie Host process — Stop clears it (matches Workspace Servers).
    canStop:
      status === "running" || status === "starting" || status === "error",
    canRestart: canOpenTerminal,
    canOpenTerminal,
  };
}

/**
 * Pull alternate Local URLs from spawn logs (e.g. Next.js "already running" on :8080
 * while project.json points at :8090).
 */
export function extractAlternateRuntimeUrlsFromLogs(
  log: readonly string[] | null | undefined,
): string[] {
  if (!log?.length) return [];
  const blob = log.join("\n");
  const found: string[] = [];
  const seen = new Set<string>();
  const re = /\bLocal:\s*(https?:\/\/[^\s]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(blob)) !== null) {
    const raw = m[1]!.replace(/[.,;)]+$/, "");
    let normalized = raw;
    try {
      const u = new URL(raw);
      if (u.hostname === "127.0.0.1" || u.hostname === "::1") {
        u.hostname = "localhost";
      }
      normalized = u.origin;
    } catch {
      continue;
    }
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    found.push(normalized);
  }
  return found;
}

const EXIT_LINE_RE = /^\[exit\]\s*exited code=/i;
const BARE_EXIT_RE = /^exited code=\S+\s+signal=/i;
const PORT_HINT_RE = /eaddrinuse|address already in use|port.*in use/i;

function isExitOnlyLine(line: string): boolean {
  const t = line.trim();
  return EXIT_LINE_RE.test(t) || BARE_EXIT_RE.test(t);
}

/**
 * Human-readable start failure for Live overlay.
 * Prefers real stdout/stderr over the trailing `[exit] exited code=…` marker.
 */
export function formatRuntimeStartErrorDetail(
  input: { lastError?: string | null; log?: readonly string[] | null } | null | undefined,
  opts?: { maxChars?: number; maxLines?: number },
): string {
  const maxChars = opts?.maxChars ?? 1200;
  const maxLines = opts?.maxLines ?? 12;
  if (!input) return "Dev server failed to start.";

  const kind = classifyRuntimeStartError(input);
  const logs = (input.log ?? [])
    .flatMap((chunk) => chunk.split("\n"))
    .map((s) => s.trim())
    .filter(Boolean);

  const useful = logs.filter((l) => !isExitOnlyLine(l));
  let preferred = useful;
  if (kind === "port_in_use") {
    const portLines = useful.filter((l) => PORT_HINT_RE.test(l));
    if (portLines.length) preferred = portLines;
  }

  const source = preferred.length ? preferred : useful;
  const body = source.slice(-maxLines).join("\n").slice(0, maxChars);
  const header = runtimeStartErrorPlainHeader(kind);

  if (header) {
    return body ? `${header}\n\n${body}` : header;
  }

  if (body) return body;

  const lastError = input.lastError?.trim() ?? "";
  if (lastError && !isExitOnlyLine(lastError)) return lastError.slice(0, maxChars);
  if (lastError) {
    return `Dev server exited (${lastError}). No stdout/stderr was captured — check the project start command and terminal output.`;
  }
  return "Dev server failed to start.";
}
