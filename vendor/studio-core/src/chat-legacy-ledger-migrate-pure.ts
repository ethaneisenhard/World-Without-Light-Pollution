/**
 * One-shot merge: per-project ledger bags → Studio-global bag + contextProjectId.
 * Shrinks dual-ledger surface after chat scope stopped BIND'ing workspace bags.
 */
import {
  chatSessionContentFingerprint,
  isWorkspaceRailChat,
  upsertChatSession,
  type ChatSession,
  type ChatSessionState,
} from "./chat-session-pure.js";

export type { ChatSession, ChatSessionState };

export type MigrateLegacyProjectSessionsInput = {
  global: ChatSessionState;
  /** Keys are project ids. Empty-string (Studio) bags are ignored. */
  projectBags: Record<string, ChatSessionState>;
};

export type MigrateLegacyProjectSessionsResult = {
  global: ChatSessionState;
  importedCount: number;
  /** Project bag keys that contributed sessions (safe to clear after persist). */
  emptiedProjectIds: string[];
};

function stampContext(session: ChatSession, projectId: string): ChatSession {
  const ctx = session.contextProjectId?.trim() || projectId.trim();
  return {
    ...session,
    tabOpen: false,
    ...(ctx ? { contextProjectId: ctx } : {}),
  };
}

/** Prefer workspace-tagged / richer / newer when collapsing twins. */
export function legacyMigrateSessionWins(
  next: ChatSession,
  prev: ChatSession,
): boolean {
  const nextWs = Boolean(next.contextProjectId?.trim());
  const prevWs = Boolean(prev.contextProjectId?.trim());
  if (nextWs !== prevWs) return nextWs;
  if (next.messages.length !== prev.messages.length) {
    return next.messages.length > prev.messages.length;
  }
  if (next.updatedAt !== prev.updatedAt) return next.updatedAt > prev.updatedAt;
  return next.id.localeCompare(prev.id) < 0;
}

function findByFingerprint(
  sessions: readonly ChatSession[],
  fingerprint: string,
): ChatSession | undefined {
  return sessions.find(
    (s) => chatSessionContentFingerprint(s) === fingerprint,
  );
}

/**
 * Merge legacy per-project chat ledgers into the Studio-global state.
 * Skips empty stubs; stamps `contextProjectId` from the bag key when missing.
 */
export function migrateLegacyProjectSessionsIntoGlobal(
  input: MigrateLegacyProjectSessionsInput,
): MigrateLegacyProjectSessionsResult {
  let global = input.global;
  let importedCount = 0;
  const emptiedProjectIds: string[] = [];

  for (const [projectId, bag] of Object.entries(input.projectBags)) {
    const pid = projectId.trim();
    if (!pid || !bag?.sessions?.length) continue;

    let contributed = false;
    for (const raw of bag.sessions) {
      if (!isWorkspaceRailChat(raw)) continue;
      const stamped = stampContext(raw, pid);
      const fp = chatSessionContentFingerprint(stamped);
      const sameId = global.sessions.find((s) => s.id === stamped.id);
      const twin = sameId
        ? undefined
        : findByFingerprint(global.sessions, fp);

      if (sameId) {
        if (!legacyMigrateSessionWins(stamped, sameId)) continue;
        global = upsertChatSession(global, stamped);
        importedCount += 1;
        contributed = true;
        continue;
      }

      if (twin) {
        if (!legacyMigrateSessionWins(stamped, twin)) continue;
        global = {
          ...global,
          activeId:
            global.activeId === twin.id ? stamped.id : global.activeId,
          sessions: global.sessions.filter((s) => s.id !== twin.id),
        };
        global = upsertChatSession(global, stamped);
        importedCount += 1;
        contributed = true;
        continue;
      }

      global = upsertChatSession(global, stamped);
      importedCount += 1;
      contributed = true;
    }

    if (contributed) emptiedProjectIds.push(pid);
  }

  return { global, importedCount, emptiedProjectIds };
}
