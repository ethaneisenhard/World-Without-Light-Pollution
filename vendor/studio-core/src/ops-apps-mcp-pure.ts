/**
 * notifications / workflows / email / analytics MCP parse (no I/O).
 */

import { parseSectionProjectId } from "./section-apps-mcp-pure.js";
import { isStudioRootChatId } from "./chat-pure.js";
import { parseDesignStudioSurfaceInput } from "./design-studio-surfaces-pure.js";

export type NotificationsListParsed = {
  limit?: number;
  unreadOnly?: boolean;
  source?: string;
  projectId?: string | null;
};
export type NotificationsGetParsed = { notificationId: string };
export type NotificationsEmitParsed = { envelope: Record<string, unknown> };
export type NotificationsMarkReadParsed = { ids: string[] };

export type WorkflowsScopeParsed = {
  projectId: string;
  /** When true, use studio-global automation root (~/.glassbox-studio). */
  studioGlobal: boolean;
};

export type EmailCampaignsParsed = { projectId: string };
export type EmailCampaignGetParsed = { projectId: string; campaignId: string };
export type EmailCampaignWriteParsed = {
  projectId: string;
  campaign: Record<string, unknown>;
};

export type AnalyticsEventsParsed = {
  projectId: string;
  destination?: string;
  limit?: number;
};
export type AnalyticsIngestParsed = {
  projectId: string;
  destination?: string;
  name: string;
  props?: Record<string, unknown>;
};

export function parseNotificationsListInput(
  input: Record<string, unknown>,
): { ok: true; value: NotificationsListParsed } | { ok: false; error: string } {
  const out: NotificationsListParsed = {};
  if (typeof input.limit === "number" && Number.isFinite(input.limit)) {
    out.limit = Math.min(500, Math.max(1, Math.floor(input.limit)));
  }
  if (input.unreadOnly === true || input.unread === true) out.unreadOnly = true;
  if (typeof input.source === "string" && input.source.trim()) {
    out.source = input.source.trim();
  }
  if (input.projectId === null || input.projectId === "") {
    out.projectId = null;
  } else if (typeof input.projectId === "string") {
    out.projectId = input.projectId.trim();
  }
  return { ok: true, value: out };
}

export function parseNotificationsGetInput(
  input: Record<string, unknown>,
): { ok: true; value: NotificationsGetParsed } | { ok: false; error: string } {
  const notificationId =
    typeof input.notificationId === "string"
      ? input.notificationId.trim()
      : typeof input.id === "string"
        ? input.id.trim()
        : "";
  if (!notificationId) return { ok: false, error: "notificationId required" };
  return { ok: true, value: { notificationId } };
}

export function parseNotificationsEmitInput(
  input: Record<string, unknown>,
): { ok: true; value: NotificationsEmitParsed } | { ok: false; error: string } {
  const envelope =
    input.envelope && typeof input.envelope === "object" && !Array.isArray(input.envelope)
      ? (input.envelope as Record<string, unknown>)
      : (input as Record<string, unknown>);
  if (typeof envelope.title !== "string" || !envelope.title.trim()) {
    return { ok: false, error: "title required (or envelope.title)" };
  }
  if (typeof envelope.source !== "string" || !envelope.source.trim()) {
    return { ok: false, error: "source required" };
  }
  return { ok: true, value: { envelope } };
}

export function parseNotificationsMarkReadInput(
  input: Record<string, unknown>,
): { ok: true; value: NotificationsMarkReadParsed } | { ok: false; error: string } {
  const ids = Array.isArray(input.ids)
    ? input.ids.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : typeof input.notificationId === "string"
      ? [input.notificationId.trim()]
      : typeof input.id === "string"
        ? [input.id.trim()]
        : [];
  if (!ids.length) return { ok: false, error: "ids required" };
  return { ok: true, value: { ids } };
}

/** Workflows: Global chat → studio automation; workspace → project. */
export function parseWorkflowsScopeInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: WorkflowsScopeParsed } | { ok: false; error: string } {
  const raw =
    typeof input.projectId === "string" ? input.projectId.trim() : "";
  if (raw && isStudioRootChatId(raw)) {
    return { ok: true, value: { projectId: raw, studioGlobal: true } };
  }
  if (raw) {
    return { ok: true, value: { projectId: raw, studioGlobal: false } };
  }
  if (isStudioRootChatId(mcpProjectId) || !mcpProjectId.trim()) {
    return {
      ok: true,
      value: { projectId: "_studio", studioGlobal: true },
    };
  }
  return {
    ok: true,
    value: { projectId: mcpProjectId.trim(), studioGlobal: false },
  };
}

export function parseEmailCampaignsInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: EmailCampaignsParsed } | { ok: false; error: string } {
  const project = parseSectionProjectId(input, mcpProjectId);
  if (!project.ok) return project;
  return { ok: true, value: { projectId: project.value } };
}

export function parseEmailCampaignGetInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: EmailCampaignGetParsed } | { ok: false; error: string } {
  const project = parseSectionProjectId(input, mcpProjectId);
  if (!project.ok) return project;
  const campaignId =
    typeof input.campaignId === "string"
      ? input.campaignId.trim()
      : typeof input.id === "string"
        ? input.id.trim()
        : "";
  if (!campaignId) return { ok: false, error: "campaignId required" };
  return { ok: true, value: { projectId: project.value, campaignId } };
}

export function parseEmailCampaignWriteInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: EmailCampaignWriteParsed } | { ok: false; error: string } {
  const project = parseSectionProjectId(input, mcpProjectId);
  if (!project.ok) return project;
  const campaign =
    input.campaign && typeof input.campaign === "object" && !Array.isArray(input.campaign)
      ? (input.campaign as Record<string, unknown>)
      : null;
  if (!campaign) return { ok: false, error: "campaign object required" };
  return { ok: true, value: { projectId: project.value, campaign } };
}

export function parseAnalyticsEventsInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: AnalyticsEventsParsed } | { ok: false; error: string } {
  const project = parseSectionProjectId(input, mcpProjectId);
  if (!project.ok) return project;
  const out: AnalyticsEventsParsed = { projectId: project.value };
  if (typeof input.destination === "string") out.destination = input.destination.trim();
  if (typeof input.destId === "string") out.destination = input.destId.trim();
  if (typeof input.limit === "number" && Number.isFinite(input.limit)) {
    out.limit = Math.min(5000, Math.max(1, Math.floor(input.limit)));
  }
  return { ok: true, value: out };
}

export function parseAnalyticsIngestInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: AnalyticsIngestParsed } | { ok: false; error: string } {
  const project = parseSectionProjectId(input, mcpProjectId);
  if (!project.ok) return project;
  const name =
    typeof input.event_name === "string"
      ? input.event_name.trim()
      : typeof input.name === "string"
        ? input.name.trim()
        : "";
  if (!name) return { ok: false, error: "name or event_name required" };
  const props =
    input.properties && typeof input.properties === "object" && !Array.isArray(input.properties)
      ? (input.properties as Record<string, unknown>)
      : input.props && typeof input.props === "object" && !Array.isArray(input.props)
        ? (input.props as Record<string, unknown>)
        : undefined;
  return {
    ok: true,
    value: {
      projectId: project.value,
      destination:
        typeof input.destination === "string"
          ? input.destination.trim()
          : typeof input.destId === "string"
            ? input.destId.trim()
            : undefined,
      name,
      props,
    },
  };
}

export type EmailCampaignSendParsed = EmailCampaignGetParsed & {
  to?: string | string[];
  from?: string;
  subject?: string;
  text?: string;
  html?: string;
  vars?: Record<string, string>;
  dryRun: boolean;
};

export type AnalyticsFunnelsParsed = { projectId: string };
export type AnalyticsFunnelsSetParsed = {
  projectId: string;
  funnels: unknown[];
};

export type WorkflowsRunParsed = WorkflowsScopeParsed & {
  workflowId: string;
  payload?: Record<string, unknown>;
  target?: "local" | "config";
};

export type OpsListParsed = {
  status?: "queued" | "running" | "blocked" | "done" | "cancelled";
  projectId?: string;
};

export type OpsJobIdParsed = { jobId: string };

export type OpsUpsertParsed = {
  id: string;
  title: string;
  status?: "queued" | "running" | "blocked" | "done" | "cancelled";
  projectId?: string | null;
  harnessId?: string;
  modelId?: string;
  source?: string;
  statusLine?: string;
};

export type DesignOpenParsed = {
  ds: "home" | "system" | "components" | "chrome";
};

export function parseEmailCampaignSendInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: EmailCampaignSendParsed } | { ok: false; error: string } {
  const base = parseEmailCampaignGetInput(input, mcpProjectId);
  if (!base.ok) return base;
  const toRaw = input.to;
  let to: string | string[] | undefined;
  if (typeof toRaw === "string" && toRaw.trim()) to = toRaw.trim();
  else if (Array.isArray(toRaw)) {
    const list = toRaw.filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0,
    );
    if (list.length) to = list;
  }
  const vars =
    input.vars && typeof input.vars === "object" && !Array.isArray(input.vars)
      ? Object.fromEntries(
          Object.entries(input.vars as Record<string, unknown>).filter(
            (e): e is [string, string] => typeof e[1] === "string",
          ),
        )
      : undefined;
  return {
    ok: true,
    value: {
      ...base.value,
      ...(to ? { to } : {}),
      ...(typeof input.from === "string" ? { from: input.from } : {}),
      ...(typeof input.subject === "string" ? { subject: input.subject } : {}),
      ...(typeof input.text === "string" ? { text: input.text } : {}),
      ...(typeof input.html === "string" ? { html: input.html } : {}),
      ...(vars ? { vars } : {}),
      dryRun: input.dryRun !== false,
    },
  };
}

export function parseAnalyticsFunnelsInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: AnalyticsFunnelsParsed } | { ok: false; error: string } {
  const project = parseSectionProjectId(input, mcpProjectId);
  if (!project.ok) return project;
  return { ok: true, value: { projectId: project.value } };
}

export function parseAnalyticsFunnelsSetInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: AnalyticsFunnelsSetParsed } | { ok: false; error: string } {
  const project = parseSectionProjectId(input, mcpProjectId);
  if (!project.ok) return project;
  if (!Array.isArray(input.funnels)) {
    return { ok: false, error: "funnels array required" };
  }
  return { ok: true, value: { projectId: project.value, funnels: input.funnels } };
}

export function parseWorkflowsRunInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: WorkflowsRunParsed } | { ok: false; error: string } {
  const scope = parseWorkflowsScopeInput(input, mcpProjectId);
  if (!scope.ok) return scope;
  const workflowId =
    typeof input.workflowId === "string"
      ? input.workflowId.trim()
      : typeof input.id === "string"
        ? input.id.trim()
        : "";
  if (!workflowId) return { ok: false, error: "workflowId required" };
  const payload =
    input.payload && typeof input.payload === "object" && !Array.isArray(input.payload)
      ? (input.payload as Record<string, unknown>)
      : undefined;
  const targetRaw = typeof input.target === "string" ? input.target.trim() : "";
  const target =
    targetRaw === "local" || targetRaw === "config" ? targetRaw : undefined;
  return {
    ok: true,
    value: {
      ...scope.value,
      workflowId,
      ...(payload ? { payload } : {}),
      ...(target ? { target } : {}),
    },
  };
}

function parseOpsJobStatus(
  raw: unknown,
): "queued" | "running" | "blocked" | "done" | "cancelled" | undefined {
  if (typeof raw !== "string") return undefined;
  switch (raw.trim()) {
    case "queued":
    case "running":
    case "blocked":
    case "done":
    case "cancelled":
      return raw.trim() as
        | "queued"
        | "running"
        | "blocked"
        | "done"
        | "cancelled";
    default:
      return undefined;
  }
}

export function parseOpsListInput(
  input: Record<string, unknown>,
): { ok: true; value: OpsListParsed } | { ok: false; error: string } {
  const out: OpsListParsed = {};
  const status = parseOpsJobStatus(input.status);
  if (typeof input.status === "string" && input.status.trim() && !status) {
    return {
      ok: false,
      error: "Unknown status (queued|running|blocked|done|cancelled)",
    };
  }
  if (status) out.status = status;
  if (typeof input.projectId === "string" && input.projectId.trim()) {
    out.projectId = input.projectId.trim();
  }
  return { ok: true, value: out };
}

export function parseOpsJobIdInput(
  input: Record<string, unknown>,
): { ok: true; value: OpsJobIdParsed } | { ok: false; error: string } {
  const jobId =
    typeof input.jobId === "string"
      ? input.jobId.trim()
      : typeof input.id === "string"
        ? input.id.trim()
        : "";
  if (!jobId) return { ok: false, error: "jobId required" };
  return { ok: true, value: { jobId } };
}

export function parseOpsUpsertInput(
  input: Record<string, unknown>,
): { ok: true; value: OpsUpsertParsed } | { ok: false; error: string } {
  const id = typeof input.id === "string" ? input.id.trim() : "";
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!id || !title) return { ok: false, error: "id and title required" };
  const out: OpsUpsertParsed = { id, title };
  const status = parseOpsJobStatus(input.status);
  if (status) out.status = status;
  if (input.projectId === null) out.projectId = null;
  else if (typeof input.projectId === "string") out.projectId = input.projectId.trim();
  if (typeof input.harnessId === "string") out.harnessId = input.harnessId.trim();
  if (typeof input.modelId === "string") out.modelId = input.modelId.trim();
  if (typeof input.source === "string") out.source = input.source.trim();
  if (typeof input.statusLine === "string") out.statusLine = input.statusLine;
  return { ok: true, value: out };
}

export function parseDesignOpenInput(
  input: Record<string, unknown>,
): { ok: true; value: DesignOpenParsed } | { ok: false; error: string } {
  const parsed = parseDesignStudioSurfaceInput(
    input.ds ?? input.surface ?? input.designSurface,
  );
  if (!parsed.ok) return parsed;
  return { ok: true, value: { ds: parsed.value } };
}
