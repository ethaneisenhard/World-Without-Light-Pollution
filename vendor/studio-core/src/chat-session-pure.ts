/**
 * Chat sessions — tabs + history (Cursor / BrowserUI-shaped).
 * Persistence is a connector concern; this module stays pure.
 */

import type { ChatComposerMode } from "./chat-mode-pure.js";
import type { ChatShipReceipt } from "./deploy-verify-pure.js";

export type ChatSessionMessage = {
  role: "user" | "assistant" | "error";
  content: string;
  thinking?: string[];
  tools?: Array<{
    id: string;
    name: string;
    state: "running" | "done";
    detail?: string;
  }>;
  stopped?: boolean;
  /** User-attached images (base64) — kept for thread display + re-send. */
  images?: Array<{
    mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    data: string;
    name?: string;
  }>;
  /** Harness that produced this assistant turn (persisted with the session). */
  harness?: string;
  /** Cloud ship check — pending / live / failed (hides cut-off deploy narration). */
  shipReceipt?: ChatShipReceipt;
};

/** Set when this session was auto-forked from a compacted parent. */
export type ChatSessionContinuation = {
  fromSessionId: string;
  reason: string;
  /** One-time banner; clear when user dismisses. */
  bannerDismissed?: boolean;
};

export type ChatSession = {
  id: string;
  title: string;
  mode: ChatComposerMode;
  messages: ChatSessionMessage[];
  createdAt: number;
  updatedAt: number;
  /** Open as a tab (vs history-only). */
  tabOpen: boolean;
  /**
   * Workspace color/context for this thread (send target). Empty/absent =
   * Studio-global. Not a separate ledger — history shows one row per thread.
   */
  contextProjectId?: string | null;
  continuation?: ChatSessionContinuation;
};

export type ChatSessionState = {
  activeId: string | null;
  sessions: ChatSession[];
};

export const MAX_CHAT_SESSIONS = 50;

export function createChatSessionId(now = Date.now()): string {
  return `chat_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function titleFromFirstUserMessage(
  messages: readonly ChatSessionMessage[],
  fallback = "New chat",
): string {
  const first = messages.find((m) => m.role === "user" && m.content.trim());
  if (first) {
    const t = first.content.trim().replace(/\s+/g, " ");
    return t.length > 42 ? `${t.slice(0, 40)}…` : t;
  }
  const withImg = messages.find(
    (m) => m.role === "user" && (m.images?.length ?? 0) > 0,
  );
  if (withImg) return "Image message";
  return fallback;
}

export function createEmptyChatSession(input?: {
  id?: string;
  mode?: ChatComposerMode;
  now?: number;
  title?: string;
  contextProjectId?: string | null;
  continuation?: ChatSessionContinuation;
}): ChatSession {
  const now = input?.now ?? Date.now();
  const ctx = input?.contextProjectId?.trim() || "";
  return {
    id: input?.id ?? createChatSessionId(now),
    title: input?.title ?? "New chat",
    mode: input?.mode ?? "agent",
    messages: [],
    createdAt: now,
    updatedAt: now,
    tabOpen: true,
    ...(ctx ? { contextProjectId: ctx } : {}),
    ...(input?.continuation ? { continuation: input.continuation } : {}),
  };
}

/** Apply a context-fork: new active session with continuation chrome. */
export function applySessionContextFork(
  state: ChatSessionState,
  input: {
    fromSessionId: string;
    reason: string;
    title?: string;
    seedMessages?: ChatSessionMessage[];
    mode?: ChatComposerMode;
    now?: number;
  },
): ChatSessionState {
  const now = input.now ?? Date.now();
  const mode =
    input.mode ??
    state.sessions.find((s) => s.id === input.fromSessionId)?.mode ??
    "agent";
  const fresh = createEmptyChatSession({
    mode,
    now,
    title: input.title ?? "Continued · compacted",
    continuation: {
      fromSessionId: input.fromSessionId,
      reason: input.reason,
      bannerDismissed: false,
    },
  });
  if (input.seedMessages?.length) {
    fresh.messages = [...input.seedMessages];
  }
  return {
    activeId: fresh.id,
    sessions: [fresh, ...state.sessions].slice(0, MAX_CHAT_SESSIONS),
  };
}

export function dismissContinuationBanner(
  state: ChatSessionState,
  sessionId: string,
): ChatSessionState {
  return {
    ...state,
    sessions: state.sessions.map((s) => {
      if (s.id !== sessionId || !s.continuation) return s;
      return {
        ...s,
        continuation: { ...s.continuation, bannerDismissed: true },
      };
    }),
  };
}

export function emptyChatSessionState(now = Date.now()): ChatSessionState {
  const s = createEmptyChatSession({ now });
  return { activeId: s.id, sessions: [s] };
}

/** Empty rail placeholder — no synthetic New chat session. */
export function emptyWorkspaceChatCache(): ChatSessionState {
  return { activeId: null, sessions: [] };
}

/**
 * Open tabs in creation order (oldest → newest).
 * Matches DeskPane `tabOrder`: position is fixed at open/create; activity must not reshuffle.
 */
export function openChatTabs(
  state: ChatSessionState,
): ChatSession[] {
  return state.sessions
    .filter((s) => s.tabOpen)
    .sort((a, b) => {
      if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
      return a.id.localeCompare(b.id);
    });
}

export type ChatHistoryDayGroup = {
  label: string;
  sessions: ChatSession[];
};

function startOfLocalDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Group all sessions for history menu (Today / Yesterday / Older). */
export function groupChatSessionsByDay(
  sessions: readonly ChatSession[],
  now = Date.now(),
): ChatHistoryDayGroup[] {
  const today = startOfLocalDay(now);
  const yesterday = today - 86_400_000;
  const buckets: Record<string, ChatSession[]> = {
    Today: [],
    Yesterday: [],
    Older: [],
  };
  const sorted = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  for (const s of sorted) {
    const day = startOfLocalDay(s.updatedAt);
    if (day === today) buckets.Today.push(s);
    else if (day === yesterday) buckets.Yesterday.push(s);
    else buckets.Older.push(s);
  }
  return (["Today", "Yesterday", "Older"] as const)
    .filter((label) => buckets[label].length > 0)
    .map((label) => ({ label, sessions: buckets[label] }));
}

export function upsertChatSession(
  state: ChatSessionState,
  session: ChatSession,
): ChatSessionState {
  const without = state.sessions.filter((s) => s.id !== session.id);
  const sessions = [session, ...without]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_CHAT_SESSIONS);
  return {
    activeId: state.activeId === session.id ? session.id : state.activeId,
    sessions,
  };
}

export function selectChatSession(
  state: ChatSessionState,
  id: string,
): ChatSessionState {
  const sessions = state.sessions.map((s) =>
    s.id === id ? { ...s, tabOpen: true } : s,
  );
  if (!sessions.some((s) => s.id === id)) return state;
  return { activeId: id, sessions };
}

export function closeChatTab(
  state: ChatSessionState,
  id: string,
  now = Date.now(),
): ChatSessionState {
  const sessions = state.sessions.map((s) =>
    s.id === id ? { ...s, tabOpen: false, updatedAt: s.updatedAt } : s,
  );
  if (state.activeId !== id) return { ...state, sessions };
  const stillOpen = sessions.filter((s) => s.tabOpen);
  if (stillOpen.length > 0) {
    return { activeId: stillOpen[0]!.id, sessions };
  }
  const fresh = createEmptyChatSession({ now });
  return { activeId: fresh.id, sessions: [fresh, ...sessions].slice(0, MAX_CHAT_SESSIONS) };
}

export function newChatSession(
  state: ChatSessionState,
  mode: ChatComposerMode = "agent",
  now = Date.now(),
  contextProjectId?: string | null,
): ChatSessionState {
  const fresh = createEmptyChatSession({ mode, now, contextProjectId });
  return {
    activeId: fresh.id,
    sessions: [fresh, ...state.sessions].slice(0, MAX_CHAT_SESSIONS),
  };
}

export function patchActiveChatSession(
  state: ChatSessionState,
  patch: Partial<
    Pick<
      ChatSession,
      | "messages"
      | "title"
      | "mode"
      | "updatedAt"
      | "tabOpen"
      | "continuation"
      | "contextProjectId"
    >
  >,
  now = Date.now(),
): ChatSessionState {
  if (!state.activeId) return state;
  const sessions = state.sessions.map((s) => {
    if (s.id !== state.activeId) return s;
    const next: ChatSession = {
      ...s,
      ...patch,
      updatedAt: patch.updatedAt ?? now,
    };
    if ("contextProjectId" in patch) {
      const ctx = patch.contextProjectId?.trim() || "";
      if (ctx) next.contextProjectId = ctx;
      else delete next.contextProjectId;
    }
    if (patch.messages) {
      next.title = titleFromFirstUserMessage(patch.messages, s.title);
    }
    return next;
  });
  return { ...state, sessions };
}

/** Fingerprint for history dedupe (same user opener → one row). */
export function chatSessionContentFingerprint(session: ChatSession): string {
  const first = session.messages.find((m) => m.role === "user");
  if (!first) return `id:${session.id}`;
  const text = first.content.trim().replace(/\s+/g, " ");
  const imgs = first.images?.length ?? 0;
  return `u:${text}|img:${imgs}`;
}

export function activeChatSession(
  state: ChatSessionState,
): ChatSession | null {
  return state.sessions.find((s) => s.id === state.activeId) ?? null;
}

/** Default visible chats under a workspace expand row. */
export const WORKSPACE_CHAT_RAIL_PAGE = 5;

export type WorkspaceChatRail = {
  sessions: ChatSession[];
  hasMore: boolean;
  total: number;
};

/** True when session has real content (skip empty New chat stubs). */
export function isWorkspaceRailChat(session: ChatSession): boolean {
  // Agent-room / Ops standing desks use `spawn_` ids. Empty ones (label-only,
  // e.g. "MCP Scout") must not pollute Chat Recents — they look like broken
  // normal chats. Once they have messages, they belong in the rail.
  if (
    session.messages.length === 0 &&
    (session.id ?? "").trim().startsWith("spawn_")
  ) {
    return false;
  }
  return (
    session.messages.length > 0 ||
    (session.title.trim() !== "" && session.title !== "New chat")
  );
}

/** Newest-first slice for workspace expand rail + Load more. */
export function workspaceChatRail(
  sessions: readonly ChatSession[],
  limit = WORKSPACE_CHAT_RAIL_PAGE,
): WorkspaceChatRail {
  const sorted = [...sessions]
    .filter(isWorkspaceRailChat)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const capped = Math.max(0, Math.floor(limit));
  return {
    sessions: sorted.slice(0, capped),
    hasMore: sorted.length > capped,
    total: sorted.length,
  };
}

/** Next Load more page size (grows by WORKSPACE_CHAT_RAIL_PAGE). */
export function nextWorkspaceChatRailLimit(
  current = WORKSPACE_CHAT_RAIL_PAGE,
): number {
  return Math.max(WORKSPACE_CHAT_RAIL_PAGE, current) + WORKSPACE_CHAT_RAIL_PAGE;
}

/** One row in the unified Studio Chats rail. */
export type StudioChatRailRow = {
  sessionId: string;
  /** null = Studio-global chat ledger. */
  projectId: string | null;
  title: string;
  updatedAt: number;
  tagLabel: string;
  /** Project accent hex; undefined for Studio (UI uses secondary token). */
  accent?: string;
};

export type StudioChatRailProjectBundle = {
  projectId: string;
  tagLabel: string;
  accent?: string;
  sessions: readonly ChatSession[];
};

export type StudioChatRail = {
  rows: StudioChatRailRow[];
  hasMore: boolean;
  total: number;
};

type StudioChatRailCandidate = {
  row: StudioChatRailRow;
  fingerprint: string;
  msgCount: number;
  /** Prefer workspace-tagged over Studio-global when deduping. */
  preferWorkspace: boolean;
};

function studioChatRailCandWins(
  next: StudioChatRailCandidate,
  prev: StudioChatRailCandidate,
): boolean {
  if (next.preferWorkspace !== prev.preferWorkspace) return next.preferWorkspace;
  if (next.msgCount !== prev.msgCount) return next.msgCount > prev.msgCount;
  if (next.row.updatedAt !== prev.row.updatedAt) {
    return next.row.updatedAt > prev.row.updatedAt;
  }
  return next.row.sessionId.localeCompare(prev.row.sessionId) < 0;
}

function dedupeStudioChatRailCandidates(
  cands: readonly StudioChatRailCandidate[],
): StudioChatRailRow[] {
  const best = new Map<string, StudioChatRailCandidate>();
  for (const c of cands) {
    const prev = best.get(c.fingerprint);
    if (!prev || studioChatRailCandWins(c, prev)) best.set(c.fingerprint, c);
  }
  return [...best.values()]
    .map((c) => c.row)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Merge Studio-global + per-project sessions into one newest-first rail.
 * Skips empty New chat stubs via `isWorkspaceRailChat`.
 * Dedupes same opener across Studio + workspace bags (color tag only).
 */
export function buildStudioChatRailRows(input: {
  studioSessions?: readonly ChatSession[];
  projects?: readonly StudioChatRailProjectBundle[];
  limit?: number;
}): StudioChatRail {
  const projects = input.projects ?? [];
  const byProjectId = new Map(projects.map((p) => [p.projectId, p]));
  const cands: StudioChatRailCandidate[] = [];

  for (const s of input.studioSessions ?? []) {
    if (!isWorkspaceRailChat(s)) continue;
    const ctx = s.contextProjectId?.trim() || "";
    const bundle = ctx ? byProjectId.get(ctx) : undefined;
    cands.push({
      fingerprint: chatSessionContentFingerprint(s),
      msgCount: s.messages.length,
      preferWorkspace: Boolean(ctx),
      row: {
        sessionId: s.id,
        projectId: ctx || null,
        title: s.title.trim() || "Chat",
        updatedAt: s.updatedAt,
        tagLabel: bundle?.tagLabel ?? (ctx ? "Workspace" : "Studio"),
        ...(bundle?.accent ? { accent: bundle.accent } : {}),
      },
    });
  }

  for (const bundle of projects) {
    for (const s of bundle.sessions) {
      if (!isWorkspaceRailChat(s)) continue;
      const ctx = s.contextProjectId?.trim() || bundle.projectId;
      cands.push({
        fingerprint: chatSessionContentFingerprint(s),
        msgCount: s.messages.length,
        preferWorkspace: true,
        row: {
          sessionId: s.id,
          projectId: ctx,
          title: s.title.trim() || "Chat",
          updatedAt: s.updatedAt,
          tagLabel: bundle.tagLabel,
          ...(bundle.accent ? { accent: bundle.accent } : {}),
        },
      });
    }
  }

  const rows = dedupeStudioChatRailCandidates(cands);
  const capped = Math.max(0, Math.floor(input.limit ?? WORKSPACE_CHAT_RAIL_PAGE));
  return {
    rows: rows.slice(0, capped),
    hasMore: rows.length > capped,
    total: rows.length,
  };
}

/**
 * Open chat tabs across Studio-global + every workspace (tabOpen only).
 * Includes empty "New chat" stubs so the strip stays persistent while switching.
 * Dedupes same opener; active session is pinned first; remaining newest-first.
 */
export function buildOpenGlobalChatTabs(input: {
  studioSessions?: readonly ChatSession[];
  projects?: readonly StudioChatRailProjectBundle[];
  active?: { projectId: string | null; sessionId: string | null };
}): StudioChatRailRow[] {
  const projects = input.projects ?? [];
  const byProjectId = new Map(projects.map((p) => [p.projectId, p]));
  const cands: StudioChatRailCandidate[] = [];

  for (const s of input.studioSessions ?? []) {
    if (!s.tabOpen) continue;
    const ctx = s.contextProjectId?.trim() || "";
    const bundle = ctx ? byProjectId.get(ctx) : undefined;
    cands.push({
      fingerprint: chatSessionContentFingerprint(s),
      msgCount: s.messages.length,
      preferWorkspace: Boolean(ctx),
      row: {
        sessionId: s.id,
        projectId: ctx || null,
        title: s.title.trim() || "New chat",
        updatedAt: s.updatedAt,
        tagLabel: bundle?.tagLabel ?? (ctx ? "Workspace" : "Studio"),
        ...(bundle?.accent ? { accent: bundle.accent } : {}),
      },
    });
  }

  for (const bundle of projects) {
    for (const s of bundle.sessions) {
      if (!s.tabOpen) continue;
      const ctx = s.contextProjectId?.trim() || bundle.projectId;
      cands.push({
        fingerprint: chatSessionContentFingerprint(s),
        msgCount: s.messages.length,
        preferWorkspace: true,
        row: {
          sessionId: s.id,
          projectId: ctx,
          title: s.title.trim() || "New chat",
          updatedAt: s.updatedAt,
          tagLabel: bundle.tagLabel,
          ...(bundle.accent ? { accent: bundle.accent } : {}),
        },
      });
    }
  }

  const rows = dedupeStudioChatRailCandidates(cands);
  const activePid = input.active?.projectId ?? null;
  const activeSid = input.active?.sessionId ?? null;
  rows.sort((a, b) => {
    const aActive =
      a.sessionId === activeSid && (a.projectId ?? null) === activePid;
    const bActive =
      b.sessionId === activeSid && (b.projectId ?? null) === activePid;
    if (aActive !== bActive) return aActive ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
  return rows;
}

export type StudioChatHistoryDayGroup = {
  label: string;
  rows: StudioChatRailRow[];
};

/** Group global Studio chat rail rows for history menu (Today / Yesterday / Older). */
export function groupStudioChatRailRowsByDay(
  rows: readonly StudioChatRailRow[],
  now = Date.now(),
): StudioChatHistoryDayGroup[] {
  const today = startOfLocalDay(now);
  const yesterday = today - 86_400_000;
  const buckets: Record<string, StudioChatRailRow[]> = {
    Today: [],
    Yesterday: [],
    Older: [],
  };
  const sorted = [...rows].sort((a, b) => b.updatedAt - a.updatedAt);
  for (const row of sorted) {
    const day = startOfLocalDay(row.updatedAt);
    if (day === today) buckets.Today.push(row);
    else if (day === yesterday) buckets.Yesterday.push(row);
    else buckets.Older.push(row);
  }
  return (["Today", "Yesterday", "Older"] as const)
    .filter((label) => buckets[label].length > 0)
    .map((label) => ({ label, rows: buckets[label] }));
}

/** History menu shows more than the left-rail page size. */
export const STUDIO_CHAT_HISTORY_LIMIT = 50;

export function filterStudioChatRailRowsByQuery(
  rows: readonly StudioChatRailRow[],
  query: string,
): StudioChatRailRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...rows];
  return rows.filter(
    (row) =>
      row.title.toLowerCase().includes(q) ||
      row.tagLabel.toLowerCase().includes(q),
  );
}

/** Compact rail time: `3:42 PM` today, `Yesterday`, weekday, or `Jul 11`. */
export function formatWorkspaceChatWhen(
  updatedAt: number,
  now = Date.now(),
): string {
  if (!Number.isFinite(updatedAt) || updatedAt <= 0) return "";
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return "";

  const today = startOfLocalDay(now);
  const day = startOfLocalDay(updatedAt);
  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (day === today) return time;
  if (day === today - 86_400_000) return `Yesterday ${time}`;

  const ageDays = (today - day) / 86_400_000;
  if (ageDays > 0 && ageDays < 7) {
    const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
    return `${weekday} ${time}`;
  }

  const monthDay = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return `${monthDay} ${time}`;
}

/** Full tooltip datetime for workspace chat rows. */
export function formatWorkspaceChatWhenFull(updatedAt: number): string {
  if (!Number.isFinite(updatedAt) || updatedAt <= 0) return "";
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
