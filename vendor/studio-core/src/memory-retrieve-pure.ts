/**
 * Memory retrieve upgrades (Wave 1) — pin, decay, caps, warm query match.
 * Pin = score >= MEMORY_PIN_SCORE (no schema migration).
 */

import type { MemoryRow, MemoryScopeKind } from "./memory-pure.js";

/** Rows at or above this score are always hot (pinned). */
export const MEMORY_PIN_SCORE = 100;

/** Pref rows use this floor score when created as preferences. */
export const MEMORY_PREF_SCORE = 100;

export const MEMORY_DEFAULT_HOT_LIMIT = 8;
export const MEMORY_DEFAULT_WARM_LIMIT = 6;
export const MEMORY_HARD_ROW_CAP = 40;

export function isMemoryPinned(row: MemoryRow): boolean {
  return row.score >= MEMORY_PIN_SCORE;
}

/** Prefs: studio-scope + high score, or why starts with "pref". */
export function isMemoryPref(row: MemoryRow): boolean {
  if (row.why?.trim().toLowerCase().startsWith("pref")) return true;
  return row.scope === "studio" && isMemoryPinned(row);
}

/** Decay unused score for ranking (does not mutate store). */
export function decayedMemoryScore(row: MemoryRow, now = Date.now()): number {
  if (isMemoryPinned(row)) return row.score + 50;
  const last = row.lastUsedAt ?? row.updatedAt;
  const ageMs = Math.max(0, now - last);
  const days = ageMs / 86_400_000;
  const decay = Math.min(row.score * 0.5, days * 0.15);
  const recentBoost = ageMs < 86_400_000 ? 2 : 0;
  return row.score - decay + recentBoost;
}

/** Tokenize query for warm match (AND of tokens, substring). */
export function tokenizeMemoryQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9_\-]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .slice(0, 12);
}

export function memoryRowMatchesQuery(
  row: MemoryRow,
  tokens: readonly string[],
): boolean {
  if (!tokens.length) return true;
  const hay = row.content.toLowerCase();
  return tokens.every((t) => hay.includes(t));
}

export type MemoryRetrieveV2Input = {
  rows: readonly MemoryRow[];
  scope: MemoryScopeKind | "all";
  projectId: string | null;
  query?: string;
  /** Hot (pinned + recent) cap. */
  hotLimit?: number;
  /** Warm (query-matched) cap. */
  warmLimit?: number;
  hardCap?: number;
};

/**
 * Hot = pinned + high decayed score (no query).
 * Warm = query token match when query present.
 * Merged, deduped, hard-capped.
 */
export function retrieveMemoryHotWarm(
  input: MemoryRetrieveV2Input,
): MemoryRow[] {
  const hotLimit = Math.max(
    1,
    Math.min(input.hotLimit ?? MEMORY_DEFAULT_HOT_LIMIT, 24),
  );
  const warmLimit = Math.max(
    0,
    Math.min(input.warmLimit ?? MEMORY_DEFAULT_WARM_LIMIT, 24),
  );
  const hardCap = Math.max(
    1,
    Math.min(input.hardCap ?? MEMORY_HARD_ROW_CAP, 40),
  );
  const now = Date.now();
  const tokens = tokenizeMemoryQuery(input.query ?? "");

  let rows = input.rows.filter((r) => r.status === "active");
  if (input.scope !== "all") {
    rows = rows.filter((r) => r.scope === input.scope);
  }
  if (input.projectId) {
    rows = rows.filter(
      (r) =>
        r.scope === "studio" ||
        r.scope === "session" ||
        r.projectId === input.projectId,
    );
  } else {
    rows = rows.filter((r) => r.scope === "studio" || r.scope === "session");
  }

  const byScore = [...rows].sort(
    (a, b) =>
      decayedMemoryScore(b, now) - decayedMemoryScore(a, now) ||
      (b.lastUsedAt ?? b.updatedAt) - (a.lastUsedAt ?? a.updatedAt),
  );

  const hot = byScore.slice(0, hotLimit);
  const seen = new Set(hot.map((r) => r.id));
  const warm: MemoryRow[] = [];
  if (tokens.length && warmLimit > 0) {
    for (const r of byScore) {
      if (seen.has(r.id)) continue;
      if (!memoryRowMatchesQuery(r, tokens)) continue;
      warm.push(r);
      seen.add(r.id);
      if (warm.length >= warmLimit) break;
    }
  }

  return [...hot, ...warm].slice(0, hardCap);
}

export function exportMemoryJson(rows: readonly MemoryRow[]): string {
  return `${JSON.stringify({ version: 1, exportedAt: Date.now(), rows }, null, 2)}\n`;
}

export type MemoryRetrieveInput = {
  rows: readonly MemoryRow[];
  scope: MemoryScopeKind | "all";
  projectId: string | null;
  /** Free-text query; empty = pinned/hot only. */
  query?: string;
  limit?: number;
};

/** Back-compat entry — hot/warm with single limit. */
export function retrieveMemoryTopK(input: MemoryRetrieveInput): MemoryRow[] {
  const limit = Math.max(1, Math.min(input.limit ?? 12, 40));
  const hasQuery = Boolean(input.query?.trim());
  return retrieveMemoryHotWarm({
    rows: input.rows,
    scope: input.scope,
    projectId: input.projectId,
    query: input.query,
    // Query mode: warm-only (substring/token match). Hot is for empty query.
    hotLimit: hasQuery ? 0 : Math.min(limit, 8),
    warmLimit: hasQuery ? limit : 0,
    hardCap: limit,
  });
}
