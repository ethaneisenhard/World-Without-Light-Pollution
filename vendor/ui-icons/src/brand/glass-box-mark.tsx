/**
 * Glass Box Computers product mark — design-system SoT (remix/ui factory).
 * Brand exception to Heroicons-only. Geometry: `glass-box-mark-geometry-pure.ts`.
 * String HTML twin: `glassBoxMarkSvgHtml` from `@glassbox-studio/ui-icons/ssr`.
 * Static — no auto-rotate (boot splash `/glass-box-splash/mount.js` is separate).
 */
/** @jsxImportSource remix/ui */
import type { IconProps } from "../types.ts";
import {
  GLASS_BOX_MARK_GRADIENTS,
  GLASS_BOX_MARK_GROUP_TRANSFORM,
  GLASS_BOX_MARK_HIGHLIGHT,
  GLASS_BOX_MARK_POLYGONS,
  GLASS_BOX_MARK_RED,
  GLASS_BOX_MARK_VIEW_BOX,
} from "./glass-box-mark-geometry-pure.ts";

function resolveClass(props: IconProps, fallback: string): string {
  return props.class ?? props.className ?? fallback;
}

/** Unique-enough gradient ids so multiple marks on one page do not clash. */
const GID = {
  top: "as-gb-mark-top",
  left: "as-gb-mark-left",
  right: "as-gb-mark-right",
  glass: "as-gb-mark-glass",
} as const;

/**
 * Call as `{GlassBoxMarkIcon({ class: "size-full" })}` — remix/ui factory, not a Handle.
 * Prefer this for all Glass Box product marks in remix/ui.
 */
export function GlassBoxMarkIcon(props: IconProps = {}) {
  const g = GLASS_BOX_MARK_GRADIENTS;
  const p = GLASS_BOX_MARK_POLYGONS;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={GLASS_BOX_MARK_VIEW_BOX}
      fill="none"
      class={resolveClass(props, "size-full shrink-0")}
      aria-hidden={props.title ? undefined : "true"}
      data-slot="icon"
      data-studio-icon="glass-box-mark"
      role={props.title ? "img" : undefined}
    >
      {props.title ? <title>{props.title}</title> : null}
      <defs>
        <linearGradient id={GID.top} x1={g.top.x1} y1={g.top.y1} x2={g.top.x2} y2={g.top.y2}>
          {g.top.stops.map((s) => (
            <stop key={s.offset} offset={s.offset} stop-color={s.color} />
          ))}
        </linearGradient>
        <linearGradient id={GID.left} x1={g.left.x1} y1={g.left.y1} x2={g.left.x2} y2={g.left.y2}>
          {g.left.stops.map((s) => (
            <stop key={s.offset} offset={s.offset} stop-color={s.color} />
          ))}
        </linearGradient>
        <linearGradient id={GID.right} x1={g.right.x1} y1={g.right.y1} x2={g.right.x2} y2={g.right.y2}>
          {g.right.stops.map((s) => (
            <stop key={s.offset} offset={s.offset} stop-color={s.color} />
          ))}
        </linearGradient>
        <linearGradient id={GID.glass} x1={g.glass.x1} y1={g.glass.y1} x2={g.glass.x2} y2={g.glass.y2}>
          {g.glass.stops.map((s) => (
            <stop key={s.offset} offset={s.offset} stop-color={s.color} />
          ))}
        </linearGradient>
      </defs>
      <g transform={GLASS_BOX_MARK_GROUP_TRANSFORM} shape-rendering="geometricPrecision">
        <polygon fill={`url(#${GID.left})`} points={p.left} />
        <polygon fill={`url(#${GID.right})`} points={p.rightA} />
        <polygon fill={`url(#${GID.right})`} points={p.rightB} />
        <polygon fill={`url(#${GID.right})`} points={p.rightC} />
        <polygon fill={`url(#${GID.right})`} points={p.rightD} />
        <polygon fill={GLASS_BOX_MARK_RED} points={p.red} />
        <polygon fill={`url(#${GID.top})`} points={p.topA} />
        <polygon fill={`url(#${GID.top})`} points={p.topB} />
        <polygon fill={`url(#${GID.glass})`} points={p.glassA} />
        <polygon fill={`url(#${GID.glass})`} points={p.glassB} />
        <polyline
          fill="none"
          stroke="#FFFFFF"
          stroke-opacity="0.35"
          stroke-width="2.5"
          stroke-linejoin="round"
          points={GLASS_BOX_MARK_HIGHLIGHT}
        />
      </g>
    </svg>
  );
}

export default GlassBoxMarkIcon;
