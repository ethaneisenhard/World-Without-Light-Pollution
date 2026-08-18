/**
 * SSR HTML twin of GlassBoxMarkIcon — same geometry SoT.
 * Prefer GlassBoxMarkIcon in remix/ui JSX; use this for string HTML (Logo, marketing).
 */

import {
  GLASS_BOX_MARK_GRADIENTS,
  GLASS_BOX_MARK_GROUP_TRANSFORM,
  GLASS_BOX_MARK_HIGHLIGHT,
  GLASS_BOX_MARK_POLYGONS,
  GLASS_BOX_MARK_RED,
  GLASS_BOX_MARK_VIEW_BOX,
} from "./glass-box-mark-geometry-pure.ts";

export type GlassBoxMarkSvgOpts = {
  className?: string;
  /** Prefix for gradient ids (multiple marks on one page). */
  idPrefix?: string;
  title?: string;
};

function escapeXml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function gradientHtml(
  id: string,
  g: (typeof GLASS_BOX_MARK_GRADIENTS)[keyof typeof GLASS_BOX_MARK_GRADIENTS],
): string {
  const stops = g.stops
    .map((s) => `<stop offset="${s.offset}" stop-color="${s.color}"/>`)
    .join("");
  return `<linearGradient id="${id}" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}">${stops}</linearGradient>`;
}

/** Design-system Glass Box mark as SSR string (parity with GlassBoxMarkIcon). */
export function glassBoxMarkSvgHtml(opts: GlassBoxMarkSvgOpts = {}): string {
  const cls = opts.className?.trim() || "size-full shrink-0";
  const pfx = (opts.idPrefix?.trim() || "as-gb-mark").replace(/[^a-zA-Z0-9_-]/g, "");
  const top = `${pfx}-top`;
  const left = `${pfx}-left`;
  const right = `${pfx}-right`;
  const glass = `${pfx}-glass`;
  const title = opts.title?.trim()
    ? `<title>${escapeXml(opts.title.trim())}</title>`
    : "";
  const aria = opts.title?.trim()
    ? ` role="img" aria-label="${escapeXml(opts.title.trim())}"`
    : ` aria-hidden="true"`;
  const poly = GLASS_BOX_MARK_POLYGONS;
  const g = GLASS_BOX_MARK_GRADIENTS;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${GLASS_BOX_MARK_VIEW_BOX}" fill="none" class="${escapeXml(cls)}" data-slot="icon" data-studio-icon="glass-box-mark"${aria}>${title}<defs>
${gradientHtml(top, g.top)}
${gradientHtml(left, g.left)}
${gradientHtml(right, g.right)}
${gradientHtml(glass, g.glass)}
</defs>
<g transform="${GLASS_BOX_MARK_GROUP_TRANSFORM}" shape-rendering="geometricPrecision">
<polygon fill="url(#${left})" points="${poly.left}"/>
<polygon fill="url(#${right})" points="${poly.rightA}"/>
<polygon fill="url(#${right})" points="${poly.rightB}"/>
<polygon fill="url(#${right})" points="${poly.rightC}"/>
<polygon fill="url(#${right})" points="${poly.rightD}"/>
<polygon fill="${GLASS_BOX_MARK_RED}" points="${poly.red}"/>
<polygon fill="url(#${top})" points="${poly.topA}"/>
<polygon fill="url(#${top})" points="${poly.topB}"/>
<polygon fill="url(#${glass})" points="${poly.glassA}"/>
<polygon fill="url(#${glass})" points="${poly.glassB}"/>
<polyline fill="none" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="2.5" stroke-linejoin="round" points="${GLASS_BOX_MARK_HIGHLIGHT}"/>
</g></svg>`;
}
