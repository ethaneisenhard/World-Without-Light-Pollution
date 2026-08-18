/**
 * Chat Completions function-calling wire helpers (DeepSeek and any peer on this shape).
 * Catalog defs use `input_schema`; this wire uses `function.parameters` + `tool_calls`.
 * Vendor-neutral — not an OpenAI product coupling.
 */

export type HarnessToolSchemaDef = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

export type ChatCompletionsToolDef = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ChatCompletionsToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  /** Raw arguments string when JSON parse failed. */
  argumentsRaw?: string;
};

export type ChatCompletionsAssistantMessage = {
  content: string;
  reasoningContent: string;
  toolCalls: ChatCompletionsToolCall[];
};

/** Catalog / Messages-API shaped defs → Chat Completions `tools[]`. */
export function chatCompletionsToolsFromSchemaDefs(
  defs: readonly HarnessToolSchemaDef[],
): ChatCompletionsToolDef[] {
  return defs.map((d) => ({
    type: "function" as const,
    function: {
      name: d.name,
      description: d.description,
      parameters: d.input_schema ?? { type: "object", properties: {} },
    },
  }));
}

function parseToolArguments(
  raw: unknown,
): { ok: true; value: Record<string, unknown> } | { ok: false; raw: string } {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return { ok: true, value: raw as Record<string, unknown> };
  }
  const s = typeof raw === "string" ? raw : "";
  if (!s.trim()) return { ok: true, value: {} };
  try {
    const parsed = JSON.parse(s) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { ok: true, value: parsed as Record<string, unknown> };
    }
    return { ok: false, raw: s };
  } catch {
    return { ok: false, raw: s };
  }
}

/**
 * Parse Chat Completions `choices[0].message` for text + tool_calls.
 */
export function parseChatCompletionsAssistantMessage(
  message: unknown,
): ChatCompletionsAssistantMessage {
  const msg =
    message && typeof message === "object"
      ? (message as Record<string, unknown>)
      : {};
  const content = typeof msg.content === "string" ? msg.content : "";
  const reasoningContent =
    typeof msg.reasoning_content === "string" ? msg.reasoning_content : "";
  const rawCalls = Array.isArray(msg.tool_calls) ? msg.tool_calls : [];
  const toolCalls: ChatCompletionsToolCall[] = [];
  for (let i = 0; i < rawCalls.length; i++) {
    const row = rawCalls[i];
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const fn =
      r.function && typeof r.function === "object"
        ? (r.function as Record<string, unknown>)
        : {};
    const name = typeof fn.name === "string" ? fn.name : "";
    if (!name) continue;
    const id =
      typeof r.id === "string" && r.id.trim()
        ? r.id
        : `call_${i + 1}_${name}`;
    const argsParsed = parseToolArguments(fn.arguments);
    toolCalls.push({
      id,
      name,
      arguments: argsParsed.ok ? argsParsed.value : {},
      ...(argsParsed.ok ? {} : { argumentsRaw: argsParsed.raw }),
    });
  }
  return { content, reasoningContent, toolCalls };
}
