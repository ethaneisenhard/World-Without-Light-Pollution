/**
 * calendar.* MCP — parse ledger event inputs (no I/O).
 */

import { isStudioRootChatId } from "./chat-pure.js";

export type CalendarListParsed = {
  projectId?: string | null;
  scope?: "studio" | "project";
  kinds?: string[];
  from?: number;
  to?: number;
  limit?: number;
};

export type CalendarGetParsed = { eventId: string };

export type CalendarCreateParsed = {
  title: string;
  startsAt: number;
  endsAt?: number | null;
  kind?: string;
  scope: "studio" | "project";
  projectId: string | null;
  meta?: Record<string, unknown>;
  sessionId?: string | null;
};

export type CalendarUpdateParsed = {
  eventId: string;
  title?: string;
  startsAt?: number;
  endsAt?: number | null;
  kind?: string;
  meta?: Record<string, unknown>;
};

export type CalendarDeleteParsed = { eventId: string };

function parseOptionalMs(v: unknown, name: string): number | undefined | { error: string } {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return Math.floor(v);
  if (typeof v === "string" && v.trim()) {
    const n = Date.parse(v);
    if (!Number.isNaN(n)) return n;
  }
  return { error: `${name} must be epoch ms or ISO date string` };
}

export function parseCalendarListInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: CalendarListParsed } | { ok: false; error: string } {
  const out: CalendarListParsed = {};
  const rawScope =
    typeof input.scope === "string" ? input.scope.trim().toLowerCase() : "";
  if (rawScope === "studio" || rawScope === "project") out.scope = rawScope;

  if (input.projectId === null) out.projectId = null;
  else if (typeof input.projectId === "string") {
    const t = input.projectId.trim();
    out.projectId = t && !isStudioRootChatId(t) ? t : null;
  } else if (!isStudioRootChatId(mcpProjectId) && mcpProjectId.trim()) {
    out.projectId = mcpProjectId.trim();
  }

  if (Array.isArray(input.kinds)) {
    out.kinds = input.kinds.filter((k): k is string => typeof k === "string");
  } else if (typeof input.kind === "string" && input.kind.trim()) {
    out.kinds = [input.kind.trim()];
  }

  const from = parseOptionalMs(input.from, "from");
  if (from && typeof from === "object" && "error" in from) {
    return { ok: false, error: from.error };
  }
  if (typeof from === "number") out.from = from;

  const to = parseOptionalMs(input.to, "to");
  if (to && typeof to === "object" && "error" in to) {
    return { ok: false, error: to.error };
  }
  if (typeof to === "number") out.to = to;

  if (typeof input.limit === "number" && Number.isFinite(input.limit)) {
    out.limit = Math.min(500, Math.max(1, Math.floor(input.limit)));
  }
  return { ok: true, value: out };
}

export function parseCalendarGetInput(
  input: Record<string, unknown>,
): { ok: true; value: CalendarGetParsed } | { ok: false; error: string } {
  const eventId =
    typeof input.eventId === "string"
      ? input.eventId.trim()
      : typeof input.id === "string"
        ? input.id.trim()
        : "";
  if (!eventId) return { ok: false, error: "eventId required" };
  return { ok: true, value: { eventId } };
}

export function parseCalendarCreateInput(
  input: Record<string, unknown>,
  mcpProjectId: string,
): { ok: true; value: CalendarCreateParsed } | { ok: false; error: string } {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title) return { ok: false, error: "title required" };

  const starts = parseOptionalMs(input.startsAt ?? input.start, "startsAt");
  if (!starts || typeof starts === "object") {
    return {
      ok: false,
      error:
        starts && typeof starts === "object"
          ? starts.error
          : "startsAt required (epoch ms or ISO)",
    };
  }

  let endsAt: number | null | undefined;
  if (input.endsAt === null || input.end === null) endsAt = null;
  else {
    const ends = parseOptionalMs(input.endsAt ?? input.end, "endsAt");
    if (ends && typeof ends === "object" && "error" in ends) {
      return { ok: false, error: ends.error };
    }
    if (typeof ends === "number") endsAt = ends;
  }

  const rawScope =
    typeof input.scope === "string" ? input.scope.trim().toLowerCase() : "";
  const mcpIsGlobal = isStudioRootChatId(mcpProjectId) || !mcpProjectId.trim();
  const scope: "studio" | "project" =
    rawScope === "studio" || rawScope === "project"
      ? rawScope
      : mcpIsGlobal
        ? "studio"
        : "project";

  let projectId: string | null = null;
  if (scope === "project") {
    if (typeof input.projectId === "string" && input.projectId.trim()) {
      projectId = input.projectId.trim();
    } else if (!mcpIsGlobal) {
      projectId = mcpProjectId.trim();
    }
    if (!projectId || isStudioRootChatId(projectId)) {
      return { ok: false, error: "projectId required when scope=project" };
    }
  }

  const kind =
    typeof input.kind === "string" && input.kind.trim()
      ? input.kind.trim()
      : "calendar";

  const meta =
    input.meta && typeof input.meta === "object" && !Array.isArray(input.meta)
      ? (input.meta as Record<string, unknown>)
      : undefined;

  const sessionId =
    typeof input.sessionId === "string" ? input.sessionId : null;

  return {
    ok: true,
    value: {
      title,
      startsAt: starts,
      endsAt: endsAt === undefined ? null : endsAt,
      kind,
      scope,
      projectId,
      meta,
      sessionId,
    },
  };
}

export function parseCalendarUpdateInput(
  input: Record<string, unknown>,
): { ok: true; value: CalendarUpdateParsed } | { ok: false; error: string } {
  const get = parseCalendarGetInput(input);
  if (!get.ok) return get;
  const out: CalendarUpdateParsed = { eventId: get.value.eventId };

  if (typeof input.title === "string") out.title = input.title.trim();

  if (input.startsAt !== undefined || input.start !== undefined) {
    const starts = parseOptionalMs(input.startsAt ?? input.start, "startsAt");
    if (starts && typeof starts === "object" && "error" in starts) {
      return { ok: false, error: starts.error };
    }
    if (typeof starts === "number") out.startsAt = starts;
  }

  if (input.endsAt !== undefined || input.end !== undefined) {
    if (input.endsAt === null || input.end === null) out.endsAt = null;
    else {
      const ends = parseOptionalMs(input.endsAt ?? input.end, "endsAt");
      if (ends && typeof ends === "object" && "error" in ends) {
        return { ok: false, error: ends.error };
      }
      if (typeof ends === "number") out.endsAt = ends;
    }
  }

  if (typeof input.kind === "string" && input.kind.trim()) {
    out.kind = input.kind.trim();
  }
  if (input.meta && typeof input.meta === "object" && !Array.isArray(input.meta)) {
    out.meta = input.meta as Record<string, unknown>;
  }

  if (
    out.title === undefined &&
    out.startsAt === undefined &&
    out.endsAt === undefined &&
    out.kind === undefined &&
    out.meta === undefined
  ) {
    return { ok: false, error: "at least one field to update required" };
  }
  return { ok: true, value: out };
}

export function parseCalendarDeleteInput(
  input: Record<string, unknown>,
): { ok: true; value: CalendarDeleteParsed } | { ok: false; error: string } {
  return parseCalendarGetInput(input);
}
