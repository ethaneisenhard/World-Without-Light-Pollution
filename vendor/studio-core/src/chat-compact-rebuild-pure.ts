/**
 * Rebuild model-view messages from full history + compaction markers.
 * Swarm pattern: latest marker + messages not in covered ids.
 */

import type { CompactMessage } from "./chat-compact-types-pure.js";
import { assignMessageIds, isCompactionMarker } from "./chat-compact-types-pure.js";

export function latestCompactionMarker(
  messages: readonly CompactMessage[],
): CompactMessage | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]!;
    if (m.compaction?.coveredMessageIds?.length || isCompactionMarker(m)) {
      return m;
    }
  }
  return null;
}

export function rebuildCanonicalMessages(
  messages: readonly CompactMessage[],
): CompactMessage[] {
  const numbered = assignMessageIds(messages);
  const marker = latestCompactionMarker(numbered);
  if (!marker) return numbered;

  const covered = new Set(
    (marker.compaction?.coveredMessageIds ?? []).map(String),
  );
  // Also cover any prior markers nested in covered set.
  for (const m of numbered) {
    if (!m.id || !covered.has(m.id)) continue;
    for (const id of m.compaction?.coveredMessageIds ?? []) {
      covered.add(String(id));
    }
  }

  const retained = numbered.filter((m) => {
    if (m.id && m.id === marker.id) return false;
    if (m.id && covered.has(m.id)) return false;
    return true;
  });

  return [marker, ...retained];
}
