/**
 * Collapse accidental double-emitted assistant text (same reply pasted twice).
 * Common when a harness regenerates / relays a full snapshot after tokens.
 *
 * Studio signal: two `## Handoff` blocks in one assistant bubble = always a
 * glitch — never a legitimate single-turn shape.
 */

const MIN_DUP_CHARS = 48;

function normalizeForDupCompare(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function longestCommonPrefixLength(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) i++;
  return i;
}

/** Map index in whitespace-stripped string back to index in `raw`. */
function mapTightIndexToRaw(raw: string, tightIndex: number): number {
  if (tightIndex <= 0) return 0;
  let t = 0;
  for (let i = 0; i < raw.length; i++) {
    if (/\s/u.test(raw[i]!)) continue;
    if (t === tightIndex) return i;
    t += 1;
  }
  return raw.length;
}

/** Walk raw until its normalized form equals `normPrefix`. */
function sliceRawMatchingNormPrefix(raw: string, normPrefix: string): string {
  const target = normPrefix;
  let best = "";
  for (let i = 0; i < raw.length; i++) {
    const acc = normalizeForDupCompare(raw.slice(0, i + 1));
    if (acc === target) {
      return raw.slice(0, i + 1).replace(/\s+$/u, "");
    }
    if (acc.length <= target.length) best = raw.slice(0, i + 1);
    if (acc.length > target.length) break;
  }
  return best.replace(/\s+$/u, "") || raw;
}

/**
 * End offset of the first Handoff section (heading → I'll do next block).
 */
function endOfFirstHandoffBlock(raw: string, h1: number): number | null {
  const after = raw.slice(h1);
  // Accept label drift: I'll do next / I'll do next (no ask).
  const m = after.match(
    /^#{1,6}\s*Handoff\s*\r?\n[\s\S]*?\*\*I'll do next(?: \(no ask\))?:\*\*[^\n]*(?:\r?\n(?!\r?\n)[^\n]*)*/im,
  );
  if (!m || m[0].length < 24) return null;
  return h1 + m[0].length;
}

/**
 * Two `## Handoff` headings → keep through the *end* of the first Handoff
 * block, then drop the replayed body (cutting at the second heading keeps
 * that replay — wrong).
 */
function collapseByRepeatedHandoffHeading(raw: string): string | null {
  const re = /^#{1,6}\s*Handoff\s*$/gim;
  const starts: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) != null) {
    if (typeof m.index === "number") starts.push(m.index);
  }
  if (starts.length < 2) return null;

  const h1 = starts[0]!;
  const h2 = starts[1]!;
  const endFirst = endOfFirstHandoffBlock(raw, h1);
  if (endFirst == null || endFirst <= h1) return null;
  // First handoff must end before the second heading.
  if (endFirst > h2) return null;

  const pre = raw.slice(0, h1);
  const preTight = pre.replace(/\s+/gu, "");
  const rest = raw.slice(endFirst).replace(/^\s+/u, "");
  const restTight = rest.replace(/\s+/gu, "");
  if (preTight.length < 24 || restTight.length < MIN_DUP_CHARS) return null;

  // Trailing text should look like a replay of the pre-handoff body (or its
  // suffix when the intro was not repeated).
  const probe = restTight.slice(0, Math.min(96, Math.floor(restTight.length * 0.4)));
  if (probe.length < 24) return null;
  const bodyReplay =
    preTight.includes(probe) ||
    preTight.endsWith(restTight.slice(0, Math.min(restTight.length, preTight.length))) ||
    longestCommonPrefixLength(
      restTight,
      preTight.slice(Math.max(0, preTight.length - restTight.length)),
    ) /
      Math.min(restTight.length, preTight.length) >=
      0.72;
  if (!bodyReplay) return null;

  const kept = raw.slice(0, endFirst).replace(/\s+$/u, "");
  if (kept.length < MIN_DUP_CHARS) return null;
  if ((kept.match(/^#{1,6}\s*Handoff\s*$/gim) ?? []).length !== 1) return null;
  return kept;
}

/**
 * Find a large near-duplicate suffix (space-insensitive) and drop it.
 * Catches intro+A+A when A does not start at string index 0.
 */
function collapseByNearDuplicateTail(raw: string): string | null {
  if (raw.length < MIN_DUP_CHARS * 2) return null;

  const blankSplits: number[] = [];
  let from = 0;
  const minCut = Math.floor(raw.length * 0.3);
  const maxCut = Math.ceil(raw.length * 0.75);
  while (from < raw.length) {
    const i = raw.indexOf("\n\n", from);
    if (i === -1) break;
    if (i >= minCut && i <= maxCut) blankSplits.push(i);
    from = i + 2;
  }

  for (const split of blankSplits) {
    const left = raw.slice(0, split);
    const right = raw.slice(split).replace(/^\s+/u, "");
    if (left.length < MIN_DUP_CHARS || right.length < MIN_DUP_CHARS) continue;
    const tL = left.replace(/\s+/gu, "");
    const tR = right.replace(/\s+/gu, "");
    const ratio =
      Math.min(tL.length, tR.length) / Math.max(tL.length, tR.length);
    if (ratio < 0.55) continue;
    const lcp = longestCommonPrefixLength(tR, tL.slice(-tR.length));
    const rightVsLeftSuffix = tR.length ? lcp / tR.length : 0;
    const idx = tL.indexOf(tR.slice(0, Math.min(80, tR.length)));
    const interiorOk =
      idx >= 0 &&
      idx + tR.length >= tL.length * 0.85 &&
      tR.length >= tL.length * 0.45;
    const suffixOk = rightVsLeftSuffix >= 0.88;
    const fullLcp = longestCommonPrefixLength(tL, tR);
    const fullOk =
      fullLcp / Math.min(tL.length, tR.length) >= 0.9 && ratio >= 0.85;
    if (!suffixOk && !interiorOk && !fullOk) continue;
    return left.replace(/\s+$/u, "");
  }
  return null;
}

function collapseBySeparators(raw: string): string | null {
  const separators = ["\n\n", "\n", " "];
  for (const sep of separators) {
    const minLeft = Math.floor(raw.length * 0.35);
    const maxLeft = Math.ceil(raw.length * 0.65);
    let from = raw.indexOf(sep, minLeft);
    while (from !== -1 && from <= maxLeft) {
      const left = raw.slice(0, from);
      const right = raw.slice(from + sep.length);
      if (
        left.length >= MIN_DUP_CHARS &&
        right.length >= MIN_DUP_CHARS &&
        (left === right ||
          normalizeForDupCompare(left) === normalizeForDupCompare(right))
      ) {
        return left;
      }
      const tL = left.replace(/\s+/gu, "");
      const tR = right.replace(/\s+/gu, "");
      if (
        tL.length >= MIN_DUP_CHARS &&
        tR.length >= MIN_DUP_CHARS &&
        longestCommonPrefixLength(tL, tR) /
          Math.min(tL.length, tR.length) >=
          0.92 &&
        Math.min(tL.length, tR.length) / Math.max(tL.length, tR.length) >= 0.85
      ) {
        return left;
      }
      from = raw.indexOf(sep, from + sep.length);
    }
  }
  return null;
}

/**
 * Second full reply often restarts with the same opener after a blank line,
 * even when mid-copy whitespace differs ("studio.\n\nnav" vs "studio.nav").
 */
function collapseByRepeatedOpener(raw: string): string | null {
  const norm = normalizeForDupCompare(raw);
  if (norm.length < MIN_DUP_CHARS * 2) return null;
  const openerLen = Math.min(96, Math.max(40, Math.floor(norm.length * 0.22)));
  const opener = norm.slice(0, openerLen);
  const second = norm.indexOf(opener, openerLen);
  if (second < 0) return null;
  if (second < norm.length * 0.35 || second > norm.length * 0.72) return null;
  const first = norm.slice(0, second).trim();
  const rest = norm.slice(second).trim();
  if (first.length < MIN_DUP_CHARS || rest.length < MIN_DUP_CHARS) return null;
  const ratio =
    Math.min(first.length, rest.length) / Math.max(first.length, rest.length);
  if (ratio < 0.7) return null;
  const tightA = first.replace(/\s+/gu, "");
  const tightB = rest.replace(/\s+/gu, "");
  const tightLcp = longestCommonPrefixLength(tightA, tightB);
  const tightRatio = tightLcp / Math.min(tightA.length, tightB.length);
  const softLcp = longestCommonPrefixLength(first, rest);
  const softOk = softLcp >= Math.min(first.length, rest.length) * 0.82;
  const tightOk = tightRatio >= 0.9;
  if (!softOk && !tightOk) return null;
  return sliceRawMatchingNormPrefix(raw, first);
}

/**
 * If `content` is A + separator + A (same reply twice), return one copy of A.
 * Also catches whitespace-corrupted doubles and intro+A+A (two Handoffs).
 */
export function collapseDuplicatedAssistantText(content: string): string {
  const raw = typeof content === "string" ? content : "";
  if (raw.length < MIN_DUP_CHARS * 2) return raw;

  // Strongest Studio signal — find body replay after first Handoff.
  const viaHandoff = collapseByRepeatedHandoffHeading(raw);
  if (viaHandoff != null) return viaHandoff;

  const viaSep = collapseBySeparators(raw);
  if (viaSep != null) return viaSep;

  // Exact half (no separator).
  if (raw.length % 2 === 0) {
    const half = raw.length / 2;
    const left = raw.slice(0, half);
    const right = raw.slice(half);
    if (
      left.length >= MIN_DUP_CHARS &&
      (left === right ||
        normalizeForDupCompare(left) === normalizeForDupCompare(right))
    ) {
      return left;
    }
  }

  const viaOpener = collapseByRepeatedOpener(raw);
  if (viaOpener != null) return viaOpener;

  const viaTail = collapseByNearDuplicateTail(raw);
  if (viaTail != null) return viaTail;

  // Normalized whole-string double.
  const norm = normalizeForDupCompare(raw);
  if (norm.length >= MIN_DUP_CHARS * 2) {
    const mid = Math.floor(norm.length / 2);
    for (let cut = mid - 120; cut <= mid + 120; cut++) {
      if (cut < MIN_DUP_CHARS || cut > norm.length - MIN_DUP_CHARS) continue;
      const a = norm.slice(0, cut);
      const b = norm.slice(cut).trimStart();
      if (a.length < MIN_DUP_CHARS || b.length < MIN_DUP_CHARS) continue;
      if (a === b) {
        return sliceRawMatchingNormPrefix(raw, a);
      }
      if (
        (a.startsWith(b) || b.startsWith(a)) &&
        Math.min(a.length, b.length) / Math.max(a.length, b.length) >= 0.9
      ) {
        const keep = a.length >= b.length ? a : b;
        return sliceRawMatchingNormPrefix(raw, keep);
      }
    }
  }

  return raw;
}
