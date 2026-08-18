import type { IconGlyph, IconProps } from "./types.ts";

function escapeAttr(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function glyphToHtml(glyph: IconGlyph): string {
  const attrs = Object.entries(glyph.attrs)
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
    .join(" ");
  return `<${glyph.tag}${attrs ? ` ${attrs}` : ""}/>`;
}

function resolveClass(props: IconProps, fallback: string): string {
  return props.class ?? props.className ?? fallback;
}

/**
 * SSR HTML for a Heroicons outline glyph — same catalog as remix factories.
 * Use for Worker/string HTML (header, Live SSR). Prefer remix factories in JSX.
 */
export function outlineIconSvg(
  glyphs: readonly IconGlyph[],
  props: IconProps = {},
): string {
  const cls = escapeAttr(resolveClass(props, "size-5 shrink-0"));
  const title = props.title
    ? `<title>${escapeAttr(props.title)}</title>`
    : "";
  const aria = props.title ? "" : ` aria-hidden="true"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" class="${cls}"${aria} data-slot="icon">${title}${glyphs.map(glyphToHtml).join("")}</svg>`;
}

/** SSR HTML for a Heroicons solid glyph. */
export function solidIconSvg(
  glyphs: readonly IconGlyph[],
  props: IconProps = {},
): string {
  const cls = escapeAttr(resolveClass(props, "size-5 shrink-0"));
  const title = props.title
    ? `<title>${escapeAttr(props.title)}</title>`
    : "";
  const aria = props.title ? "" : ` aria-hidden="true"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="${cls}"${aria} data-slot="icon">${title}${glyphs.map(glyphToHtml).join("")}</svg>`;
}
