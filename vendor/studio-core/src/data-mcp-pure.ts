/**
 * data.* MCP — parse inputs (no I/O).
 */

import { parseSectionProjectId } from "./section-apps-mcp-pure.js";

export type DataDestParsed = { projectId: string };
export type DataTablesParsed = { projectId: string; destId: string };
export type DataRowsParsed = DataTablesParsed & {
  table: string;
  limit?: number;
  offset?: number;
  sort?: string;
  dir?: string;
  q?: string;
};
export type DataInsertParsed = DataTablesParsed & {
  table: string;
  values: Record<string, unknown>;
};
export type DataUpdateParsed = DataTablesParsed & {
  table: string;
  pk: Record<string, unknown>;
  values: Record<string, unknown>;
};
export type DataDeleteParsed = DataTablesParsed & {
  table: string;
  pk: Record<string, unknown>;
};

function destId(input: Record<string, unknown>): string {
  if (typeof input.destId === "string") return input.destId.trim();
  if (typeof input.destination === "string") return input.destination.trim();
  if (typeof input.dest === "string") return input.dest.trim();
  return "";
}

function tableName(input: Record<string, unknown>): string {
  return typeof input.table === "string" ? input.table.trim() : "";
}

function asObj(v: unknown, name: string): Record<string, unknown> | { error: string } {
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    return { error: `${name} object required` };
  }
  return v as Record<string, unknown>;
}

export function parseDataDestinationsInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: DataDestParsed } | { ok: false; error: string } {
  const project = parseSectionProjectId(input, mcpProjectId);
  if (!project.ok) return project;
  return { ok: true, value: { projectId: project.value } };
}

export function parseDataTablesInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: DataTablesParsed } | { ok: false; error: string } {
  const project = parseSectionProjectId(input, mcpProjectId);
  if (!project.ok) return project;
  const d = destId(input);
  if (!d) return { ok: false, error: "destId required" };
  return { ok: true, value: { projectId: project.value, destId: d } };
}

export function parseDataRowsInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: DataRowsParsed } | { ok: false; error: string } {
  const tables = parseDataTablesInput(input, mcpProjectId);
  if (!tables.ok) return tables;
  const table = tableName(input);
  if (!table) return { ok: false, error: "table required" };
  const out: DataRowsParsed = { ...tables.value, table };
  if (typeof input.limit === "number" && Number.isFinite(input.limit)) {
    out.limit = Math.min(500, Math.max(1, Math.floor(input.limit)));
  }
  if (typeof input.offset === "number" && Number.isFinite(input.offset)) {
    out.offset = Math.max(0, Math.floor(input.offset));
  }
  if (typeof input.sort === "string") out.sort = input.sort;
  if (typeof input.dir === "string") out.dir = input.dir;
  if (typeof input.q === "string") out.q = input.q;
  return { ok: true, value: out };
}

export function parseDataInsertInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: DataInsertParsed } | { ok: false; error: string } {
  const tables = parseDataTablesInput(input, mcpProjectId);
  if (!tables.ok) return tables;
  const table = tableName(input);
  if (!table) return { ok: false, error: "table required" };
  const values = asObj(input.values ?? input.row, "values");
  if ("error" in values) return { ok: false, error: values.error };
  return { ok: true, value: { ...tables.value, table, values } };
}

export function parseDataUpdateInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: DataUpdateParsed } | { ok: false; error: string } {
  const tables = parseDataTablesInput(input, mcpProjectId);
  if (!tables.ok) return tables;
  const table = tableName(input);
  if (!table) return { ok: false, error: "table required" };
  const pk = asObj(input.pk, "pk");
  if ("error" in pk) return { ok: false, error: pk.error };
  const values = asObj(input.values, "values");
  if ("error" in values) return { ok: false, error: values.error };
  return { ok: true, value: { ...tables.value, table, pk, values } };
}

export function parseDataDeleteInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: DataDeleteParsed } | { ok: false; error: string } {
  const tables = parseDataTablesInput(input, mcpProjectId);
  if (!tables.ok) return tables;
  const table = tableName(input);
  if (!table) return { ok: false, error: "table required" };
  const pk = asObj(input.pk, "pk");
  if ("error" in pk) return { ok: false, error: pk.error };
  return { ok: true, value: { ...tables.value, table, pk } };
}
