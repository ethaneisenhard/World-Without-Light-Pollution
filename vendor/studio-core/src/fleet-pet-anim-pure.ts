/**
 * Fleet desk → Codex atlas row. Status first; running jobs follow activity
 * (statusLine / tool / SSE) so Orchestrator rooms don't share one playlist.
 * No I/O.
 */

import { projectToolActivity } from "./tool-activity-registry-pure.js";

export type FleetPetAnimState =
  | "idle"
  | "running-right"
  | "running-left"
  | "waving"
  | "jumping"
  | "failed"
  | "waiting"
  | "running"
  | "review";

const FLEET_PET_ANIM_STATES: ReadonlySet<string> = new Set([
  "idle",
  "running-right",
  "running-left",
  "waving",
  "jumping",
  "failed",
  "waiting",
  "running",
  "review",
]);

export function isFleetPetAnimState(raw: string): raw is FleetPetAnimState {
  return FLEET_PET_ANIM_STATES.has(raw);
}

export type FleetPetActivityKind =
  | "thinking"
  | "shell"
  | "files-write"
  | "files-read"
  | "search"
  | "waiting"
  | "streaming"
  | "failed"
  | "celebrate";

type FleetJobStatusAnim =
  | "queued"
  | "running"
  | "blocked"
  | "done"
  | "cancelled";

function activityToAnim(kind: FleetPetActivityKind): FleetPetAnimState {
  switch (kind) {
    case "thinking":
      return "review";
    case "shell":
      return "running";
    case "files-write":
      return "running-right";
    case "files-read":
      return "running-left";
    case "search":
      return "jumping";
    case "waiting":
      return "waiting";
    case "streaming":
      return "running";
    case "failed":
      return "failed";
    case "celebrate":
      return "waving";
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

/**
 * Classify a glass-box status / tool title into an activity kind.
 * Unknown work copy → null (caller keeps status default).
 */
export function projectFleetPetActivityKind(input: {
  statusLine?: string | null;
  toolName?: string | null;
  phase?: string | null;
}): FleetPetActivityKind | null {
  const tool = input.toolName?.trim();
  if (tool) {
    const title = projectToolActivity({ name: tool }).title;
    const fromTool = classifyActivityCopy(title) ?? classifyActivityCopy(tool);
    if (fromTool) return fromTool;
  }
  const phase = input.phase?.trim();
  if (phase) {
    const fromPhase = classifyActivityCopy(phase);
    if (fromPhase) return fromPhase;
  }
  const line = input.statusLine?.trim();
  if (line) return classifyActivityCopy(line);
  return null;
}

function classifyActivityCopy(raw: string): FleetPetActivityKind | null {
  const t = raw.toLowerCase().replace(/\s+/g, " ").trim();
  if (!t) return null;
  if (/\berror\b|\bfail|\bblocked\b/.test(t)) return "failed";
  if (/\bdone\b|\bcomplete|\bwave/.test(t)) return "celebrate";
  if (
    /\bwait|\bqueued\b|\bask user\b|\bapproval\b|\bstarting\b/.test(t)
  ) {
    return "waiting";
  }
  if (
    /\bthink|\bloading context|\bstarting model|\bprep\b|\bponder/.test(t)
  ) {
    return "thinking";
  }
  if (/\brun command|\bshell\b|\bbash\b|\bterminal\b|\bexec\b/.test(t)) {
    return "shell";
  }
  if (
    /\bwrite file|\bedit file|\bapply patch|\bcoding\b|\bfiles_write|\bwrite\b/.test(
      t,
    )
  ) {
    return "files-write";
  }
  if (/\bread file|\bopen file|\bfiles_read|\bread\b/.test(t)) {
    return "files-read";
  }
  if (/\bsearch|\bgrep|\bfind files|\bglob\b/.test(t)) return "search";
  if (/\bship to cloud|\bdeploy|\bcheck cloud/.test(t)) return "shell";
  if (/\brunning\b/.test(t)) return "streaming";
  return null;
}

/**
 * Map job status → pet animation (PRD table).
 * selected overrides to review. Running uses activity when present.
 */
export function fleetPetStateForJob(input: {
  status: FleetJobStatusAnim;
  selected?: boolean;
  /** During done linger celebration. */
  celebrating?: boolean;
  statusLine?: string | null;
  toolName?: string | null;
  phase?: string | null;
}): FleetPetAnimState {
  if (input.selected) return "review";
  switch (input.status) {
    case "queued":
      return "waiting";
    case "running": {
      const kind = projectFleetPetActivityKind({
        statusLine: input.statusLine,
        toolName: input.toolName,
        phase: input.phase,
      });
      return kind ? activityToAnim(kind) : "running";
    }
    case "blocked":
      return "failed";
    case "done":
      return input.celebrating ? "waving" : "idle";
    case "cancelled":
      return "idle";
    default: {
      const _exhaustive: never = input.status;
      return _exhaustive;
    }
  }
}

/**
 * SSE → office status line (and therefore pet row). Null = don't patch.
 */
export function fleetStatusLineFromSse(
  event: string,
  data: Record<string, unknown>,
): string | null {
  switch (event) {
    case "tool-start": {
      const name = typeof data.name === "string" ? data.name.trim() : "";
      if (!name) return "Running…";
      return projectToolActivity({ name, input: data.input }).title;
    }
    case "tool-end":
      return "Running…";
    case "thinking":
      return "Thinking…";
    case "status": {
      const phase = typeof data.phase === "string" ? data.phase : "";
      const detail =
        typeof data.detail === "string" ? data.detail.trim() : "";
      switch (phase) {
        case "done":
        case "stopped":
          return null;
        case "prep":
        case "harness":
        case "thinking":
          return detail || "Thinking…";
        default:
          return detail || null;
      }
    }
    default:
      return null;
  }
}
