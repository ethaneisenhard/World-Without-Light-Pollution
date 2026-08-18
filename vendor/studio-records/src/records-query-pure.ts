/** Pure RecordsStore query option normalize + filter match (no I/O). */

import type { RecordsSortDir } from "./types.js";

export type { RecordsSortDir };

export function normalizeRecordsSortDir(
  raw: string | null | undefined,
): RecordsSortDir | undefined {
  if (raw == null || raw === "") return undefined;
  const t = raw.trim().toLowerCase();
  if (t === "asc" || t === "desc") return t;
  return undefined;
}

export function normalizeRecordsSearchQ(
  raw: string | null | undefined,
): string | undefined {
  if (raw == null) return undefined;
  const t = raw.trim();
  return t.length > 0 ? t : undefined;
}

/** Clamp page size / offset for browse queries. */
export function normalizeRecordsPage(input: {
  limit?: number;
  offset?: number;
}): { limit: number; offset: number } {
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 500);
  const offset = Math.max(input.offset ?? 0, 0);
  return { limit, offset };
}

/** Memory / client-side filter: row matches if any cell contains q (case-insensitive). */
export function rowMatchesRecordsSearch(
  row: Record<string, unknown>,
  q: string,
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  for (const value of Object.values(row)) {
    if (value == null) continue;
    const hay =
      typeof value === "object"
        ? (() => {
            try {
              return JSON.stringify(value);
            } catch {
              return String(value);
            }
          })()
        : String(value);
    if (hay.toLowerCase().includes(needle)) return true;
  }
  return false;
}

export function compareRecordsCell(
  a: unknown,
  b: unknown,
  dir: RecordsSortDir,
): number {
  const mul = dir === "desc" ? -1 : 1;
  if (a == null && b == null) return 0;
  if (a == null) return -1 * mul;
  if (b == null) return 1 * mul;
  if (typeof a === "number" && typeof b === "number") {
    return (a - b) * mul;
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true }) * mul;
}
