/**
 * Memory import projector registry — one entry per provider id.
 * New provider = register a projector; never `if (provider === …)` in handlers.
 */

import type { MemoryImportDraft, MemoryProviderId } from "./memory-provider-pure.js";
import { projectImportedMemoryRows } from "./memory-provider-pure.js";
import type { MemoryRow } from "./memory-pure.js";

export type MemoryImportProjector = {
  id: Exclude<MemoryProviderId, "studio">;
  /** Parse provider dump → drafts (no I/O). */
  dumpToDrafts: (dump: unknown) => MemoryImportDraft[];
  /** Origin tag when projecting to staged rows. */
  origin: "imported" | "harness_synced";
};

/** Hermes Honcho / memory dump shape → drafts. */
export function hermesMemoryDumpToDrafts(dump: unknown): MemoryImportDraft[] {
  if (!dump || typeof dump !== "object") return [];
  const rows = (dump as { memories?: unknown }).memories;
  if (!Array.isArray(rows)) return [];
  const out: MemoryImportDraft[] = [];
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const content =
      typeof (r as { content?: unknown }).content === "string"
        ? (r as { content: string }).content.trim()
        : typeof (r as { text?: unknown }).text === "string"
          ? (r as { text: string }).text.trim()
          : "";
    if (!content) continue;
    const id =
      typeof (r as { id?: unknown }).id === "string"
        ? (r as { id: string }).id
        : "anon";
    out.push({ content, source: id, why: "hermes import" });
  }
  return out.slice(0, 100);
}

/** Letta-class dump (memories[] or blocks[]) → drafts. */
export function lettaMemoryDumpToDrafts(dump: unknown): MemoryImportDraft[] {
  if (!dump || typeof dump !== "object") return [];
  const obj = dump as { memories?: unknown; blocks?: unknown };
  const rows = Array.isArray(obj.memories)
    ? obj.memories
    : Array.isArray(obj.blocks)
      ? obj.blocks
      : [];
  const out: MemoryImportDraft[] = [];
  for (const r of rows) {
    if (!r || typeof r !== "object") continue;
    const content =
      typeof (r as { value?: unknown }).value === "string"
        ? (r as { value: string }).value.trim()
        : typeof (r as { content?: unknown }).content === "string"
          ? (r as { content: string }).content.trim()
          : "";
    if (!content) continue;
    const id =
      typeof (r as { id?: unknown }).id === "string"
        ? (r as { id: string }).id
        : typeof (r as { label?: unknown }).label === "string"
          ? (r as { label: string }).label
          : "anon";
    out.push({ content, source: id, why: "letta import" });
  }
  return out.slice(0, 100);
}

/**
 * Built-in import projectors. Extend via `registerMemoryImportProjector`
 * in tests / plugins — do not branch in HTTP/MCP hosts.
 */
export const MEMORY_IMPORT_PROJECTORS: Readonly<
  Record<Exclude<MemoryProviderId, "studio">, MemoryImportProjector>
> = {
  hermes: {
    id: "hermes",
    dumpToDrafts: hermesMemoryDumpToDrafts,
    origin: "harness_synced",
  },
  letta: {
    id: "letta",
    dumpToDrafts: lettaMemoryDumpToDrafts,
    origin: "imported",
  },
};

const extraProjectors = new Map<string, MemoryImportProjector>();

/** Test / plugin seam — register without forking hosts. */
export function registerMemoryImportProjector(
  projector: MemoryImportProjector,
): void {
  extraProjectors.set(projector.id, projector);
}

export function clearMemoryImportProjectorOverrides(): void {
  extraProjectors.clear();
}

export function getMemoryImportProjector(
  providerId: string,
): MemoryImportProjector | null {
  const id = providerId.trim();
  if (id === "studio" || !id) return null;
  return (
    extraProjectors.get(id) ??
    MEMORY_IMPORT_PROJECTORS[id as Exclude<MemoryProviderId, "studio">] ??
    null
  );
}

export function listMemoryImportProviderIds(): string[] {
  const ids = new Set<string>([
    ...Object.keys(MEMORY_IMPORT_PROJECTORS),
    ...extraProjectors.keys(),
  ]);
  return [...ids].sort();
}

/**
 * Pure: dump → staged rows via registry. Unknown provider → empty + error tag.
 */
export function importMemoryViaProviderRegistry(input: {
  providerId: string;
  dump: unknown;
  now?: number;
}): { ok: true; rows: MemoryRow[] } | { ok: false; error: string } {
  const projector = getMemoryImportProjector(input.providerId);
  if (!projector) {
    return {
      ok: false,
      error: `Unknown memory provider "${input.providerId}". Registered: ${listMemoryImportProviderIds().join(", ")}`,
    };
  }
  const drafts = projector.dumpToDrafts(input.dump);
  const rows = projectImportedMemoryRows(drafts, projector.id, input.now);
  return { ok: true, rows };
}
