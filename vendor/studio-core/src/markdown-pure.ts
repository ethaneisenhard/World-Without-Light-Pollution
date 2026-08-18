/**
 * Markdown → HTML via [marked](https://github.com/markedjs/marked) (CommonMark + GFM).
 * Pure wrapper — no I/O. Ideal-stack projects use this instead of hand-rolled parsers.
 *
 * Images: `media:<id>` / Studio media paths rewrite to optimized `<img>` (srcset + webp).
 * Extra blank lines (beyond one paragraph break) become visible vertical gaps on Live.
 */
import { marked, type Tokens } from "marked";
import {
  buildOptimizedSrcSet,
  mediaHrefDisplayPercent,
  parseMediaHref,
  resolveMediaImageUrl,
  type ResolveMediaHrefOpts,
} from "./image-optimize-pure.js";

marked.setOptions({
  gfm: true,
  // Single newlines in Source → <br> on Live (authors expect Enter to show).
  breaks: true,
});

export type MarkdownToHtmlOpts = ResolveMediaHrefOpts & {
  /** Default true when media opts present — emit srcset WebP. */
  optimizeImages?: boolean;
  sizes?: string;
};

function escapeAttr(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/**
 * CommonMark collapses 2+ blank lines to one paragraph break.
 * Preserve author "extra space" as spacer elements so Live matches Source gaps.
 */
export function expandMarkdownBlankGaps(source: string): string {
  return source.replace(/\n{3,}/g, (match) => {
    // `\n\n` = normal paragraph break; each extra `\n` → one gap.
    const extras = match.length - 2;
    if (extras <= 0) return match;
    const gaps = Array.from(
      { length: extras },
      () => '<div class="as-md-gap" aria-hidden="true"></div>',
    ).join("\n\n");
    return `\n\n${gaps}\n\n`;
  });
}

function renderOptimizedImg(
  href: string,
  alt: string,
  opts: MarkdownToHtmlOpts,
): string {
  const optimize = opts.optimizeImages !== false;
  const isMedia = Boolean(parseMediaHref(href));
  const pct = mediaHrefDisplayPercent(href);
  const src = resolveMediaImageUrl(href, {
    apiOrigin: opts.apiOrigin,
    defaultProjectId: opts.defaultProjectId,
    transform: optimize
      ? { width: pct ? undefined : 1200, format: "webp", quality: 82 }
      : undefined,
  });
  const srcset =
    optimize && (isMedia || href.includes("/media/"))
      ? buildOptimizedSrcSet(href, {
          apiOrigin: opts.apiOrigin,
          defaultProjectId: opts.defaultProjectId,
        })
      : "";
  const sizes = opts.sizes ?? "(max-width: 768px) 100vw, 720px";
  const imgAttrs = [
    `src="${escapeAttr(src)}"`,
    alt ? `alt="${escapeAttr(alt)}"` : 'alt=""',
    srcset ? `srcset="${escapeAttr(srcset)}"` : "",
    srcset ? `sizes="${escapeAttr(sizes)}"` : "",
    'loading="lazy"',
    'decoding="async"',
    'data-as-component="optimized-image"',
    'data-as-inspect="1"',
    'data-as-kind="component"',
    'class="as-prose-image h-auto w-full max-w-full rounded-xl border border-line"',
  ]
    .filter(Boolean)
    .join(" ");
  const img = `<img ${imgAttrs} />`;
  if (!pct) return img;
  // BrowserUI-shaped stage: percent of prose measure.
  return `<span class="as-prose-image-wrap" data-as-image-wrap="1"><span class="as-prose-image-stage" style="width:${pct}%" data-width="${pct}">${img}</span></span>`;
}

/** Render markdown source to HTML (sync). */
export function markdownToHtml(
  source: string,
  opts: MarkdownToHtmlOpts = {},
): string {
  const text = expandMarkdownBlankGaps(source.replace(/^\uFEFF/, ""));
  if (!text.trim()) return "";

  const renderer = new marked.Renderer();
  const prevImage = renderer.image.bind(renderer);
  renderer.image = (token: Tokens.Image) => {
    const href = token.href ?? "";
    const alt = token.text ?? "";
    if (
      parseMediaHref(href) ||
      href.includes("/api/projects/") ||
      href.includes("/api/studio/media/")
    ) {
      return renderOptimizedImg(href, alt, opts);
    }
    if (opts.optimizeImages && href) {
      return renderOptimizedImg(href, alt, opts);
    }
    return prevImage(token);
  };

  return marked.parse(text, { async: false, renderer }) as string;
}
