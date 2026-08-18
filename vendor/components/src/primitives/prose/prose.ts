/**
 * Prose — long-form / blog body wrapper.
 *
 * Prefer heading + text primitives for marketing page bands.
 * Use prose when the author needs multi-block markdown-ish body
 * (lists, quotes, several paragraphs) as one Inspect target.
 */

import { componentStamp, stampSlotAttrs } from "../../inspect-stamp.js";
import { escapeAttr, htmlOrText } from "../../ssr-escape.js";

export type ProseProps = {
  size?: "base" | "lg";
  measure?: "sm" | "md" | "lg";
  className?: string;
  instanceId?: string;
  source?: string;
};

export type ProseSlots = { content?: string };

export type ProseRenderInput = {
  props?: ProseProps;
  slots?: ProseSlots;
  children?: string;
};

/**
 * Token-aware long-form styles via core Tailwind (no @tailwindcss/typography).
 * Preflight zeros `p` margins — restore rhythm here so Live matches Source blank lines.
 */
const SIZE_CLASS: Record<NonNullable<ProseProps["size"]>, string> = {
  base: [
    "max-w-none text-base leading-7 text-ink-soft",
    "[&_h1]:font-display [&_h2]:font-display [&_h3]:font-display",
    "[&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold",
    "[&_h1]:tracking-tight [&_h2]:tracking-tight [&_h3]:tracking-tight",
    "[&_h1]:text-ink [&_h2]:text-ink [&_h3]:text-ink",
    "[&_h1]:mt-8 [&_h1]:mb-4 [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:mt-6 [&_h3]:mb-3",
    "[&_h1:first-child]:mt-0 [&_h2:first-child]:mt-0 [&_h3:first-child]:mt-0",
    "[&_p]:my-5 [&_p]:text-ink-soft",
    "[&_li]:text-ink-soft [&_ul]:my-5 [&_ol]:my-5 [&_ul]:pl-6 [&_ol]:pl-6",
    "[&_a]:text-accent [&_strong]:text-ink",
    "[&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-4 [&_blockquote]:text-ink-soft",
    "[&_hr]:my-8 [&_hr]:border-line",
    "[&_.as-md-gap]:my-0 [&_.as-md-gap]:block [&_.as-md-gap]:h-6 [&_.as-md-gap]:p-0 [&_.as-md-gap]:border-0",
    "[&_.as-prose-image-wrap]:my-6 [&_.as-prose-image-wrap]:block [&_.as-prose-image-wrap]:w-full",
    "[&_.as-prose-image-stage]:block [&_.as-prose-image-stage]:max-w-full",
  ].join(" "),
  lg: [
    "max-w-none text-lg leading-8 text-ink-soft",
    "[&_h1]:font-display [&_h2]:font-display [&_h3]:font-display",
    "[&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold",
    "[&_h1]:tracking-tight [&_h2]:tracking-tight [&_h3]:tracking-tight",
    "[&_h1]:text-ink [&_h2]:text-ink [&_h3]:text-ink",
    "[&_h1]:mt-10 [&_h1]:mb-5 [&_h2]:mt-10 [&_h2]:mb-5 [&_h3]:mt-8 [&_h3]:mb-4",
    "[&_h1:first-child]:mt-0 [&_h2:first-child]:mt-0 [&_h3:first-child]:mt-0",
    "[&_p]:my-6 [&_p]:text-ink-soft",
    "[&_li]:text-ink-soft [&_ul]:my-6 [&_ol]:my-6 [&_ul]:pl-6 [&_ol]:pl-6",
    "[&_a]:text-accent [&_strong]:text-ink",
    "[&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-4 [&_blockquote]:text-ink-soft",
    "[&_hr]:my-10 [&_hr]:border-line",
    "[&_.as-md-gap]:my-0 [&_.as-md-gap]:block [&_.as-md-gap]:h-8 [&_.as-md-gap]:p-0 [&_.as-md-gap]:border-0",
    "[&_.as-prose-image-wrap]:my-8 [&_.as-prose-image-wrap]:block [&_.as-prose-image-wrap]:w-full",
    "[&_.as-prose-image-stage]:block [&_.as-prose-image-stage]:max-w-full",
  ].join(" "),
};

const MEASURE_CLASS: Record<NonNullable<ProseProps["measure"]>, string> = {
  sm: "max-w-prose",
  md: "max-w-2xl",
  lg: "max-w-3xl",
};

export function renderProse(
  input: ProseRenderInput | ProseProps = {},
): string {
  const normalized =
    "props" in input || "slots" in input || "children" in input
      ? (input as ProseRenderInput)
      : { props: input as ProseProps };
  const props = normalized.props ?? {};
  const stamp = componentStamp({
    componentId: "prose",
    instanceId: props.instanceId,
    source: props.source,
  });
  const slotStamp = stampSlotAttrs({
    componentId: "prose",
    slot: "content",
    instanceId: props.instanceId,
  });
  const cls = [
    SIZE_CLASS[props.size ?? "base"],
    MEASURE_CLASS[props.measure ?? "md"],
    "nl-rise",
    props.className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  const body = htmlOrText(
    normalized.children ??
      normalized.slots?.content ??
      "<p>Prose content</p>",
  );
  // Semantic article — long-form landmark; Inspect still stamps component id.
  return `<article class="${escapeAttr(cls)}" ${stamp}><div ${slotStamp}>${body}</div></article>`;
}

export function Prose(
  props: ProseProps & { children?: string; content?: string } = {},
): string {
  const { children, content, ...rest } = props;
  return renderProse({ props: rest, slots: { content }, children });
}
