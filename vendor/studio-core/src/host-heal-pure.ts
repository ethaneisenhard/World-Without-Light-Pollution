/**
 * Host heal — allowlist, job face, success criteria (pure).
 * Allowlist patterns mirror infra/studio-host-vps/operator-allowlist-pure.mjs
 */

export type HostHealPhase =
  | "idle"
  | "diagnosing"
  | "acting"
  | "probing"
  | "fixed"
  | "failed";

export type HostHealReport = {
  ok: boolean;
  summary: string;
  actions: string[];
  logTail: string;
  phase: HostHealPhase;
};

export type HostHealJobState = {
  id: string;
  phase: HostHealPhase;
  startedAt: number;
  finishedAt: number | null;
  auto: boolean;
  report: HostHealReport | null;
  error: string | null;
};

export type OperatorAllowRule = {
  id: string;
  /** Source pattern string for docs/tests — compiled in match fn */
  patternSource: string;
  label: string;
};

/** Keep ids/labels aligned with operator-allowlist-pure.mjs */
export const HOST_HEAL_ALLOW_RULES: readonly OperatorAllowRule[] = [
  {
    id: "journalctl-serve",
    patternSource: String.raw`^journalctl\s+-u\s+studio-serve(\s+(-n\s+\d+|--no-pager|-l))*\s*$`,
    label: "studio-serve journal",
  },
  {
    id: "systemctl-status-serve",
    patternSource: String.raw`^systemctl\s+(status|is-active|is-failed)\s+studio-serve\s*$`,
    label: "studio-serve status",
  },
  {
    id: "systemctl-reset-restart-serve",
    patternSource: String.raw`^systemctl\s+(reset-failed|restart|start|stop)\s+studio-serve\s*$`,
    label: "studio-serve control",
  },
  {
    id: "curl-local-health",
    patternSource: String.raw`^curl\s+-sS\s+-m\s+\d+\s+http://127\.0\.0\.1:3847/health\s*$`,
    label: "local host health",
  },
  {
    id: "pnpm-install",
    patternSource: String.raw`^cd\s+/opt/glassbox-studio\s+&&\s+pnpm\s+install(\s+--no-frozen-lockfile)?\s*$`,
    label: "pnpm install",
  },
  {
    id: "ls-marked",
    patternSource: String.raw`^ls\s+(-la\s+)?(/opt/glassbox-studio/)?(packages/studio/studio-core/)?node_modules/marked(/package\.json)?\s*$`,
    label: "check marked install",
  },
] as const;

const COMPILED = HOST_HEAL_ALLOW_RULES.map((r) => ({
  ...r,
  pattern: new RegExp(r.patternSource),
}));

export function matchHostHealCommand(
  command: string,
): { ok: true; ruleId: string } | { ok: false; reason: string } {
  const cmd = String(command ?? "").trim();
  if (!cmd) return { ok: false, reason: "empty command" };
  if (cmd.length > 500) return { ok: false, reason: "command too long" };
  if (/[;&|`$<>]/.test(cmd) && !cmd.startsWith("cd /opt/glassbox-studio &&")) {
    if (!/^cd\s+\/opt\/glassbox-studio\s+&&\s+pnpm\s+install/.test(cmd)) {
      return { ok: false, reason: "shell metacharacters not allowed" };
    }
  }
  for (const rule of COMPILED) {
    if (rule.pattern.test(cmd)) return { ok: true, ruleId: rule.id };
  }
  return { ok: false, reason: "command not on allowlist" };
}

export function buildHostHealSystemPrompt(): string {
  return [
    "You are the Glass Box Studio desk Host heal agent.",
    "studio-serve on the desk VPS is unhealthy. Diagnose with allowlisted tools, then fix.",
    "Prefer: journalctl/status → if ERR_MODULE_NOT_FOUND or missing deps → pnpm install --no-frozen-lockfile → systemctl reset-failed + restart → curl local health.",
    "Only use allowlisted exec commands. One repair pass. Stop when /health returns ok.",
    "Respond with a short summary of what you found and did.",
  ].join("\n");
}

export function hostHealSuccessFromHealthBody(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const rec = body as Record<string, unknown>;
  return rec.ok === true;
}

export function newHostHealJobId(now = Date.now()): string {
  return `heal-${now.toString(36)}`;
}

/** Auto-start at most once per windowMs for a given host key. */
export function shouldAutoStartHostHeal(input: {
  lastAutoStartedAt: number | null;
  now: number;
  windowMs?: number;
  lastJobPhase: HostHealPhase | null;
}): boolean {
  const windowMs = input.windowMs ?? 60 * 60 * 1000;
  if (input.lastJobPhase === "diagnosing" || input.lastJobPhase === "acting" || input.lastJobPhase === "probing") {
    return false;
  }
  if (input.lastAutoStartedAt != null && input.now - input.lastAutoStartedAt < windowMs) {
    return false;
  }
  return true;
}

export type HostDownFace =
  | "hidden"
  | "detecting"
  | "healing"
  | "fixed"
  | "failed";

export function resolveHostDownFace(input: {
  hostHealthy: boolean | null;
  job: Pick<HostHealJobState, "phase"> | null;
}): HostDownFace {
  if (input.hostHealthy === true) {
    if (input.job?.phase === "fixed") return "fixed";
    return "hidden";
  }
  if (input.hostHealthy === null) return "detecting";
  const phase = input.job?.phase;
  switch (phase) {
    case "diagnosing":
    case "acting":
    case "probing":
      return "healing";
    case "fixed":
      return "fixed";
    case "failed":
      return "failed";
    case "idle":
    case undefined:
      return "detecting";
    default: {
      const _x: never = phase;
      return _x;
    }
  }
}

/**
 * Heuristic plan when no LLM — covers missing-module crash-loop class.
 */
export function heuristicHostHealPlan(journalText: string): string[] {
  const text = journalText.toLowerCase();
  const cmds: string[] = [];
  if (
    text.includes("err_module_not_found") ||
    text.includes("cannot find package") ||
    text.includes("missing dependency")
  ) {
    cmds.push("cd /opt/glassbox-studio && pnpm install --no-frozen-lockfile");
  }
  cmds.push("systemctl reset-failed studio-serve");
  cmds.push("systemctl restart studio-serve");
  cmds.push("curl -sS -m 15 http://127.0.0.1:3847/health");
  return cmds;
}

export function createInitialHealJob(input: {
  id: string;
  auto: boolean;
  now: number;
}): HostHealJobState {
  return {
    id: input.id,
    phase: "diagnosing",
    startedAt: input.now,
    finishedAt: null,
    auto: input.auto,
    report: null,
    error: null,
  };
}

export function finalizeHealJob(
  job: HostHealJobState,
  report: HostHealReport,
  now: number,
): HostHealJobState {
  return {
    ...job,
    phase: report.ok ? "fixed" : "failed",
    finishedAt: now,
    report: { ...report, phase: report.ok ? "fixed" : "failed" },
    error: report.ok ? null : report.summary,
  };
}
