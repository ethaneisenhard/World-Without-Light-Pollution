/**
 * Import a spawned Agent-room child (or Voice worker) as a Chat tab in ledger state.
 */

import { STUDIO_ROOT_CHAT_ID } from "./chat-pure.js";
import {
  createEmptyChatSession,
  upsertChatSession,
  type ChatSessionState,
} from "./chat-session-pure.js";
import type { ChatComposerMode } from "./chat-mode-pure.js";

/** Ledger workspace key: Studio-global chats use null, not `_studio`. */
export function ledgerProjectIdForChat(
  projectId: string | null | undefined,
): string | null {
  const t = (projectId ?? "").trim();
  if (!t || t === STUDIO_ROOT_CHAT_ID) return null;
  return t;
}

export function spawnChatSessionTitle(input: {
  label?: string | null;
  intent?: string | null;
  fallback?: string;
}): string {
  const label = input.label?.trim() || "";
  if (label) return label.length > 42 ? `${label.slice(0, 40)}…` : label;
  const intent = input.intent?.trim() || "";
  if (intent) {
    return intent.length > 42 ? `${intent.slice(0, 40)}…` : intent;
  }
  return input.fallback?.trim() || "Agent room";
}

/**
 * Ensure `childChatId` is a tabOpen session. Does not steal activeId (parent stays focused).
 * Existing rows only flip `tabOpen` — messages stay.
 */
export function importSpawnedChatSession(
  state: ChatSessionState,
  input: {
    childChatId: string;
    title?: string;
    mode?: ChatComposerMode;
    contextProjectId?: string | null;
    now?: number;
  },
): ChatSessionState {
  const id = input.childChatId.trim();
  if (!id) return state;
  const existing = state.sessions.find((s) => s.id === id);
  if (existing) {
    if (existing.tabOpen) return state;
    const now = input.now ?? Date.now();
    return {
      ...state,
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, tabOpen: true, updatedAt: now } : s,
      ),
    };
  }
  const session = createEmptyChatSession({
    id,
    title: spawnChatSessionTitle({
      label: input.title,
      fallback: "Agent room",
    }),
    mode: input.mode ?? "multitask",
    now: input.now,
    contextProjectId: input.contextProjectId,
  });
  return upsertChatSession(state, session);
}
