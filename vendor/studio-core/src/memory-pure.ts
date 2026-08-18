/**
 * Agent Memory — curated beliefs (not Notes, not ledger activity).
 * Glass-box: every row has provenance; retrieve is top-K, never full dump.
 */

export type MemoryOrigin =
  | "self_learn"
  | "imported"
  | "hand_authored"
  | "harness_synced";

export type MemoryStatus = "staged" | "approved" | "rejected" | "active";

export type MemoryScopeKind = "studio" | "project" | "session";

export type MemoryRow = {
  id: string;
  scope: MemoryScopeKind;
  projectId: string | null;
  content: string;
  origin: MemoryOrigin;
  status: MemoryStatus;
  /** Run / message / import path for glass-box trail. */
  source: string | null;
  /** Optional human “why learned”. */
  why: string | null;
  score: number;
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number | null;
};

const ORIGINS: readonly MemoryOrigin[] = [
  "self_learn",
  "imported",
  "hand_authored",
  "harness_synced",
];

const STATUSES: readonly MemoryStatus[] = [
  "staged",
  "approved",
  "rejected",
  "active",
];

export function parseMemoryOrigin(raw: unknown): MemoryOrigin {
  if (typeof raw === "string" && (ORIGINS as readonly string[]).includes(raw)) {
    return raw as MemoryOrigin;
  }
  return "hand_authored";
}

export function parseMemoryStatus(raw: unknown): MemoryStatus {
  if (typeof raw === "string" && (STATUSES as readonly string[]).includes(raw)) {
    return raw as MemoryStatus;
  }
  return "staged";
}

export function createMemoryId(now = Date.now()): string {
  return `mem_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Format retrieved rows for ContextBundle system part (transparent). */
export function formatMemoryBundleSlice(rows: readonly MemoryRow[]): string {
  if (!rows.length) return "";
  const lines = rows.map((r, i) => {
    const origin = r.origin;
    const src = r.source ? ` source=${r.source}` : "";
    return `${i + 1}. [${r.id} origin=${origin}${src}] ${r.content}`;
  });
  return [
    "## Agent Memory (active, retrieved)",
    "These facts were selected for this turn. Ids are shown for glass-box inspect.",
    ...lines,
  ].join("\n");
}

export function memoryStatusAfterApprove(status: MemoryStatus): MemoryStatus {
  if (status === "staged" || status === "approved") return "active";
  return status;
}
