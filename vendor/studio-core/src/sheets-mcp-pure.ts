/**
 * sheets.* MCP — parse inputs (no I/O).
 */

import { parseSectionProjectId } from "./section-apps-mcp-pure.js";

export type SheetsListParsed = { projectId: string };
export type SheetsGetParsed = { projectId: string; path?: string };
export type SheetsPutParsed = {
  projectId: string;
  path?: string;
  workbook: unknown;
};

export function parseSheetsListInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: SheetsListParsed } | { ok: false; error: string } {
  const project = parseSectionProjectId(input, mcpProjectId);
  if (!project.ok) return project;
  return { ok: true, value: { projectId: project.value } };
}

export function parseSheetsGetInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: SheetsGetParsed } | { ok: false; error: string } {
  const project = parseSectionProjectId(input, mcpProjectId);
  if (!project.ok) return project;
  const path =
    typeof input.path === "string" ? input.path.trim() : undefined;
  return { ok: true, value: { projectId: project.value, path } };
}

export function parseSheetsPutInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: SheetsPutParsed } | { ok: false; error: string } {
  const project = parseSectionProjectId(input, mcpProjectId);
  if (!project.ok) return project;
  if (input.workbook === undefined) {
    return { ok: false, error: "workbook required" };
  }
  return {
    ok: true,
    value: {
      projectId: project.value,
      path: typeof input.path === "string" ? input.path.trim() : undefined,
      workbook: input.workbook,
    },
  };
}
