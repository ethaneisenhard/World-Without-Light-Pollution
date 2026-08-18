/**
 * Host heal orchestrator — diagnose → allowlisted exec → probe health.
 * LLM optional via deps.complete; always has heuristic fallback.
 */

import {
  buildHostHealSystemPrompt,
  createInitialHealJob,
  finalizeHealJob,
  heuristicHostHealPlan,
  hostHealSuccessFromHealthBody,
  matchHostHealCommand,
  newHostHealJobId,
  type HostHealJobState,
  type HostHealReport,
} from "./host-heal-pure.js";

export type HostHealExecResult = {
  ok: boolean;
  code: number;
  stdout: string;
  stderr: string;
  ruleId?: string;
};

export type HostHealOrchestratorDeps = {
  exec: (command: string) => Promise<HostHealExecResult>;
  probeDeskHealth: () => Promise<{ ok: boolean; body?: unknown; text?: string }>;
  /** Optional LLM — return next allowlisted command or empty to stop. */
  suggestNextCommand?: (input: {
    system: string;
    journal: string;
    history: { command: string; result: HostHealExecResult }[];
  }) => Promise<string | null>;
  now?: () => number;
};

export type RunHostHealInput = {
  auto?: boolean;
  jobId?: string;
};

export async function runHostHealOrchestrator(
  deps: HostHealOrchestratorDeps,
  input: RunHostHealInput = {},
): Promise<{ job: HostHealJobState; report: HostHealReport }> {
  const now = deps.now ?? (() => Date.now());
  let job = createInitialHealJob({
    id: input.jobId ?? newHostHealJobId(now()),
    auto: Boolean(input.auto),
    now: now(),
  });

  const actions: string[] = [];
  const logParts: string[] = [];
  const history: { command: string; result: HostHealExecResult }[] = [];

  const journalCmd = "journalctl -u studio-serve -n 80 --no-pager";
  const journalMatch = matchHostHealCommand(journalCmd);
  if (!journalMatch.ok) {
    const report: HostHealReport = {
      ok: false,
      summary: `allowlist blocked journal: ${journalMatch.reason}`,
      actions,
      logTail: "",
      phase: "failed",
    };
    return { job: finalizeHealJob(job, report, now()), report };
  }

  job = { ...job, phase: "diagnosing" };
  const journalRes = await deps.exec(journalCmd);
  history.push({ command: journalCmd, result: journalRes });
  actions.push(journalCmd);
  logParts.push(journalRes.stdout, journalRes.stderr);
  const journalText = `${journalRes.stdout}\n${journalRes.stderr}`;

  job = { ...job, phase: "acting" };
  let plan = heuristicHostHealPlan(journalText);

  if (deps.suggestNextCommand) {
    try {
      const suggested = await deps.suggestNextCommand({
        system: buildHostHealSystemPrompt(),
        journal: journalText.slice(-8000),
        history,
      });
      if (suggested?.trim()) {
        const m = matchHostHealCommand(suggested.trim());
        if (m.ok) {
          plan = [suggested.trim(), ...plan.filter((c) => c !== suggested.trim())];
        }
      }
    } catch (e) {
      logParts.push(
        `[heal] LLM suggest failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  // Dedupe while preserving order
  const seen = new Set<string>();
  const uniquePlan = plan.filter((c) => {
    if (seen.has(c)) return false;
    seen.add(c);
    return true;
  });

  for (const command of uniquePlan) {
    const m = matchHostHealCommand(command);
    if (!m.ok) {
      logParts.push(`[heal] skip ${command}: ${m.reason}`);
      continue;
    }
    const result = await deps.exec(command);
    history.push({ command, result });
    actions.push(command);
    logParts.push(`$ ${command}`, result.stdout, result.stderr);
  }

  job = { ...job, phase: "probing" };
  const health = await deps.probeDeskHealth();
  const ok =
    health.ok &&
    (health.body === undefined || hostHealSuccessFromHealthBody(health.body));

  const report: HostHealReport = {
    ok,
    summary: ok
      ? "Desk Host /health is OK after heal."
      : "Heal finished but desk Host /health is still failing.",
    actions,
    logTail: logParts.join("\n").slice(-12_000),
    phase: ok ? "fixed" : "failed",
  };

  return { job: finalizeHealJob(job, report, now()), report };
}
