/**
 * Live Dev port registry — band + host denylist for all projects.
 * Assign / remap in normalize + scaffold; no project-id one-offs.
 */

import type { ProjectConfig, ProjectDevServer } from "./types.js";

function isTcpPort(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 65535
  );
}

/** Inclusive band for auto-assigned Live ports (scaffold / remap). */
export const LIVE_DEV_PORT_BAND = { min: 9000, max: 9999 } as const;

/**
 * Ports commonly used by host `yarn`/`pnpm`/`vite`/`next` outside Studio.
 * Live must not steal these.
 */
export const HOST_DEV_PORT_DENYLIST: ReadonlySet<number> = new Set([
  3000, 3001, 4000, 4173, 4200, 5000, 5173, 5174, 8000, 8080, 8888,
]);

/** Studio shell / API / services — never assign as project Live. */
export const STUDIO_RESERVED_PORTS: ReadonlySet<number> = new Set([
  3847, 4400, 4410, 4412, 5678, 9230,
]);

export function isDeniedLiveDevPort(port: number): boolean {
  return (
    HOST_DEV_PORT_DENYLIST.has(port) || STUDIO_RESERVED_PORTS.has(port)
  );
}

/** True when port is a usable Live listen port (not denied / reserved). */
export function isAssignableLiveDevPort(port: unknown): port is number {
  return isTcpPort(port) && !isDeniedLiveDevPort(port);
}

/** FNV-1a → offset in [0, bandSize). */
export function hashProjectIdToBandOffset(
  projectId: string,
  bandSize: number,
): number {
  const size = Math.max(1, bandSize);
  let h = 2166136261;
  const id = projectId.trim() || "project";
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % size;
}

export type SuggestLiveDevPortInput = {
  projectId: string;
  takenPorts?: readonly number[];
};

/**
 * Pick a free port in {@link LIVE_DEV_PORT_BAND} from projectId hash.
 * Skips denylist, reserved, and `takenPorts`.
 */
export function suggestLiveDevPort(input: SuggestLiveDevPortInput): number {
  const { min, max } = LIVE_DEV_PORT_BAND;
  const bandSize = max - min + 1;
  const taken = new Set(input.takenPorts ?? []);
  const start =
    min +
    hashProjectIdToBandOffset(input.projectId.trim() || "project", bandSize);

  for (let i = 0; i < bandSize; i++) {
    const port = min + ((start - min + i) % bandSize);
    if (!isDeniedLiveDevPort(port) && !taken.has(port)) return port;
  }

  for (let port = max + 1; port <= 65535; port++) {
    if (!isDeniedLiveDevPort(port) && !taken.has(port)) return port;
  }

  return start;
}

export type ResolveAssignedLiveDevPortInput = SuggestLiveDevPortInput & {
  /** Existing project.json / hint port — kept when assignable and not taken. */
  requested?: number | null;
};

/**
 * Keep `requested` when assignable and free; otherwise suggest from band.
 * Explicit ports outside the band (e.g. demo 8788 / 9888) stay if allowed.
 */
export function resolveAssignedLiveDevPort(
  input: ResolveAssignedLiveDevPortInput,
): number {
  const req = input.requested;
  const taken = new Set(input.takenPorts ?? []);
  if (isAssignableLiveDevPort(req) && !taken.has(req)) return req;
  return suggestLiveDevPort(input);
}

/**
 * Raw ports claimed by other project configs (pre-normalize).
 * Exclude `exceptProjectId` so a project does not collide with itself.
 */
export function collectTakenLivePortsFromConfigs(
  configs: readonly Pick<ProjectConfig, "id" | "dev">[],
  exceptProjectId?: string,
): number[] {
  const ports: number[] = [];
  const except = exceptProjectId?.trim();
  for (const cfg of configs) {
    if (except && cfg.id?.trim() === except) continue;
    if (isTcpPort(cfg.dev?.port)) ports.push(cfg.dev.port);
    for (const server of cfg.dev?.servers ?? []) {
      pushServerPorts(server, ports);
    }
  }
  return ports;
}

function pushServerPorts(server: ProjectDevServer, ports: number[]): void {
  if (isTcpPort(server.port)) ports.push(server.port);
  if (!server.url?.trim()) return;
  try {
    const withPlaceholder = server.url.includes("{port}")
      ? server.url.replaceAll("{port}", "0")
      : server.url;
    const parsed = Number(new URL(withPlaceholder).port);
    if (isTcpPort(parsed)) ports.push(parsed);
  } catch {
    /* ignore */
  }
}

/** Minimal mapped project.json seed for link when config is missing. */
export function seedLinkedProjectConfig(input: {
  projectId: string;
  name?: string;
  takenPorts?: readonly number[];
  /** ADR 0016 — link defaults to local compute. */
  placement?: "hosted" | "local" | "byo";
}): ProjectConfig {
  const id = input.projectId.trim() || "project";
  const port = suggestLiveDevPort({
    projectId: id,
    takenPorts: input.takenPorts,
  });
  return {
    id,
    name: input.name?.trim() || id,
    mode: "mapped",
    compute: {
      placement: input.placement ?? "local",
    },
    dev: {
      defaultProfile: "minimal",
      port,
      servers: [
        {
          id: "web",
          label: "Web",
          kind: "web",
          port,
          url: `http://localhost:${port}`,
          runtime: "node",
          command: "pnpm",
          args: ["dev"],
          profiles: ["minimal"],
        },
      ],
    },
  };
}
