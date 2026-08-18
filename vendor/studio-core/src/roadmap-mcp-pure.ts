/**
 * roadmap.* MCP — parse inputs (no I/O).
 */

import {
  parseSectionVaultScope,
  type SectionVaultScopeParsed,
} from "./section-apps-mcp-pure.js";

export type RoadmapListParsed = SectionVaultScopeParsed;
export type RoadmapAddParsed = SectionVaultScopeParsed & {
  title: string;
  body?: string;
  columnId?: string;
  linkProjectId?: string | null;
};
export type RoadmapMoveParsed = SectionVaultScopeParsed & {
  cardId: string;
  columnId: string;
  toIndex?: number;
};

export function parseRoadmapListInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: RoadmapListParsed } | { ok: false; error: string } {
  return parseSectionVaultScope(input, mcpProjectId);
}

export function parseRoadmapAddInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: RoadmapAddParsed } | { ok: false; error: string } {
  const scope = parseSectionVaultScope(input, mcpProjectId);
  if (!scope.ok) return scope;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title) return { ok: false, error: "title required" };
  const body = typeof input.body === "string" ? input.body : undefined;
  const columnId =
    typeof input.columnId === "string" ? input.columnId.trim() : undefined;
  let linkProjectId: string | null | undefined;
  if (input.linkProjectId === null) linkProjectId = null;
  else if (typeof input.linkProjectId === "string") {
    linkProjectId = input.linkProjectId.trim() || null;
  }
  return {
    ok: true,
    value: {
      ...scope.value,
      title,
      body,
      columnId: columnId || undefined,
      linkProjectId,
    },
  };
}

export function parseRoadmapMoveInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: RoadmapMoveParsed } | { ok: false; error: string } {
  const scope = parseSectionVaultScope(input, mcpProjectId);
  if (!scope.ok) return scope;
  const cardId = typeof input.cardId === "string" ? input.cardId.trim() : "";
  const columnId =
    typeof input.columnId === "string" ? input.columnId.trim() : "";
  if (!cardId) return { ok: false, error: "cardId required" };
  if (!columnId) return { ok: false, error: "columnId required" };
  let toIndex: number | undefined;
  if (typeof input.toIndex === "number" && Number.isFinite(input.toIndex)) {
    toIndex = Math.max(0, Math.floor(input.toIndex));
  }
  return {
    ok: true,
    value: { ...scope.value, cardId, columnId, toIndex },
  };
}
