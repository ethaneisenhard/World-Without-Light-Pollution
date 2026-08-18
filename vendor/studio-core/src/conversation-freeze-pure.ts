/**
 * Conversation freeze — once-per-session stable turn-prepare slices.
 *
 * Invalidate when memory is written so the next turn rebuilds.
 * Keyed by sessionId (chat session). Missing sessionId → no freeze.
 */

export type ConversationFreezeSlice = {
  /** Stable system parts (rules, skills, memory, rootHint) — joined order preserved. */
  stableParts: readonly string[];
  frozenAt: number;
};

export type ConversationFreezeStore = {
  get: (sessionId: string) => ConversationFreezeSlice | undefined;
  set: (sessionId: string, slice: ConversationFreezeSlice) => void;
  /** Clear one session, or all when sessionId omitted. */
  invalidate: (sessionId?: string) => void;
  size: () => number;
};

export function conversationFreezeKey(
  sessionId: string | null | undefined,
): string | null {
  const id = sessionId?.trim();
  return id ? id : null;
}

/** In-memory Map store (process-local v1). */
export function createConversationFreezeStore(): ConversationFreezeStore {
  const map = new Map<string, ConversationFreezeSlice>();
  return {
    get(sessionId) {
      const key = conversationFreezeKey(sessionId);
      if (!key) return undefined;
      return map.get(key);
    },
    set(sessionId, slice) {
      const key = conversationFreezeKey(sessionId);
      if (!key) return;
      map.set(key, {
        stableParts: [...slice.stableParts],
        frozenAt: slice.frozenAt,
      });
    },
    invalidate(sessionId) {
      if (sessionId === undefined) {
        map.clear();
        return;
      }
      const key = conversationFreezeKey(sessionId);
      if (key) map.delete(key);
    },
    size: () => map.size,
  };
}

/**
 * Resolve stable parts: prefer freeze when present; else use freshly loaded.
 * Returns whether the freeze was used (skip re-load of memory/rules/skills).
 */
export function resolveFrozenStableParts(input: {
  sessionId?: string | null;
  store: ConversationFreezeStore;
  freshStableParts: readonly string[];
  now?: number;
}): {
  stableParts: string[];
  fromFreeze: boolean;
} {
  const key = conversationFreezeKey(input.sessionId);
  if (key) {
    const hit = input.store.get(key);
    if (hit) {
      return { stableParts: [...hit.stableParts], fromFreeze: true };
    }
  }
  const fresh = [...input.freshStableParts];
  if (key && fresh.length > 0) {
    input.store.set(key, {
      stableParts: fresh,
      frozenAt: input.now ?? Date.now(),
    });
  }
  return { stableParts: fresh, fromFreeze: false };
}
