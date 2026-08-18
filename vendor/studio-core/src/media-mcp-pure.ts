/**
 * media.* MCP — parse inputs (no I/O).
 */

import {
  parseSectionVaultScope,
  type SectionVaultScopeParsed,
} from "./section-apps-mcp-pure.js";

export type MediaListParsed = SectionVaultScopeParsed & { tag?: string };
export type MediaGetParsed = SectionVaultScopeParsed & { assetId: string };
export type MediaCreateParsed = SectionVaultScopeParsed & {
  filename: string;
  dataBase64: string;
  contentType?: string;
  alt?: string;
  id?: string;
};
export type MediaDeleteParsed = MediaGetParsed;

function assetIdFrom(input: Record<string, unknown>): string {
  if (typeof input.assetId === "string") return input.assetId.trim();
  if (typeof input.id === "string") return input.id.trim();
  return "";
}

export function parseMediaListInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: MediaListParsed } | { ok: false; error: string } {
  const scope = parseSectionVaultScope(input, mcpProjectId);
  if (!scope.ok) return scope;
  const tag = typeof input.tag === "string" ? input.tag.trim() : undefined;
  return { ok: true, value: { ...scope.value, tag: tag || undefined } };
}

export function parseMediaGetInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: MediaGetParsed } | { ok: false; error: string } {
  const scope = parseSectionVaultScope(input, mcpProjectId);
  if (!scope.ok) return scope;
  const assetId = assetIdFrom(input);
  if (!assetId) return { ok: false, error: "assetId required" };
  return { ok: true, value: { ...scope.value, assetId } };
}

export function parseMediaCreateInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: MediaCreateParsed } | { ok: false; error: string } {
  const scope = parseSectionVaultScope(input, mcpProjectId);
  if (!scope.ok) return scope;
  const filename =
    typeof input.filename === "string" ? input.filename.trim() : "";
  const dataBase64 =
    typeof input.dataBase64 === "string" ? input.dataBase64.trim() : "";
  if (!filename) return { ok: false, error: "filename required" };
  if (!dataBase64) return { ok: false, error: "dataBase64 required" };
  return {
    ok: true,
    value: {
      ...scope.value,
      filename,
      dataBase64,
      contentType:
        typeof input.contentType === "string"
          ? input.contentType
          : undefined,
      alt: typeof input.alt === "string" ? input.alt : undefined,
      id: typeof input.id === "string" ? input.id.trim() : undefined,
    },
  };
}

export function parseMediaDeleteInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: MediaDeleteParsed } | { ok: false; error: string } {
  return parseMediaGetInput(input, mcpProjectId);
}
