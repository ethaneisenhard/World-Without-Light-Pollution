/**
 * Anthropic prompt-cache markers — pure helpers for the Studio AI loop.
 *
 * Cache control sits on each Messages request (in-loop), not a harness.
 * Freeze / ContextBundle split is turn prepare (pre-loop) — separate modules.
 *
 * Mirrors AGNT llmAdapters.js all-1h rolling breakpoints (Cache Wars / PRD-113).
 * Anthropic max 4 breakpoints across system + tools + messages.
 */

export type AnthropicCacheControl = {
  type: "ephemeral";
  ttl: "1h" | "5m";
};

/** Default Cache Wars TTL — all breakpoints 1h. */
export const ANTHROPIC_CACHE_TTL_1H = "1h" as const;

/**
 * Required for `ttl: '1h'`. Pair with anthropic-version on every cached call.
 * @see https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
 */
export const ANTHROPIC_PROMPT_CACHE_BETA =
  "prompt-caching-2024-07-31,extended-cache-ttl-2025-04-11";

export const ANTHROPIC_CACHE_CONTROL_1H: AnthropicCacheControl = {
  type: "ephemeral",
  ttl: ANTHROPIC_CACHE_TTL_1H,
};

/** Anthropic hard cap on cache_control breakpoints per request. */
export const ANTHROPIC_MAX_CACHE_BREAKPOINTS = 4;

export type AnthropicContentBlock = {
  type: string;
  cache_control?: AnthropicCacheControl;
  [key: string]: unknown;
};

export type AnthropicCacheMessage = {
  role: string;
  content?: string | AnthropicContentBlock[] | null;
  cache_control?: AnthropicCacheControl;
  [key: string]: unknown;
};

export type AnthropicCacheTool = {
  name: string;
  description?: string;
  input_schema?: Record<string, unknown>;
  cache_control?: AnthropicCacheControl;
  [key: string]: unknown;
};

export function anthropicCacheControl1h(): AnthropicCacheControl {
  return { ...ANTHROPIC_CACHE_CONTROL_1H };
}

/** Strip cache_control from messages (and content blocks) — clone, no mutate. */
export function stripAnthropicCacheMarkers(
  messages: readonly AnthropicCacheMessage[],
): AnthropicCacheMessage[] {
  return messages.map((msg) => {
    const next: AnthropicCacheMessage = { ...msg };
    delete next.cache_control;
    const content = msg.content;
    if (Array.isArray(content)) {
      next.content = content.map((block) => {
        const b = { ...block };
        delete b.cache_control;
        return b;
      });
    }
    return next;
  });
}

/**
 * Apply cache_control to a message's content (string → text block; array → last block).
 * Empty / null content → unchanged (Anthropic rejects empty marked blocks).
 */
export function applyAnthropicCacheMarker(
  msg: AnthropicCacheMessage,
  marker: AnthropicCacheControl = ANTHROPIC_CACHE_CONTROL_1H,
): AnthropicCacheMessage {
  const content = msg.content;
  if (content == null || content === "") {
    const next = { ...msg };
    delete next.cache_control;
    return next;
  }
  if (typeof content === "string") {
    return {
      ...msg,
      content: [{ type: "text", text: content, cache_control: { ...marker } }],
    };
  }
  if (Array.isArray(content) && content.length > 0) {
    const blocks = content.map((b, i) => {
      const copy = { ...b };
      delete copy.cache_control;
      if (i === content.length - 1) {
        copy.cache_control = { ...marker };
      }
      return copy;
    });
    const next = { ...msg, content: blocks };
    delete next.cache_control;
    return next;
  }
  return { ...msg };
}

/**
 * Rolling 1h markers on penultimate + last non-system messages.
 * Strips first. `messageBreakpointBudget` = remaining slots after system/tools (0–2).
 */
export function applyRollingAnthropicCacheBreakpoints(
  messages: readonly AnthropicCacheMessage[],
  messageBreakpointBudget = 2,
  marker: AnthropicCacheControl = ANTHROPIC_CACHE_CONTROL_1H,
): AnthropicCacheMessage[] {
  if (!messages.length || messageBreakpointBudget <= 0) {
    return stripAnthropicCacheMarkers(messages);
  }

  let next = stripAnthropicCacheMarkers(messages);
  const indices: number[] = [];
  for (let i = 0; i < next.length; i++) {
    if (next[i]!.role !== "system") indices.push(i);
  }
  if (indices.length === 0) return next;

  const latestIdx = indices[indices.length - 1]!;
  const count = Math.min(messageBreakpointBudget, 2);

  if (count >= 2 && indices.length >= 2) {
    const prefixIdx = indices[indices.length - 2]!;
    next = next.map((m, i) => {
      if (i === prefixIdx || i === latestIdx) {
        return applyAnthropicCacheMarker(m, marker);
      }
      return m;
    });
  } else if (count >= 1) {
    next = next.map((m, i) =>
      i === latestIdx ? applyAnthropicCacheMarker(m, marker) : m,
    );
  }
  return next;
}

/** Mark last tool only (caches entire tools[] prefix). Empty tools → unchanged. */
export function markLastAnthropicToolCache(
  tools: readonly AnthropicCacheTool[],
  marker: AnthropicCacheControl = ANTHROPIC_CACHE_CONTROL_1H,
): AnthropicCacheTool[] {
  if (tools.length === 0) return [];
  return tools.map((t, i) => {
    const copy = { ...t };
    delete copy.cache_control;
    if (i === tools.length - 1) {
      copy.cache_control = { ...marker };
    }
    return copy;
  });
}

/**
 * System as content blocks with 1h marker on the last non-empty text block.
 * Empty / whitespace-only → undefined (omit `system` on the request).
 */
export function buildAnthropicCachedSystem(
  systemText: string | undefined | null,
  marker: AnthropicCacheControl = ANTHROPIC_CACHE_CONTROL_1H,
): AnthropicContentBlock[] | undefined {
  const text = typeof systemText === "string" ? systemText.trim() : "";
  if (!text) return undefined;
  return [
    {
      type: "text",
      text,
      cache_control: { ...marker },
    },
  ];
}

/**
 * Budget remaining message breakpoints after system + tools markers.
 * systemUsed / toolsUsed are 0 or 1 each.
 */
export function anthropicMessageCacheBudget(input: {
  systemUsed: boolean;
  toolsUsed: boolean;
}): number {
  let used = 0;
  if (input.systemUsed) used += 1;
  if (input.toolsUsed) used += 1;
  return Math.max(0, ANTHROPIC_MAX_CACHE_BREAKPOINTS - used);
}

/** Count cache_control markers on a built request shape (tests / debug). */
export function countAnthropicCacheBreakpoints(input: {
  system?: readonly AnthropicContentBlock[] | string | null;
  tools?: readonly AnthropicCacheTool[] | null;
  messages?: readonly AnthropicCacheMessage[] | null;
}): number {
  let n = 0;
  const sys = input.system;
  if (Array.isArray(sys)) {
    for (const b of sys) {
      if (b.cache_control) n += 1;
    }
  }
  for (const t of input.tools ?? []) {
    if (t.cache_control) n += 1;
  }
  for (const m of input.messages ?? []) {
    if (m.cache_control) n += 1;
    const c = m.content;
    if (Array.isArray(c)) {
      for (const b of c) {
        if (b.cache_control) n += 1;
      }
    }
  }
  return n;
}
