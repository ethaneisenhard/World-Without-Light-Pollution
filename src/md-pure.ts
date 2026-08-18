import {
  markdownToHtml,
  resolveStudioMediaApiOrigin,
  type MarkdownToHtmlOpts,
} from "@glassbox-studio/studio-core/browser";

/**
 * Page markdown → HTML. Delegates to marked via studio-core (no hand-rolled parser).
 * Pass media opts so `media:<id>` images get optimized srcset URLs.
 */
export function markdownToSimpleHtml(
  source: string,
  opts?: MarkdownToHtmlOpts,
): string {
  return markdownToHtml(source, opts);
}

/** Studio API origin for Live `<img src>` (cross-origin OK for images). */
export function studioMediaApiOrigin(): string {
  const env =
    typeof process !== "undefined" && process.env
      ? (process.env as Record<string, string | undefined>)
      : {};
  return resolveStudioMediaApiOrigin(env);
}

/**
 * Inline markdown for hero lines / titles — unwrap a single outer `<p>`.
 * Multi-block markdown stays as block HTML.
 */
export function markdownToInlineHtml(source: string): string {
  const html = markdownToSimpleHtml(source).trim();
  const single = html.match(/^<p>([\s\S]*)<\/p>$/i);
  return single ? single[1] : html;
}

/** Parse marketing page MD the same way generate-pages.mjs does. */
export function pageFromDraftSource(
  raw: string,
  fallbackSlug: string,
): { title: string; body: string } {
  const text = raw.replace(/^\uFEFF/, "").trim();
  const heading = text.match(/^#\s+(.+)$/m);
  const title = heading?.[1]?.trim() ?? fallbackSlug;
  const body = heading ? text.replace(heading[0], "").trim() : text;
  return { title, body };
}
