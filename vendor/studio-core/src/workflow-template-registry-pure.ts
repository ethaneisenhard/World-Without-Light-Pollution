/**
 * Workflow agent templates — named step graphs (no visual DAG UI).
 * Studio owns the graph SoT; substrates execute (ADR 0013).
 */

import type { DurableStepKind } from "./durable-runtime-pure.js";
import type { DurableIntentKind } from "./durable-runtime-registry-pure.js";
import { STUDIO_SERVICE_DEFS } from "./studio-service-registry-pure.js";

export const WORKFLOW_TEMPLATE_IDS = [
  "composer-build",
  "ship-with-approve",
  "ticket-build",
] as const;

export type WorkflowTemplateId = (typeof WORKFLOW_TEMPLATE_IDS)[number];

export type WorkflowTemplateStepDraft = {
  id: string;
  kind: DurableStepKind;
  label?: string;
  action?: string;
  input?: Record<string, unknown>;
  event?: string;
};

export type WorkflowTemplateBuildInput = {
  cardId?: string;
  title?: string;
  body?: string;
  projectId?: string;
};

export type WorkflowTemplate = {
  id: WorkflowTemplateId;
  label: string;
  description: string;
  intentKind: DurableIntentKind;
  buildSteps: (input: WorkflowTemplateBuildInput) => WorkflowTemplateStepDraft[];
  /**
   * Path under hosted n8n for “Edit in n8n” (Studio does not own the DAG canvas).
   * Absolute URL paths only — e.g. `/home/workflows` or `/workflow/new`.
   */
  n8nEditPath?: string;
};

/** Composer path — build immediately, no Approve gate. */
const COMPOSER_BUILD_STEPS: WorkflowTemplateStepDraft[] = [
  {
    id: "build",
    kind: "run",
    action: "durable.build",
    label: "Build",
  },
  {
    id: "finish",
    kind: "emit",
    event: "task/done",
    label: "Finish",
  },
];

const SHIP_WITH_APPROVE_STEPS: WorkflowTemplateStepDraft[] = [
  {
    id: "prep",
    kind: "run",
    action: "durable.prep",
    label: "Prepare",
  },
  {
    id: "gate",
    kind: "wait",
    event: "task/approved",
    label: "Approve",
  },
  {
    id: "finish",
    kind: "emit",
    event: "task/done",
    label: "Finish",
  },
];

function stepsForTicket(input: WorkflowTemplateBuildInput): WorkflowTemplateStepDraft[] {
  const meta = {
    cardId: input.cardId ?? null,
    title: input.title ?? null,
    projectId: input.projectId ?? null,
  };
  return SHIP_WITH_APPROVE_STEPS.map((s) =>
    s.kind === "run"
      ? { ...s, input: { ...meta, bodyPreview: (input.body ?? "").slice(0, 240) } }
      : s,
  );
}

export const WORKFLOW_TEMPLATE_REGISTRY: Record<
  WorkflowTemplateId,
  WorkflowTemplate
> = {
  "composer-build": {
    id: "composer-build",
    label: "Build",
    description: "Build → finish (composer path — no Approve gate)",
    intentKind: "background",
    buildSteps: () => COMPOSER_BUILD_STEPS.map((s) => ({ ...s })),
    n8nEditPath: "/workflow/new",
  },
  "ship-with-approve": {
    id: "ship-with-approve",
    label: "Ship with Approve",
    description: "Prepare → Approve checkpoint → finish emit",
    intentKind: "background",
    buildSteps: (input) => stepsForTicket(input),
    n8nEditPath: "/workflow/new",
  },
  "ticket-build": {
    id: "ticket-build",
    label: "Ticket build",
    description:
      "Roadmap ticket workflow (stub steps this wave; harness-in-step next)",
    intentKind: "background",
    buildSteps: (input) => stepsForTicket(input),
    n8nEditPath: "/workflow/new",
  },
};

/** Roadmap / HITL default. */
export const DEFAULT_WORKFLOW_TEMPLATE_ID: WorkflowTemplateId =
  "ship-with-approve";

/** Composer Workflow mode — build now, then Edit in n8n. */
export const COMPOSER_WORKFLOW_TEMPLATE_ID: WorkflowTemplateId =
  "composer-build";

export function isWorkflowTemplateId(
  value: unknown,
): value is WorkflowTemplateId {
  return (
    typeof value === "string" &&
    (WORKFLOW_TEMPLATE_IDS as readonly string[]).includes(value)
  );
}

export function getWorkflowTemplate(
  id: string | undefined | null,
): WorkflowTemplate {
  if (id && isWorkflowTemplateId(id)) {
    return WORKFLOW_TEMPLATE_REGISTRY[id];
  }
  return WORKFLOW_TEMPLATE_REGISTRY[DEFAULT_WORKFLOW_TEMPLATE_ID];
}

export function resolveWorkflowTemplateId(
  raw: string | undefined | null,
): WorkflowTemplateId {
  return isWorkflowTemplateId(raw) ? raw : DEFAULT_WORKFLOW_TEMPLATE_ID;
}

/** Intent line for a roadmap card + template. */
export function workflowIntentFromRoadmapCard(input: {
  title: string;
  body?: string;
  templateId?: string | null;
}): string {
  const tmpl = getWorkflowTemplate(input.templateId);
  const title = input.title.trim() || "Untitled ticket";
  const body = (input.body ?? "").trim();
  const snippet = body ? ` — ${body.slice(0, 80)}${body.length > 80 ? "…" : ""}` : "";
  return `[${tmpl.label}] ${title}${snippet}`;
}

/** Absolute n8n editor URL for a template (visual authoring lives in n8n). */
export function workflowTemplateN8nEditUrl(
  templateId: string | null | undefined,
  n8nBaseUrl: string,
): string {
  const base =
    n8nBaseUrl.trim().replace(/\/+$/, "") ||
    STUDIO_SERVICE_DEFS.n8n.defaultUrl.replace(/\/+$/, "");
  const tmpl = getWorkflowTemplate(templateId);
  const path = tmpl.n8nEditPath?.trim() || "/home/workflows";
  const rel = path.startsWith("/") ? path : `/${path}`;
  return `${base}${rel}`;
}
