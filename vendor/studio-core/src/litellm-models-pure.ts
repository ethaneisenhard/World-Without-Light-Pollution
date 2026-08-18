/**
 * Parse OpenAI-compatible `GET /v1/models` for LiteLLM gateway dropdown.
 */

import type { ChatModelOption } from "./chat-model-pure.js";

export type OpenAiModelsListJson = {
  data?: unknown;
};

/**
 * Map LiteLLM / OpenAI models list → composer options.
 * Prefers `id`; label = id (gateway aliases are already human).
 */
export function parseOpenAiModelsList(json: unknown): ChatModelOption[] {
  if (!json || typeof json !== "object") return [];
  const data = (json as OpenAiModelsListJson).data;
  if (!Array.isArray(data)) return [];
  const out: ChatModelOption[] = [];
  const seen = new Set<string>();
  for (const row of data) {
    if (!row || typeof row !== "object") continue;
    const id = String((row as { id?: unknown }).id ?? "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label: id });
  }
  return out;
}

/** Merge live list over static seed — live wins; seed fills if live empty. */
export function mergeLitellmModelCatalog(input: {
  live: readonly ChatModelOption[] | null | undefined;
  seed: readonly ChatModelOption[];
}): ChatModelOption[] {
  if (input.live && input.live.length > 0) return [...input.live];
  return [...input.seed];
}
