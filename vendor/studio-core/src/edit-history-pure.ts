/** Linear undo/redo stack for editor content (pure — no DOM). */

export type EditHistory = {
  entries: string[];
  index: number;
  /** Last successful push timestamp (for coalesce). */
  lastPushAt: number;
};

export type PushEditOptions = {
  now: number;
  /** If a push lands within this window of the previous push, replace the tip instead of growing. */
  coalesceMs?: number;
  /** Cap stack length (oldest dropped). Default 100. */
  maxEntries?: number;
};

export function createEditHistory(content: string, now = 0): EditHistory {
  return { entries: [content], index: 0, lastPushAt: now };
}

export function canUndo(history: EditHistory): boolean {
  return history.index > 0;
}

export function canRedo(history: EditHistory): boolean {
  return history.index < history.entries.length - 1;
}

export function currentEdit(history: EditHistory): string {
  return history.entries[history.index] ?? "";
}

/**
 * Record a new content snapshot.
 * No-op when content equals current tip. Truncates redo branch on real push.
 */
export function pushEdit(
  history: EditHistory,
  content: string,
  options: PushEditOptions,
): EditHistory {
  const current = currentEdit(history);
  if (content === current) return history;

  const coalesceMs = options.coalesceMs ?? 400;
  const maxEntries = options.maxEntries ?? 100;
  const withinCoalesce =
    history.index > 0 &&
    options.now - history.lastPushAt <= coalesceMs &&
    history.index === history.entries.length - 1;

  if (withinCoalesce) {
    const entries = history.entries.slice();
    entries[history.index] = content;
    return { entries, index: history.index, lastPushAt: options.now };
  }

  const kept = history.entries.slice(0, history.index + 1);
  kept.push(content);
  let index = kept.length - 1;
  let entries = kept;
  if (entries.length > maxEntries) {
    const drop = entries.length - maxEntries;
    entries = entries.slice(drop);
    index = entries.length - 1;
  }
  return { entries, index, lastPushAt: options.now };
}

export function undoEdit(history: EditHistory): EditHistory | null {
  if (!canUndo(history)) return null;
  return { ...history, index: history.index - 1, lastPushAt: history.lastPushAt };
}

export function redoEdit(history: EditHistory): EditHistory | null {
  if (!canRedo(history)) return null;
  return { ...history, index: history.index + 1, lastPushAt: history.lastPushAt };
}
