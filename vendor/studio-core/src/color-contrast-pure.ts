/**
 * Background ↔ text / hairline awareness — WCAG relative luminance + mix helpers.
 * Used by theme shell paint and design audits (no DOM).
 */

export type Rgb = { r: number; g: number; b: number };

const HEX6 = /^#([0-9a-f]{6})$/i;
const HEX3 = /^#([0-9a-f]{3})$/i;

/** Parse `#rgb` / `#rrggbb` → 0–255 channels. */
export function parseHexRgb(hex: string): Rgb | null {
  const s = hex.trim().toLowerCase();
  const m6 = s.match(HEX6);
  if (m6) {
    const h = m6[1]!;
    return {
      r: Number.parseInt(h.slice(0, 2), 16),
      g: Number.parseInt(h.slice(2, 4), 16),
      b: Number.parseInt(h.slice(4, 6), 16),
    };
  }
  const m3 = s.match(HEX3);
  if (m3) {
    const h = m3[1]!;
    return {
      r: Number.parseInt(h[0]! + h[0]!, 16),
      g: Number.parseInt(h[1]! + h[1]!, 16),
      b: Number.parseInt(h[2]! + h[2]!, 16),
    };
  }
  return null;
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")}`;
}

function srgbChannelToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.1 relative luminance (0 = black, 1 = white). */
export function relativeLuminance(hex: string): number | null {
  const rgb = parseHexRgb(hex);
  if (!rgb) return null;
  const R = srgbChannelToLinear(rgb.r);
  const G = srgbChannelToLinear(rgb.g);
  const B = srgbChannelToLinear(rgb.b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/** WCAG contrast ratio (1–21). */
export function contrastRatio(fgHex: string, bgHex: string): number | null {
  const L1 = relativeLuminance(fgHex);
  const L2 = relativeLuminance(bgHex);
  if (L1 == null || L2 == null) return null;
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** True when ratio meets WCAG AA for normal text (4.5) or large (3). */
export function meetsContrast(
  fgHex: string,
  bgHex: string,
  minRatio = 4.5,
): boolean {
  const r = contrastRatio(fgHex, bgHex);
  return r != null && r >= minRatio;
}

/**
 * Pick ink for a background — light cream vs near-black.
 * Prefer themed pairs when provided; else `#f8fafc` / `#0f172a`.
 */
export function pickReadableInk(
  bgHex: string,
  opts?: { lightInk?: string; darkInk?: string },
): string {
  const L = relativeLuminance(bgHex);
  const light = opts?.lightInk ?? "#f8fafc";
  const dark = opts?.darkInk ?? "#0f172a";
  if (L == null) return dark;
  return L > 0.45 ? dark : light;
}

/** Mix `fg` onto `bg` at `amount` (0–1) in sRGB — hairlines, washes. */
export function mixHex(bgHex: string, fgHex: string, amount: number): string | null {
  const bg = parseHexRgb(bgHex);
  const fg = parseHexRgb(fgHex);
  if (!bg || !fg) return null;
  const t = Math.max(0, Math.min(1, amount));
  return rgbToHex({
    r: bg.r + (fg.r - bg.r) * t,
    g: bg.g + (fg.g - bg.g) * t,
    b: bg.b + (fg.b - bg.b) * t,
  });
}

/**
 * Hairline border that shares the surface hue (ink @ ~12–18% on bg).
 * Avoids cool slate `#232830` on warm yellow/brown shells.
 */
export function deriveHairlineBorder(
  bgHex: string,
  inkHex?: string,
  amount = 0.14,
): string | null {
  const ink = inkHex ?? pickReadableInk(bgHex);
  return mixHex(bgHex, ink, amount);
}

/** Stronger edge for chips / tokens on the same family of surfaces. */
export function deriveTokenBorder(
  bgHex: string,
  inkHex?: string,
  amount = 0.18,
): string | null {
  return deriveHairlineBorder(bgHex, inkHex, amount);
}

/**
 * Hue scale for Studio chrome from one seed hex.
 * Light = washes toward white (readable desk); dark = washes toward near-black.
 * Surfaces stay distinct — never monochrome fill of the seed.
 */
export function buildShellHueBgPalette(
  seedHex: string,
  mode: "light" | "dark",
): {
  canvas: string;
  surface: string;
  sidebar: string;
  muted: string;
} | null {
  const seed = seedHex.trim().toLowerCase();
  if (!parseHexRgb(seed)) return null;
  if (mode === "light") {
    const canvas = mixHex("#ffffff", seed, 0.1);
    const surface = mixHex("#ffffff", seed, 0.04);
    const sidebar = mixHex("#ffffff", seed, 0.22);
    const muted = mixHex("#ffffff", seed, 0.38);
    if (!canvas || !surface || !sidebar || !muted) return null;
    return { canvas, surface, sidebar, muted };
  }
  const base = "#0b1020";
  const canvas = mixHex(base, seed, 0.18);
  const surface = mixHex(base, seed, 0.28);
  const sidebar = mixHex(base, seed, 0.42);
  const muted = mixHex(base, seed, 0.55);
  if (!canvas || !surface || !sidebar || !muted) return null;
  return { canvas, surface, sidebar, muted };
}

/** Lighter pair for dark-mode accent chips when only one hex is given. */
export function deriveAccentDarkFromHex(accentHex: string): string {
  const accent = accentHex.trim().toLowerCase();
  return mixHex(accent, "#ffffff", 0.32) ?? accent;
}

/**
 * Ensure fg contrast on bg — if below min, return readable ink; else keep fg.
 */
export function ensureReadableFg(
  bgHex: string,
  fgHex: string,
  minRatio = 4.5,
): string {
  if (meetsContrast(fgHex, bgHex, minRatio)) return fgHex;
  return pickReadableInk(bgHex);
}

/**
 * Hue angle in degrees (0–360) from sRGB hex.
 * Null when unparsable or near-gray (chroma too low to own a hue).
 */
export function hexToHueDegrees(hex: string): number | null {
  const rgb = parseHexRgb(hex);
  if (!rgb) return null;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  if (chroma < 0.04) return null;
  let hue = 0;
  switch (max) {
    case r:
      hue = ((g - b) / chroma) % 6;
      break;
    case g:
      hue = (b - r) / chroma + 2;
      break;
    default:
      hue = (r - g) / chroma + 4;
      break;
  }
  hue *= 60;
  if (hue < 0) hue += 360;
  return hue;
}

/** Smallest circular distance between two hue angles (0–180). */
export function circularHueDistance(aDeg: number, bDeg: number): number {
  const d = Math.abs(((aDeg - bDeg) % 360) + 360) % 360;
  return d > 180 ? 360 - d : d;
}
