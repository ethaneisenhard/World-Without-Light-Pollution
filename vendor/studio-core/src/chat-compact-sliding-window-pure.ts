/**
 * Sliding-window compact strategy — keep last N + deterministic summary marker.
 * Evolves Wave-4 applyContextCompress into a registry row.
 */

import {
  applyContextCompress,
  shouldCompressContext,
} from "./context-compress-pure.js";
import type {
  CompactMessage,
  CompactStrategy,
  CompactStrategyInput,
  CompactStrategyResult,
} from "./chat-compact-types-pure.js";
import { assignMessageIds, messageIdAt } from "./chat-compact-types-pure.js";

export const SLIDING_WINDOW_DEFAULT_RETAIN = 8;

export function applySlidingWindowCompact(
  input: CompactStrategyInput & {
    charThreshold?: number;
    messageThreshold?: number;
    /** Force apply even under char/message thresholds (budget path). */
    force?: boolean;
  },
): CompactStrategyResult {
  const retain =
    input.retainRecentMessages ?? SLIDING_WINDOW_DEFAULT_RETAIN;
  const numbered = assignMessageIds(input.messages);
  const historyChars = numbered.reduce(
    (n, m) => n + (m.content?.length ?? 0),
    0,
  );
  const decision = shouldCompressContext({
    messageCount: numbered.length,
    historyChars,
    charThreshold: input.charThreshold,
    messageThreshold: input.messageThreshold,
  });
  if (!input.force && !decision.compress) {
    return {
      messages: numbered,
      applied: false,
      strategyId: "sliding_window",
      coveredMessageIds: [],
      summary: null,
      droppedCount: 0,
    };
  }
  if (numbered.length <= Math.max(2, retain)) {
    return {
      messages: numbered,
      applied: false,
      strategyId: "sliding_window",
      coveredMessageIds: [],
      summary: null,
      droppedCount: 0,
    };
  }

  const keepLast = input.force ? retain : decision.keepLast;
  const applied = applyContextCompress({
    messages: numbered,
    keepLast,
    projectId: input.projectId,
  });
  if (!applied.compressed || !applied.summary) {
    return {
      messages: numbered,
      applied: false,
      strategyId: "sliding_window",
      coveredMessageIds: [],
      summary: null,
      droppedCount: 0,
    };
  }

  const older = numbered.slice(0, -Math.max(2, keepLast));
  const coveredMessageIds = older.map((m, i) => messageIdAt(m, i));
  const marker: CompactMessage = {
    id: `compact_sliding_${Date.now().toString(36)}`,
    role: "user",
    content: applied.summary,
    compaction: {
      coveredMessageIds,
      reason: decision.reason,
      strategyId: "sliding_window",
    },
  };
  const recent = numbered.slice(-Math.max(2, keepLast));
  return {
    messages: [marker, ...recent],
    applied: true,
    strategyId: "sliding_window",
    coveredMessageIds,
    summary: applied.summary,
    droppedCount: applied.droppedCount,
  };
}

export const slidingWindowCompactStrategy: CompactStrategy = {
  id: "sliding_window",
  apply: (input) => applySlidingWindowCompact(input),
};
