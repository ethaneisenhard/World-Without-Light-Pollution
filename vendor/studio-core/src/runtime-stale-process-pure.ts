/**
 * Configurable stale-process policy for project Dev starts.
 * Pure — no fs/kill/fetch.
 */

import type { ProjectDevConfig, ProjectDevStartPolicy } from "./types.js";
import {
  listStaleProcessDetectors,
  type StaleProcessHint,
} from "./runtime-stale-process-registry-pure.js";

export type { StaleProcessHint };

export type DevOnAlreadyRunning = "stop-stale-and-retry" | "attach" | "fail";
export type DevStaleMatch = "same-root" | "any-pid";

const DEFAULT_POLICY: ProjectDevStartPolicy = {
  onAlreadyRunning: "stop-stale-and-retry",
  match: "same-root",
  retry: 1,
  stop: { signal: "SIGTERM", graceMs: 500 },
};

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

/** Normalize `dev.startPolicy` — safe defaults for every project. */
export function normalizeDevStartPolicy(
  raw: ProjectDevStartPolicy | null | undefined,
): ProjectDevStartPolicy {
  const on =
    raw?.onAlreadyRunning === "attach" ||
    raw?.onAlreadyRunning === "fail" ||
    raw?.onAlreadyRunning === "stop-stale-and-retry"
      ? raw.onAlreadyRunning
      : DEFAULT_POLICY.onAlreadyRunning;
  const match =
    raw?.match === "any-pid" || raw?.match === "same-root"
      ? raw.match
      : DEFAULT_POLICY.match!;
  const signal =
    raw?.stop?.signal === "SIGKILL" ? "SIGKILL" : DEFAULT_POLICY.stop!.signal!;
  return {
    onAlreadyRunning: on,
    match,
    retry: clampInt(
      raw?.retry ?? DEFAULT_POLICY.retry!,
      0,
      3,
    ),
    stop: {
      signal,
      graceMs: clampInt(
        raw?.stop?.graceMs ?? DEFAULT_POLICY.stop!.graceMs!,
        0,
        10_000,
      ),
    },
  };
}

export function resolveDevStartPolicy(
  dev: ProjectDevConfig | null | undefined,
): ProjectDevStartPolicy {
  return normalizeDevStartPolicy(dev?.startPolicy);
}

/** Path compare for same-root match (posix-ish; Host paths). */
export function pathsLikelySameProjectRoot(a: string, b: string): boolean {
  const norm = (p: string) =>
    p
      .trim()
      .replace(/\\/g, "/")
      .replace(/\/+$/, "")
      .toLowerCase();
  const left = norm(a);
  const right = norm(b);
  if (!left || !right) return false;
  return left === right;
}

/** Run all registry detectors over joined spawn logs. */
export function extractStaleProcessHintsFromLogs(
  log: readonly string[] | null | undefined,
): StaleProcessHint[] {
  if (!log?.length) return [];
  const blob = log.join("\n");
  const out: StaleProcessHint[] = [];
  const seenPid = new Set<number>();
  for (const detector of listStaleProcessDetectors()) {
    for (const hint of detector.detect(blob)) {
      if (seenPid.has(hint.pid)) continue;
      seenPid.add(hint.pid);
      out.push(hint);
    }
  }
  return out;
}

export type StaleProcessDecision =
  | {
      action: "kill-and-retry";
      pids: number[];
      signal: "SIGTERM" | "SIGKILL";
      graceMs: number;
      hints: StaleProcessHint[];
    }
  | { action: "attach"; hints: StaleProcessHint[] }
  | { action: "fail"; hints: StaleProcessHint[]; reason: string };

/**
 * Decide what to do after a spawn exit that looks like "already running".
 */
export function decideStaleProcessAction(input: {
  policy: ProjectDevStartPolicy;
  hints: StaleProcessHint[];
  projectRoot: string;
  /** Retries already consumed this start chain. */
  staleRetryCount: number;
}): StaleProcessDecision {
  const policy = normalizeDevStartPolicy(input.policy);
  const hints = input.hints;
  const on = policy.onAlreadyRunning ?? "stop-stale-and-retry";

  if (on === "fail") {
    return {
      action: "fail",
      hints,
      reason: "dev.startPolicy.onAlreadyRunning=fail",
    };
  }

  if (on === "attach") {
    return { action: "attach", hints };
  }

  // stop-stale-and-retry
  const maxRetry = policy.retry ?? 1;
  if (input.staleRetryCount >= maxRetry) {
    return { action: "attach", hints };
  }

  const match = policy.match ?? "same-root";
  const killable = hints.filter((h) => {
    if (!Number.isInteger(h.pid) || h.pid <= 0) return false;
    if (match === "any-pid") return true;
    // same-root: require Dir and equality with project root
    if (!h.dir) return false;
    return pathsLikelySameProjectRoot(h.dir, input.projectRoot);
  });

  if (!killable.length) {
    // No safe PID — fall back to attach/probe (existing recovery).
    return { action: "attach", hints };
  }

  return {
    action: "kill-and-retry",
    pids: [...new Set(killable.map((h) => h.pid))],
    signal: policy.stop?.signal === "SIGKILL" ? "SIGKILL" : "SIGTERM",
    graceMs: policy.stop?.graceMs ?? 500,
    hints,
  };
}
