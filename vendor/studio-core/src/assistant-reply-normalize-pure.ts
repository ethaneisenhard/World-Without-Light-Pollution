/**
 * Harness-agnostic assistant reply normalize.
 *
 * Every Host turn’s final `message` (and client seal/replace) runs through
 * this — Cursor / Hermes / Grok / Kody / Studio all get the same pretty text.
 * Transport adapters stay dumb; they must not own per-harness “response style”.
 */

import { collapseDuplicatedAssistantText } from "./assistant-reply-collapse-pure.js";
import { prepareChatMarkdownSource } from "./chat-markdown-prepare-pure.js";

/**
 * Single pretty pipeline: collapse doubles → markdown structure heals.
 */
export function normalizeAssistantReply(content: string): string {
  const raw = typeof content === "string" ? content : "";
  if (!raw.trim()) return raw;
  const collapsed = collapseDuplicatedAssistantText(raw);
  return prepareChatMarkdownSource(collapsed).replace(/\s+$/u, "");
}

/**
 * Wrap harness SSE `message` payloads — leave other events untouched.
 */
export function normalizeHarnessSendPayload(
  event: string,
  data: unknown,
): unknown {
  if (event !== "message") return data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  const row = data as Record<string, unknown>;
  if (typeof row.content !== "string") return data;
  const next = normalizeAssistantReply(row.content);
  if (next === row.content) return data;
  return { ...row, content: next };
}

export type HarnessSendFn = (event: string, data: unknown) => void;

/** Turn-orchestrator seam: one send wrapper for all harnesses. */
export function wrapHarnessSendNormalize(send: HarnessSendFn): HarnessSendFn {
  return (event, data) => {
    send(event, normalizeHarnessSendPayload(event, data));
  };
}
