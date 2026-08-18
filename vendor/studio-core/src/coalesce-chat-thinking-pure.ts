/**
 * Collapse thinking note fragments into one readable reasoning block.
 * Token streams → joined prose; discrete notes → paragraphs.
 */

export function coalesceThinkingNotes(
  notes: readonly string[] | null | undefined,
): string | null {
  if (!Array.isArray(notes) || notes.length === 0) return null;
  const parts = notes
    .map((n) => (typeof n === "string" ? n : ""))
    .filter((n) => n.trim());
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0]!.trim();

  const shortish = parts.filter(
    (n) => n.trim().length < 80 && !n.includes("\n"),
  ).length;
  const sentenceish = parts.filter((n) => {
    const t = n.trim();
    return t.length >= 40 || /[.!?]$/.test(t) || t.includes("\n");
  }).length;
  const tokenish =
    shortish / parts.length >= 0.6 && sentenceish / parts.length < 0.5;

  if (tokenish) {
    return joinThinkingFragments(parts);
  }

  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join("\n\n");
}

/** Join token-ish deltas without double spaces or dropped punctuation glue. */
export function joinThinkingFragments(parts: readonly string[]): string {
  let out = "";
  for (const raw of parts) {
    if (!raw.trim()) continue;
    if (!out) {
      out = raw.replace(/^\s+/, "");
      continue;
    }
    out = mergeWithSpacing(out, raw);
  }
  return out
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function mergeWithSpacing(prev: string, next: string): string {
  if (/^\s/.test(next)) {
    if (/\s$/.test(prev)) return prev + next.trimStart();
    return prev + next;
  }
  if (/\s$/.test(prev)) return prev + next.trimStart();
  if (/[.,;:!?)\]}'"`]/.test(next[0] ?? "")) return prev + next;
  if (/[-_/]$/.test(prev) || /^[-_/]/.test(next)) return prev + next;
  return `${prev} ${next}`;
}
