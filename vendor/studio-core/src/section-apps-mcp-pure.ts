/**
 * Shared scope resolution for section-app MCP tools (notes / roadmap / …).
 * No I/O.
 */

import { isStudioRootChatId } from "./chat-pure.js";

export type SectionVaultScope = "studio" | "project";

export type SectionVaultScopeParsed = {
  scope: SectionVaultScope;
  projectId: string | null;
};

/**
 * Resolve vault/board scope from tool input + MCP chat scope.
 * `_studio` / global → studio unless input forces project + projectId.
 */
export function parseSectionVaultScope(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: SectionVaultScopeParsed } | { ok: false; error: string } {
  const rawScope =
    typeof input.scope === "string" ? input.scope.trim().toLowerCase() : "";
  let scope: SectionVaultScope | null =
    rawScope === "studio" || rawScope === "project"
      ? (rawScope as SectionVaultScope)
      : null;

  const rawPid =
    typeof input.projectId === "string" ? input.projectId.trim() : undefined;
  const mcpIsGlobal = isStudioRootChatId(mcpProjectId) || !mcpProjectId.trim();

  if (!scope) {
    scope = mcpIsGlobal ? "studio" : "project";
  }

  if (scope === "studio") {
    return { ok: true, value: { scope: "studio", projectId: null } };
  }

  const projectId =
    rawPid && rawPid.length > 0 && !isStudioRootChatId(rawPid)
      ? rawPid
      : mcpIsGlobal
        ? null
        : mcpProjectId.trim();

  if (!projectId) {
    return {
      ok: false,
      error: "projectId required when scope=project (or run from a workspace chat)",
    };
  }
  return { ok: true, value: { scope: "project", projectId } };
}

/**
 * Resolve a required workspace projectId (forms / sheets / data).
 * Uses input.projectId, else MCP chat project (not `_studio`).
 */
export function parseSectionProjectId(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const raw =
    typeof input.projectId === "string" ? input.projectId.trim() : "";
  if (raw && !isStudioRootChatId(raw)) {
    return { ok: true, value: raw };
  }
  if (mcpProjectId.trim() && !isStudioRootChatId(mcpProjectId)) {
    return { ok: true, value: mcpProjectId.trim() };
  }
  return {
    ok: false,
    error: "projectId required (pass projectId or run from a workspace chat)",
  };
}
