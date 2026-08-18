/**
 * Terminal session caps / ids / path containment — pure, no I/O.
 */

export const DEFAULT_TERMINAL_SESSION_CAP = 6;

export type TerminalSessionKind = "shell" | "runtime";

export type TerminalSessionId = string;

export function createTerminalSessionId(
  kind: TerminalSessionKind,
  now = Date.now,
  random = () => Math.random().toString(36).slice(2, 8),
): TerminalSessionId {
  return `${kind}-${now().toString(36)}-${random()}`;
}

export function checkTerminalSessionCap(
  currentCount: number,
  cap = DEFAULT_TERMINAL_SESSION_CAP,
): { ok: true } | { ok: false; limit: number; current: number } {
  if (currentCount >= cap) {
    return { ok: false, limit: cap, current: currentCount };
  }
  return { ok: true };
}

/**
 * Resolved cwd must equal root or sit under root + sep (no escape).
 * Paths are absolute; caller resolves with path.resolve first.
 */
export function isPathUnderRoot(root: string, candidate: string): boolean {
  const r = root.endsWith("/") || root.endsWith("\\") ? root.slice(0, -1) : root;
  if (candidate === r) return true;
  const sep = r.includes("\\") && !r.includes("/") ? "\\" : "/";
  return candidate.startsWith(r + sep);
}

export function shellSessionLabel(projectId: string): string {
  const id = projectId.trim();
  return id ? `shell · ${id}` : "shell · studio";
}

/**
 * Where a new interactive shell starts (cwd).
 * - `project` — registered project root (needs projectId)
 * - `studio` — Glass Box Studio monorepo / Host repoRoot
 * - `vps` — Host filesystem root (`/` / drive root) so operator can reach whole machine
 */
export type TerminalShellRootKind = "project" | "studio" | "vps";

export type TerminalShellRoot = {
  kind: TerminalShellRootKind;
  /** Required when kind === "project". */
  projectId?: string;
};

/** Stable select value — `vps` | `studio` | `project:<id>`. */
export function terminalShellRootValue(root: TerminalShellRoot): string {
  if (root.kind === "project") {
    const id = (root.projectId ?? "").trim();
    return id ? `project:${id}` : "studio";
  }
  return root.kind;
}

export function parseTerminalShellRootValue(
  value: string,
): TerminalShellRoot | null {
  const v = value.trim();
  if (v === "vps" || v === "studio") return { kind: v };
  if (v.startsWith("project:")) {
    const projectId = v.slice("project:".length).trim();
    if (!projectId) return null;
    return { kind: "project", projectId };
  }
  return null;
}

export function shellSessionLabelForRoot(root: TerminalShellRoot): string {
  if (root.kind === "vps") return "shell · VPS /";
  if (root.kind === "studio") return "shell · studio";
  return shellSessionLabel(root.projectId ?? "");
}

/**
 * Resolve absolute cwd for a shell root. Pure — caller supplies absolute paths.
 * `hostRoot` is filesystem root (`/` or `C:\\`).
 */
export function resolveTerminalShellCwd(input: {
  root: TerminalShellRoot;
  repoRoot: string;
  /** Absolute project root when kind=project; null if unknown. */
  projectRoot: string | null;
  hostRoot: string;
}): { ok: true; cwd: string } | { ok: false; error: string } {
  const repo = input.repoRoot.trim();
  const host = input.hostRoot.trim() || "/";
  if (input.root.kind === "vps") {
    return { ok: true, cwd: host };
  }
  if (input.root.kind === "studio") {
    if (!repo) return { ok: false, error: "Missing studio root" };
    return { ok: true, cwd: repo };
  }
  const projectId = (input.root.projectId ?? "").trim();
  if (!projectId) {
    return { ok: false, error: "Missing project id" };
  }
  const projectRoot = (input.projectRoot ?? "").trim();
  if (!projectRoot) {
    return { ok: false, error: `Unknown project: ${projectId}` };
  }
  return { ok: true, cwd: projectRoot };
}

/** Dropdown rows — VPS + Studio first, then projects (id order preserved). */
export function terminalShellRootOptions(projects: readonly {
  id: string;
  name?: string;
}[]): Array<{ value: string; label: string }> {
  const rows: Array<{ value: string; label: string }> = [
    { value: "vps", label: "VPS / (entire host)" },
    { value: "studio", label: "Studio (monorepo)" },
  ];
  for (const p of projects) {
    const id = p.id.trim();
    if (!id) continue;
    const name = (p.name ?? "").trim();
    rows.push({
      value: `project:${id}`,
      label: name && name !== id ? `${name} (${id})` : id,
    });
  }
  return rows;
}

export function runtimeSessionLabel(projectId: string, serverId: string): string {
  return `runtime · ${projectId}/${serverId}`;
}

/** Public session row (list / restore). */
export type TerminalSessionWire = {
  id: string;
  kind: TerminalSessionKind;
  label: string;
  stdin: boolean;
  projectId: string;
  serverId?: string;
};

/** Wire protocol (JSON text frames over WebSocket). */
export type TerminalClientMessage =
  | {
      type: "create";
      kind: "shell";
      /**
       * Shell cwd root. Default: `project` when projectId set, else `studio`.
       * `vps` = Host filesystem root (entire machine).
       */
      root?: TerminalShellRootKind;
      projectId?: string;
      cols?: number;
      rows?: number;
    }
  | {
      type: "create";
      kind: "runtime";
      projectId: string;
      serverId: string;
    }
  /** Re-bind this socket to a session that survived a page refresh. */
  | { type: "adopt"; sessionId: string }
  /** Ask server for live sessions (hard-refresh restore). */
  | { type: "list" }
  | { type: "input"; sessionId: string; data: string }
  | { type: "resize"; sessionId: string; cols: number; rows: number }
  | { type: "close"; sessionId: string };

export type TerminalServerMessage =
  | {
      type: "ready";
      sessionId: string;
      kind: TerminalSessionKind;
      label: string;
      stdin: boolean;
      projectId: string;
      serverId?: string;
    }
  | { type: "sessions"; sessions: TerminalSessionWire[] }
  | { type: "output"; sessionId: string; data: string }
  | { type: "exit"; sessionId: string; code?: number | null }
  | { type: "error"; message: string; sessionId?: string };
