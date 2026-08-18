/** @jsxImportSource remix/ui */
import type { IconGlyph, IconProps } from "./types.ts";

function resolveClass(props: IconProps, fallback: string): string {
  return props.class ?? props.className ?? fallback;
}

function glyphEl(glyph: IconGlyph, key: number) {
  const a = glyph.attrs;
  switch (glyph.tag) {
    case "path":
      return <path key={key} d={a.d} fill={a.fill} fill-rule={a["fill-rule"]} clip-rule={a["clip-rule"]} />;
    case "circle":
      return (
        <circle
          key={key}
          cx={a.cx}
          cy={a.cy}
          r={a.r}
          fill={a.fill}
        />
      );
    case "rect":
      return (
        <rect
          key={key}
          x={a.x}
          y={a.y}
          width={a.width}
          height={a.height}
          rx={a.rx}
          ry={a.ry}
          fill={a.fill}
        />
      );
    case "line":
      return (
        <line
          key={key}
          x1={a.x1}
          y1={a.y1}
          x2={a.x2}
          y2={a.y2}
        />
      );
    case "polyline":
      return <polyline key={key} points={a.points} fill={a.fill} />;
    case "polygon":
      return <polygon key={key} points={a.points} fill={a.fill} />;
    default:
      return null;
  }
}

/**
 * remix/ui icon factory — call as `{ComputerDesktopIcon({ class: "size-5" })}`.
 * Do not mount as a Handle component (`<ComputerDesktopIcon />` is wrong for remix).
 */
export function createOutlineIcon(glyphs: readonly IconGlyph[]) {
  return function OutlineIcon(props: IconProps = {}) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        class={resolveClass(props, "size-5 shrink-0")}
        aria-hidden={props.title ? undefined : "true"}
        data-slot="icon"
      >
        {props.title ? <title>{props.title}</title> : null}
        {glyphs.map((g, i) => glyphEl(g, i))}
      </svg>
    );
  };
}

export function createSolidIcon(glyphs: readonly IconGlyph[]) {
  return function SolidIcon(props: IconProps = {}) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class={resolveClass(props, "size-5 shrink-0")}
        aria-hidden={props.title ? undefined : "true"}
        data-slot="icon"
      >
        {props.title ? <title>{props.title}</title> : null}
        {glyphs.map((g, i) => glyphEl(g, i))}
      </svg>
    );
  };
}

export type IconFactory = ReturnType<typeof createOutlineIcon>;
