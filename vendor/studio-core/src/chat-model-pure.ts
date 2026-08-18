/**
 * Chat model catalog — harness-aware defaults + resolve.
 * Cursor list is live (CLI); Studio/Kody lists are static allowlists.
 * Hermes merges Host config + Cursor/Composer options.
 */

import { DEFAULT_CHAT_MODEL } from "./chat-pure.js";
import { DEFAULT_HERMES_CHAT_MODEL } from "./hermes-config-pure.js";

export type ChatModelOption = {
  id: string;
  label: string;
};

/** Static Anthropic allowlist for harness:anthropic (legacy studio aliases here). */
export const STUDIO_CHAT_MODELS: readonly ChatModelOption[] = [
  { id: "claude-haiku-4-5", label: "Haiku 4.5" },
  { id: "claude-sonnet-4-5", label: "Sonnet 4.5" },
  { id: "claude-opus-4-5", label: "Opus 4.5" },
] as const;

/**
 * Kody harness model picker.
 * Claude / `auto` → package `/api/chat` (Anthropic in our dogfood package).
 * `cursor::…` → UI switches harness to Cursor (CLI owns Composer / Grok).
 * Stock Kody has no built-in chat — packages own the brain; Cursor is not inside Kody.
 */
export const KODY_CHAT_MODELS: readonly ChatModelOption[] = [
  { id: "claude-haiku-4-5", label: "Haiku 4.5" },
  ...STUDIO_CHAT_MODELS.filter((m) => m.id !== "claude-haiku-4-5"),
  { id: "auto", label: "Kody default (Claude)" },
  { id: "cursor::composer-2.5", label: "Cursor · Composer 2.5" },
  {
    id: "cursor::cursor-grok-4.5-high-fast",
    label: "Cursor · Grok 4.5 Fast",
  },
  { id: "cursor::auto", label: "Cursor · Auto" },
] as const;

/** Cursor Agent CLI id — Grok 4.5 Fast (Host list: `agent models`). */
export const DEFAULT_CURSOR_CHAT_MODEL = "cursor-grok-4.5-high-fast";
export const DEFAULT_KODY_CHAT_MODEL = "claude-haiku-4-5";

/** Prefix for Kody-picker rows that hand off to harness:cursor (glass-box, not silent). */
export const KODY_CURSOR_BRIDGE_PREFIX = "cursor::";

/**
 * Resolve a Kody model-picker choice.
 * `cursor::composer-2.5` → { harness: "cursor", model: "composer-2.5" }.
 */
export function applyKodyModelPickerChoice(selectedModelId: string): {
  harness: "kody" | "cursor";
  model: string;
} {
  const id = selectedModelId.trim();
  if (id.startsWith(KODY_CURSOR_BRIDGE_PREFIX)) {
    const model = id.slice(KODY_CURSOR_BRIDGE_PREFIX.length).trim();
    return {
      harness: "cursor",
      model: model || DEFAULT_CURSOR_CHAT_MODEL,
    };
  }
  return { harness: "kody", model: id || DEFAULT_KODY_CHAT_MODEL };
}

/**
 * Grok Build CLI models (`grok -m`). Ids match xAI console / `grok models`.
 * See https://docs.x.ai/build/overview
 */
export const GROK_CHAT_MODELS: readonly ChatModelOption[] = [
  { id: "grok-4.5", label: "Grok 4.5" },
  { id: "grok-4.3", label: "Grok 4.3" },
  { id: "grok-code-fast-1", label: "Grok Code Fast" },
] as const;

export const DEFAULT_GROK_CHAT_MODEL = "grok-4.5";

/**
 * DeepSeek Chat Completions harness models (`https://api.deepseek.com`).
 * Catalog: https://api-docs.deepseek.com/quick_start/pricing
 */
export const DEEPSEEK_CHAT_MODELS: readonly ChatModelOption[] = [
  { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash" },
  { id: "deepseek-v4-pro", label: "DeepSeek V4 Pro" },
] as const;

export const DEFAULT_DEEPSEEK_CHAT_MODEL = "deepseek-v4-flash";

/**
 * LiteLLM gateway seed catalog — keep aligned with `infra/litellm/litellm.yaml`.
 * Live `GET /v1/models` (issue 07) supersedes when the gateway is reachable.
 */
export const LITELLM_CHAT_MODELS: readonly ChatModelOption[] = [
  { id: "claude-sonnet", label: "Claude Sonnet (via LiteLLM)" },
  { id: "gpt-4o-mini", label: "GPT-4o mini (via LiteLLM)" },
  { id: "deepseek-chat", label: "DeepSeek Chat (via LiteLLM)" },
  { id: "groq-llama", label: "Groq Llama (via LiteLLM)" },
  { id: "auto", label: "Auto (LiteLLM router)" },
] as const;

export const DEFAULT_LITELLM_CHAT_MODEL = "claude-sonnet";

/** Harnesses that expose a composer Model picker. */
export function chatModelPickerShows(harnessId: string): boolean {
  const id = harnessId.trim();
  return (
    id === "studio" ||
    id === "anthropic" ||
    id === "deepseek" ||
    id === "litellm" ||
    id === "cursor" ||
    id === "hermes" ||
    id === "kody" ||
    id === "grok"
  );
}

export function defaultChatModelForHarness(harnessId: string): string {
  switch (harnessId.trim()) {
    case "cursor":
      return DEFAULT_CURSOR_CHAT_MODEL;
    case "hermes":
      return DEFAULT_HERMES_CHAT_MODEL;
    case "kody":
      return DEFAULT_KODY_CHAT_MODEL;
    case "grok":
      return DEFAULT_GROK_CHAT_MODEL;
    case "deepseek":
      return DEFAULT_DEEPSEEK_CHAT_MODEL;
    case "litellm":
      return DEFAULT_LITELLM_CHAT_MODEL;
    case "studio":
    case "anthropic":
      return DEFAULT_CHAT_MODEL;
    default:
      return DEFAULT_CHAT_MODEL;
  }
}

/**
 * Configured Studio default model, or harness fallback when unset.
 */
export function resolveConfiguredDefaultChatModel(input: {
  defaultHarness: string;
  defaultChatModel?: string | null;
}): string {
  const requested =
    typeof input.defaultChatModel === "string"
      ? input.defaultChatModel.trim()
      : "";
  if (requested) return requested;
  return defaultChatModelForHarness(input.defaultHarness);
}

export function studioChatModelIds(): string[] {
  return STUDIO_CHAT_MODELS.map((m) => m.id);
}

export function kodyChatModelIds(): string[] {
  return KODY_CHAT_MODELS.map((m) => m.id);
}

export function grokChatModelIds(): string[] {
  return GROK_CHAT_MODELS.map((m) => m.id);
}

export function deepseekChatModelIds(): string[] {
  return DEEPSEEK_CHAT_MODELS.map((m) => m.id);
}

export function litellmChatModelIds(): string[] {
  return LITELLM_CHAT_MODELS.map((m) => m.id);
}

/**
 * Parse `agent --list-models` / `agent models` stdout.
 * Lines look like: `cursor-grok-4.5-high-fast - Cursor Grok 4.5 Fast`
 */
export function parseCursorModelsList(stdout: string): ChatModelOption[] {
  const out: ChatModelOption[] = [];
  const seen = new Set<string>();
  for (const raw of stdout.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || /^available models$/i.test(line)) continue;
    const m = /^(\S+)\s+-\s+(.+)$/.exec(line);
    if (!m) continue;
    const id = m[1]!.trim();
    const label = m[2]!.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label });
  }
  return out;
}

export function resolveChatModel(input: {
  harness: string;
  requested?: string | null;
  available?: readonly string[] | null;
}): string {
  const fallback = defaultChatModelForHarness(input.harness);
  const requested = input.requested?.trim() || "";
  if (!requested) return fallback;
  const available = input.available;
  if (available == null || available.length === 0) {
    // No allowlist yet (e.g. Cursor list still loading) — keep requested.
    return requested;
  }
  if (available.includes(requested)) return requested;
  return fallback;
}

/** Short face for the composer pill. */
export function chatModelFaceLabel(id: string): string {
  const trimmed = id.trim();
  if (!trimmed) return "Model";
  const studio = STUDIO_CHAT_MODELS.find((m) => m.id === trimmed);
  if (studio) return studio.label;
  const deepseek = DEEPSEEK_CHAT_MODELS.find((m) => m.id === trimmed);
  if (deepseek) return deepseek.label;
  const litellm = LITELLM_CHAT_MODELS.find((m) => m.id === trimmed);
  if (litellm) return litellm.label;
  const grok = GROK_CHAT_MODELS.find((m) => m.id === trimmed);
  if (grok) return grok.label;
  if (trimmed === "cursor-grok-4.5-high-fast") return "Grok 4.5 Fast";
  if (trimmed === "cursor-grok-4.5-high") return "Grok 4.5";
  if (trimmed === "composer-2.5") return "Composer 2.5";
  if (trimmed === "composer-2.5-fast") return "Composer 2.5 Fast";
  if (trimmed === "auto") return "Auto";
  if (trimmed.startsWith("cursor::")) {
    const m = trimmed.slice("cursor::".length);
    return m.length > 18 ? `Cursor ${m.slice(0, 16)}…` : `Cursor ${m}`;
  }
  if (trimmed.includes("::")) {
    const [, model = trimmed] = trimmed.split("::");
    return model.length > 22 ? `${model.slice(0, 20)}…` : model;
  }
  // Last path segment after last slash/dash cluster — keep readable.
  const short = trimmed.replace(/^cursor-/, "").replace(/^claude-/, "");
  return short.length > 22 ? `${short.slice(0, 20)}…` : short;
}

export function chatModelOptionLabel(
  id: string,
  known?: readonly ChatModelOption[] | null,
): string {
  const hit = known?.find((m) => m.id === id);
  if (hit) return hit.label;
  const studio = STUDIO_CHAT_MODELS.find((m) => m.id === id);
  if (studio) return studio.label;
  const deepseek = DEEPSEEK_CHAT_MODELS.find((m) => m.id === id);
  if (deepseek) return deepseek.label;
  const litellm = LITELLM_CHAT_MODELS.find((m) => m.id === id);
  if (litellm) return litellm.label;
  return id;
}
