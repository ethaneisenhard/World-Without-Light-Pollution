/**
 * Session Apply bar — coalesce write-through proposals by path.
 * One Keep All / Undo All for the chat, not per-message cards.
 */

export type PendingWriteProposal = {
  id: string;
  path: string;
  before: string | null;
  after: string;
};

export type CoalescedPathProposal = {
  path: string;
  /** Earliest before in this session (Undo All restores here). */
  before: string | null;
  /** Latest after (current disk). */
  after: string;
  ids: string[];
};

/** Merge proposals in arrival order: keep first before, last after, all ids. */
export function coalesceProposalsByPath(
  proposals: readonly PendingWriteProposal[],
): CoalescedPathProposal[] {
  const order: string[] = [];
  const map = new Map<string, CoalescedPathProposal>();
  for (const p of proposals) {
    const existing = map.get(p.path);
    if (!existing) {
      map.set(p.path, {
        path: p.path,
        before: p.before,
        after: p.after,
        ids: [p.id],
      });
      order.push(p.path);
      continue;
    }
    existing.after = p.after;
    existing.ids.push(p.id);
  }
  return order.map((path) => map.get(path)!);
}

/** Newest-first ids — Undo All must restore intermediates in reverse. */
export function proposalIdsNewestFirst(
  proposals: readonly PendingWriteProposal[],
): string[] {
  return [...proposals].map((p) => p.id).reverse();
}
