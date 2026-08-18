/**
 * Durable chat turn ids — persist across chrome reload; reattach via subscribe.
 */

import { looksLikeIncompleteShipNarration } from "./deploy-verify-pure.js";

export const CHAT_TURN_STORAGE_PREFIX = "as-chat-turn:";

/** Cap sessionStorage prose so huge turns do not blow the quota. Prefix kept for catch-up. */
export const CHAT_TURN_STORED_ASSISTANT_MAX = 200_000;

export type StoredChatTurnCursor = {
  turnId: string;
  /** Last event seq successfully applied; next subscribe uses fromSeq = lastSeq + 1. */
  lastSeq: number;
  /**
   * Last painted assistant prose — seeds the bubble across hard refresh so
   * catch-up does not flash an empty face before SSE replay.
   */
  assistant?: string;
};

/** Trim + cap assistant snapshot for sessionStorage. */
export function normalizeStoredChatTurnAssistant(
  text: string | null | undefined,
): string | undefined {
  const raw = typeof text === "string" ? text : "";
  if (!raw) return undefined;
  if (raw.length <= CHAT_TURN_STORED_ASSISTANT_MAX) return raw;
  return raw.slice(0, CHAT_TURN_STORED_ASSISTANT_MAX);
}

export function chatTurnStorageKey(sessionId: string): string {
  return `${CHAT_TURN_STORAGE_PREFIX}${sessionId.trim()}`;
}

/**
 * Accept legacy bare turnId string or `{ turnId, lastSeq }` JSON.
 */
export function parseStoredChatTurnCursor(
  raw: string | null | undefined,
): StoredChatTurnCursor | null {
  const text = (raw ?? "").trim();
  if (!text) return null;
  if (text.startsWith("{")) {
    try {
      const o = JSON.parse(text) as unknown;
      if (!o || typeof o !== "object") return null;
      const turnId =
        typeof (o as { turnId?: unknown }).turnId === "string"
          ? (o as { turnId: string }).turnId.trim()
          : "";
      if (!turnId) return null;
      const lastSeqRaw = (o as { lastSeq?: unknown }).lastSeq;
      const lastSeq =
        typeof lastSeqRaw === "number" && Number.isFinite(lastSeqRaw)
          ? Math.max(0, Math.floor(lastSeqRaw))
          : -1;
      const assistant = normalizeStoredChatTurnAssistant(
        typeof (o as { assistant?: unknown }).assistant === "string"
          ? (o as { assistant: string }).assistant
          : undefined,
      );
      return assistant ? { turnId, lastSeq, assistant } : { turnId, lastSeq };
    } catch {
      return null;
    }
  }
  return { turnId: text, lastSeq: -1 };
}

export function serializeStoredChatTurnCursor(
  cursor: StoredChatTurnCursor,
): string {
  const assistant = normalizeStoredChatTurnAssistant(cursor.assistant);
  return JSON.stringify({
    turnId: cursor.turnId.trim(),
    lastSeq: Math.max(-1, Math.floor(cursor.lastSeq)),
    ...(assistant ? { assistant } : {}),
  });
}

/** Next SSE fromSeq after a stored cursor (−1 → 0 full replay). */
export function chatTurnSubscribeFromSeq(lastSeq: number): number {
  if (!Number.isFinite(lastSeq) || lastSeq < 0) return 0;
  return Math.floor(lastSeq) + 1;
}

export function parseActiveTurnResponse(body: unknown): {
  turnId: string | null;
  status: string | null;
  tools: string[];
  shipRebuild: boolean;
} {
  if (!body || typeof body !== "object") {
    return { turnId: null, status: null, tools: [], shipRebuild: false };
  }
  const o = body as Record<string, unknown>;
  const turnId = typeof o.turnId === "string" && o.turnId.trim() ? o.turnId.trim() : null;
  const status = typeof o.status === "string" ? o.status : null;
  const tools: string[] = [];
  if (Array.isArray(o.tools)) {
    for (const t of o.tools) {
      if (typeof t === "string" && t.trim()) tools.push(t.trim());
    }
  }
  const shipRebuild = o.shipRebuild === true;
  return { turnId, status, tools, shipRebuild };
}

/**
 * Pick which turn id / status to reattach after chrome reload.
 *
 * `/active` succeeded with no turn → drop stale sessionStorage (never invent
 * "running" or paint a live face when the Host already said the turn is gone).
 * `/active` unreachable → fall back to stored cursor as maybe-still-running.
 */
export function resolveReattachTurnCursor(input: {
  activeOk: boolean;
  activeTurnId: string | null;
  activeStatus: string | null;
  storedTurnId: string | null;
}): {
  turnId: string | null;
  turnStatus: string | null;
  clearStored: boolean;
} {
  const activeTurnId = input.activeTurnId?.trim() || null;
  if (activeTurnId) {
    return {
      turnId: activeTurnId,
      turnStatus: input.activeStatus,
      clearStored: false,
    };
  }
  if (input.activeOk) {
    return { turnId: null, turnStatus: null, clearStored: true };
  }
  const storedTurnId = input.storedTurnId?.trim() || null;
  if (storedTurnId) {
    return {
      turnId: storedTurnId,
      turnStatus: "running",
      clearStored: false,
    };
  }
  return { turnId: null, turnStatus: null, clearStored: false };
}

/**
 * Whether the client should subscribe / replay a turn for catch-up.
 * Running always; finished only when the last assistant bubble is empty/sealed
 * — unless this tab still holds a matching mid-flight cursor (partial ledger
 * prose must not skip Host replay of the final message / Handoff).
 */
export function shouldCatchUpChatTurn(input: {
  lastAssistantContent: string | null | undefined;
  turnStatus: string | null | undefined;
  emptyMarkers?: readonly string[];
  /** Same-tab stored turn id matches Host turn — always catch up. */
  storedCursorMatchesTurn?: boolean;
}): boolean {
  if (input.storedCursorMatchesTurn) return true;
  const status = input.turnStatus?.trim() || "";
  if (!status || status === "running") return true;
  const content = (input.lastAssistantContent ?? "").trim();
  if (!content) return true;
  if (content === "(no reply)" || /^\(empty reply/i.test(content)) return true;
  const markers = input.emptyMarkers ?? [];
  for (const m of markers) {
    if (m && content === m) return true;
  }
  if (looksLikeIncompleteShipNarration(content)) return true;
  return false;
}

export function parseTurnAnnounceEvent(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const turnId = (data as { turnId?: unknown }).turnId;
  return typeof turnId === "string" && turnId.trim() ? turnId.trim() : null;
}
