/**
 * Automation registry + event matching (BrowserUI-shaped).
 * Pure — no fetch/fs. Orchestrator posts webhooks with injected deps.
 */

import { STUDIO_SERVICE_DEFS } from "./studio-service-registry-pure.js";

export const AUTOMATION_EVENT_NAMES = [
  "content.page.published",
  "content.page.unpublished",
  "record.blog.published",
  "record.blog.scheduled",
  "form.submitted",
  "auth.user.registered",
  "auth.user.login",
  "consent.updated",
  "analytics.event",
  "workflow.manual",
  "content.scheduled",
  "email.campaign.sent",
] as const;

export type AutomationEventName = (typeof AUTOMATION_EVENT_NAMES)[number];

export const AUTOMATION_EVENT_SPEC = "glassbox-studio.automation.event@1" as const;

export type AutomationProvider = "n8n" | "webhook";

export type AutomationConnectionAuth = {
  kind: "header";
  headerName: string;
  /** e.g. env:N8N_API_KEY — resolved by orchestrator */
  keyRef: string;
};

export type AutomationConnection = {
  baseUrl: string;
  auth?: AutomationConnectionAuth;
};

export type AutomationN8nTarget = {
  mode: "webhook" | "workflowId";
  webhookPath?: string;
  workflowId?: string;
};

export type AutomationWorkflowFilter = {
  formId?: string;
  pageRef?: string;
  blogRecordId?: string;
};

export type AutomationWorkflowEntry = {
  id: string;
  title: string;
  tags: string[];
  events: string[];
  enabled: boolean;
  n8n?: AutomationN8nTarget;
  webhookPath?: string;
  filter?: AutomationWorkflowFilter;
};

export type AutomationInbound = {
  serviceTokenRef: string;
  allowedCollections: string[];
};

export type AutomationDispatch = {
  analyticsForward: string[];
  retry: { maxAttempts: number; backoffMs: number };
};

export type AutomationIntegration = {
  kind: "automation";
  version: string;
  provider: AutomationProvider;
  connection: AutomationConnection;
  workflows: AutomationWorkflowEntry[];
  inbound: AutomationInbound;
  dispatch: AutomationDispatch;
};

export type AutomationEventEnvelope = {
  spec: typeof AUTOMATION_EVENT_SPEC;
  event: AutomationEventName;
  eventId: string;
  projectId: string;
  timestamp: string;
  workflowTags: string[];
  payload: Record<string, unknown>;
};

export type WorkflowDispatchTarget = {
  workflow: AutomationWorkflowEntry;
  url: string;
};

const EVENT_SET = new Set<string>(AUTOMATION_EVENT_NAMES);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim()).map((x) => x.trim());
}

function parseN8nTarget(raw: unknown): AutomationN8nTarget | undefined {
  if (!isRecord(raw)) return undefined;
  const mode = raw.mode === "workflowId" ? "workflowId" : "webhook";
  const webhookPath = asString(raw.webhookPath);
  const workflowId = asString(raw.workflowId);
  if (mode === "webhook" && !webhookPath) return undefined;
  if (mode === "workflowId" && !workflowId) return undefined;
  return {
    mode,
    ...(webhookPath ? { webhookPath } : {}),
    ...(workflowId ? { workflowId } : {}),
  };
}

function parseWorkflow(raw: unknown): AutomationWorkflowEntry | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id);
  const title = asString(raw.title);
  if (!id || !title) return null;
  const events = asStringArray(raw.events);
  if (events.length === 0) return null;
  const n8n = parseN8nTarget(raw.n8n);
  const webhookPath = asString(raw.webhookPath);
  if (!n8n && !webhookPath) return null;
  const filterRaw = raw.filter;
  let filter: AutomationWorkflowFilter | undefined;
  if (isRecord(filterRaw)) {
    filter = {
      ...(asString(filterRaw.formId) ? { formId: asString(filterRaw.formId) } : {}),
      ...(asString(filterRaw.pageRef) ? { pageRef: asString(filterRaw.pageRef) } : {}),
      ...(asString(filterRaw.blogRecordId)
        ? { blogRecordId: asString(filterRaw.blogRecordId) }
        : {}),
    };
  }
  return {
    id,
    title,
    tags: asStringArray(raw.tags),
    events,
    enabled: raw.enabled !== false,
    ...(n8n ? { n8n } : {}),
    ...(webhookPath ? { webhookPath } : {}),
    ...(filter && Object.keys(filter).length > 0 ? { filter } : {}),
  };
}

/** Parse integrations/automation.json (or equivalent). Returns null if invalid. */
export function parseAutomationIntegration(raw: unknown): AutomationIntegration | null {
  if (!isRecord(raw)) return null;
  if (raw.kind !== "automation") return null;
  if (!isRecord(raw.connection)) return null;
  const baseUrl = asString(raw.connection.baseUrl);
  if (!baseUrl) return null;

  let auth: AutomationConnectionAuth | undefined;
  if (isRecord(raw.connection.auth)) {
    const keyRef = asString(raw.connection.auth.keyRef);
    if (keyRef) {
      auth = {
        kind: "header",
        headerName: asString(raw.connection.auth.headerName) ?? "Authorization",
        keyRef,
      };
    }
  }

  const workflows: AutomationWorkflowEntry[] = [];
  if (Array.isArray(raw.workflows)) {
    for (const w of raw.workflows) {
      const parsed = parseWorkflow(w);
      if (parsed) workflows.push(parsed);
    }
  }

  if (!isRecord(raw.inbound)) return null;
  const serviceTokenRef = asString(raw.inbound.serviceTokenRef);
  if (!serviceTokenRef) return null;

  const retryRaw = isRecord(raw.dispatch) && isRecord(raw.dispatch.retry) ? raw.dispatch.retry : {};
  const maxAttempts =
    typeof retryRaw.maxAttempts === "number" && retryRaw.maxAttempts >= 1
      ? Math.min(10, Math.floor(retryRaw.maxAttempts))
      : 3;
  const backoffMs =
    typeof retryRaw.backoffMs === "number" && retryRaw.backoffMs >= 0
      ? Math.floor(retryRaw.backoffMs)
      : 1000;

  return {
    kind: "automation",
    version: asString(raw.version) ?? "1.0.0",
    provider: raw.provider === "webhook" ? "webhook" : "n8n",
    connection: {
      baseUrl,
      ...(auth ? { auth } : {}),
    },
    workflows,
    inbound: {
      serviceTokenRef,
      allowedCollections: asStringArray(raw.inbound.allowedCollections),
    },
    dispatch: {
      analyticsForward:
        isRecord(raw.dispatch) ? asStringArray(raw.dispatch.analyticsForward) : [],
      retry: { maxAttempts, backoffMs },
    },
  };
}

export function isAutomationEventName(raw: string): raw is AutomationEventName {
  return EVENT_SET.has(raw);
}

export function createAutomationEnvelope(input: {
  event: AutomationEventName;
  projectId: string;
  payload?: Record<string, unknown>;
  workflowTags?: string[];
  eventId?: string;
  timestamp?: string;
}): AutomationEventEnvelope {
  return {
    spec: AUTOMATION_EVENT_SPEC,
    event: input.event,
    eventId: input.eventId ?? globalThis.crypto.randomUUID(),
    projectId: input.projectId,
    timestamp: input.timestamp ?? new Date().toISOString(),
    workflowTags: input.workflowTags ?? [],
    payload: input.payload ?? {},
  };
}

export function parseAutomationEnvelope(raw: unknown): AutomationEventEnvelope | null {
  if (!isRecord(raw)) return null;
  if (raw.spec !== AUTOMATION_EVENT_SPEC) return null;
  const event = asString(raw.event);
  if (!event || !isAutomationEventName(event)) return null;
  const eventId = asString(raw.eventId);
  const projectId = asString(raw.projectId);
  const timestamp = asString(raw.timestamp);
  if (!eventId || !projectId || !timestamp) return null;
  return {
    spec: AUTOMATION_EVENT_SPEC,
    event,
    eventId,
    projectId,
    timestamp,
    workflowTags: asStringArray(raw.workflowTags),
    payload: isRecord(raw.payload) ? raw.payload : {},
  };
}

export function resolveWebhookUrl(
  integration: AutomationIntegration,
  workflow: AutomationWorkflowEntry,
): string | null {
  const base = integration.connection.baseUrl.replace(/\/+$/, "");
  const path = workflow.n8n?.webhookPath ?? workflow.webhookPath ?? null;
  if (!path) return null;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function workflowMatchesEvent(
  workflow: AutomationWorkflowEntry,
  envelope: AutomationEventEnvelope,
): boolean {
  if (!workflow.enabled) return false;
  if (!workflow.events.includes(envelope.event)) return false;
  const filter = workflow.filter;
  if (!filter) return true;
  const payload = envelope.payload;
  if (filter.formId && payload.formId !== filter.formId) return false;
  if (filter.pageRef && payload.pageRef !== filter.pageRef) return false;
  if (filter.blogRecordId && payload.blogRecordId !== filter.blogRecordId) return false;
  return true;
}

export function matchWorkflowTargets(
  integration: AutomationIntegration,
  envelope: AutomationEventEnvelope,
): WorkflowDispatchTarget[] {
  const out: WorkflowDispatchTarget[] = [];
  for (const workflow of integration.workflows) {
    if (!workflowMatchesEvent(workflow, envelope)) continue;
    const url = resolveWebhookUrl(integration, workflow);
    if (!url) continue;
    out.push({ workflow, url });
  }
  return out;
}

/** Local n8n default when env unset — same SoT as Studio service registry. */
export const DEFAULT_N8N_BASE_URL = STUDIO_SERVICE_DEFS.n8n.defaultUrl.replace(
  /\/+$/,
  "",
);

/**
 * Empty git registry for projects that have not created integrations/automation.json yet.
 * Same shape as template — zero workflows; UI can paint the triggers table immediately.
 */
export function emptyAutomationIntegration(opts?: {
  baseUrl?: string;
}): AutomationIntegration {
  const baseUrl = (opts?.baseUrl?.trim() || DEFAULT_N8N_BASE_URL).replace(
    /\/+$/,
    "",
  );
  return {
    kind: "automation",
    version: "1.0.0",
    provider: "n8n",
    connection: {
      baseUrl,
      auth: {
        kind: "header",
        headerName: "Authorization",
        keyRef: "env:N8N_API_KEY",
      },
    },
    workflows: [],
    inbound: {
      serviceTokenRef: "env:AGENT_STUDIO_AUTOMATION_TOKEN",
      allowedCollections: [],
    },
    dispatch: {
      analyticsForward: [],
      retry: { maxAttempts: 3, backoffMs: 1000 },
    },
  };
}

/** Prefer local override for test-fire (BrowserUI dual-target). */
export function resolveAutomationBaseUrl(
  configuredBaseUrl: string,
  localBaseUrl?: string | null,
): { baseUrl: string; targetLabel: "local" | "config" } {
  if (localBaseUrl?.trim()) {
    return { baseUrl: localBaseUrl.replace(/\/+$/, ""), targetLabel: "local" };
  }
  return {
    baseUrl: configuredBaseUrl.replace(/\/+$/, ""),
    targetLabel: "config",
  };
}
