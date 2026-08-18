/**
 * Glass-box turn inspect — what entered the turn before the harness ran.
 */

import type { ContextBundleV1 } from "./context-bundle-pure.js";
import { isMemoryPinned } from "./memory-retrieve-pure.js";
import type { MemoryRow } from "./memory-pure.js";
import {
  classifyRulePack,
  formatRuleReceiptPackLabel,
  type RuleReceiptPack,
} from "./rules-retrieve-pure.js";
import type { MergedRule } from "./rules-manifest-pure.js";

/** Into-chat pack name for turn receipts (human). */
export type MemoryReceiptPack = "always-on" | "auto";

export function memoryReceiptPack(row: MemoryRow): MemoryReceiptPack {
  return isMemoryPinned(row) ? "always-on" : "auto";
}

export function formatMemoryReceiptPackLabel(pack: MemoryReceiptPack): string {
  return pack === "always-on" ? "Always-on memory" : "Auto memory";
}

/** Summary chip for Thinking chrome. */
export function formatMemoryReceiptSummary(count: number): string {
  if (count <= 0) return "";
  if (count === 1) return " · 1 turn receipt (memory)";
  return ` · ${count} turn receipts (memory)`;
}

export type TurnInspectSlice = {
  id: string;
  kind: "memory" | "notes" | "rules" | "skills" | "other";
  label: string;
  detail?: string;
};

export type TurnInspectLiveAgentSibling = {
  chatId: string;
  label: string;
  harnessId: string;
  role: "spawned" | "peer";
};

export type TurnInspectLiveAgents = {
  siblingCount: number;
  overlapCount: number;
  spawnedCount: number;
  /** Other room members for spawn chrome (click → switch session). */
  siblings?: readonly TurnInspectLiveAgentSibling[];
};

/** Prompt-cache / cost telemetry (from SSE status after Anthropic rounds). */
export type TurnInspectPromptCache = {
  cacheRead: number;
  cacheCreation5m: number;
  cacheCreation1h: number;
  inputUncached: number;
  inputTotal: number;
};

export type TurnInspectV1 = {
  version: 1;
  projectId: string;
  harnessId: string;
  allowTools: readonly string[] | null;
  /** Memory rows injected this turn. */
  memoryIds: readonly string[];
  /** Note paths retrieved (vault-relative). */
  notePaths: readonly string[];
  systemChars: number;
  slices: readonly TurnInspectSlice[];
  multiAgent: string;
  /** Agent room snapshot for glass-box chrome. */
  liveAgents: TurnInspectLiveAgents;
  /** Filled after harness status with cache tokens (optional). */
  promptCache?: TurnInspectPromptCache | null;
};

export function formatPromptCacheInspectLabel(
  cache: TurnInspectPromptCache,
): string {
  return `Cache read ${cache.cacheRead} · write 5m ${cache.cacheCreation5m} / 1h ${cache.cacheCreation1h} · uncached ${cache.inputUncached} · in ${cache.inputTotal}`;
}

export function mergeTurnInspectPromptCache(
  inspect: TurnInspectV1,
  cache: TurnInspectPromptCache,
): TurnInspectV1 {
  const label = formatPromptCacheInspectLabel(cache);
  const without = inspect.slices.filter((s) => s.id !== "prompt-cache");
  return {
    ...inspect,
    promptCache: cache,
    slices: [
      ...without,
      {
        id: "prompt-cache",
        kind: "other",
        label: `Prompt cache`,
        detail: label,
      },
    ],
  };
}

export function buildTurnInspect(input: {
  bundle: ContextBundleV1;
  memoryRows?: readonly MemoryRow[];
  notePaths?: readonly string[];
  /** Rules packed this turn (Always-on / Auto). */
  ruleRows?: readonly MergedRule[];
  multiAgent?: string;
  extraSlices?: readonly TurnInspectSlice[];
  liveAgents?: TurnInspectLiveAgents;
  promptCache?: TurnInspectPromptCache | null;
}): TurnInspectV1 {
  const memoryRows = input.memoryRows ?? [];
  const notePaths = input.notePaths ?? [];
  const ruleRows = input.ruleRows ?? [];
  const slices: TurnInspectSlice[] = [
    {
      id: "harness",
      kind: "other",
      label: `Harness: ${input.bundle.harnessId}`,
    },
    {
      id: "tools",
      kind: "other",
      label:
        input.bundle.allowTools === null
          ? "Tools: all catalog"
          : `Tools: ${input.bundle.allowTools.length}`,
      detail:
        input.bundle.allowTools === null
          ? undefined
          : input.bundle.allowTools.join(", "),
    },
    ...memoryRows.map((r) => {
      const pack = memoryReceiptPack(r);
      const packLabel = formatMemoryReceiptPackLabel(pack);
      return {
        id: r.id,
        kind: "memory" as const,
        label: `${packLabel} — ${r.content.slice(0, 72)}`,
        detail: `origin=${r.origin}${r.source ? ` source=${r.source}` : ""}`,
      };
    }),
    ...ruleRows.map((r) => {
      const pack = classifyRulePack(r) as RuleReceiptPack;
      const packLabel = formatRuleReceiptPackLabel(pack);
      const title = r.title ?? r.id;
      return {
        id: `rule:${r.id}`,
        kind: "rules" as const,
        label: `${packLabel} — ${title}`,
        detail: `scope=${r.scope} path=${r.path}`,
      };
    }),
    ...notePaths.map((p) => ({
      id: p,
      kind: "notes" as const,
      label: p,
    })),
    ...(input.extraSlices ?? []),
  ];
  return {
    version: 1,
    projectId: input.bundle.projectId,
    harnessId: input.bundle.harnessId,
    allowTools: input.bundle.allowTools,
    memoryIds: memoryRows.map((r) => r.id),
    notePaths,
    systemChars: input.bundle.system.length,
    slices,
    multiAgent: input.multiAgent ?? "agent-room",
    liveAgents: input.liveAgents ?? {
      siblingCount: 0,
      overlapCount: 0,
      spawnedCount: 0,
      siblings: [],
    },
    promptCache: input.promptCache ?? null,
  };
}
