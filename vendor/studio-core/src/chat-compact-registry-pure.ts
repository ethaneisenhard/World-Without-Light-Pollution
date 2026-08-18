/**
 * Compact strategy registry — ordered cascade; add rows, not host ifs.
 */

import { emergencyTruncateStrategy } from "./chat-compact-emergency-truncate-pure.js";
import { llmSummarizeCompactStrategy } from "./chat-compact-llm-summarize-pure.js";
import { applySlidingWindowCompact } from "./chat-compact-sliding-window-pure.js";
import { slidingWindowCompactStrategy } from "./chat-compact-sliding-window-pure.js";
import { toolResultCollapseStrategy } from "./chat-compact-tool-collapse-pure.js";
import type {
  CompactMessage,
  CompactStrategy,
  CompactStrategyId,
  CompactStrategyResult,
} from "./chat-compact-types-pure.js";
import { assignMessageIds } from "./chat-compact-types-pure.js";

export const DEFAULT_COMPACT_STRATEGY_ORDER: readonly CompactStrategyId[] = [
  "tool_result_collapse",
  "sliding_window",
  "llm_summarize",
  "emergency_truncate",
] as const;

const BUILTIN: Record<CompactStrategyId, CompactStrategy> = {
  tool_result_collapse: toolResultCollapseStrategy,
  sliding_window: slidingWindowCompactStrategy,
  llm_summarize: llmSummarizeCompactStrategy,
  emergency_truncate: emergencyTruncateStrategy,
};

const extras = new Map<string, CompactStrategy>();

export function getCompactStrategy(
  id: CompactStrategyId | string,
): CompactStrategy | null {
  if (id in BUILTIN) return BUILTIN[id as CompactStrategyId];
  return extras.get(id) ?? null;
}

export function listCompactStrategyIds(): CompactStrategyId[] {
  return [...DEFAULT_COMPACT_STRATEGY_ORDER];
}

/** Test / plugin hook — register additional strategy by id. */
export function registerCompactStrategy(strategy: CompactStrategy): void {
  extras.set(strategy.id, strategy);
}

export function clearCompactStrategyExtras(): void {
  extras.clear();
}

export type RunCompactCascadeInput = {
  messages: readonly CompactMessage[];
  projectId: string;
  order?: readonly CompactStrategyId[];
  retainRecentMessages?: number;
  /** Per-strategy summary injection (llm_summarize). */
  summaryByStrategy?: Partial<Record<CompactStrategyId, string | null>>;
  /** Force sliding_window even under char thresholds (token budget path). */
  forceSlidingWindow?: boolean;
  /** Stop early when predicate returns true (e.g. under compact threshold). */
  shouldStop?: (messages: readonly CompactMessage[]) => boolean;
};

export type RunCompactCascadeResult = {
  messages: CompactMessage[];
  applied: CompactStrategyResult[];
  strategiesApplied: CompactStrategyId[];
};

export function runCompactCascade(
  input: RunCompactCascadeInput,
): RunCompactCascadeResult {
  let messages = assignMessageIds(input.messages);
  const order = input.order ?? DEFAULT_COMPACT_STRATEGY_ORDER;
  const applied: CompactStrategyResult[] = [];
  const strategiesApplied: CompactStrategyId[] = [];

  for (const id of order) {
    if (input.shouldStop?.(messages)) break;
    const strategy = getCompactStrategy(id);
    if (!strategy) continue;

    const result: CompactStrategyResult =
      id === "sliding_window"
        ? applySlidingWindowCompact({
            messages,
            projectId: input.projectId,
            retainRecentMessages: input.retainRecentMessages,
            force: input.forceSlidingWindow === true,
          })
        : strategy.apply({
            messages,
            projectId: input.projectId,
            retainRecentMessages: input.retainRecentMessages,
            summaryText: input.summaryByStrategy?.[id] ?? null,
          });

    if (result.applied) {
      messages = result.messages;
      applied.push(result);
      strategiesApplied.push(id);
    }
  }

  return { messages, applied, strategiesApplied };
}
