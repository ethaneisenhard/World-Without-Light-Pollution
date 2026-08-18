/**
 * Workflow triggers editor — draft/filter/list mutations (BrowserUI-shaped).
 * Pure — no DOM/fetch.
 */

import {
  AUTOMATION_EVENT_NAMES,
  type AutomationIntegration,
  type AutomationWorkflowEntry,
} from "./automation-pure.js";

export type WorkflowStatusFilter = "all" | "enabled" | "disabled";

export type WorkflowListFilter = {
  query: string;
  event: string;
  tag: string;
  status: WorkflowStatusFilter;
};

export const EMPTY_WORKFLOW_FILTER: WorkflowListFilter = {
  query: "",
  event: "",
  tag: "",
  status: "all",
};

export type WorkflowDraft = {
  id: string;
  title: string;
  events: string[];
  /** Comma-separated; parsed on save */
  tags: string;
  enabled: boolean;
  n8nMode: "webhook" | "workflowId";
  webhookPath: string;
  workflowId: string;
};

export function draftFromEntry(entry: AutomationWorkflowEntry): WorkflowDraft {
  return {
    id: entry.id,
    title: entry.title,
    events: [...entry.events],
    tags: entry.tags.join(", "),
    enabled: entry.enabled,
    n8nMode: entry.n8n?.mode ?? "webhook",
    webhookPath: entry.n8n?.webhookPath ?? entry.webhookPath ?? "",
    workflowId: entry.n8n?.workflowId ?? "",
  };
}

export function emptyWorkflowDraft(): WorkflowDraft {
  return {
    id: "",
    title: "",
    events: [],
    tags: "",
    enabled: true,
    n8nMode: "webhook",
    webhookPath: "",
    workflowId: "",
  };
}

export function slugFromTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function defaultWebhookPath(id: string): string {
  const slug = id.trim();
  return slug ? `/webhook/${slug}` : "";
}

export function normalizeWorkflowDraft(draft: WorkflowDraft): WorkflowDraft {
  const title = draft.title.trim();
  const id = draft.id.trim() || slugFromTitle(title);
  const webhookPath =
    draft.n8nMode === "webhook"
      ? draft.webhookPath.trim() || defaultWebhookPath(id)
      : draft.webhookPath.trim();
  return { ...draft, title, id, webhookPath };
}

export function parseWorkflowTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Comma-separated event names (search / paste). */
export function parseWorkflowEvents(raw: string): string[] {
  return parseWorkflowTags(raw);
}

export function formatWorkflowEvents(events: readonly string[]): string {
  return events.join(", ");
}

/** Compact multi-select trigger label for workflow events. */
export function workflowEventsTriggerLabel(
  events: readonly string[],
): string {
  if (events.length === 0) return "Select events…";
  if (events.length === 1) return events[0]!;
  return `${events.length} events`;
}

export function draftToWorkflowEntry(draft: WorkflowDraft): AutomationWorkflowEntry {
  const normalized = normalizeWorkflowDraft(draft);
  const tags = parseWorkflowTags(normalized.tags);
  const base = {
    id: normalized.id,
    title: normalized.title,
    events: normalized.events,
    tags,
    enabled: normalized.enabled,
  };
  if (normalized.n8nMode === "workflowId") {
    return {
      ...base,
      n8n: { mode: "workflowId", workflowId: normalized.workflowId.trim() },
    };
  }
  return {
    ...base,
    n8n: { mode: "webhook", webhookPath: normalized.webhookPath.trim() },
  };
}

export function validateWorkflowDraft(draft: WorkflowDraft): string | null {
  const normalized = normalizeWorkflowDraft(draft);
  if (!normalized.title) return "Name is required.";
  if (!normalized.id) return "ID could not be generated from the name.";
  if (normalized.events.length === 0) return "Select at least one event.";
  if (normalized.n8nMode === "webhook" && !normalized.webhookPath.trim()) {
    return "Webhook path is required.";
  }
  if (normalized.n8nMode === "workflowId" && !normalized.workflowId.trim()) {
    return "Workflow ID is required.";
  }
  return null;
}

export function filterWorkflows(
  entries: readonly AutomationWorkflowEntry[],
  filter: WorkflowListFilter,
): AutomationWorkflowEntry[] {
  const q = filter.query.trim().toLowerCase();
  return entries.filter((entry) => {
    if (filter.status === "enabled" && !entry.enabled) return false;
    if (filter.status === "disabled" && entry.enabled) return false;
    if (filter.event && !entry.events.includes(filter.event)) return false;
    if (filter.tag && !entry.tags.includes(filter.tag)) return false;
    if (!q) return true;
    const haystack = [
      entry.id,
      entry.title,
      ...entry.events,
      ...entry.tags,
      entry.n8n?.webhookPath ?? entry.webhookPath ?? "",
      entry.n8n?.workflowId ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function collectWorkflowTags(
  entries: readonly AutomationWorkflowEntry[],
): string[] {
  const tags = new Set<string>();
  for (const entry of entries) {
    for (const tag of entry.tags) tags.add(tag);
  }
  return [...tags].sort((a, b) => a.localeCompare(b));
}

export function collectWorkflowEvents(
  entries: readonly AutomationWorkflowEntry[],
): string[] {
  const events = new Set<string>();
  for (const entry of entries) {
    for (const event of entry.events) events.add(event);
  }
  return [...events].sort((a, b) => a.localeCompare(b));
}

export function resolveWorkflowTarget(entry: AutomationWorkflowEntry): string {
  if (entry.n8n?.mode === "workflowId") return entry.n8n.workflowId ?? "—";
  return entry.n8n?.webhookPath ?? entry.webhookPath ?? "—";
}

export function toggleWorkflowEnabled(
  workflows: readonly AutomationWorkflowEntry[],
  id: string,
  enabled: boolean,
): AutomationWorkflowEntry[] {
  return workflows.map((w) => (w.id === id ? { ...w, enabled } : w));
}

export function deleteWorkflowById(
  workflows: readonly AutomationWorkflowEntry[],
  id: string,
): AutomationWorkflowEntry[] {
  return workflows.filter((w) => w.id !== id);
}

export function upsertWorkflowEntry(
  workflows: readonly AutomationWorkflowEntry[],
  entry: AutomationWorkflowEntry,
  editingId: string | null,
): AutomationWorkflowEntry[] {
  if (editingId) {
    return workflows.map((w) => (w.id === editingId ? entry : w));
  }
  if (workflows.some((w) => w.id === entry.id)) {
    return workflows.map((w) => (w.id === entry.id ? entry : w));
  }
  return [...workflows, entry];
}

export function withWorkflows(
  integration: AutomationIntegration,
  workflows: AutomationWorkflowEntry[],
): AutomationIntegration {
  return { ...integration, workflows };
}

/** Stable JSON for git — BrowserUI-compatible shape + top-level id. */
export function serializeAutomationIntegration(
  integration: AutomationIntegration,
  opts?: { id?: string },
): Record<string, unknown> {
  return {
    id: opts?.id ?? "automation",
    kind: "automation",
    version: integration.version,
    provider: integration.provider,
    connection: {
      baseUrl: integration.connection.baseUrl,
      ...(integration.connection.auth
        ? {
            auth: {
              kind: integration.connection.auth.kind,
              headerName: integration.connection.auth.headerName,
              keyRef: integration.connection.auth.keyRef,
            },
          }
        : {}),
    },
    workflows: integration.workflows.map((w) => ({
      id: w.id,
      title: w.title,
      tags: w.tags,
      events: w.events,
      enabled: w.enabled,
      ...(w.n8n ? { n8n: w.n8n } : {}),
      ...(w.webhookPath ? { webhookPath: w.webhookPath } : {}),
      ...(w.filter ? { filter: w.filter } : {}),
    })),
    inbound: {
      serviceTokenRef: integration.inbound.serviceTokenRef,
      allowedCollections: integration.inbound.allowedCollections,
    },
    dispatch: {
      analyticsForward: integration.dispatch.analyticsForward,
      retry: {
        maxAttempts: integration.dispatch.retry.maxAttempts,
        backoffMs: integration.dispatch.retry.backoffMs,
      },
    },
  };
}

export function isCatalogIntegration(
  row: { id: string; config: Record<string, unknown> },
): boolean {
  const kind = row.config.kind;
  if (kind === "automation") return false;
  if (row.id === "automation") return false;
  return true;
}

export { AUTOMATION_EVENT_NAMES };
