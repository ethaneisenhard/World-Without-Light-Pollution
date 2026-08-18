/**
 * Host fleet job registry — pure. Presence board for Orchestrator office.
 * Statuses align with VoiceJob; fields add project/harness/model/pet/source.
 * No I/O.
 */

export type FleetJobStatus =
  | "queued"
  | "running"
  | "blocked"
  | "done"
  | "cancelled";

export type FleetJobPriority = "low" | "normal" | "high" | "blocker";

export type FleetJobSource =
  | "chat"
  | "spawn"
  | "voice"
  | "durable"
  | "peer"
  | "other";

export type FleetJob = {
  id: string;
  title: string;
  status: FleetJobStatus;
  priority: FleetJobPriority;
  /** null = Global bay */
  projectId: string | null;
  harnessId: string | null;
  modelId: string | null;
  petId: string | null;
  source: FleetJobSource;
  sessionId: string | null;
  durableRunId: string | null;
  createdAt: string;
  updatedAt: string;
  /** Glass-box status for Ops / Voice (never spoken as-is). */
  statusLine: string | null;
  resultSummary: string | null;
  error: string | null;
};

export type FleetJobRegistry = {
  jobs: FleetJob[];
};

export type FleetBoardSnapshot = {
  running: number;
  queued: number;
  blocked: number;
  done: number;
  cancelled: number;
  jobs: FleetJob[];
};

const PRIORITY_RANK: Record<FleetJobPriority, number> = {
  blocker: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export function createEmptyFleetRegistry(): FleetJobRegistry {
  return { jobs: [] };
}

export function createFleetJob(input: {
  id: string;
  title: string;
  priority?: FleetJobPriority;
  projectId?: string | null;
  harnessId?: string | null;
  modelId?: string | null;
  petId?: string | null;
  source?: FleetJobSource;
  sessionId?: string | null;
  durableRunId?: string | null;
  status?: FleetJobStatus;
  statusLine?: string | null;
  now?: string;
}): FleetJob {
  const now = input.now ?? new Date().toISOString();
  return {
    id: input.id,
    title: input.title.trim() || "Untitled job",
    status: input.status ?? "queued",
    priority: input.priority ?? "normal",
    projectId: input.projectId ?? null,
    harnessId: input.harnessId ?? null,
    modelId: input.modelId ?? null,
    petId: input.petId ?? null,
    source: input.source ?? "other",
    sessionId: input.sessionId ?? null,
    durableRunId: input.durableRunId ?? null,
    createdAt: now,
    updatedAt: now,
    statusLine: input.statusLine ?? null,
    resultSummary: null,
    error: null,
  };
}

export function addFleetJob(
  registry: FleetJobRegistry,
  job: FleetJob,
): FleetJobRegistry {
  if (registry.jobs.some((j) => j.id === job.id)) {
    return upsertFleetJob(registry, job);
  }
  return { ...registry, jobs: [...registry.jobs, job] };
}

export function upsertFleetJob(
  registry: FleetJobRegistry,
  job: FleetJob,
): FleetJobRegistry {
  const idx = registry.jobs.findIndex((j) => j.id === job.id);
  if (idx < 0) {
    return { ...registry, jobs: [...registry.jobs, job] };
  }
  const jobs = [...registry.jobs];
  jobs[idx] = job;
  return { ...registry, jobs };
}

export type FleetJobPatch = Partial<
  Pick<
    FleetJob,
    | "title"
    | "status"
    | "priority"
    | "projectId"
    | "harnessId"
    | "modelId"
    | "petId"
    | "source"
    | "sessionId"
    | "durableRunId"
    | "statusLine"
    | "resultSummary"
    | "error"
  >
> & { now?: string };

export function updateFleetJob(
  registry: FleetJobRegistry,
  id: string,
  patch: FleetJobPatch,
): FleetJobRegistry {
  const now = patch.now ?? new Date().toISOString();
  let changed = false;
  const jobs = registry.jobs.map((j) => {
    if (j.id !== id) return j;
    changed = true;
    const { now: _n, ...rest } = patch;
    return { ...j, ...rest, updatedAt: now };
  });
  return changed ? { ...registry, jobs } : registry;
}

export function findFleetJob(
  registry: FleetJobRegistry,
  id: string,
): FleetJob | undefined {
  return registry.jobs.find((j) => j.id === id);
}

export function listFleetJobsByStatus(
  registry: FleetJobRegistry,
  status: FleetJobStatus,
): FleetJob[] {
  return registry.jobs.filter((j) => j.status === status);
}

export function countFleetJobsByStatus(
  registry: FleetJobRegistry,
): Record<FleetJobStatus, number> {
  const counts: Record<FleetJobStatus, number> = {
    queued: 0,
    running: 0,
    blocked: 0,
    done: 0,
    cancelled: 0,
  };
  for (const j of registry.jobs) {
    counts[j.status] += 1;
  }
  return counts;
}

/** Active = not terminal. */
export function listActiveFleetJobs(registry: FleetJobRegistry): FleetJob[] {
  return registry.jobs.filter(
    (j) =>
      j.status === "queued" ||
      j.status === "running" ||
      j.status === "blocked",
  );
}

export function toFleetBoardSnapshot(
  registry: FleetJobRegistry,
): FleetBoardSnapshot {
  const c = countFleetJobsByStatus(registry);
  return {
    running: c.running,
    queued: c.queued,
    blocked: c.blocked,
    done: c.done,
    cancelled: c.cancelled,
    jobs: [...registry.jobs],
  };
}

export function emptyFleetBoardSnapshot(): FleetBoardSnapshot {
  return toFleetBoardSnapshot(createEmptyFleetRegistry());
}

/** How long a running/queued desk may sit without an update before we seal it. */
export const FLEET_RUNNING_STALE_MS = 10 * 60_000;

/** Local-only optimistic desks Host never acknowledged. */
export const FLEET_OPTIMISTIC_TTL_MS = 30_000;

export function fleetJobAgeMs(job: FleetJob, nowMs: number): number {
  const t = Date.parse(job.updatedAt);
  return Number.isFinite(t) ? nowMs - t : Number.POSITIVE_INFINITY;
}

function isLiveDeskStatus(status: FleetJobStatus): boolean {
  switch (status) {
    case "queued":
    case "running":
      return true;
    case "blocked":
    case "done":
    case "cancelled":
      return false;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function chatSessionKey(job: FleetJob): string {
  const sid = job.sessionId?.trim();
  return sid && sid.length > 0 ? sid : `__id:${job.id}`;
}

/**
 * Cancel older live chat desks that share a session — one clocked-in desk per thread.
 */
export function supersedeOlderFleetChatJobs(
  registry: FleetJobRegistry,
  input: { sessionId: string; keepId: string },
): FleetJobRegistry {
  const sid = input.sessionId.trim();
  if (!sid) return registry;
  let changed = false;
  const jobs = registry.jobs.map((j) => {
    if (j.id === input.keepId) return j;
    if (j.source !== "chat") return j;
    if ((j.sessionId ?? "").trim() !== sid) return j;
    if (!isLiveDeskStatus(j.status)) return j;
    changed = true;
    return {
      ...j,
      status: "cancelled" as const,
      statusLine: "Superseded",
    };
  });
  return changed ? { jobs } : registry;
}

/**
 * Seal abandoned running desks + keep one live chat desk per session.
 * Blocked stays until dismissed. Does not persist — callers write if needed.
 */
export function reconcileFleetJobsForOffice(
  jobs: readonly FleetJob[],
  opts: { nowMs: number; staleMs?: number },
): FleetJob[] {
  const staleMs = opts.staleMs ?? FLEET_RUNNING_STALE_MS;
  const sealed = jobs.map((j) => {
    if (!isLiveDeskStatus(j.status)) return j;
    if (fleetJobAgeMs(j, opts.nowMs) < staleMs) return j;
    return {
      ...j,
      status: "cancelled" as const,
      statusLine: "Stopped",
    };
  });
  const keepLiveChat = new Map<string, FleetJob>();
  for (const j of sealed) {
    if (j.source !== "chat" || !isLiveDeskStatus(j.status)) continue;
    const key = chatSessionKey(j);
    const prev = keepLiveChat.get(key);
    if (!prev || j.updatedAt.localeCompare(prev.updatedAt) >= 0) {
      keepLiveChat.set(key, j);
    }
  }
  const keepIds = new Set([...keepLiveChat.values()].map((j) => j.id));
  return sealed.map((j) => {
    if (j.source !== "chat" || !isLiveDeskStatus(j.status)) return j;
    if (keepIds.has(j.id)) return j;
    return {
      ...j,
      status: "cancelled" as const,
      statusLine: "Superseded",
    };
  });
}

export function reconcileFleetBoardSnapshot(
  board: FleetBoardSnapshot,
  opts: { nowMs: number; staleMs?: number },
): FleetBoardSnapshot {
  return toFleetBoardSnapshot({
    jobs: reconcileFleetJobsForOffice(board.jobs, opts),
  });
}

/** Stable paint key — skip remount when Host/WS repeats the same board. */
export function fleetBoardPaintKey(
  board: FleetBoardSnapshot | null | undefined,
): string {
  if (!board) return "";
  const jobs = board.jobs
    .map((j) =>
      [j.id, j.status, j.updatedAt, j.statusLine ?? "", j.source, j.title].join(
        "\0",
      ),
    )
    .sort()
    .join("\n");
  return `${jobs}\n#${board.running}:${board.queued}:${board.blocked}:${board.done}:${board.cancelled}`;
}

export function fleetBoardsPaintEqual(
  a: FleetBoardSnapshot | null | undefined,
  b: FleetBoardSnapshot | null | undefined,
): boolean {
  return fleetBoardPaintKey(a) === fleetBoardPaintKey(b);
}

export function fleetJobWhenLabel(updatedAt: string, nowMs: number): string {
  const t = Date.parse(updatedAt);
  if (!Number.isFinite(t)) return "";
  const d = Math.max(0, nowMs - t);
  if (d < 45_000) return "just now";
  if (d < 3_600_000) return `${Math.max(1, Math.floor(d / 60_000))}m ago`;
  if (d < 86_400_000) return `${Math.max(1, Math.floor(d / 3_600_000))}h ago`;
  return `${Math.max(1, Math.floor(d / 86_400_000))}d ago`;
}

/**
 * Upsert one job onto a board snapshot (optimistic client / Host merge helper).
 * `replaceId` drops a prior provisional id (e.g. pending → chat:turnId).
 */
export function upsertJobOnFleetBoard(
  board: FleetBoardSnapshot | null | undefined,
  job: FleetJob,
  opts?: { replaceId?: string | null },
): FleetBoardSnapshot {
  let jobs = board?.jobs ? [...board.jobs] : [];
  const drop = opts?.replaceId?.trim();
  if (drop && drop !== job.id) {
    jobs = jobs.filter((j) => j.id !== drop);
  }
  const i = jobs.findIndex((j) => j.id === job.id);
  if (i >= 0) jobs[i] = job;
  else jobs.push(job);
  const sid = job.sessionId?.trim();
  if (sid && job.source === "chat" && isLiveDeskStatus(job.status)) {
    jobs = supersedeOlderFleetChatJobs(
      { jobs },
      { sessionId: sid, keepId: job.id },
    ).jobs;
  }
  return toFleetBoardSnapshot({ jobs });
}

/**
 * Host snapshot wins per id; keep fresh local-only live desks Host has not seen yet.
 */
export function mergeHostFleetBoardWithLocal(
  host: FleetBoardSnapshot,
  prior: FleetBoardSnapshot | null | undefined,
  opts?: { nowMs?: number; optimisticTtlMs?: number },
): FleetBoardSnapshot {
  if (!prior?.jobs.length) return host;
  const nowMs = opts?.nowMs ?? Date.now();
  const ttl = opts?.optimisticTtlMs ?? FLEET_OPTIMISTIC_TTL_MS;
  const hostIds = new Set(host.jobs.map((j) => j.id));
  const locals = prior.jobs.filter((j) => {
    if (hostIds.has(j.id)) return false;
    if (j.status !== "running" && j.status !== "queued" && j.status !== "blocked") {
      return false;
    }
    if (j.status === "blocked") return true;
    return fleetJobAgeMs(j, nowMs) < ttl;
  });
  if (!locals.length) return host;
  return toFleetBoardSnapshot({ jobs: [...host.jobs, ...locals] });
}

/** Bay key: Global sentinel or project id. */
export const FLEET_GLOBAL_BAY = "__global__";

export function fleetBayKey(projectId: string | null | undefined): string {
  const id = typeof projectId === "string" ? projectId.trim() : "";
  return id.length > 0 ? id : FLEET_GLOBAL_BAY;
}

export function fleetBayLabel(bayKey: string): string {
  return bayKey === FLEET_GLOBAL_BAY ? "Global" : bayKey;
}

export type FleetProjectBay = {
  bayKey: string;
  label: string;
  jobs: FleetJob[];
};

/**
 * Group jobs into project bays. Global first, then alpha by label.
 * Empty bays omitted.
 */
export function groupFleetJobsByProject(
  jobs: readonly FleetJob[],
): FleetProjectBay[] {
  const map = new Map<string, FleetJob[]>();
  for (const job of jobs) {
    const key = fleetBayKey(job.projectId);
    const list = map.get(key);
    if (list) list.push(job);
    else map.set(key, [job]);
  }
  const bays: FleetProjectBay[] = [];
  for (const [bayKey, bayJobs] of map) {
    bays.push({
      bayKey,
      label: fleetBayLabel(bayKey),
      jobs: bayJobs,
    });
  }
  bays.sort((a, b) => {
    if (a.bayKey === FLEET_GLOBAL_BAY) return -1;
    if (b.bayKey === FLEET_GLOBAL_BAY) return 1;
    return a.label.localeCompare(b.label);
  });
  return bays;
}

export type FleetBoardFilter = {
  harnessId?: string | null;
  status?: FleetJobStatus | null;
  /** When set, only this project (or Global sentinel). */
  bayKey?: string | null;
};

export function filterFleetJobs(
  jobs: readonly FleetJob[],
  filter: FleetBoardFilter,
): FleetJob[] {
  return jobs.filter((job) => {
    if (filter.harnessId && job.harnessId !== filter.harnessId) return false;
    if (filter.status && job.status !== filter.status) return false;
    if (filter.bayKey && fleetBayKey(job.projectId) !== filter.bayKey) {
      return false;
    }
    return true;
  });
}

export type {
  FleetPetActivityKind,
  FleetPetAnimState,
} from "./fleet-pet-anim-pure.js";
export {
  fleetPetStateForJob,
  fleetStatusLineFromSse,
  isFleetPetAnimState,
  projectFleetPetActivityKind,
} from "./fleet-pet-anim-pure.js";

/** Default done linger ms (office wave before drop). */
export const FLEET_DONE_LINGER_MS = 45_000;

/**
 * Live office jobs: active + done still within linger window.
 * Failed/blocked stay until dismissed (always included when status blocked).
 */
export function listOfficeFloorJobs(
  registry: FleetJobRegistry,
  opts: { nowMs: number; lingerMs?: number },
): FleetJob[] {
  const linger = opts.lingerMs ?? FLEET_DONE_LINGER_MS;
  return registry.jobs.filter((job) => {
    switch (job.status) {
      case "queued":
      case "running":
      case "blocked":
        return true;
      case "done": {
        const updated = Date.parse(job.updatedAt);
        if (!Number.isFinite(updated)) return true;
        return opts.nowMs - updated < linger;
      }
      case "cancelled": {
        const updated = Date.parse(job.updatedAt);
        if (!Number.isFinite(updated)) return false;
        return opts.nowMs - updated < Math.min(8_000, linger);
      }
      default: {
        const _exhaustive: never = job.status;
        return _exhaustive;
      }
    }
  });
}

/** Thin Recent: terminal jobs outside linger, newest first, capped. */
export function listFleetRecentJobs(
  registry: FleetJobRegistry,
  opts: { nowMs: number; lingerMs?: number; limit?: number },
): FleetJob[] {
  const linger = opts.lingerMs ?? FLEET_DONE_LINGER_MS;
  const limit = opts.limit ?? 12;
  const floorIds = new Set(
    listOfficeFloorJobs(registry, { nowMs: opts.nowMs, lingerMs: linger }).map(
      (j) => j.id,
    ),
  );
  const recent = registry.jobs
    .filter(
      (j) =>
        (j.status === "done" || j.status === "cancelled") &&
        !floorIds.has(j.id),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return recent.slice(0, limit);
}

export function sortFleetJobsByPriority(
  jobs: readonly FleetJob[],
): FleetJob[] {
  return [...jobs].sort((a, b) => {
    const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (pr !== 0) return pr;
    return a.createdAt.localeCompare(b.createdAt);
  });
}
