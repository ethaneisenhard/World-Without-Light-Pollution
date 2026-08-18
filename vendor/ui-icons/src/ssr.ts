/**
 * Common chrome icons as SSR HTML strings (Heroicons catalog).
 * Prefer remix factories (`MoonIcon({ class })`) in JSX; use these for string HTML.
 */
import arrowPath from "./generated/heroicons/outline/arrow-path.json" with { type: "json" };
import arrowRight from "./generated/heroicons/outline/arrow-right.json" with { type: "json" };
import arrowRightOnRectangle from "./generated/heroicons/outline/arrow-right-on-rectangle.json" with { type: "json" };
import banknotes from "./generated/heroicons/outline/banknotes.json" with { type: "json" };
import bars3 from "./generated/heroicons/outline/bars-3.json" with { type: "json" };
import chevronDown from "./generated/heroicons/outline/chevron-down.json" with { type: "json" };
import cube from "./generated/heroicons/outline/cube.json" with { type: "json" };
import fingerPrint from "./generated/heroicons/outline/finger-print.json" with { type: "json" };
import globeAlt from "./generated/heroicons/outline/globe-alt.json" with { type: "json" };
import informationCircle from "./generated/heroicons/outline/information-circle.json" with { type: "json" };
import moon from "./generated/heroicons/outline/moon.json" with { type: "json" };
import puzzlePiece from "./generated/heroicons/outline/puzzle-piece.json" with { type: "json" };
import queueList from "./generated/heroicons/outline/queue-list.json" with { type: "json" };
import serverStack from "./generated/heroicons/outline/server-stack.json" with { type: "json" };
import sparkles from "./generated/heroicons/outline/sparkles.json" with { type: "json" };
import sun from "./generated/heroicons/outline/sun.json" with { type: "json" };
import userCircle from "./generated/heroicons/outline/user-circle.json" with { type: "json" };
import xMark from "./generated/heroicons/outline/x-mark.json" with { type: "json" };
import { outlineIconSvg } from "./icon-svg.ts";
import type { IconGlyph } from "./types.ts";

const OUTLINE_BY_NAME: Record<string, IconGlyph[]> = {
  "arrow-path": arrowPath as IconGlyph[],
  "arrow-right": arrowRight as IconGlyph[],
  "arrow-right-on-rectangle": arrowRightOnRectangle as IconGlyph[],
  banknotes: banknotes as IconGlyph[],
  "bars-3": bars3 as IconGlyph[],
  "chevron-down": chevronDown as IconGlyph[],
  cube: cube as IconGlyph[],
  "finger-print": fingerPrint as IconGlyph[],
  "globe-alt": globeAlt as IconGlyph[],
  "information-circle": informationCircle as IconGlyph[],
  moon: moon as IconGlyph[],
  "puzzle-piece": puzzlePiece as IconGlyph[],
  "queue-list": queueList as IconGlyph[],
  "server-stack": serverStack as IconGlyph[],
  sparkles: sparkles as IconGlyph[],
  sun: sun as IconGlyph[],
  "user-circle": userCircle as IconGlyph[],
  "x-mark": xMark as IconGlyph[],
};

/** Resolve a Heroicons outline kebab name to SSR SVG HTML. */
export function outlineIconSvgByName(
  name: string,
  className = "size-5 shrink-0",
): string {
  const glyphs = OUTLINE_BY_NAME[name] ?? OUTLINE_BY_NAME["information-circle"]!;
  return outlineIconSvg(glyphs, { class: className });
}

export function bars3OutlineSvg(className = "size-6"): string {
  return outlineIconSvgByName("bars-3", className);
}

export function xMarkOutlineSvg(className = "size-6"): string {
  return outlineIconSvgByName("x-mark", className);
}

export function moonOutlineSvg(className = "size-4"): string {
  return outlineIconSvgByName("moon", className);
}

export function sunOutlineSvg(className = "size-4"): string {
  return outlineIconSvgByName("sun", className);
}

export function arrowRightOutlineSvg(className = "size-4"): string {
  return outlineIconSvgByName("arrow-right", className);
}

export function sparklesOutlineSvg(className = "size-5"): string {
  return outlineIconSvgByName("sparkles", className);
}

export function fingerPrintOutlineSvg(className = "size-4"): string {
  return outlineIconSvgByName("finger-print", className);
}

export {
  glassBoxMarkSvgHtml,
  type GlassBoxMarkSvgOpts,
} from "./brand/glass-box-mark-ssr-pure.ts";
