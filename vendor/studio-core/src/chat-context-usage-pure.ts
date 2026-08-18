/**
 * Chat context-window usage (Cursor-style % + category breakdown).
 *
 * SoT ladder (Hermes-shaped):
 * 1. Provider `prompt` / `inputTotal` tokens when streamed (`estimated: false`)
 * 2. Turn-prepare slice estimate (chars/4 + categories)
 * 3. Thin client guess before first prepare SSE
 */

export type ChatContextUsageCategoryId =
  | "system"
  | "tools"
  | "rules"
  | "skills"
  | "mcp"
  | "subagents"
  | "summarized"
  | "conversation"
  | "images"
  | "studioContext";

export type ChatContextUsageCategory = {
  id: ChatContextUsageCategoryId;
  label: string;
  tokens: number;
};

export type ChatContextUsageEstimate = {
  modelId: string;
  windowTokens: number;
  usedTokens: number;
  pct: number;
  /** False when usedTokens came from provider usage SSE / status. */
  estimated: boolean;
  categories: readonly ChatContextUsageCategory[];
  /** Budget level when computed with prepare gate. */
  level?: "ok" | "warn" | "compact" | "hard";
};

/**
 * Flat image cost when provider usage unavailable (Anthropic-ish / Hermes ~1500).
 * Never count raw base64 length as text tokens.
 */
export const ESTIMATED_TOKENS_PER_IMAGE = 1_500;

/** CJK / Hangul / Kana — denser than English under common LLM tokenizers. */
const CJK_DENSE_RE =
  /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u3040-\u30FF\uAC00-\uD7AF]/g;

/** Fallback when model window unknown. */
export const DEFAULT_CONTEXT_WINDOW_TOKENS = 200_000;

const MODEL_CONTEXT_WINDOWS: Readonly<Record<string, number>> = {
  "claude-haiku-4-5": 200_000,
  "claude-sonnet-4-5": 200_000,
  "claude-opus-4-5": 200_000,
  "cursor-grok-4.5-high-fast": 256_000,
  "cursor-grok-4.5-high": 256_000,
  "grok-4.5": 500_000,
  "grok-4.3": 1_000_000,
  "grok-code-fast-1": 256_000,
  auto: 200_000,
};

export const CHAT_CONTEXT_USAGE_CATEGORY_LABELS: Readonly<
  Record<ChatContextUsageCategoryId, string>
> = {
  system: "System prompt",
  tools: "Tool definitions",
  rules: "Rules",
  skills: "Skills",
  mcp: "MCP & dynamic tools",
  subagents: "Subagent definitions",
  summarized: "Summarized conversation",
  conversation: "Conversation",
  images: "Images",
  studioContext: "Studio context",
};

/** @deprecated use CHAT_CONTEXT_USAGE_CATEGORY_LABELS */
const CATEGORY_LABELS = CHAT_CONTEXT_USAGE_CATEGORY_LABELS;

/**
 * Rough token estimate for preflight / category split (Hermes-shaped).
 * ASCII ≈ 4 chars/token; CJK/Hangul/Kana ≈ 1 token per codepoint.
 */
export function estimateTokensFromText(text: string): number {
  if (!text) return 0;
  const s = String(text);
  if (s.length <= 0) return 0;
  // Fast path — ASCII cannot contain CJK dense codepoints.
  if (/^[\x00-\x7F]*$/.test(s)) {
    return Math.floor((s.length + 3) / 4);
  }
  const dense = (s.match(CJK_DENSE_RE) ?? []).length;
  if (!dense) {
    return Math.floor((s.length + 3) / 4);
  }
  const sparse = s.length - dense;
  return dense + Math.floor((sparse + 3) / 4);
}

export function resolveContextWindowTokens(modelId: string): number {
  const id = modelId.trim();
  if (!id) return DEFAULT_CONTEXT_WINDOW_TOKENS;
  const exact = MODEL_CONTEXT_WINDOWS[id];
  if (exact != null) return exact;
  if (id.startsWith("claude-")) return 200_000;
  if (id.startsWith("cursor-grok")) return 256_000;
  if (id.startsWith("grok-")) return 256_000;
  if (id.startsWith("cursor-")) return 200_000;
  return DEFAULT_CONTEXT_WINDOW_TOKENS;
}

export type EstimateChatContextUsageInput = {
  modelId: string;
  /** Transcript messages (user/assistant/error text). */
  messages?: readonly { content?: string | null }[] | null;
  /** Unsent composer draft. */
  draft?: string | null;
  /** Studio UI context block (selected file, preview path, …). */
  studioContext?: string | null;
  /** Tool schema / catalog text (or JSON string). */
  toolsText?: string | null;
  /** Injected rules text when known. */
  rulesText?: string | null;
  /** Injected skills text when known. */
  skillsText?: string | null;
  /** Fixed system framing (harness preamble) when known. */
  systemText?: string | null;
  mcpText?: string | null;
  subagentsText?: string | null;
  imageCount?: number | null;
  /** Override window; default from model map. */
  windowTokens?: number | null;
  level?: ChatContextUsageEstimate["level"];
};

function pushCategory(
  out: ChatContextUsageCategory[],
  id: ChatContextUsageCategoryId,
  tokens: number,
): void {
  if (tokens <= 0) return;
  out.push({ id, label: CATEGORY_LABELS[id], tokens });
}

/** True when message is a compaction / handoff summary, not live conversation. */
export function isSummarizedContextMessage(content: string | null | undefined): boolean {
  const c = typeof content === "string" ? content : "";
  if (!c.trim()) return false;
  return (
    c.includes("## Compressed prior context") ||
    c.includes("<summary>") ||
    c.includes("continued from earlier context") ||
    c.includes("Emergency truncate")
  );
}

export function partitionMessagesForUsage(
  messages: readonly { content?: string | null }[] | null | undefined,
): { conversation: string[]; summarized: string[] } {
  const conversation: string[] = [];
  const summarized: string[] = [];
  for (const m of messages ?? []) {
    const content = typeof m.content === "string" ? m.content : "";
    if (!content) continue;
    if (isSummarizedContextMessage(content)) summarized.push(content);
    else conversation.push(content);
  }
  return { conversation, summarized };
}

function pctFor(usedTokens: number, windowTokens: number): number {
  if (windowTokens <= 0) return 0;
  return Math.min(100, Math.round((usedTokens / windowTokens) * 1000) / 10);
}

function finalizeUsage(input: {
  modelId: string;
  windowTokens: number;
  categories: ChatContextUsageCategory[];
  level?: ChatContextUsageEstimate["level"];
  estimated?: boolean;
  /** When set, overrides category sum (provider prompt tokens). */
  usedTokens?: number;
}): ChatContextUsageEstimate {
  const fromCats = input.categories.reduce((sum, c) => sum + c.tokens, 0);
  const usedTokens =
    input.usedTokens != null ? Math.max(0, Math.floor(input.usedTokens)) : fromCats;
  return {
    modelId: input.modelId,
    windowTokens: input.windowTokens,
    usedTokens,
    pct: pctFor(usedTokens, input.windowTokens),
    estimated: input.estimated !== false,
    categories: input.categories,
    ...(input.level ? { level: input.level } : {}),
  };
}

/**
 * Extract provider **prompt** tokens from usage / status payloads.
 * Prefer input / prompt / inputTotal — never `total` (includes completion).
 */
export function resolveProviderPromptTokens(
  data: Record<string, unknown> | null | undefined,
): number | null {
  if (!data || typeof data !== "object") return null;
  const keys = [
    "inputTotal",
    "prompt_tokens",
    "promptTokens",
    "input_tokens",
    "inputTokens",
  ] as const;
  for (const key of keys) {
    const v = data[key];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) {
      return Math.floor(v);
    }
  }
  return null;
}

/**
 * Overlay provider prompt tokens onto a prepare estimate.
 * Totals become real (`estimated: false`); category rows scale to match.
 */
export function applyProviderPromptTokens(
  base: ChatContextUsageEstimate | null | undefined,
  promptTokens: number,
  opts?: { modelId?: string; windowTokens?: number },
): ChatContextUsageEstimate {
  const used = Math.max(0, Math.floor(promptTokens));
  const modelId =
    (opts?.modelId?.trim() || base?.modelId || "unknown").trim() || "unknown";
  const windowTokens = Math.max(
    1,
    opts?.windowTokens ??
      base?.windowTokens ??
      resolveContextWindowTokens(modelId),
  );
  const level = base?.level;

  if (!base || base.categories.length === 0) {
    const categories: ChatContextUsageCategory[] =
      used > 0
        ? [
            {
              id: "conversation",
              label: CATEGORY_LABELS.conversation,
              tokens: used,
            },
          ]
        : [];
    return finalizeUsage({
      modelId,
      windowTokens,
      categories,
      level,
      estimated: false,
      usedTokens: used,
    });
  }

  const prevSum = base.categories.reduce((sum, c) => sum + c.tokens, 0);
  let categories: ChatContextUsageCategory[];
  if (prevSum <= 0) {
    categories = [
      {
        id: "conversation",
        label: CATEGORY_LABELS.conversation,
        tokens: used,
      },
    ];
  } else {
    categories = base.categories.map((c) => ({
      ...c,
      tokens: Math.max(0, Math.round((c.tokens / prevSum) * used)),
    }));
    const sum = categories.reduce((s, c) => s + c.tokens, 0);
    const drift = used - sum;
    if (drift !== 0 && categories.length > 0) {
      const last = categories[categories.length - 1]!;
      categories = [
        ...categories.slice(0, -1),
        { ...last, tokens: Math.max(0, last.tokens + drift) },
      ];
    }
  }

  return finalizeUsage({
    modelId,
    windowTokens,
    categories,
    level,
    estimated: false,
    usedTokens: used,
  });
}

export function estimateChatContextUsage(
  input: EstimateChatContextUsageInput,
): ChatContextUsageEstimate {
  const modelId = input.modelId.trim() || "unknown";
  const windowTokens = Math.max(
    1,
    input.windowTokens ?? resolveContextWindowTokens(modelId),
  );

  const partitioned = partitionMessagesForUsage(input.messages);
  const conversationText = [
    ...partitioned.conversation,
    typeof input.draft === "string" ? input.draft : "",
  ]
    .filter(Boolean)
    .join("\n");
  const summarizedText = partitioned.summarized.join("\n");

  const categories: ChatContextUsageCategory[] = [];
  pushCategory(categories, "system", estimateTokensFromText(input.systemText ?? ""));
  pushCategory(categories, "tools", estimateTokensFromText(input.toolsText ?? ""));
  pushCategory(categories, "rules", estimateTokensFromText(input.rulesText ?? ""));
  pushCategory(categories, "skills", estimateTokensFromText(input.skillsText ?? ""));
  pushCategory(categories, "mcp", estimateTokensFromText(input.mcpText ?? ""));
  pushCategory(
    categories,
    "subagents",
    estimateTokensFromText(input.subagentsText ?? ""),
  );
  pushCategory(categories, "summarized", estimateTokensFromText(summarizedText));
  pushCategory(
    categories,
    "studioContext",
    estimateTokensFromText(input.studioContext ?? ""),
  );
  pushCategory(categories, "conversation", estimateTokensFromText(conversationText));
  const images = Math.max(0, Math.floor(input.imageCount ?? 0));
  pushCategory(categories, "images", images * ESTIMATED_TOKENS_PER_IMAGE);

  return finalizeUsage({
    modelId,
    windowTokens,
    categories,
    level: input.level,
  });
}

/**
 * Turn-prepare SoT — count the slices actually assembled for this turn.
 * Empty slices are omitted (no stub zero rows).
 */
export type EstimateChatContextUsageFromPrepareInput = {
  modelId: string;
  messages: readonly { content?: string | null }[];
  rulesText?: string | null;
  skillsText?: string | null;
  /** Root / access / framing (not rules/skills). */
  systemText?: string | null;
  /** Viewport, notes, memory inject — Studio chrome context. */
  studioContextText?: string | null;
  /** MCP connection fact + Studio MCP tool catalog text for peers. */
  mcpText?: string | null;
  /** Agent room presence / sibling inject. */
  subagentsText?: string | null;
  /** Progressive / harness tool schemas actually offered. */
  toolsText?: string | null;
  imageCount?: number | null;
  windowTokens?: number | null;
  level?: ChatContextUsageEstimate["level"];
  draft?: string | null;
};

export function estimateChatContextUsageFromPrepare(
  input: EstimateChatContextUsageFromPrepareInput,
): ChatContextUsageEstimate {
  return estimateChatContextUsage({
    modelId: input.modelId,
    messages: input.messages,
    draft: input.draft,
    systemText: input.systemText,
    rulesText: input.rulesText,
    skillsText: input.skillsText,
    studioContext: input.studioContextText,
    mcpText: input.mcpText,
    subagentsText: input.subagentsText,
    toolsText: input.toolsText,
    imageCount: input.imageCount,
    windowTokens: input.windowTokens,
    level: input.level,
  });
}

/** Merge server snapshot with live draft (conversation only). */
export function mergeContextUsageWithDraft(
  base: ChatContextUsageEstimate,
  draft: string | null | undefined,
): ChatContextUsageEstimate {
  const draftText = typeof draft === "string" ? draft.trim() : "";
  if (!draftText) return base;
  const draftTokens = estimateTokensFromText(draftText);
  const categories = base.categories.map((c) =>
    c.id === "conversation"
      ? { ...c, tokens: c.tokens + draftTokens }
      : c,
  );
  if (!categories.some((c) => c.id === "conversation")) {
    categories.push({
      id: "conversation",
      label: CATEGORY_LABELS.conversation,
      tokens: draftTokens,
    });
  }
  // Draft tip is heuristic — even over a provider base, mark estimated.
  return finalizeUsage({
    modelId: base.modelId,
    windowTokens: base.windowTokens,
    categories: [...categories],
    level: base.level,
    estimated: true,
    usedTokens: base.usedTokens + draftTokens,
  });
}

/** Parse SSE context_usage payload (categories optional). */
export function parseContextUsageSseData(
  data: Record<string, unknown>,
): ChatContextUsageEstimate | null {
  const windowTokens =
    typeof data.windowTokens === "number" && data.windowTokens > 0
      ? Math.floor(data.windowTokens)
      : null;
  const usedTokens =
    typeof data.usedTokens === "number" && data.usedTokens >= 0
      ? Math.floor(data.usedTokens)
      : null;
  if (windowTokens == null || usedTokens == null) return null;
  const modelId =
    typeof data.modelId === "string" && data.modelId.trim()
      ? data.modelId.trim()
      : "unknown";
  const pct =
    typeof data.pct === "number" && Number.isFinite(data.pct)
      ? data.pct
      : Math.min(100, Math.round((usedTokens / windowTokens) * 1000) / 10);
  const level =
    data.level === "ok" ||
    data.level === "warn" ||
    data.level === "compact" ||
    data.level === "hard"
      ? data.level
      : undefined;
  const rawCats = Array.isArray(data.categories) ? data.categories : [];
  const categories: ChatContextUsageCategory[] = [];
  for (const row of rawCats) {
    if (!row || typeof row !== "object") continue;
    const rec = row as Record<string, unknown>;
    const id = rec.id;
    const tokens = typeof rec.tokens === "number" ? Math.floor(rec.tokens) : 0;
    if (tokens <= 0) continue;
    if (
      id !== "system" &&
      id !== "tools" &&
      id !== "rules" &&
      id !== "skills" &&
      id !== "mcp" &&
      id !== "subagents" &&
      id !== "summarized" &&
      id !== "conversation" &&
      id !== "images" &&
      id !== "studioContext"
    ) {
      continue;
    }
    categories.push({
      id,
      label:
        typeof rec.label === "string" && rec.label.trim()
          ? rec.label.trim()
          : CATEGORY_LABELS[id],
      tokens,
    });
  }
  const estimated = data.estimated === false ? false : true;
  return {
    modelId,
    windowTokens,
    usedTokens,
    pct,
    estimated,
    categories,
    ...(level ? { level } : {}),
  };
}

/** Face label: `25%` or `0%`. */
export function formatContextUsagePct(pct: number): string {
  const n = Number.isFinite(pct) ? Math.max(0, pct) : 0;
  if (n > 0 && n < 1) return "<1%";
  if (Number.isInteger(n) || Math.abs(n - Math.round(n)) < 0.05) {
    return `${Math.round(n)}%`;
  }
  return `${n.toFixed(1)}%`;
}

/** Cursor-ish counts: `474`, `9.1K`, `64.4K`. */
export function formatContextTokenCount(tokens: number): string {
  const n = Math.max(0, Math.floor(tokens));
  if (n < 1_000) return String(n);
  if (n < 10_000) return `${(n / 1_000).toFixed(1)}K`;
  if (n < 1_000_000) {
    const k = n / 1_000;
    return Number.isInteger(k) ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export function formatContextUsageSummary(
  usage: Pick<
    ChatContextUsageEstimate,
    "usedTokens" | "windowTokens" | "estimated"
  >,
): string {
  const prefix = usage.estimated === false ? "" : "~";
  return `${prefix}${formatContextTokenCount(usage.usedTokens)} / ${formatContextTokenCount(usage.windowTokens)} Tokens`;
}

/** Compact tool-catalog string for token estimate (id + description). */
export function estimateToolsCatalogText(
  tools: readonly { id: string; description: string }[],
): string {
  return tools.map((t) => `${t.id}: ${t.description}`).join("\n");
}

/**
 * Fast JSON of harness tool defs for token estimate (schemas actually offered).
 */
export function estimateToolsSchemasText(
  defs: readonly {
    name?: string;
    description?: string;
    input_schema?: unknown;
  }[],
): string {
  try {
    return JSON.stringify(defs);
  } catch {
    return defs
      .map((d) => `${d.name ?? "?"}: ${d.description ?? ""}`)
      .join("\n");
  }
}

/**
 * SVG ring stroke for Cursor-style context meter.
 * Circle r=9 in 24 viewBox → circumference ≈ 56.55.
 */
export const CONTEXT_USAGE_RING_RADIUS = 9;
export const CONTEXT_USAGE_RING_CIRCUMFERENCE =
  2 * Math.PI * CONTEXT_USAGE_RING_RADIUS;

export function contextUsageRingDash(
  pct: number,
  circumference = CONTEXT_USAGE_RING_CIRCUMFERENCE,
): { dasharray: string; pctClamped: number } {
  const pctClamped = Math.min(100, Math.max(0, Number.isFinite(pct) ? pct : 0));
  const filled = (pctClamped / 100) * circumference;
  return {
    dasharray: `${filled} ${circumference}`,
    pctClamped,
  };
}
