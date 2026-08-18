/**
 * forms.* MCP — parse inputs (no I/O).
 */

import { parseSectionProjectId } from "./section-apps-mcp-pure.js";

export type FormsListParsed = {
  projectId: string;
  formId?: string;
  destination?: string;
};
export type FormsGetParsed = { projectId: string; submissionId: string; destination?: string };
export type FormsSubmitParsed = {
  projectId: string;
  formId: string;
  payload: Record<string, unknown>;
  destination?: string;
};

export function parseFormsListInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: FormsListParsed } | { ok: false; error: string } {
  const project = parseSectionProjectId(input, mcpProjectId);
  if (!project.ok) return project;
  return {
    ok: true,
    value: {
      projectId: project.value,
      formId:
        typeof input.formId === "string" ? input.formId.trim() : undefined,
      destination:
        typeof input.destination === "string"
          ? input.destination.trim()
          : undefined,
    },
  };
}

export function parseFormsGetInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: FormsGetParsed } | { ok: false; error: string } {
  const project = parseSectionProjectId(input, mcpProjectId);
  if (!project.ok) return project;
  const submissionId =
    typeof input.submissionId === "string"
      ? input.submissionId.trim()
      : typeof input.id === "string"
        ? input.id.trim()
        : "";
  if (!submissionId) return { ok: false, error: "submissionId required" };
  return {
    ok: true,
    value: {
      projectId: project.value,
      submissionId,
      destination:
        typeof input.destination === "string"
          ? input.destination.trim()
          : undefined,
    },
  };
}

export function parseFormsSubmitInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: FormsSubmitParsed } | { ok: false; error: string } {
  const project = parseSectionProjectId(input, mcpProjectId);
  if (!project.ok) return project;
  const formId = typeof input.formId === "string" ? input.formId.trim() : "";
  if (!formId) return { ok: false, error: "formId required" };
  if (!input.payload || typeof input.payload !== "object" || Array.isArray(input.payload)) {
    return { ok: false, error: "payload object required" };
  }
  return {
    ok: true,
    value: {
      projectId: project.value,
      formId,
      payload: input.payload as Record<string, unknown>,
      destination:
        typeof input.destination === "string"
          ? input.destination.trim()
          : undefined,
    },
  };
}
