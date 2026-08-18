/**
 * Preserve author blank lines through ProseMirror (Write) ↔ Source ↔ Live.
 *
 * defaultMarkdownSerializer drops empty paragraphs, so Enter×N in Write
 * never reaches the draft / Live. We park a ZWSP marker in those slots.
 */

/** Zero-width space — invisible, keeps an empty PM paragraph in markdown. */
export const MD_BLANK_GAP_MARKER = "\u200b";

/**
 * Before PM parse: turn 3+ newlines into ZWSP-only paragraphs so empties survive.
 * `\n\n` (normal para break) unchanged; each extra `\n` → one gap paragraph.
 */
export function encodeBlankGapsForProseMirror(source: string): string {
  return source.replace(/\n{3,}/g, (match) => {
    const extras = match.length - 2;
    if (extras <= 0) return match;
    const gaps = Array.from({ length: extras }, () => MD_BLANK_GAP_MARKER).join(
      "\n\n",
    );
    return `\n\n${gaps}\n\n`;
  });
}

/**
 * After PM serialize: ZWSP-only paragraphs → real blank lines for Source + Live.
 * `# Ab\n\n\\u200b\n\n\\u200b\n\nHello` → `# Ab\n\n\n\nHello` (two extras).
 */
export function decodeBlankGapsFromProseMirror(source: string): string {
  const restored = source.replace(/\n\n((?:\u200b\n\n)+)/g, (_m, markers: string) => {
    const count = (markers.match(/\u200b/g) ?? []).length;
    return "\n".repeat(2 + count);
  });
  // Trailing / lone ZWSP paras
  return restored
    .replace(/\n\n\u200b[ \t]*(?=\n|$)/g, "\n\n\n")
    .replace(/\u200b/g, "");
}

/**
 * Peel heading without destroying author blank lines after `# Title`.
 * Only strips the heading line + at most one following newline.
 */
export function bodyAfterHeading(afterFrontmatter: string): {
  title: string | null;
  body: string;
} {
  const heading = afterFrontmatter.match(/^#\s+(.+)$/m);
  if (!heading || heading.index === undefined) {
    return { title: null, body: afterFrontmatter };
  }
  const title = heading[1]?.trim() || null;
  const start = heading.index;
  const end = start + heading[0].length;
  let body = afterFrontmatter.slice(0, start) + afterFrontmatter.slice(end);
  // Drop the single newline that always follows the heading line — keep extras.
  if (body.startsWith("\r\n")) body = body.slice(2);
  else if (body.startsWith("\n")) body = body.slice(1);
  return { title, body };
}
