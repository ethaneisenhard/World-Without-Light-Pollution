/**
 * Shared types for chat compact strategies + markers.
 */

export type CompactMessage = {
  role: string;
  content: string;
  id?: string;
  /** When set, this message is a compaction marker summarizing covered ids. */
  compaction?: {
    coveredMessageIds: readonly string[];
    reason?: string;
    strategyId?: string;
  };
};

export type CompactStrategyId =
  | "tool_result_collapse"
  | "sliding_window"
  | "llm_summarize"
  | "emergency_truncate";

export type CompactStrategyResult = {
  messages: CompactMessage[];
  applied: boolean;
  strategyId: CompactStrategyId;
  coveredMessageIds: readonly string[];
  summary: string | null;
  droppedCount: number;
};

export type CompactStrategyInput = {
  messages: readonly CompactMessage[];
  projectId: string;
  retainRecentMessages?: number;
  /** Injected LLM/deterministic summary for llm_summarize. */
  summaryText?: string | null;
};

export type CompactStrategy = {
  id: CompactStrategyId;
  /** Pure apply — may no-op (applied: false). */
  apply: (input: CompactStrategyInput) => CompactStrategyResult;
};

export function messageIdAt(message: CompactMessage, index: number): string {
  const id = typeof message.id === "string" ? message.id.trim() : "";
  if (id) return id;
  return `msg_${index}`;
}

export function assignMessageIds(
  messages: readonly CompactMessage[],
): CompactMessage[] {
  return messages.map((m, i) => ({
    ...m,
    id: messageIdAt(m, i),
  }));
}

export function isCompactionMarker(message: CompactMessage): boolean {
  return Boolean(message.compaction?.coveredMessageIds?.length) ||
    (typeof message.content === "string" &&
      message.content.includes("## Compressed prior context"));
}
