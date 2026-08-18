/** Pure helpers for RecordsStore row mutate (PK extract / validate). */

import { assertSafeIdent, type RecordsColumn } from "./types.js";

export function pkColumnNames(schema: RecordsColumn[]): string[] {
  return schema.filter((c) => c.pk).map((c) => c.name);
}

export function extractPkValues(
  schema: RecordsColumn[],
  row: Record<string, unknown>,
): Record<string, unknown> {
  const pks = pkColumnNames(schema);
  if (pks.length === 0) {
    throw new Error("table has no primary key — cannot update/delete");
  }
  const out: Record<string, unknown> = {};
  for (const name of pks) {
    if (!(name in row) || row[name] === undefined) {
      throw new Error(`missing primary key field: ${name}`);
    }
    out[name] = row[name];
  }
  return out;
}

/** Whitelist column names present in schema (safe idents). */
export function filterRowToSchema(
  schema: RecordsColumn[],
  row: Record<string, unknown>,
  opts?: { omitPk?: boolean },
): Record<string, unknown> {
  const allowed = new Set(schema.map((c) => c.name));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (!allowed.has(k)) continue;
    if (opts?.omitPk && schema.find((c) => c.name === k)?.pk) continue;
    assertSafeIdent(k);
    out[k] = v;
  }
  return out;
}

export function isRecordsWritable(dest: {
  kind?: string;
  capabilities?: string[];
}): boolean {
  const caps = dest.capabilities ?? [];
  if (caps.includes("records-readonly")) return false;
  if (dest.kind === "d1") return true;
  return caps.includes("records");
}
