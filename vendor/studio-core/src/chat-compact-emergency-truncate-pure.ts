/**
 * Last-resort truncate — keep system-ish summary stub + last N messages.
 */

import {
  formatContextCompressSummary,
} from "./context-compress-pure.js";
import type {
  CompactMessage,
  CompactStrategy,
  CompactStrategyInput,
  CompactStrategyResult,
} from "./chat-compact-types-pure.js";
import { assignMessageIds, messageIdAt } from "./chat-compact-types-pure.js";

export const EMERGENCY_RETAIN = 4;

export function applyEmergencyTruncate(
  input: CompactStrategyInput,
): CompactStrategyResult {
  const retain = Math.max(
    2,
    input.retainRecentMessages ?? EMERGENCY_RETAIN,
  );
  const numbered = assignMessageIds(input.messages);
  if (numbered.length <= retain) {
    return {
      messages: numbered,
      applied: false,
      strategyId: "emergency_truncate",
      coveredMessageIds: [],
      summary: null,
      droppedCount: 0,
    };
  }
  const older = numbered.slice(0, -retain);
  const recent = numbered.slice(-retain);
  const coveredMessageIds = older.map((m, i) => messageIdAt(m, i));
  const summary = formatContextCompressSummary({
    olderMessages: older,
    projectId: input.projectId,
  });
  const marker: CompactMessage = {
    id: `compact_emergency_${Date.now().toString(36)}`,
    role: "user",
    content: `${summary}\n\n(Emergency truncate — older turns dropped.)`,
    compaction: {
      coveredMessageIds,
      reason: "emergency_truncate",
      strategyId: "emergency_truncate",
    },
  };
  return {
    messages: [marker, ...recent],
    applied: true,
    strategyId: "emergency_truncate",
    coveredMessageIds,
    summary: marker.content,
    droppedCount: older.length,
  };
}

export const emergencyTruncateStrategy: CompactStrategy = {
  id: "emergency_truncate",
  apply: applyEmergencyTruncate,
};
