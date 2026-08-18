/**
 * Context compress helpers — used by sliding_window strategy.
 * Prefer prepareChatTurnContext (ADR 0011) at the chat handler seam.
 */

export type ContextCompressDecision = {
  compress: boolean;
  reason: string;
  /** Keep last N messages verbatim. */
  keepLast: number;
};

export function shouldCompressContext(input: {
  messageCount: number;
  /** Rough char estimate of history. */
  historyChars: number;
  /** Threshold chars (default ~48k). */
  charThreshold?: number;
  /** Threshold messages (default 24). */
  messageThreshold?: number;
}): ContextCompressDecision {
  const charThreshold = input.charThreshold ?? 48_000;
  const messageThreshold = input.messageThreshold ?? 24;
  const keepLast = 8;
  if (input.historyChars >= charThreshold) {
    return { compress: true, reason: "history_chars", keepLast };
  }
  if (input.messageCount >= messageThreshold) {
    return { compress: true, reason: "message_count", keepLast };
  }
  return { compress: false, reason: "under_threshold", keepLast };
}

/** Build a deterministic summary stub for older messages (no LLM). */
export function formatContextCompressSummary(input: {
  olderMessages: readonly { role: string; content: string }[];
  projectId: string;
}): string {
  const n = input.olderMessages.length;
  const roles = input.olderMessages.reduce(
    (acc, m) => {
      acc[m.role] = (acc[m.role] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const roleBits = Object.entries(roles)
    .map(([r, c]) => `${c} ${r}`)
    .join(", ");
  const snippets = input.olderMessages
    .slice(0, 6)
    .map((m) => `- (${m.role}) ${m.content.trim().slice(0, 80)}`)
    .join("\n");
  return [
    `## Compressed prior context (${input.projectId})`,
    `Summarized ${n} earlier messages (${roleBits}). Details below are excerpts only.`,
    snippets,
  ].join("\n");
}

export function applyContextCompress<
  T extends { role: string; content: string },
>(input: {
  messages: readonly T[];
  keepLast: number;
  projectId: string;
}): {
  messages: Array<T | { role: "user"; content: string }>;
  compressed: boolean;
  summary: string | null;
  droppedCount: number;
} {
  const keep = Math.max(2, input.keepLast);
  if (input.messages.length <= keep) {
    return {
      messages: input.messages.map((m) => ({ ...m })),
      compressed: false,
      summary: null,
      droppedCount: 0,
    };
  }
  const older = input.messages.slice(0, -keep);
  const recent = input.messages.slice(-keep);
  const summary = formatContextCompressSummary({
    olderMessages: older,
    projectId: input.projectId,
  });
  return {
    messages: [{ role: "user" as const, content: summary }, ...recent.map((m) => ({ ...m }))],
    compressed: true,
    summary,
    droppedCount: older.length,
  };
}
