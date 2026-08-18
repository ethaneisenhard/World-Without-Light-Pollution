/**
 * notes.* MCP — parse inputs (no I/O).
 */

import {
  parseSectionVaultScope,
  type SectionVaultScopeParsed,
} from "./section-apps-mcp-pure.js";

export type NotesListParsed = SectionVaultScopeParsed;
export type NotesSearchParsed = SectionVaultScopeParsed & {
  query: string;
  limit?: number;
};
export type NotesPathParsed = SectionVaultScopeParsed & { path: string };
export type NotesWriteParsed = NotesPathParsed & { content: string };
export type NotesCreateParsed = NotesPathParsed & { content?: string };

export function parseNotesListInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: NotesListParsed } | { ok: false; error: string } {
  return parseSectionVaultScope(input, mcpProjectId);
}

export function parseNotesSearchInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: NotesSearchParsed } | { ok: false; error: string } {
  const scope = parseSectionVaultScope(input, mcpProjectId);
  if (!scope.ok) return scope;
  const query = typeof input.query === "string" ? input.query : typeof input.q === "string" ? input.q : "";
  let limit: number | undefined;
  if (typeof input.limit === "number" && Number.isFinite(input.limit)) {
    limit = Math.min(100, Math.max(1, Math.floor(input.limit)));
  }
  return { ok: true, value: { ...scope.value, query, limit } };
}

export function parseNotesPathInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: NotesPathParsed } | { ok: false; error: string } {
  const scope = parseSectionVaultScope(input, mcpProjectId);
  if (!scope.ok) return scope;
  const path = typeof input.path === "string" ? input.path.trim() : "";
  if (!path) return { ok: false, error: "path required" };
  return { ok: true, value: { ...scope.value, path } };
}

export function parseNotesWriteInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: NotesWriteParsed } | { ok: false; error: string } {
  const path = parseNotesPathInput(input, mcpProjectId);
  if (!path.ok) return path;
  if (typeof input.content !== "string") {
    return { ok: false, error: "content required" };
  }
  return { ok: true, value: { ...path.value, content: input.content } };
}

export function parseNotesCreateInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: NotesCreateParsed } | { ok: false; error: string } {
  const path = parseNotesPathInput(input, mcpProjectId);
  if (!path.ok) return path;
  const content =
    typeof input.content === "string" ? input.content : undefined;
  return { ok: true, value: { ...path.value, content } };
}
