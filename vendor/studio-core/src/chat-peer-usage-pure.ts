/**
 * Optional peer token/usage SSE — glass-box paint for any harness.
 * Pure: no store / billing invent.
 */

export type PeerUsageEvent = {
  harness?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export function parsePeerUsageEvent(
  data: Record<string, unknown>,
): PeerUsageEvent | null {
  const inputTokens =
    typeof data.inputTokens === "number"
      ? data.inputTokens
      : typeof data.input_tokens === "number"
        ? data.input_tokens
        : undefined;
  const outputTokens =
    typeof data.outputTokens === "number"
      ? data.outputTokens
      : typeof data.output_tokens === "number"
        ? data.output_tokens
        : undefined;
  const totalTokens =
    typeof data.totalTokens === "number"
      ? data.totalTokens
      : typeof data.total_tokens === "number"
        ? data.total_tokens
        : undefined;
  if (
    inputTokens === undefined &&
    outputTokens === undefined &&
    totalTokens === undefined
  ) {
    return null;
  }
  return {
    ...(typeof data.harness === "string" && data.harness.trim()
      ? { harness: data.harness.trim() }
      : {}),
    ...(inputTokens !== undefined ? { inputTokens } : {}),
    ...(outputTokens !== undefined ? { outputTokens } : {}),
    ...(totalTokens !== undefined ? { totalTokens } : {}),
  };
}

/** Short meta label — empty when peer sent no usage. */
export function formatPeerUsageLabel(usage: PeerUsageEvent | null | undefined): string {
  if (!usage) return "";
  const total =
    usage.totalTokens ??
    (usage.inputTokens !== undefined || usage.outputTokens !== undefined
      ? (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0)
      : undefined);
  if (total === undefined) return "";
  const parts = [`${total} tok`];
  if (usage.inputTokens !== undefined && usage.outputTokens !== undefined) {
    parts.push(`(${usage.inputTokens}→${usage.outputTokens})`);
  }
  if (usage.harness) parts.push(usage.harness);
  return parts.join(" ");
}
