/**
 * integrations / runtimes / services / convert MCP parse (no I/O).
 */

import { parseSectionProjectId } from "./section-apps-mcp-pure.js";

export type IntegrationsListParsed = { projectId: string };
export type IntegrationsWriteParsed = {
  projectId: string;
  id: string;
  kind?: string;
  config: Record<string, unknown>;
};
export type IntegrationsDeleteParsed = { projectId: string; id: string };

export type ServicesActionParsed = {
  serviceId: string;
  action: "start" | "stop" | "restart";
};

export type ConvertRunParsed = {
  presetId: string;
  inputPath?: string;
  inputBase64?: string;
  inputFilename?: string;
  destScope: "studio" | "project";
  projectId?: string | null;
};

export function parseIntegrationsListInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: IntegrationsListParsed } | { ok: false; error: string } {
  const project = parseSectionProjectId(input, mcpProjectId);
  if (!project.ok) return project;
  return { ok: true, value: { projectId: project.value } };
}

export function parseIntegrationsWriteInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: IntegrationsWriteParsed } | { ok: false; error: string } {
  const project = parseSectionProjectId(input, mcpProjectId);
  if (!project.ok) return project;
  const id = typeof input.id === "string" ? input.id.trim() : "";
  if (!id) return { ok: false, error: "id required" };
  if (!input.config || typeof input.config !== "object" || Array.isArray(input.config)) {
    return { ok: false, error: "config object required" };
  }
  return {
    ok: true,
    value: {
      projectId: project.value,
      id,
      kind: typeof input.kind === "string" ? input.kind.trim() : undefined,
      config: input.config as Record<string, unknown>,
    },
  };
}

export function parseIntegrationsDeleteInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: IntegrationsDeleteParsed } | { ok: false; error: string } {
  const project = parseSectionProjectId(input, mcpProjectId);
  if (!project.ok) return project;
  const id = typeof input.id === "string" ? input.id.trim() : "";
  if (!id) return { ok: false, error: "id required" };
  return { ok: true, value: { projectId: project.value, id } };
}

export function parseServicesActionInput(
  input: Record<string, unknown>,
  action: "start" | "stop" | "restart",
): { ok: true; value: ServicesActionParsed } | { ok: false; error: string } {
  const serviceId =
    typeof input.serviceId === "string"
      ? input.serviceId.trim()
      : typeof input.id === "string"
        ? input.id.trim()
        : "";
  if (!serviceId) return { ok: false, error: "serviceId required" };
  return { ok: true, value: { serviceId, action } };
}

export function parseConvertRunInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: ConvertRunParsed } | { ok: false; error: string } {
  const presetId =
    typeof input.presetId === "string" ? input.presetId.trim() : "";
  if (!presetId) return { ok: false, error: "presetId required" };
  const destScope =
    input.destScope === "project" ? "project" : "studio";
  let projectId: string | null | undefined;
  if (destScope === "project") {
    const project = parseSectionProjectId(input, mcpProjectId);
    if (!project.ok) return project;
    projectId = project.value;
  } else if (typeof input.projectId === "string") {
    projectId = input.projectId.trim();
  }
  return {
    ok: true,
    value: {
      presetId,
      inputPath:
        typeof input.inputPath === "string" ? input.inputPath : undefined,
      inputBase64:
        typeof input.inputBase64 === "string" ? input.inputBase64 : undefined,
      inputFilename:
        typeof input.inputFilename === "string"
          ? input.inputFilename
          : undefined,
      destScope,
      projectId,
    },
  };
}
