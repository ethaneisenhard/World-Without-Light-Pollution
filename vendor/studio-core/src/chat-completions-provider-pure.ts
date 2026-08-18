/**
 * Chat Completions provider registry — DeepSeek direct + LiteLLM gateway.
 * Host injects env; pure resolves URL + default model allowlist.
 */

import {
  BUILTIN_HARNESS_IDS,
  normalizeHarnessIdAlias,
} from "./harness-policy-pure.js";
import {
  DEFAULT_DEEPSEEK_CHAT_MODEL,
  DEFAULT_LITELLM_CHAT_MODEL,
  deepseekChatModelIds,
  litellmChatModelIds,
} from "./chat-model-pure.js";

export const DEFAULT_DEEPSEEK_CHAT_COMPLETIONS_URL =
  "https://api.deepseek.com/chat/completions";

export const DEFAULT_LITELLM_BASE_URL = "http://127.0.0.1:4000/v1";

export type ChatCompletionsProviderRow = {
  harnessId: string;
  /** Fixed chat completions URL when no base URL override. */
  defaultChatUrl: string;
  /** Env name for OpenAI-style base (`…/v1`); null = use defaultChatUrl only. */
  baseUrlEnv: string | null;
  apiKeyEnv: string;
  defaultModel: string;
  modelIds: () => string[];
};

export const CHAT_COMPLETIONS_PROVIDER_REGISTRY: Readonly<
  Record<string, ChatCompletionsProviderRow>
> = {
  [BUILTIN_HARNESS_IDS.deepseek]: {
    harnessId: BUILTIN_HARNESS_IDS.deepseek,
    defaultChatUrl: DEFAULT_DEEPSEEK_CHAT_COMPLETIONS_URL,
    baseUrlEnv: null,
    apiKeyEnv: "DEEPSEEK_API_KEY",
    defaultModel: DEFAULT_DEEPSEEK_CHAT_MODEL,
    modelIds: deepseekChatModelIds,
  },
  [BUILTIN_HARNESS_IDS.litellm]: {
    harnessId: BUILTIN_HARNESS_IDS.litellm,
    defaultChatUrl: `${DEFAULT_LITELLM_BASE_URL}/chat/completions`,
    baseUrlEnv: "LITELLM_BASE_URL",
    apiKeyEnv: "LITELLM_API_KEY",
    defaultModel: DEFAULT_LITELLM_CHAT_MODEL,
    modelIds: litellmChatModelIds,
  },
};

export function getChatCompletionsProvider(
  harnessId: string,
): ChatCompletionsProviderRow | null {
  const id = normalizeHarnessIdAlias(harnessId.trim());
  return CHAT_COMPLETIONS_PROVIDER_REGISTRY[id] ?? null;
}

/**
 * Build `…/chat/completions` from an OpenAI-style base URL (`…/v1` or full path).
 */
export function chatCompletionsUrlFromBase(baseUrl: string): string {
  const t = baseUrl.trim().replace(/\/+$/, "");
  if (!t) return DEFAULT_LITELLM_BASE_URL + "/chat/completions";
  if (t.endsWith("/chat/completions")) return t;
  return `${t}/chat/completions`;
}

export function resolveChatCompletionsUrl(input: {
  harnessId: string;
  /** Injected base (e.g. from LITELLM_BASE_URL); ignored when provider has no baseUrlEnv. */
  baseUrl?: string | null;
}): string | null {
  const row = getChatCompletionsProvider(input.harnessId);
  if (!row) return null;
  if (row.baseUrlEnv) {
    const base = (input.baseUrl ?? "").trim();
    if (base) return chatCompletionsUrlFromBase(base);
  }
  return row.defaultChatUrl;
}

export function resolveChatCompletionsModel(input: {
  harnessId: string;
  requested?: string | null;
}): string | null {
  const row = getChatCompletionsProvider(input.harnessId);
  if (!row) return null;
  const allow = new Set(row.modelIds());
  const pick = (input.requested ?? "").trim();
  if (pick && allow.has(pick)) return pick;
  // LiteLLM may expose more models than the static seed — keep requested.
  if (pick && row.harnessId === BUILTIN_HARNESS_IDS.litellm) return pick;
  return row.defaultModel;
}

export function chatCompletionsSystemIdentity(input: {
  harnessId: string;
  model: string;
}): string {
  const id = normalizeHarnessIdAlias(input.harnessId.trim());
  switch (id) {
    case BUILTIN_HARNESS_IDS.litellm:
      return [
        "You are an AI assistant reached via the Glass Box Studio LiteLLM gateway harness.",
        `Harness id: litellm. Model id: ${input.model}.`,
        "Never claim to be Claude, Anthropic, GPT, Cursor, or another provider unless that is this model id.",
        "When the user asks you to change Studio chrome (theme, brand, pet, nav, files), use tools — do not claim Done without a successful tool result.",
      ].join(" ");
    case BUILTIN_HARNESS_IDS.deepseek:
      return [
        "You are DeepSeek, an AI assistant reached via the Glass Box Studio DeepSeek API harness.",
        `Harness id: deepseek. Model id: ${input.model}.`,
        "Never claim to be Claude, Anthropic, GPT, Cursor, or another provider.",
        "When the user asks you to change Studio chrome (theme, brand, pet, nav, files), use tools — do not claim Done without a successful tool result.",
      ].join(" ");
    default:
      return [
        `You are an AI assistant via Glass Box Studio harness ${id}.`,
        `Model id: ${input.model}.`,
        "When changing Studio chrome, use tools — do not claim Done without a successful tool result.",
      ].join(" ");
  }
}
