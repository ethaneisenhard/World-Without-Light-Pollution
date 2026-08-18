/**
 * Chat turn event persistence — serialize without AbortController.
 * Process keeps live aborts; store holds event ring for Host restart catch-up.
 */

export type ChatTurnPersistedStatus =
  | "running"
  | "done"
  | "cancelled"
  | "error";

export type ChatTurnPersistedEvent = {
  seq: number;
  event: string;
  data: unknown;
};

export type ChatTurnPersistedRecord = {
  turnId: string;
  projectId: string;
  sessionId: string | null;
  status: ChatTurnPersistedStatus;
  createdAt: number;
  finishedAt: number | null;
  errorMessage: string | null;
  /** Monotonic next seq (survives ring trim). */
  nextSeq: number;
  events: ChatTurnPersistedEvent[];
};

export function isChatTurnPersistedStatus(
  value: unknown,
): value is ChatTurnPersistedStatus {
  switch (value) {
    case "running":
    case "done":
    case "cancelled":
    case "error":
      return true;
    default:
      return false;
  }
}

export function parseChatTurnPersistedRecord(
  raw: unknown,
): ChatTurnPersistedRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const turnId = typeof o.turnId === "string" ? o.turnId.trim() : "";
  const projectId = typeof o.projectId === "string" ? o.projectId.trim() : "";
  if (!turnId || !projectId) return null;
  if (!isChatTurnPersistedStatus(o.status)) return null;
  const sessionId =
    typeof o.sessionId === "string" && o.sessionId.trim()
      ? o.sessionId.trim()
      : null;
  const createdAt = typeof o.createdAt === "number" ? o.createdAt : 0;
  const finishedAt =
    typeof o.finishedAt === "number"
      ? o.finishedAt
      : o.finishedAt === null
        ? null
        : null;
  const errorMessage =
    typeof o.errorMessage === "string" ? o.errorMessage : null;
  const nextSeq = typeof o.nextSeq === "number" ? o.nextSeq : 0;
  const eventsIn = Array.isArray(o.events) ? o.events : [];
  const events: ChatTurnPersistedEvent[] = [];
  for (const e of eventsIn) {
    if (!e || typeof e !== "object") continue;
    const ev = e as Record<string, unknown>;
    if (typeof ev.seq !== "number" || typeof ev.event !== "string") continue;
    events.push({ seq: ev.seq, event: ev.event, data: ev.data });
  }
  return {
    turnId,
    projectId,
    sessionId,
    status: o.status,
    createdAt,
    finishedAt,
    errorMessage,
    nextSeq: Math.max(nextSeq, events.length ? events[events.length - 1]!.seq + 1 : 0),
    events,
  };
}

export function toChatTurnPersistedJson(
  record: ChatTurnPersistedRecord,
): string {
  return `${JSON.stringify(record)}\n`;
}

/**
 * Host restart left a running turn with no live AbortController / harness.
 * Mark error so clients can catch up then settle.
 */
export function orphanRunningChatTurn(
  record: ChatTurnPersistedRecord,
  now = Date.now(),
  message = "Host restarted; turn interrupted",
): ChatTurnPersistedRecord {
  if (record.status !== "running") return record;
  const nextSeq = record.nextSeq;
  const events = record.events.slice();
  events.push({
    seq: nextSeq,
    event: "error",
    data: { message },
  });
  events.push({
    seq: nextSeq + 1,
    event: "done",
    data: { ok: false, orphaned: true },
  });
  return {
    ...record,
    status: "error",
    finishedAt: now,
    errorMessage: message,
    nextSeq: nextSeq + 2,
    events,
  };
}

export function chatTurnExpired(
  record: ChatTurnPersistedRecord,
  now: number,
  ttlMs: number,
): boolean {
  if (record.status === "running") return false;
  const anchor = record.finishedAt ?? record.createdAt;
  return now - anchor > ttlMs;
}

export function trimChatTurnEvents(
  events: ChatTurnPersistedEvent[],
  maxEvents: number,
): ChatTurnPersistedEvent[] {
  if (events.length <= maxEvents) return events;
  return events.slice(events.length - maxEvents);
}
