/**
 * memory.provider — draft → staged Memory rows (Wave 5).
 * Dump parsers live in `memory-provider-registry-pure` (registry, not if-branches).
 */

import type { MemoryOrigin, MemoryRow } from "./memory-pure.js";
import { createMemoryId } from "./memory-pure.js";

export type MemoryProviderId = "studio" | "hermes" | "letta";

export type MemoryImportDraft = {
  content: string;
  source: string;
  why?: string | null;
  projectId?: string | null;
  scope?: "studio" | "project";
};

export function parseMemoryProviderId(raw: unknown): MemoryProviderId {
  if (raw === "hermes" || raw === "letta" || raw === "studio") return raw;
  return "studio";
}

/** Map provider drafts → staged Memory rows (never active). */
export function projectImportedMemoryRows(
  drafts: readonly MemoryImportDraft[],
  provider: Exclude<MemoryProviderId, "studio">,
  now = Date.now(),
): MemoryRow[] {
  const origin: MemoryOrigin =
    provider === "hermes" ? "harness_synced" : "imported";
  return drafts.map((d) => ({
    id: createMemoryId(now),
    scope: d.scope === "project" ? "project" : "studio",
    projectId: d.scope === "project" ? (d.projectId ?? null) : null,
    content: d.content.trim(),
    origin,
    status: "staged" as const,
    source: `${provider}:${d.source}`,
    why: d.why ?? `imported from ${provider}`,
    score: 1,
    createdAt: now,
    updatedAt: now,
    lastUsedAt: null,
  }));
}

/** @deprecated Use registry — re-export for older imports. */
export { hermesMemoryDumpToDrafts } from "./memory-provider-registry-pure.js";
