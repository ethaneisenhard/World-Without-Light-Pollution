/**
 * Chat context budget levels — when to warn / compact / hard-fork.
 * Swarm/Claude-style: min(ratio×window, window−buffer).
 */

import {
  estimateChatContextUsage,
  estimateTokensFromText,
  resolveContextWindowTokens,
  type ChatContextUsageEstimate,
} from "./chat-context-usage-pure.js";

export type ChatContextBudgetLevel = "ok" | "warn" | "compact" | "hard";

export type ChatContextBudgetConfig = {
  /** Fraction of window that starts compact (default 1.0, capped by buffer). */
  thresholdRatio?: number;
  /** Tokens reserved below provider limit (default 13_000). */
  bufferTokens?: number;
  /** Fraction of window for warn (default 0.75). */
  warnRatio?: number;
  /** Fraction of window for hard after compact failed (default = compact threshold). */
  hardRatio?: number;
};

export type ChatContextBudgetSnapshot = {
  level: ChatContextBudgetLevel;
  usedTokens: number;
  windowTokens: number;
  compactThresholdTokens: number;
  hardThresholdTokens: number;
  warnThresholdTokens: number;
  pct: number;
};

export const DEFAULT_COMPACTION_BUFFER_TOKENS = 13_000;
export const DEFAULT_COMPACTION_THRESHOLD_RATIO = 1;
export const DEFAULT_WARN_RATIO = 0.75;

export function resolveCompactThresholdTokens(
  windowTokens: number,
  config: ChatContextBudgetConfig = {},
): number {
  const window = Math.max(1, Math.floor(windowTokens));
  const ratio = config.thresholdRatio ?? DEFAULT_COMPACTION_THRESHOLD_RATIO;
  const buffer = config.bufferTokens ?? DEFAULT_COMPACTION_BUFFER_TOKENS;
  const ratioThreshold = Math.floor(window * (ratio > 0 ? ratio : 1));
  const buffered = Math.max(1, window - Math.max(0, buffer));
  return Math.min(ratioThreshold, buffered);
}

export function resolveChatContextBudget(
  input: {
    usedTokens: number;
    windowTokens: number;
  },
  config: ChatContextBudgetConfig = {},
): ChatContextBudgetSnapshot {
  const windowTokens = Math.max(1, Math.floor(input.windowTokens));
  const usedTokens = Math.max(0, Math.floor(input.usedTokens));
  const compactThresholdTokens = resolveCompactThresholdTokens(
    windowTokens,
    config,
  );
  const warnRatio = config.warnRatio ?? DEFAULT_WARN_RATIO;
  const warnThresholdTokens = Math.floor(
    windowTokens * (warnRatio > 0 && warnRatio < 1 ? warnRatio : DEFAULT_WARN_RATIO),
  );
  // Default hard = full window (hard is decided after cascade in the orchestrator).
  // Callers may set hardRatio to treat pre-cascade overfill as hard.
  const hardThresholdTokens =
    config.hardRatio != null && config.hardRatio > 0
      ? Math.floor(windowTokens * config.hardRatio)
      : windowTokens;
  const pct =
    windowTokens <= 0
      ? 0
      : Math.min(100, Math.round((usedTokens / windowTokens) * 1000) / 10);

  let level: ChatContextBudgetLevel = "ok";
  if (usedTokens >= hardThresholdTokens) level = "hard";
  else if (usedTokens >= compactThresholdTokens) level = "compact";
  else if (usedTokens >= warnThresholdTokens) level = "warn";

  return {
    level,
    usedTokens,
    windowTokens,
    compactThresholdTokens,
    hardThresholdTokens,
    warnThresholdTokens,
    pct,
  };
}

/** Estimate conversation tokens then resolve budget. */
export function budgetFromMessages(
  input: {
    modelId: string;
    messages: readonly { content?: string | null }[];
    systemText?: string | null;
    toolsText?: string | null;
    studioContext?: string | null;
    windowTokens?: number | null;
  },
  config: ChatContextBudgetConfig = {},
): {
  estimate: ChatContextUsageEstimate;
  budget: ChatContextBudgetSnapshot;
} {
  const estimate = estimateChatContextUsage({
    modelId: input.modelId,
    messages: input.messages,
    systemText: input.systemText,
    toolsText: input.toolsText,
    studioContext: input.studioContext,
    windowTokens: input.windowTokens,
  });
  const budget = resolveChatContextBudget(
    {
      usedTokens: estimate.usedTokens,
      windowTokens: estimate.windowTokens,
    },
    config,
  );
  return { estimate, budget };
}

export function estimateMessagesTokens(
  messages: readonly { content?: string | null }[],
): number {
  const text = messages
    .map((m) => (typeof m.content === "string" ? m.content : ""))
    .join("\n");
  return estimateTokensFromText(text);
}

export function windowTokensForModel(modelId: string): number {
  return resolveContextWindowTokens(modelId);
}
