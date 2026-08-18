/**
 * Extract staged Memory candidates from a turn (Wave 1).
 * Heuristic only — LLM judge can replace later. Always staged; never auto-active.
 */

import {
  createMemoryId,
  type MemoryRow,
  type MemoryScopeKind,
} from "./memory-pure.js";
import { MEMORY_PREF_SCORE } from "./memory-retrieve-pure.js";

export type MemoryExtractCandidate = {
  content: string;
  why: string;
  score: number;
  scope: MemoryScopeKind;
};

const REMEMBER_RE =
  /\b(?:remember(?:\s+that)?|don't forget|prefers?|preference|always use|never use)\b[:\s]+(.+)/i;

/**
 * Pull preference / remember lines from user (+ optional assistant) text.
 */
export function extractMemoryCandidatesFromTurn(input: {
  userText: string;
  assistantText?: string;
  projectId: string | null;
}): MemoryExtractCandidate[] {
  const blobs = [input.userText, input.assistantText ?? ""]
    .map((t) => t.trim())
    .filter(Boolean);
  const out: MemoryExtractCandidate[] = [];
  const seen = new Set<string>();

  for (const blob of blobs) {
    for (const line of blob.split(/\n+/)) {
      const m = line.trim().match(REMEMBER_RE);
      if (!m?.[1]) continue;
      const content = m[1].trim().replace(/^["']|["']$/g, "").slice(0, 500);
      if (content.length < 8) continue;
      const key = content.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const isPref = /\bprefer/i.test(line) || /\balways\b|\bnever\b/i.test(line);
      out.push({
        content,
        why: isPref ? "pref:heuristic" : "self_learn:heuristic",
        score: isPref ? MEMORY_PREF_SCORE : 1,
        scope: input.projectId ? "project" : "studio",
      });
    }
  }
  return out.slice(0, 5);
}

export function candidatesToStagedRows(
  candidates: readonly MemoryExtractCandidate[],
  input: {
    projectId: string | null;
    source: string;
    now?: number;
  },
): MemoryRow[] {
  const now = input.now ?? Date.now();
  return candidates.map((c) => ({
    id: createMemoryId(now),
    scope: c.scope,
    projectId: c.scope === "project" ? input.projectId : null,
    content: c.content,
    origin: "self_learn" as const,
    status: "staged" as const,
    source: input.source,
    why: c.why,
    score: c.score,
    createdAt: now,
    updatedAt: now,
    lastUsedAt: null,
  }));
}
