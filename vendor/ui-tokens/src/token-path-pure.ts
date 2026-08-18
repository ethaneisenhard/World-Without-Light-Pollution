/**
 * Dot-path get/set for design-system tokens (e.g. color.ink, font.size.base).
 */

import type { DesignSystemDoc, TokenMap, TokenValue } from "./design-system.ts";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

export function getTokenAtPath(
  design: DesignSystemDoc,
  path: string,
): string | null {
  const parts = path.split(".").filter(Boolean);
  if (parts[0] !== "tokens" && parts[0] !== undefined) {
    // allow "color.ink" or "tokens.color.ink"
  }
  const start =
    parts[0] === "tokens" ? parts.slice(1) : parts;
  let cur: unknown = design.tokens;
  for (const key of start) {
    if (!isPlainObject(cur) || !(key in cur)) return null;
    cur = (cur as TokenMap)[key];
  }
  if (typeof cur === "string" || typeof cur === "number") return String(cur);
  return null;
}

/** Immutable set — returns new design doc. */
export function setTokenAtPath(
  design: DesignSystemDoc,
  path: string,
  value: string,
): DesignSystemDoc {
  const parts = path.split(".").filter(Boolean);
  const start = parts[0] === "tokens" ? parts.slice(1) : parts;
  if (start.length === 0) return design;

  const cloneTokens = structuredClone(design.tokens) as TokenMap;
  let cur: TokenMap = cloneTokens;
  for (let i = 0; i < start.length - 1; i++) {
    const key = start[i]!;
    const next = cur[key];
    if (!isPlainObject(next)) {
      cur[key] = {};
    }
    cur = cur[key] as TokenMap;
  }
  const leaf = start[start.length - 1]!;
  cur[leaf] = value as TokenValue;

  return {
    ...design,
    tokens: cloneTokens as DesignSystemDoc["tokens"],
  };
}
