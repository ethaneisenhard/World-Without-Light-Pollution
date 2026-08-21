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
  return stampMarkdownHeadingAnchors(markdownToHtml(source, opts));
}

/** URL fragment for a heading — stable, shareable, no punctuation. */
export function headingSlug(text: string): string {
  const slug = text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['"“”‘’]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
}

/** Stamp `id` + in-heading link so section URLs scroll smoothly. */
export function stampMarkdownHeadingAnchors(html: string): string {
  const used = new Map<string, number>();
  return html.replace(
    /<(h[1-3])(\s[^>]*)?>([\s\S]*?)<\/\1>/gi,
    (_full, tag: string, attrs = "", inner: string) => {
      if (/\sid=/i.test(attrs)) return _full;
      const plain = inner.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
      let slug = headingSlug(plain);
      const n = (used.get(slug) ?? 0) + 1;
      used.set(slug, n);
      if (n > 1) slug = `${slug}-${n}`;
      return `<${tag}${attrs} id="${slug}"><a class="nl-heading-link" href="#${slug}">${inner}</a></${tag}>`;
    },
  );
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
  return decodeInlineTextEntities(single ? single[1] : html);
}

/**
 * Marked turns `'` into `&#39;`. Heading/text primitives then escape again
 * when the slot has no tags — visitors see `night&#39;s`. Undo those.
 */
function decodeInlineTextEntities(html: string): string {
  return html
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#34;/g, '"')
    .replace(/&quot;/g, '"');
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
