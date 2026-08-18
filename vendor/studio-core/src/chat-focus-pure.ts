/**
 * studio.chat.focus — switch the Chat window to a specific session tab.
 * Voice + Chat MCP share this parse / match / spoken classify.
 */

export type ChatFocusTarget = {
  chatId: string | null;
  query: string | null;
  projectId: string | null;
};

export type ChatFocusSessionRow = {
  id: string;
  title: string;
  updatedAt: number;
  tabOpen: boolean;
  projectId?: string | null;
};

export type ChatFocusMatchReason = "id" | "query" | "other";

export type ChatFocusMatch = {
  id: string;
  title: string;
  projectId: string | null;
  reason: ChatFocusMatchReason;
};

export type ParseChatFocusResult =
  | { ok: true; target: ChatFocusTarget }
  | { ok: false; error: string };

const QUERY_MAX = 200;

function trimId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return t ? t : null;
}

function cleanFocusQuery(raw: string): string {
  return raw
    .replace(/[.!?]+$/g, "")
    .replace(/\b(?:chat|tab|thread|session)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Validate tools.call / CLI input for studio.chat.focus. */
export function parseChatFocusInput(
  raw: Record<string, unknown>,
): ParseChatFocusResult {
  const chatId = trimId(raw.chatId) ?? trimId(raw.sessionId);
  const projectId = trimId(raw.projectId);
  const queryRaw =
    typeof raw.query === "string"
      ? raw.query
      : typeof raw.q === "string"
        ? raw.q
        : "";
  const query = cleanFocusQuery(queryRaw);
  if (query.length > QUERY_MAX) {
    return { ok: false, error: "query too long (max 200)" };
  }
  return {
    ok: true,
    target: {
      chatId,
      query: query || null,
      projectId,
    },
  };
}

function scoreQueryHit(
  row: ChatFocusSessionRow,
  needle: string,
): boolean {
  const title = row.title.toLowerCase();
  const id = row.id.toLowerCase();
  return title.includes(needle) || id.includes(needle);
}

/**
 * Pick a session: exact id, then title/id needle (open tabs first),
 * else most recently updated open tab that is not active.
 */
export function matchChatFocusSession(
  sessions: readonly ChatFocusSessionRow[],
  target: ChatFocusTarget,
  activeId: string | null,
): ChatFocusMatch | null {
  if (target.chatId) {
    const hit = sessions.find((s) => s.id === target.chatId);
    if (!hit) return null;
    return {
      id: hit.id,
      title: hit.title,
      projectId: hit.projectId ?? target.projectId,
      reason: "id",
    };
  }

  const needle = (target.query ?? "").toLowerCase();
  if (needle) {
    const hits = sessions
      .filter((s) => scoreQueryHit(s, needle))
      .sort((a, b) => {
        if (a.tabOpen !== b.tabOpen) return a.tabOpen ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
    const hit = hits[0];
    if (!hit) return null;
    return {
      id: hit.id,
      title: hit.title,
      projectId: hit.projectId ?? target.projectId,
      reason: "query",
    };
  }

  const others = sessions
    .filter((s) => s.tabOpen && s.id !== activeId)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const other = others[0];
  if (!other) return null;
  return {
    id: other.id,
    title: other.title,
    projectId: other.projectId ?? target.projectId,
    reason: "other",
  };
}

const BARE_CHAT_WINDOW_RE =
  /^(?:please\s+|can you\s+|hey\s+)*(?:open(?:\s+up)?|show(?:\s+me)?|go to|pull up|bring up|focus)\s+(?:the\s+|my\s+)?chat(?:\s+please)?[.!?]*$/i;

const NAMED_CHAT_RE =
  /\b(?:the|that)\s+(.+?)\s+(?:chat|tab|thread|session)\b/i;

const ABOUT_RE =
  /\babout\s+(?:the\s+)?(.+?)(?:\s+(?:chat|tab)\b|[.!?]+|$)/i;

const THAT_TAB_RE = /\bthat\s+(?:chat|tab|thread|session)\b/i;

const FOCUS_VERB_RE =
  /\b(?:bring|open|show|switch|pull|focus|need)\b/i;

const TAB_NOUN_RE = /\b(?:chat|tab|thread|session)\b/i;

const PRONOUN_QUERY_RE = /^(?:that|this|it|the|other)$/i;

/**
 * Spoken “bring that chat up” / “open the robots tab” → focus query.
 * Bare “open chat” is window nav — not a tab switch.
 */
export function classifyChatFocusUtterance(
  text: string,
): { query: string } | null {
  const t = text.trim();
  if (!t) return null;
  if (BARE_CHAT_WINDOW_RE.test(t)) return null;
  if (!FOCUS_VERB_RE.test(t) || !TAB_NOUN_RE.test(t)) return null;

  const named = t.match(NAMED_CHAT_RE)?.[1] ?? "";
  const about = t.match(ABOUT_RE)?.[1] ?? "";
  const thatTab = THAT_TAB_RE.test(t);
  if (!named && !about && !thatTab) return null;

  const query = cleanFocusQuery(about || named);
  if (PRONOUN_QUERY_RE.test(query)) return { query: "" };
  return { query };
}
