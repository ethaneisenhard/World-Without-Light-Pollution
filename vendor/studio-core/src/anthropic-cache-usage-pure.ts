/**
 * Normalize Anthropic Messages `usage` for Cache Wars telemetry.
 * AGNT OrchestratorService.accumulateUsage shape.
 */

export type AnthropicUsageBlock = {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_creation?: {
    ephemeral_5m_input_tokens?: number;
    ephemeral_1h_input_tokens?: number;
  };
  /** Flattened by some adapters */
  cache_creation_5m_input_tokens?: number;
  cache_creation_1h_input_tokens?: number;
};

export type NormalizedAnthropicCacheUsage = {
  inputUncached: number;
  cacheRead: number;
  cacheCreation: number;
  cacheCreation5m: number;
  cacheCreation1h: number;
  outputTokens: number;
  /** True total input = uncached + read + creation */
  inputTotal: number;
};

export function normalizeAnthropicCacheUsage(
  usage: AnthropicUsageBlock | null | undefined,
): NormalizedAnthropicCacheUsage | null {
  if (!usage || typeof usage !== "object") return null;

  const cacheRead = Math.max(0, Number(usage.cache_read_input_tokens) || 0);
  const cacheCreation = Math.max(
    0,
    Number(usage.cache_creation_input_tokens) || 0,
  );
  let cacheCreation5m = Math.max(
    0,
    Number(usage.cache_creation_5m_input_tokens) ||
      Number(usage.cache_creation?.ephemeral_5m_input_tokens) ||
      0,
  );
  let cacheCreation1h = Math.max(
    0,
    Number(usage.cache_creation_1h_input_tokens) ||
      Number(usage.cache_creation?.ephemeral_1h_input_tokens) ||
      0,
  );
  if (cacheCreation5m + cacheCreation1h === 0 && cacheCreation > 0) {
    // Pre-beta / unspecified — attribute write total to 5m (AGNT back-compat).
    cacheCreation5m = cacheCreation;
  }

  const inputUncached = Math.max(0, Number(usage.input_tokens) || 0);
  const outputTokens = Math.max(0, Number(usage.output_tokens) || 0);
  const inputTotal = inputUncached + cacheRead + cacheCreation;

  return {
    inputUncached,
    cacheRead,
    cacheCreation,
    cacheCreation5m,
    cacheCreation1h,
    outputTokens,
    inputTotal,
  };
}

export type AccumulatedAnthropicCacheUsage = {
  inputUncached: number;
  cacheRead: number;
  cacheCreation: number;
  cacheCreation5m: number;
  cacheCreation1h: number;
  outputTokens: number;
  inputTotal: number;
  rounds: number;
};

export function createAnthropicCacheUsageAccumulator(): {
  accumulate: (usage: AnthropicUsageBlock | null | undefined) => void;
  snapshot: () => AccumulatedAnthropicCacheUsage;
} {
  const acc: AccumulatedAnthropicCacheUsage = {
    inputUncached: 0,
    cacheRead: 0,
    cacheCreation: 0,
    cacheCreation5m: 0,
    cacheCreation1h: 0,
    outputTokens: 0,
    inputTotal: 0,
    rounds: 0,
  };
  return {
    accumulate(usage) {
      const n = normalizeAnthropicCacheUsage(usage);
      if (!n) return;
      acc.inputUncached += n.inputUncached;
      acc.cacheRead += n.cacheRead;
      acc.cacheCreation += n.cacheCreation;
      acc.cacheCreation5m += n.cacheCreation5m;
      acc.cacheCreation1h += n.cacheCreation1h;
      acc.outputTokens += n.outputTokens;
      acc.inputTotal += n.inputTotal;
      acc.rounds += 1;
    },
    snapshot: () => ({ ...acc }),
  };
}

/** SSE / turn-inspect payload fields. */
export function anthropicCacheUsageStatusData(
  usage: NormalizedAnthropicCacheUsage | AccumulatedAnthropicCacheUsage,
): {
  cacheRead: number;
  cacheCreation5m: number;
  cacheCreation1h: number;
  inputUncached: number;
  inputTotal: number;
} {
  return {
    cacheRead: usage.cacheRead,
    cacheCreation5m: usage.cacheCreation5m,
    cacheCreation1h: usage.cacheCreation1h,
    inputUncached: usage.inputUncached,
    inputTotal: usage.inputTotal,
  };
}
