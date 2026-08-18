/**
 * Prompt-cache policy — global good practice for every model path.
 *
 * Layer 1 (turn prepare): freeze + stable/dynamic split — provider-agnostic
 *   → turn-prepare-context-pure / conversation-freeze-pure
 *
 * Layer 2 (this module): ProviderCacheAdapter registry — how each API
 *   records/reuses a stable prefix. New provider = new adapter row, not a
 *   forked feature. Peer CLIs use "peer" (no Studio markers).
 *
 * No one-offs: Studio AI loop always calls applyPromptCache(providerId, …).
 */

import {
  ANTHROPIC_PROMPT_CACHE_BETA,
  anthropicMessageCacheBudget,
  applyRollingAnthropicCacheBreakpoints,
  buildAnthropicCachedSystem,
  markLastAnthropicToolCache,
  type AnthropicCacheMessage,
  type AnthropicCacheTool,
} from "./anthropic-prompt-cache-pure.js";
import {
  normalizeAnthropicCacheUsage,
  type NormalizedAnthropicCacheUsage,
} from "./anthropic-cache-usage-pure.js";

/** Provider families Studio may call or spawn. */
export type PromptCacheProviderId =
  | "anthropic"
  | "openai"
  /** Chat Completions wire (DeepSeek, OpenRouter, …) — automatic prefix cache. */
  | "chat-completions"
  | "peer"
  | "noop";

export type PromptCacheStrategy =
  /** Anthropic-style explicit cache_control breakpoints */
  | "explicit-markers"
  /** Chat Completions automatic prefix cache — stable bytes only */
  | "automatic-prefix"
  /** No provider cache API — prepare still applies */
  | "none";

export type PromptCacheRequest = {
  system?: string;
  messages: readonly {
    role: string;
    content?: unknown;
    [key: string]: unknown;
  }[];
  tools?: readonly {
    name: string;
    description?: string;
    input_schema?: Record<string, unknown>;
    [key: string]: unknown;
  }[];
};

export type PromptCacheApplied = {
  /** Provider-specific system (string or content blocks). */
  system?: unknown;
  messages: unknown[];
  tools?: unknown[];
  /** Extra headers to merge into the provider HTTP call. */
  headers: Record<string, string>;
  strategy: PromptCacheStrategy;
  providerId: PromptCacheProviderId;
};

/** Cross-provider usage shape (Anthropic fills 5m/1h; OpenAI fills cacheRead). */
export type NormalizedPromptCacheUsage = NormalizedAnthropicCacheUsage;

export type ProviderCacheAdapter = {
  id: PromptCacheProviderId;
  strategy: PromptCacheStrategy;
  apply: (req: PromptCacheRequest) => PromptCacheApplied;
  normalizeUsage: (raw: unknown) => NormalizedPromptCacheUsage | null;
};

function passthroughApply(
  id: PromptCacheProviderId,
  strategy: PromptCacheStrategy,
  req: PromptCacheRequest,
): PromptCacheApplied {
  return {
    system: req.system,
    messages: req.messages.map((m) => ({ ...m })),
    tools: req.tools ? req.tools.map((t) => ({ ...t })) : undefined,
    headers: {},
    strategy,
    providerId: id,
  };
}

const anthropicAdapter: ProviderCacheAdapter = {
  id: "anthropic",
  strategy: "explicit-markers",
  apply(req) {
    const system = buildAnthropicCachedSystem(req.system);
    const toolsUsed = (req.tools?.length ?? 0) > 0;
    const tools = toolsUsed
      ? markLastAnthropicToolCache(req.tools as AnthropicCacheTool[])
      : undefined;
    const budget = anthropicMessageCacheBudget({
      systemUsed: Boolean(system),
      toolsUsed,
    });
    const messages = applyRollingAnthropicCacheBreakpoints(
      req.messages as AnthropicCacheMessage[],
      budget,
    );
    return {
      system,
      messages,
      tools,
      headers: {
        "anthropic-beta": ANTHROPIC_PROMPT_CACHE_BETA,
      },
      strategy: "explicit-markers",
      providerId: "anthropic",
    };
  },
  normalizeUsage(raw) {
    return normalizeAnthropicCacheUsage(
      raw as Parameters<typeof normalizeAnthropicCacheUsage>[0],
    );
  },
};

const openaiAdapter: ProviderCacheAdapter = {
  id: "openai",
  strategy: "automatic-prefix",
  apply(req) {
    // OpenAI caches stable prefixes automatically — no markers.
    // Turn prepare (freeze / dynamic-off-system) is the whole lever.
    return passthroughApply("openai", "automatic-prefix", req);
  },
  normalizeUsage(raw) {
    if (!raw || typeof raw !== "object") return null;
    const u = raw as {
      prompt_tokens?: number;
      completion_tokens?: number;
      prompt_tokens_details?: { cached_tokens?: number };
    };
    const prompt = Math.max(0, Number(u.prompt_tokens) || 0);
    const cacheRead = Math.max(
      0,
      Number(u.prompt_tokens_details?.cached_tokens) || 0,
    );
    const outputTokens = Math.max(0, Number(u.completion_tokens) || 0);
    return {
      inputUncached: Math.max(0, prompt - cacheRead),
      cacheRead,
      cacheCreation: 0,
      cacheCreation5m: 0,
      cacheCreation1h: 0,
      outputTokens,
      inputTotal: prompt,
    };
  },
};

const chatCompletionsAdapter: ProviderCacheAdapter = {
  ...openaiAdapter,
  id: "chat-completions",
  apply(req) {
    return passthroughApply("chat-completions", "automatic-prefix", req);
  },
};

const peerAdapter: ProviderCacheAdapter = {
  id: "peer",
  strategy: "none",
  apply(req) {
    // Cursor / Hermes / Grok own their loop — Studio does not mark requests.
    return passthroughApply("peer", "none", req);
  },
  normalizeUsage: () => null,
};

const noopAdapter: ProviderCacheAdapter = {
  id: "noop",
  strategy: "none",
  apply(req) {
    return passthroughApply("noop", "none", req);
  },
  normalizeUsage: () => null,
};

/** Registry — extend here; do not fork apply sites. */
export const PROVIDER_CACHE_ADAPTERS: Readonly<
  Record<PromptCacheProviderId, ProviderCacheAdapter>
> = {
  anthropic: anthropicAdapter,
  openai: openaiAdapter,
  "chat-completions": chatCompletionsAdapter,
  peer: peerAdapter,
  noop: noopAdapter,
};

const PROVIDER_ALIASES: Record<string, PromptCacheProviderId> = {
  anthropic: "anthropic",
  studio: "anthropic", // legacy harness id → Claude Messages
  claude: "anthropic",
  openai: "openai",
  "chat-completions": "chat-completions",
  /** @deprecated alias — use chat-completions */
  "openai-compatible": "chat-completions",
  openrouter: "chat-completions",
  deepseek: "chat-completions",
  peer: "peer",
  cursor: "peer",
  hermes: "peer",
  grok: "peer",
  kody: "peer",
  "agent-room": "peer",
  noop: "noop",
};

export function resolvePromptCacheProviderId(
  providerOrHarnessId: string | null | undefined,
): PromptCacheProviderId {
  const raw = (providerOrHarnessId ?? "").trim().toLowerCase();
  if (!raw) return "noop";
  return PROVIDER_ALIASES[raw] ?? "noop";
}

export function resolveProviderCacheAdapter(
  providerOrHarnessId: string | null | undefined,
): ProviderCacheAdapter {
  const id = resolvePromptCacheProviderId(providerOrHarnessId);
  return PROVIDER_CACHE_ADAPTERS[id];
}

/** Studio AI loop / any caller — single entry. */
export function applyPromptCache(
  providerOrHarnessId: string | null | undefined,
  req: PromptCacheRequest,
): PromptCacheApplied {
  return resolveProviderCacheAdapter(providerOrHarnessId).apply(req);
}

export function normalizePromptCacheUsage(
  providerOrHarnessId: string | null | undefined,
  raw: unknown,
): NormalizedPromptCacheUsage | null {
  return resolveProviderCacheAdapter(providerOrHarnessId).normalizeUsage(raw);
}
