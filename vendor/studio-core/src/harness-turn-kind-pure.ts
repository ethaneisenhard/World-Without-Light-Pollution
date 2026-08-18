/**
 * Harness turn kind registry — who owns the agent loop.
 * Host looks up kind → runner; never `if (harnessId === …)` for behavior.
 */

import {
  BUILTIN_HARNESS_IDS,
  normalizeHarnessIdAlias,
} from "./harness-policy-pure.js";

/**
 * - `api-tool-loop` — Studio Host runs progressive MCP tools (Messages or Chat Completions transport).
 * - `cli-peer` — peer CLI / remote agent owns the loop; Studio injects MCP.
 */
export type HarnessTurnKind = "api-tool-loop" | "cli-peer";

/** Wire shape for API tool-loop harnesses (transport adapter id). */
export type ApiToolLoopTransport = "anthropic-messages" | "chat-completions";

export type ApiToolLoopHarnessRow = {
  kind: "api-tool-loop";
  transport: ApiToolLoopTransport;
};

export type CliPeerHarnessRow = {
  kind: "cli-peer";
};

export type HarnessTurnKindRow = ApiToolLoopHarnessRow | CliPeerHarnessRow;

/**
 * Registry — add a row for new harnesses; do not branch in harness-turn-orchestrator.
 */
export const HARNESS_TURN_KIND_REGISTRY: Readonly<
  Record<string, HarnessTurnKindRow>
> = {
  [BUILTIN_HARNESS_IDS.anthropic]: {
    kind: "api-tool-loop",
    transport: "anthropic-messages",
  },
  // Legacy alias — normalizeHarnessIdAlias maps to anthropic; keep for direct lookup.
  [BUILTIN_HARNESS_IDS.studio]: {
    kind: "api-tool-loop",
    transport: "anthropic-messages",
  },
  [BUILTIN_HARNESS_IDS.deepseek]: {
    kind: "api-tool-loop",
    transport: "chat-completions",
  },
  [BUILTIN_HARNESS_IDS.litellm]: {
    kind: "api-tool-loop",
    transport: "chat-completions",
  },
  [BUILTIN_HARNESS_IDS.cursor]: { kind: "cli-peer" },
  [BUILTIN_HARNESS_IDS.hermes]: { kind: "cli-peer" },
  [BUILTIN_HARNESS_IDS.grok]: { kind: "cli-peer" },
  [BUILTIN_HARNESS_IDS.kody]: { kind: "cli-peer" },
};

export function getHarnessTurnKindRow(
  harnessId: string,
): HarnessTurnKindRow | null {
  const id = normalizeHarnessIdAlias(harnessId.trim());
  return HARNESS_TURN_KIND_REGISTRY[id] ?? null;
}

export function harnessTurnKind(harnessId: string): HarnessTurnKind | null {
  return getHarnessTurnKindRow(harnessId)?.kind ?? null;
}

/** Studio Host owns progressive tools for this harness. */
export function isApiToolLoopHarness(harnessId: string): boolean {
  return harnessTurnKind(harnessId) === "api-tool-loop";
}

export function apiToolLoopTransport(
  harnessId: string,
): ApiToolLoopTransport | null {
  const row = getHarnessTurnKindRow(harnessId);
  return row?.kind === "api-tool-loop" ? row.transport : null;
}
