/**
 * Soft-heal assistant markdown before GFM paint.
 * Display-only — does not mutate stored session text.
 *
 * Models often stream hard-wraps, split `**bold**` across lines, drip table
 * cell fragments onto the next row, and leave leading `,` / `;` lines. Marked
 * then paints `<br>, …` / literal `**` / junk table cells. Heal here first.
 *
 * After heal: demote layout / broken pipe blocks so only strict real comparison
 * tables reach GFM. Response-style prefs are prompt plugins on top of this lock.
 */

/** Discourse openers typical of agent status narration. */
const DISCOURSE_AFTER_END =
  /([.!?:])[ \t]+(?=(?:Hmm|Let me|Looking|Checking|Moving|Also|Found|Next|Done|I'll|I will|OK|Okay|Now|Wait|Actually|Then|Here|See|Note|Blocked|You're)\b)/g;

const BLOCK_START =
  /^(?:\s{0,3}#{1,6}\s|\s{0,3}[-*+]\s+\S|\s{0,3}\d+\.\s|\s{0,3}>\s)/;

const GLUE_WORD =
  /^(?:or|and|then|but|vs\.?|via|with|without|for|to|of|in|on|at|from|into|onto|over|under|as|than)\b/i;

/**
 * True when source already has intentional markdown / paragraph structure.
 * Soft-break discourse must not rewrite these (tables/lists still get heals).
 */
export function chatMarkdownSourceIsStructured(source: string): boolean {
  const text = source.replace(/^\uFEFF/, "");
  if (!text.trim()) return true;
  if (/\n\s*\n/.test(text)) return true;
  if (/```/.test(text)) return true;
  if (/^\s{0,3}#{1,6}\s/m.test(text)) return true;
  if (/^\s{0,3}[-*+]\s+\S/m.test(text)) return true;
  if (/^\s{0,3}\d+\.\s+\S/m.test(text)) return true;
  if (/^\s{0,3}\|/m.test(text)) return true;
  if (/^\s{0,3}>\s/m.test(text)) return true;
  return false;
}

function isFenceLine(line: string): boolean {
  return /^\s{0,3}```/.test(line);
}

function isTableSeparator(line: string): boolean {
  const t = line.trim();
  if (!t.includes("-")) return false;
  return /^\|?[\s:|-]+$/.test(t) && /-{3,}/.test(t);
}

function looksLikeTableRow(line: string): boolean {
  const t = line.trim();
  if (!t || isTableSeparator(t)) return false;
  if (t.startsWith("|")) return true;
  // "cell | cell |" without leading pipe (common model drift)
  return /\|/.test(t) && /\|/.test(t.slice(1));
}

function splitTableRow(line: string): string[] {
  let t = line.trim();
  if (t.startsWith("|")) t = t.slice(1);
  if (t.endsWith("|")) t = t.slice(0, -1);
  return t.split("|").map((c) => c.trim());
}

function joinTableRow(cells: string[]): string {
  return `| ${cells.join(" | ")} |`;
}

function isDegenerateTableRow(cells: string[], colCount: number): boolean {
  if (cells.length === 0) return true;
  const first = (cells[0] ?? "").trim();
  // Fragment rows from hard-wrapped cells: "/Slack/etc." or lone "/"
  if (first === "/" || /^\/[\w.~-]/.test(first)) return true;
  // Mostly empty / far short of header width with no real first cell
  const nonempty = cells.filter((c) => c.trim()).length;
  if (nonempty <= 1 && cells.length < colCount && !first) return true;
  if (nonempty === 1 && first.length <= 2 && /[^A-Za-z0-9]/.test(first)) {
    return true;
  }
  return false;
}

function fragmentFromDegenerateRow(cells: string[]): string {
  return cells
    .map((c) => c.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/^\/\s*/, "/")
    .trim();
}

/** Merge broken / fragment pipe rows into prior cells; keep real rows. */
export function healChatMarkdownTables(source: string): string {
  const lines = source.split("\n");
  const out: string[] = [];
  let i = 0;
  let inFence = false;

  while (i < lines.length) {
    const line = lines[i]!;
    if (isFenceLine(line)) {
      inFence = !inFence;
      out.push(line);
      i += 1;
      continue;
    }
    if (
      !inFence &&
      i + 1 < lines.length &&
      looksLikeTableRow(line) &&
      isTableSeparator(lines[i + 1]!)
    ) {
      const headerCells = splitTableRow(line);
      const colCount = Math.max(headerCells.length, 1);
      out.push(joinTableRow(headerCells));
      out.push(lines[i + 1]!);
      i += 2;
      while (i < lines.length) {
        const body = lines[i]!;
        if (!body.trim()) break;
        if (isFenceLine(body)) break;
        if (BLOCK_START.test(body) && !looksLikeTableRow(body)) break;
        if (!looksLikeTableRow(body) && !body.includes("|")) break;

        const cells = splitTableRow(body);
        if (isDegenerateTableRow(cells, colCount)) {
          const fragment = fragmentFromDegenerateRow(cells);
          if (fragment && out.length >= 2) {
            // Prefer merging into previous body row (not separator).
            for (let k = out.length - 1; k >= 0; k -= 1) {
              const prev = out[k]!;
              if (isTableSeparator(prev)) continue;
              if (!looksLikeTableRow(prev)) break;
              const prevCells = splitTableRow(prev);
              const lastIdx = Math.max(prevCells.length - 1, 0);
              const last = prevCells[lastIdx] ?? "";
              const glued =
                last && !last.endsWith("/") && fragment.startsWith("/")
                  ? `${last}${fragment}`
                  : `${last} ${fragment}`.trim();
              prevCells[lastIdx] = glued;
              while (prevCells.length < colCount) prevCells.push("");
              out[k] = joinTableRow(prevCells.slice(0, colCount));
              break;
            }
          }
          i += 1;
          continue;
        }
        while (cells.length < colCount) cells.push("");
        out.push(joinTableRow(cells.slice(0, colCount)));
        i += 1;
      }
      continue;
    }
    out.push(line);
    i += 1;
  }
  return out.join("\n");
}

/**
 * Handoff field labels (Studio task closeout). Must never be glued to prior text.
 * Matches `**Done:**` / `**You:**` / `**Blocked on you:**` / `**I'll do next (no ask):**`.
 */
const HANDOFF_LABEL_RE =
  /\*\*(?:Done|You|Blocked(?: on you)?|I'll do next(?: \(no ask\))?):\*\*/gi;

const HANDOFF_LABEL_NAMES =
  "Done|You|Blocked(?: on you)?|I'll do next(?: \\(no ask\\))?";

/** Join `**\nbold**` / `__\nbold__` split markers (marked otherwise prints literal **). */
export function healBrokenInlineMarkers(source: string): string {
  let text = source;
  // Opening ** / __ alone at EOL → pull next line up ("**\nbold**" → "**bold**").
  // Require whitespace/start before the opener so we do NOT eat the closing ** of
  // a complete marker (e.g. "**Done:**\n- bullet" must stay on two lines).
  text = text.replace(/(^|[\s(>])(\*\*|__)[ \t]*\n+[ \t]*(?=\S)/gm, "$1$2");
  // Closing marker alone on next line: "word\n**" → "word**" (line is only ** / __).
  // Do NOT pull up a new bold phrase (`green\n**You:**` must stay split).
  text = text.replace(/(\S)[ \t]*\n+[ \t]*(\*\*|__)[ \t]*(?=\n|$)/g, "$1$2");
  // Same for single-asterisk emphasis when clearly paired across one break
  text = text.replace(/(^|[^\*])\*([ \t]*\n+[ \t]*)(?=[^*\n]+\*)/gm, "$1*");
  // Handoff labels smashed across blanks: `**You\n\n:**` → `**You:**`
  text = text.replace(
    new RegExp(
      `\\*\\*(${HANDOFF_LABEL_NAMES})\\*\\*[ \\t]*\\n+[ \\t]*:\\*\\*`,
      "gi",
    ),
    "**$1:**",
  );
  text = text.replace(
    new RegExp(
      `\\*\\*(${HANDOFF_LABEL_NAMES})[ \\t]*\\n+[ \\t]*:\\*\\*`,
      "gi",
    ),
    "**$1:**",
  );
  return text;
}

/**
 * Drop blank lines before leading punctuation so soft-wrap join can fire.
 * (`scope\\n\\n, Home` → `scope\\n, Home` → joined).
 */
export function healBlankLineBeforeContinuation(source: string): string {
  return source.replace(/\n[ \t]*\n+[ \t]*(?=[,;:)\]}])/g, "\n");
}

/**
 * Bare `Handoff` / unbolded Done line → canonical closeout markers.
 * Never rewrites labels that are already `**Label:**`.
 */
export function healBareHandoffSection(source: string): string {
  let text = source;
  // `Handoff\nDone:` or `## Handoff\nDone:` (missing **) — stream marker drop.
  text = text.replace(
    /(^|\n)(?:#{1,6}\s*)?Handoff\s*\n+(?!\*\*)Done:\s*/gi,
    "$1## Handoff\n\n**Done:** ",
  );
  // Bare closeout labels only (not already bold, not mid-word like You're).
  text = text.replace(
    /(^|\n)(?!\*\*)(Done|You|Blocked(?: on you)?|I'll do next(?: \(no ask\))?):\s+/gim,
    "$1**$2:** ",
  );
  return text;
}

/**
 * Keep Handoff fields on their own lines with blank-line breathing room.
 * Repairs smashed paint (`Handoff**Done:**`, `green**You:**`) from older heals / model drift.
 */
export function healHandoffSectionSpacing(source: string): string {
  let text = source;
  // Unsmash: non-whitespace immediately before a handoff label → blank line.
  text = text.replace(
    new RegExp(`(\\S)(${HANDOFF_LABEL_RE.source})`, "gi"),
    "$1\n\n$2",
  );
  // ## Handoff then content — always a blank line after the heading.
  text = text.replace(/(#{1,6}\s*Handoff)\n(?!\n)/i, "$1\n\n");
  // Any non-empty line followed by a handoff label → blank line between.
  text = text.replace(
    new RegExp(`([^\\n])\\n(${HANDOFF_LABEL_RE.source})`, "gi"),
    "$1\n\n$2",
  );
  return text;
}

/**
 * Join hard-wrap artifacts: leading `,` / `;` / `)` / orphan `.` lines,
 * short glue words (`or`, `and`, …), and lowercase continuations.
 */
export function healSoftWrappedLines(source: string): string {
  const lines = source.split("\n");
  const out: string[] = [];
  let inFence = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    if (isFenceLine(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence || out.length === 0) {
      out.push(line);
      continue;
    }

    const prev = out[out.length - 1]!;
    const prevTrim = prev.trimEnd();
    const nextTrim = line.trim();

    // Preserve blank lines (paragraph structure).
    if (!prevTrim || !nextTrim) {
      out.push(line);
      continue;
    }
    if (isTableSeparator(nextTrim) || looksLikeTableRow(nextTrim)) {
      out.push(line);
      continue;
    }
    if (BLOCK_START.test(nextTrim)) {
      out.push(line);
      continue;
    }

    // Lone period / ellipsis line → attach to previous sentence.
    if (/^\.+\s*$/.test(nextTrim)) {
      out[out.length - 1] = `${prevTrim}${nextTrim}`;
      continue;
    }

    // Leading continuation punctuation (", file/ops" / "; polish")
    if (/^[,;:)\]}]/.test(nextTrim)) {
      out[out.length - 1] = `${prevTrim}${nextTrim}`;
      continue;
    }

    // Soft-wrapped URL: "https://studio…ts\n.net/?asDcpPreview=1"
    // or "https://x.com/path\n?query=1&x=2 for preview."
    // Join the URL fragment (no space); leave trailing prose.
    if (/https?:\/\/\S+$/i.test(prevTrim)) {
      const urlCont = nextTrim.match(/^([./?#&=%+\w-]{2,}\S*)(\s.*)?$/);
      if (urlCont?.[1]) {
        out[out.length - 1] = `${prevTrim}${urlCont[1]}${urlCont[2] ?? ""}`;
        continue;
      }
    }

    // Short glue-word wrap: "Messages…,\nor\nChat"
    if (GLUE_WORD.test(nextTrim) && nextTrim.length < 48) {
      out[out.length - 1] = `${prevTrim} ${nextTrim}`;
      continue;
    }

    // Previous line ended on a glue word — keep pulling the next clause up.
    if (
      /\b(?:or|and|then|but|vs\.?|via|with|for|to|of|in|on|at|as)\s*$/i.test(
        prevTrim,
      )
    ) {
      out[out.length - 1] = `${prevTrim} ${nextTrim}`;
      continue;
    }

    // Lowercase continuation of a wrapped sentence/phrase
    if (/^[a-z]/.test(nextTrim) && !/[.!?:]$/.test(prevTrim)) {
      out[out.length - 1] = `${prevTrim} ${nextTrim}`;
      continue;
    }

    out.push(line);
  }
  return out.join("\n");
}

/** Tighten spaces around inline code next to brackets: `x` ) → `x`). */
export function healInlineCodeSpacing(source: string): string {
  return source
    .replace(/`([^`\n]+)`[ \t]+([),;.])/g, "`$1`$2")
    .replace(/([(])[ \t]+`([^`\n]+)`/g, "$1`$2`");
}

function isMeaningfulTableCell(cell: string): boolean {
  const t = cell.replace(/\*+/g, "").trim();
  return t.length >= 1 && /[A-Za-z0-9]/.test(t);
}

function stripOuterBold(cell: string): string {
  let t = cell.trim();
  if (t.startsWith("**") && t.endsWith("**") && t.length > 4) {
    t = t.slice(2, -2).trim();
  }
  return t;
}

function cellHasUnbalancedBold(cell: string): boolean {
  const n = (cell.match(/\*\*/g) ?? []).length;
  return n % 2 === 1;
}

function isSmashedTableRow(cells: string[]): boolean {
  if (cells.length === 0) return true;
  if (!cells.some((c) => c.trim())) return true;
  if (cells.some(cellHasUnbalancedBold)) return true;
  // Header-smear / mid-stream junk: first cell is only markdown crumbs.
  const first = (cells[0] ?? "").trim();
  if (first === "**" || first === "*" || first === "`") return true;
  return false;
}

/**
 * Keep a GFM table only when it is real comparison data:
 * header + separator + ≥1 body row, consistent columns, no smashed cells.
 */
export function isStrictRealChatTable(
  headerLine: string,
  separatorLine: string,
  bodyLines: string[],
): boolean {
  if (!looksLikeTableRow(headerLine) || !isTableSeparator(separatorLine)) {
    return false;
  }
  if (bodyLines.length < 1) return false;
  const headerCells = splitTableRow(headerLine);
  if (headerCells.length < 2) return false;
  if (!headerCells.every(isMeaningfulTableCell)) return false;
  if (isSmashedTableRow(headerCells)) return false;
  const colCount = headerCells.length;
  for (const body of bodyLines) {
    if (!looksLikeTableRow(body)) return false;
    const cells = splitTableRow(body);
    if (cells.length !== colCount) return false;
    if (isSmashedTableRow(cells)) return false;
    if (!cells.some(isMeaningfulTableCell)) return false;
  }
  return true;
}

function demotePipeRowToSections(line: string): string[] {
  const cells = splitTableRow(line)
    .map((c) => c.trim())
    .filter(Boolean);
  if (cells.length === 0) return [];
  if (cells.length === 1) return [cells[0]!, ""];
  const title = stripOuterBold(cells[0]!);
  const out: string[] = [`**${title}**`, ""];
  for (const cell of cells.slice(1)) {
    const body = stripOuterBold(cell);
    if (!body) continue;
    out.push(body, "");
  }
  return out;
}

function demoteTableBlockToSections(
  headerLine: string,
  bodyLines: string[],
): string[] {
  const out: string[] = [];
  // Prefer body rows as sections; skip label-only header.
  const rows = bodyLines.length > 0 ? bodyLines : [headerLine];
  for (const row of rows) {
    out.push(...demotePipeRowToSections(row));
  }
  while (out.length > 0 && out[out.length - 1] === "") out.pop();
  return out;
}

/**
 * Paint-time lock: demote layout / broken pipe blocks to bold sections.
 * Only strict real comparison tables survive as GFM `<table>`.
 * Display-only — does not mutate stored session text.
 */
export function demoteLayoutPipeBlocks(source: string): string {
  const lines = source.split("\n");
  const out: string[] = [];
  let i = 0;
  let inFence = false;

  while (i < lines.length) {
    const line = lines[i]!;
    if (isFenceLine(line)) {
      inFence = !inFence;
      out.push(line);
      i += 1;
      continue;
    }
    if (inFence) {
      out.push(line);
      i += 1;
      continue;
    }

    // Proper table candidate: header + separator (+ body).
    if (
      i + 1 < lines.length &&
      looksLikeTableRow(line) &&
      isTableSeparator(lines[i + 1]!)
    ) {
      const header = line;
      const sep = lines[i + 1]!;
      const body: string[] = [];
      i += 2;
      while (i < lines.length) {
        const bodyLine = lines[i]!;
        if (!bodyLine.trim()) break;
        if (isFenceLine(bodyLine)) break;
        if (BLOCK_START.test(bodyLine) && !looksLikeTableRow(bodyLine)) break;
        if (!looksLikeTableRow(bodyLine) && !bodyLine.includes("|")) break;
        body.push(bodyLine);
        i += 1;
      }
      if (isStrictRealChatTable(header, sep, body)) {
        const colCount = splitTableRow(header).length;
        out.push(joinTableRow(splitTableRow(header)));
        out.push(sep);
        for (const row of body) {
          const cells = splitTableRow(row);
          while (cells.length < colCount) cells.push("");
          out.push(joinTableRow(cells.slice(0, colCount)));
        }
      } else {
        const sections = demoteTableBlockToSections(header, body);
        if (out.length > 0 && out[out.length - 1] !== "") out.push("");
        out.push(...sections);
        if (out.length > 0 && out[out.length - 1] !== "") {
          out.push("");
        }
      }
      continue;
    }

    // Layout pipes without a separator row (e.g. "Option A | cost | effort").
    if (looksLikeTableRow(line) && (line.match(/\|/g) ?? []).length >= 2) {
      const sections = demotePipeRowToSections(line);
      if (out.length > 0 && out[out.length - 1] !== "") out.push("");
      out.push(...sections);
      if (sections.length > 0 && sections[sections.length - 1] !== "") {
        out.push("");
      }
      i += 1;
      continue;
    }

    out.push(line);
    i += 1;
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

/**
 * AGNT MessageItem inspo: `end.Home` → `end. Home`.
 * Skip fenced + inline code so `foo.Bar` identifiers stay intact.
 */
export function healMissingSpaceAfterPunctuation(source: string): string {
  const lines = source.split("\n");
  const out: string[] = [];
  let inFence = false;
  for (const line of lines) {
    if (isFenceLine(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }
    out.push(
      line
        .split(/(`[^`\n]*`)/g)
        .map((seg, i) =>
          i % 2 === 1 ? seg : seg.replace(/([.!?:])([A-Z])/g, "$1 $2"),
        )
        .join(""),
    );
  }
  return out.join("\n");
}

/**
 * AGNT MessageItem inspo: odd open fence while streaming → close before GFM
 * so the rest of the bubble still parses (partial code stays in a fence).
 */
export function sealUnclosedMarkdownFences(source: string): string {
  const lines = source.split("\n");
  let open = false;
  let openChar = "`";
  let openLen = 3;
  for (const line of lines) {
    const stripped = line.trimStart();
    const m = stripped.match(/^(`{3,}|~{3,})(.*)$/);
    if (!m) continue;
    const fence = m[1]!;
    const info = (m[2] ?? "").trim();
    const char = fence[0]!;
    const len = fence.length;
    if (open) {
      if (!info && char === openChar && len >= openLen) open = false;
      continue;
    }
    open = true;
    openChar = char;
    openLen = len;
  }
  if (!open) return source;
  const closer = openChar === "~" ? "~~~" : "```";
  return `${source.replace(/\s*$/u, "")}\n${closer}`;
}

/**
 * Soft-wrap tore `agent-\nstudio` / `foo/\nbar` — join with no space (path glue).
 * Runs outside fences so code samples keep intentional wraps.
 */
export function healSoftWrappedPathBreaks(source: string): string {
  const lines = source.split("\n");
  const out: string[] = [];
  let inFence = false;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!;
    if (isFenceLine(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence || out.length === 0) {
      out.push(line);
      continue;
    }
    const prev = out[out.length - 1]!;
    const prevTrim = prev.trimEnd();
    const nextTrim = line.trim();
    if (!nextTrim) {
      // Peek past blanks for path continuation (`agent-\n\nstudio-…`).
      // Only `-` / `/` — not `.` (that glued `reply.` + `Handoff`).
      let j = i + 1;
      while (j < lines.length && !(lines[j] ?? "").trim()) j += 1;
      const peek = (lines[j] ?? "").trim();
      if (
        peek &&
        /[-/]$/.test(prevTrim) &&
        /^[a-z0-9@+]/.test(peek) &&
        !isFenceLine(lines[j]!)
      ) {
        out[out.length - 1] = `${prevTrim}${peek}`;
        i = j;
        continue;
      }
      out.push(line);
      continue;
    }
    if (/[-/]$/.test(prevTrim) && /^[a-z0-9@+]/.test(nextTrim)) {
      out[out.length - 1] = `${prevTrim}${nextTrim}`;
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}

/** Collapse whitespace inside a path-ish string (md soft wraps). */
function collapseMarkdownPathToken(raw: string): string {
  return String(raw ?? "")
    .replace(/-\s*\n+\s*/g, "-")
    .replace(/\/\s*\n+\s*/g, "/")
    .replace(/\.\s*\n+\s*/g, ".")
    .replace(/`/g, "")
    .replace(/\s+/g, "")
    .trim();
}

/**
 * Rebuild smashed `[`path`](path)` links (newlines inside label/href) into a
 * clean clickable form. Uses dynamic import-free path check via extension leaf.
 */
export function healChatFileMarkdownLinks(source: string): string {
  return source.replace(
    /\[([\s\S]*?)\]\(([\s\S]*?)\)/g,
    (full, label: string, href: string) => {
      if (!/\n|\r/.test(full) && !/`/.test(label)) {
        // Intact link without codespan label — leave for marked (may still be a file).
        const hrefPath = collapseMarkdownPathToken(href);
        if (!FILE_PATH_LEAF_RE.test(hrefPath.split("/").pop() ?? "")) {
          return full;
        }
      }
      const hrefPath = collapseMarkdownPathToken(href);
      const labelPath = collapseMarkdownPathToken(label);
      const path =
        FILE_PATH_LEAF_RE.test(hrefPath.split("/").pop() ?? "")
          ? hrefPath
          : FILE_PATH_LEAF_RE.test(labelPath.split("/").pop() ?? "")
            ? labelPath
            : "";
      if (!path || path.includes("://") || path.startsWith("/")) return full;
      return `[\`${path}\`](${path})`;
    },
  );
}

/** Wrap bare monorepo file paths as codespans so paint linkifies them. */
export function wrapBareFilePathsAsCodespans(source: string): string {
  const lines = source.split("\n");
  const out: string[] = [];
  let inFence = false;
  for (const line of lines) {
    if (isFenceLine(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }
    out.push(
      line.replace(
        /(^|[\s>])((?:projects|apps|packages|content|src|client)\/[A-Za-z0-9_./+-]+\.[A-Za-z0-9.+-]+)(?=$|[\s.,;:!?)'\]])/g,
        (full, pre: string, path: string) => {
          const idx = line.indexOf(path);
          // Skip codespan / markdown link href (`path` or ](path)).
          if (idx > 0 && (line[idx - 1] === "`" || line[idx - 1] === "(")) {
            return full;
          }
          if (!FILE_PATH_LEAF_RE.test(path.split("/").pop() ?? "")) return full;
          return `${pre}\`${path}\``;
        },
      ),
    );
  }
  return out.join("\n");
}

/** Leaf must look like a source file (shared with chat-file-path-pure intent). */
const FILE_PATH_LEAF_RE =
  /\.(?:tsx?|jsx?|m?[jt]sx?|cts|mts|mjs|cjs|jsonc?|mdx?|mdc|css|scss|less|html?|toml|ya?ml|svg|txt|svg)$/i;

/**
 * Insert blank lines after sentence ends before discourse openers when the
 * source is a flat run-on paragraph (no lists/headings/blank lines).
 * Always run table/wrap heals first, then demote junk pipes.
 */
export function prepareChatMarkdownSource(source: string): string {
  let text = source.replace(/^\uFEFF/, "");
  if (!text.trim()) return text;

  text = healBrokenInlineMarkers(text);
  text = healBlankLineBeforeContinuation(text);
  text = healSoftWrappedPathBreaks(text);
  text = healChatFileMarkdownLinks(text);
  text = healChatMarkdownTables(text);
  // After heal: keep only strict real tables; demote layout / smash pipes.
  text = demoteLayoutPipeBlocks(text);
  text = healSoftWrappedLines(text);
  text = healMissingSpaceAfterPunctuation(text);
  text = healInlineCodeSpacing(text);
  // Re-run emphasis heal after wrap joins (may reunite split markers).
  text = healBrokenInlineMarkers(text);
  text = healBareHandoffSection(text);
  // After emphasis heals — unsmash Handoff labels glued to prior text.
  text = healHandoffSectionSpacing(text);
  text = wrapBareFilePathsAsCodespans(text);
  // Last: seal odd fences so marked doesn't eat the trailing prose.
  text = sealUnclosedMarkdownFences(text);

  if (!chatMarkdownSourceIsStructured(text)) {
    text = text.replace(DISCOURSE_AFTER_END, "$1\n\n");
  }
  return text;
}
