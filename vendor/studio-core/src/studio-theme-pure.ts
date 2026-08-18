/**
 * Studio chrome theme tokens (workspace UI) — patch colors without project-id branches.
 * Source file: packages/studio/studio-theme-default/tokens.json
 */

import {
  buildShellHueBgPalette,
  deriveAccentDarkFromHex,
  deriveHairlineBorder,
  pickReadableInk,
} from "./color-contrast-pure.js";

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/**
 * Common color names → light/dark hex.
 * Models often pass `accent: "yellow"` instead of `#fbbf24`; reject → no disk write → fake Done.
 */
export const STUDIO_THEME_NAMED_COLORS: Record<
  string,
  { accent: string; accentDark: string }
> = {
  yellow: { accent: "#fbbf24", accentDark: "#fcd34d" },
  gold: { accent: "#fbbf24", accentDark: "#fcd34d" },
  green: { accent: "#22c55e", accentDark: "#4ade80" },
  lime: { accent: "#22c55e", accentDark: "#4ade80" },
  purple: { accent: "#7c3aed", accentDark: "#c084fc" },
  violet: { accent: "#7c3aed", accentDark: "#c084fc" },
  blue: { accent: "#2563eb", accentDark: "#60a5fa" },
  /** beehiiv / brand “fusion blue” — models often pass the name, not hex. */
  "fusion-blue": { accent: "#2f39ba", accentDark: "#5b65d6" },
  fusionblue: { accent: "#2f39ba", accentDark: "#5b65d6" },
  red: { accent: "#ef4444", accentDark: "#f87171" },
  orange: { accent: "#f97316", accentDark: "#fb923c" },
  pink: { accent: "#ec4899", accentDark: "#f472b6" },
  teal: { accent: "#14b8a6", accentDark: "#2dd4bf" },
  cyan: { accent: "#06b6d4", accentDark: "#22d3ee" },
  black: { accent: "#0f172a", accentDark: "#1e293b" },
  white: { accent: "#f8fafc", accentDark: "#e2e8f0" },
  gray: { accent: "#64748b", accentDark: "#94a3b8" },
  grey: { accent: "#64748b", accentDark: "#94a3b8" },
};

/** Resolve hex or named color → canonical `#rrggbb` (light). */
export function resolveStudioThemeColorInput(
  value: string,
): { accent: string; accentDark: string } | null {
  const raw = value.trim();
  if (!raw) return null;
  if (isStudioThemeHex(raw)) {
    const accent = normalizeStudioThemeHex(raw);
    return { accent, accentDark: deriveAccentDarkFromHex(accent) };
  }
  const named = STUDIO_THEME_NAMED_COLORS[raw.toLowerCase()];
  return named ? { ...named } : null;
}

/** Expand #rgb → #rrggbb; leave longer hex as-is (lowercased). */
export function normalizeStudioThemeHex(value: string): string {
  const s = value.trim().toLowerCase();
  const m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (!m) return s;
  const h = m[1]!;
  if (h.length === 3) {
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  return `#${h.slice(0, 6)}`;
}

/**
 * Soft / muted fills — readable chrome (not neon fillShell from vivid accent).
 * Used when the user asks for muted / soft / readable / pastel.
 */
export const STUDIO_THEME_SOFT_SHELLS: Record<
  string,
  {
    accent: string;
    accentDark: string;
    color: StudioThemeColorMapPatch;
    colorDark: StudioThemeColorMapPatch;
  }
> = {
  yellow: {
    accent: "#a16207",
    accentDark: "#fbbf24",
    color: {
      fg: {
        accent: "#a16207",
        onAccent: "#ffffff",
        primary: "#422006",
        secondary: "#854d0e",
      },
      bg: {
        canvas: "#fefce8",
        surface: "#fffbeb",
        sidebar: "#fef9c3",
        muted: "#fde68a",
      },
      border: {
        default: "#e8d9a8",
        strong: "#d4c48a",
      },
    },
    colorDark: {
      fg: {
        accent: "#fbbf24",
        onAccent: "#422006",
        primary: "#fef3c7",
        secondary: "#fde68a",
      },
      bg: {
        canvas: "#1c1917",
        surface: "#292524",
        sidebar: "#422006",
        muted: "#713f12",
      },
      border: {
        default: "#3f3429",
        strong: "#524536",
      },
    },
  },
  purple: {
    accent: "#6d28d9",
    accentDark: "#c4b5fd",
    color: {
      fg: {
        accent: "#6d28d9",
        onAccent: "#ffffff",
        primary: "#1e1b4b",
        secondary: "#5b21b6",
      },
      bg: {
        canvas: "#faf8ff",
        surface: "#ffffff",
        sidebar: "#f3e8ff",
        muted: "#ede9fe",
      },
      border: {
        default: "#ddd6fe",
        strong: "#c4b5fd",
      },
    },
    colorDark: {
      fg: {
        accent: "#c4b5fd",
        onAccent: "#1e1b4b",
        primary: "#f5f3ff",
        secondary: "#ddd6fe",
      },
      bg: {
        canvas: "#1a1625",
        surface: "#221c30",
        sidebar: "#2e1065",
        muted: "#3b0764",
      },
      border: {
        default: "#3b3354",
        strong: "#4c4368",
      },
    },
  },
  green: {
    accent: "#15803d",
    accentDark: "#4ade80",
    color: {
      fg: {
        accent: "#15803d",
        onAccent: "#ffffff",
        primary: "#14532d",
        secondary: "#166534",
      },
      bg: {
        canvas: "#f0fdf4",
        surface: "#ffffff",
        sidebar: "#dcfce7",
        muted: "#bbf7d0",
      },
      border: {
        default: "#bbf7d0",
        strong: "#86efac",
      },
    },
    colorDark: {
      fg: {
        accent: "#4ade80",
        onAccent: "#14532d",
        primary: "#ecfdf5",
        secondary: "#86efac",
      },
      bg: {
        canvas: "#052e16",
        surface: "#14532d",
        sidebar: "#166534",
        muted: "#15803d",
      },
      border: {
        default: "#166534",
        strong: "#15803d",
      },
    },
  },
  blue: {
    accent: "#1d4ed8",
    accentDark: "#60a5fa",
    color: {
      fg: {
        accent: "#1d4ed8",
        onAccent: "#ffffff",
        primary: "#0f172a",
        secondary: "#475569",
      },
      bg: {
        canvas: "#f8fafc",
        surface: "#ffffff",
        sidebar: "#eff6ff",
        muted: "#dbeafe",
      },
      border: {
        default: "#e2e8f0",
        strong: "#cbd5e1",
      },
    },
    colorDark: {
      fg: {
        accent: "#60a5fa",
        onAccent: "#0b1220",
        primary: "#e2e8f0",
        secondary: "#94a3b8",
      },
      bg: {
        canvas: "#0f172a",
        surface: "#111827",
        sidebar: "#1e3a5f",
        muted: "#1e293b",
      },
      border: {
        default: "#1e293b",
        strong: "#334155",
      },
    },
  },
};

export type ShellBackgroundChatIntent = {
  accent: string;
  accentDark: string;
  /** Neon full-shell from accent (simple "background to yellow"). */
  fillShell?: boolean;
  label: string;
  soft: boolean;
  /** Explicit maps when soft/muted — prefer these over fillShell. */
  color?: StudioThemeColorMapPatch;
  colorDark?: StudioThemeColorMapPatch;
};

/**
 * Chrome layout / placement asks — never a shell color shortcut.
 * Classic false positive: "move the pet next to the green dot" matched
 * `\bto\b` + named color "green" and painted fillShell before the model ran.
 */
export function isShellChromeLayoutChatIntent(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  const placeVerb =
    /\b(move|place|put|drag|reposition|reorder|align|sit|sits?)\b/i.test(t);
  const beside =
    /\b(next\s+to|beside|alongside|adjacent\s+to|close\s+to)\b/i.test(t);
  const chromeBit =
    /\b(pet|dot|connected|footer|status\s*bar|status\s*dot)\b/i.test(t);
  return chromeBit && (placeVerb || beside);
}

/**
 * Deterministic chat intent for workspace / background color changes.
 * Kept for tests / future helpers — chat SSE must **not** auto-exec this
 * before the harness (never skip the model).
 */
export function parseShellBackgroundChatIntent(
  text: string,
): ShellBackgroundChatIntent | null {
  const t = text.trim();
  if (!t) return null;
  // Layout wins over color-word latch (pet / status-dot / "next to").
  if (isShellChromeLayoutChatIntent(t)) return null;
  const mentionsShell =
    /\b(background|bg|shell|chrome|workspace|theme|studio)\b/i.test(t);
  // Do NOT treat bare `\bto\b` as a color verb — "next to the green dot" is layout.
  const wantsChange =
    /\b(change|set|make|update|paint|turn|recolor|colour|color)\b/i.test(t);
  // Short follow-ups: "purple", "muted yellow", "not studio — the workspace purple"
  const shortColorCommand = t.length <= 120;
  const softBare = /\b(muted|soft|readable|pastel)\b/i.test(t);
  const hasNamedColor = Object.keys(STUDIO_THEME_NAMED_COLORS).some((n) =>
    new RegExp(`\\b${n.replace(/-/g, "[-\\s]?")}\\b`, "i").test(t),
  ) || /\bfusion[\s-]?blue\b/i.test(t);
  const shortChange = shortColorCommand && wantsChange && hasNamedColor;
  const softBareCmd = softBare && hasNamedColor && shortColorCommand;

  // Need shell+change, or a short "change to blue", or bare "muted purple".
  if (!(mentionsShell && wantsChange) && !shortChange && !softBareCmd) {
    return null;
  }

  const soft = /\b(muted|soft|readable|pastel|pale|warm|gentle|subtle)\b/i.test(
    t,
  );

  const found = findShellBackgroundColorTarget(t);
  if (!found) {
    const hexMatches = [...t.matchAll(/#[0-9a-fA-F]{3,8}\b/g)];
    const hex = hexMatches.at(-1)?.[0];
    if (hex) {
      const resolved = resolveStudioThemeColorInput(hex);
      if (!resolved) return null;
      return {
        accent: resolved.accent,
        accentDark: resolved.accentDark,
        fillShell: true,
        label: hex.toLowerCase(),
        soft: false,
      };
    }
    return null;
  }

  if (soft && STUDIO_THEME_SOFT_SHELLS[found]) {
    const softShell = STUDIO_THEME_SOFT_SHELLS[found]!;
    return {
      accent: softShell.accent,
      accentDark: softShell.accentDark,
      label: `muted-${found}`,
      soft: true,
      color: softShell.color,
      colorDark: softShell.colorDark,
    };
  }

  const resolved = resolveStudioThemeColorInput(found);
  if (!resolved) return null;
  return {
    accent: resolved.accent,
    accentDark: resolved.accentDark,
    fillShell: true,
    label: found,
    soft: false,
  };
}

/**
 * Pick the color the user wants — not a color they complained about.
 * "Still looks green. Change it to blue" → blue (not green).
 */
export function findShellBackgroundColorTarget(text: string): string | null {
  type Hit = { name: string; index: number; score: number; len: number };
  const hits: Hit[] = [];

  const pushHits = (name: string, pattern: RegExp) => {
    pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text))) {
      hits.push({
        name,
        index: m.index,
        len: m[0]!.length,
        score: scoreShellColorHit(text, m.index),
      });
    }
  };

  // Multi-word / hyphen aliases first (longer).
  pushHits("fusion-blue", /\bfusion[\s-]?blue\b/gi);

  const names = Object.keys(STUDIO_THEME_NAMED_COLORS).sort(
    (a, b) => b.length - a.length,
  );
  for (const name of names) {
    if (name === "fusion-blue" || name === "fusionblue") continue;
    const body = name.replace(/-/g, "[-\\s]?");
    pushHits(name, new RegExp(`\\b${body}\\b`, "gi"));
  }
  // fusionblue without space/hyphen
  pushHits("fusion-blue", /\bfusionblue\b/gi);

  if (!hits.length) return null;

  // Drop shorter hits fully inside a longer hit (e.g. "blue" inside "fusion blue").
  const filtered = hits.filter(
    (h) =>
      !hits.some(
        (o) =>
          o !== h &&
          o.index <= h.index &&
          o.index + o.len >= h.index + h.len &&
          o.len > h.len,
      ),
  );

  filtered.sort((a, b) => b.score - a.score || b.index - a.index);
  return filtered[0]?.name ?? null;
}

function scoreShellColorHit(text: string, index: number): number {
  const before = text.slice(Math.max(0, index - 48), index);
  const after = text.slice(index, Math.min(text.length, index + 24));
  let score = 0;
  // Desired target phrasing.
  if (
    /\b(?:change|set|make|update|paint|turn|recolor)\b[\s\S]{0,32}$/i.test(
      before,
    )
  ) {
    score += 80;
  }
  // "to/into/as a green" — but not "next to the green …"
  if (
    /\b(?:to|into|as)\s+(?:a|an|the)?\s*$/i.test(before) &&
    !/\b(?:next|close|adjacent|beside)\s+$/i.test(before)
  ) {
    score += 100;
  }
  if (/\bback\s+to\b[\s\S]{0,24}$/i.test(before)) {
    score += 100;
  }
  // Status / layout color words ("green dot") — not a shell fill target.
  if (/^\w*\s*dot\b/i.test(after) || /\bnext\s+to\b/i.test(before)) {
    score -= 150;
  }
  // Complaint / current-state phrasing — deprioritize.
  if (
    /\b(?:looks?|looking|still|remains?|stays?|stuck|seeing|see)\b[\s\S]{0,24}$/i.test(
      before,
    )
  ) {
    score -= 120;
  }
  return score;
}

/** One token group: `{ accent: "#…", sidebar: "#…" }`. */
export type StudioThemeColorGroupPatch = Record<string, string>;

/** Nested token map: `{ fg: { accent }, bg: { sidebar, muted } }`. */
export type StudioThemeColorMapPatch = Record<string, StudioThemeColorGroupPatch>;

/** Chrome surfaces painted when `fillShell` is true. */
export const STUDIO_SHELL_BG_KEYS = [
  "canvas",
  "surface",
  "sidebar",
  "muted",
] as const;

export type StudioThemeColorPatch = {
  /** Light-mode accent shortcut → color.fg.accent */
  accent?: string;
  /** Dark-mode accent shortcut → colorDark.fg.accent */
  accentDark?: string;
/**
   * Paint full chrome backgrounds from accent as a **hue scale** (washes —
   * canvas/surface/sidebar/muted stay distinct). Not monochrome. Use when
   * user wants shell recolor from one hex; accent-only merge leaves prior bg.
   */
  fillShell?: boolean;
  /** Light-mode nested colors (bg / fg / border / status). */
  color?: StudioThemeColorMapPatch;
  /** Dark-mode nested colors. */
  colorDark?: StudioThemeColorMapPatch;
};

export type StudioThemeTokensDoc = {
  version?: number;
  name?: string;
  color?: {
    fg?: { accent?: string; [k: string]: unknown };
    [k: string]: unknown;
  };
  colorDark?: {
    fg?: { accent?: string; [k: string]: unknown };
    [k: string]: unknown;
  };
  [k: string]: unknown;
};

export function isStudioThemeHex(value: string): boolean {
  return HEX.test(value.trim());
}

function parseColorMap(
  raw: unknown,
  label: string,
): { ok: true; map: StudioThemeColorMapPatch } | { ok: false; error: string } {
  if (raw === undefined) return { ok: true, map: {} };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: `${label} must be an object` };
  }
  const map: StudioThemeColorMapPatch = {};
  for (const [group, values] of Object.entries(raw as Record<string, unknown>)) {
    if (!values || typeof values !== "object" || Array.isArray(values)) {
      return { ok: false, error: `${label}.${group} must be an object of hex colors` };
    }
    const groupPatch: StudioThemeColorGroupPatch = {};
    for (const [key, value] of Object.entries(values as Record<string, unknown>)) {
      if (typeof value !== "string") {
        return {
          ok: false,
          error: `${label}.${group}.${key} must be a hex or named color`,
        };
      }
      const resolved = resolveStudioThemeColorInput(value);
      if (!resolved) {
        return {
          ok: false,
          error: `${label}.${group}.${key} must be a hex color (#rgb / #rrggbb) or named color`,
        };
      }
      groupPatch[key] = resolved.accent;
    }
    if (Object.keys(groupPatch).length) map[group] = groupPatch;
  }
  return { ok: true, map };
}

/** True when project shell already paints chrome backgrounds (not accent-only). */
export function shellHasPaintedBackground(shell?: {
  color?: StudioThemeColorMapPatch;
  colorDark?: StudioThemeColorMapPatch;
} | null): boolean {
  if (!shell) return false;
  for (const map of [shell.color, shell.colorDark]) {
    const bg = map?.bg;
    if (!bg) continue;
    for (const key of STUDIO_SHELL_BG_KEYS) {
      if (typeof bg[key] === "string" && bg[key]!.trim()) return true;
    }
  }
  return false;
}

/**
 * Accent-only patches leave prior bg in place. If the shell is already fully
 * painted (e.g. yellow fill), recoloring accent should repaint backgrounds too.
 */
export function resolveThemePatchForExistingShell(
  patch: StudioThemeColorPatch,
  existingShell?: {
    color?: StudioThemeColorMapPatch;
    colorDark?: StudioThemeColorMapPatch;
  } | null,
): StudioThemeColorPatch {
  if (patch.fillShell) return expandFillShellPatch(patch);
  if (patch.color?.bg || patch.colorDark?.bg) return patch;
  if (
    shellHasPaintedBackground(existingShell) &&
    (patch.accent || patch.accentDark)
  ) {
    return expandFillShellPatch({ ...patch, fillShell: true });
  }
  return patch;
}

/** Expand `fillShell` into hue-scale bg + readable ink + hue-matched borders. */
export function expandFillShellPatch(
  patch: StudioThemeColorPatch,
): StudioThemeColorPatch {
  if (!patch.fillShell) return patch;
  const lightSeed =
    patch.accent?.trim() ||
    patch.color?.bg?.canvas?.trim() ||
    patch.color?.bg?.sidebar?.trim() ||
    patch.color?.bg?.surface?.trim();
  const darkSeed =
    patch.accentDark?.trim() ||
    (lightSeed ? deriveAccentDarkFromHex(lightSeed) : "") ||
    patch.colorDark?.bg?.canvas?.trim() ||
    patch.colorDark?.bg?.sidebar?.trim() ||
    lightSeed;
  if (!lightSeed && !darkSeed) return patch;

  const paintReadableChrome = (
    surfaceHex: string,
  ): Pick<StudioThemeColorMapPatch, "fg" | "border"> => {
    const ink = pickReadableInk(surfaceHex);
    const mutedInk = deriveHairlineBorder(surfaceHex, ink, 0.55) ?? ink;
    const hairline = deriveHairlineBorder(surfaceHex, ink, 0.14) ?? surfaceHex;
    const strong = deriveHairlineBorder(surfaceHex, ink, 0.22) ?? hairline;
    return {
      fg: {
        primary: ink,
        secondary: mutedInk,
        onAccent: ink,
      },
      border: {
        default: hairline,
        strong,
      },
    };
  };

  const next: StudioThemeColorPatch = { ...patch };
  if (lightSeed) {
    const bg =
      buildShellHueBgPalette(lightSeed, "light") ??
      Object.fromEntries(STUDIO_SHELL_BG_KEYS.map((k) => [k, lightSeed]));
    const chrome = paintReadableChrome(bg.canvas!);
    next.color = {
      ...(next.color ?? {}),
      bg: { ...(next.color?.bg ?? {}), ...bg },
      fg: { ...(chrome.fg ?? {}), ...(next.color?.fg ?? {}) },
      border: { ...(chrome.border ?? {}), ...(next.color?.border ?? {}) },
    };
    if (!next.accent) next.accent = lightSeed;
  }
  if (darkSeed) {
    const bg =
      buildShellHueBgPalette(darkSeed, "dark") ??
      Object.fromEntries(STUDIO_SHELL_BG_KEYS.map((k) => [k, darkSeed]));
    const chrome = paintReadableChrome(bg.canvas!);
    next.colorDark = {
      ...(next.colorDark ?? {}),
      bg: { ...(next.colorDark?.bg ?? {}), ...bg },
      fg: { ...(chrome.fg ?? {}), ...(next.colorDark?.fg ?? {}) },
      border: { ...(chrome.border ?? {}), ...(next.colorDark?.border ?? {}) },
    };
    if (!next.accentDark) next.accentDark = darkSeed;
  }
  return next;
}

export function parseStudioThemeColorPatch(
  raw: unknown,
): { ok: true; patch: StudioThemeColorPatch } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "patch object required" };
  }
  const o = raw as Record<string, unknown>;
  const patch: StudioThemeColorPatch = {};
  if (o.accent !== undefined) {
    if (typeof o.accent !== "string") {
      return { ok: false, error: "accent must be a hex or named color string" };
    }
    const resolved = resolveStudioThemeColorInput(o.accent);
    if (!resolved) {
      return {
        ok: false,
        error: "accent must be a hex color (#rgb / #rrggbb) or named color (yellow, green, …)",
      };
    }
    patch.accent = resolved.accent;
    if (o.accentDark === undefined) patch.accentDark = resolved.accentDark;
  }
  if (o.accentDark !== undefined) {
    if (typeof o.accentDark !== "string") {
      return {
        ok: false,
        error: "accentDark must be a hex or named color string",
      };
    }
    const resolved = resolveStudioThemeColorInput(o.accentDark);
    if (!resolved) {
      return {
        ok: false,
        error:
          "accentDark must be a hex color (#rgb / #rrggbb) or named color (yellow, green, …)",
      };
    }
    // Named dark pair prefers its own dark; hex dark uses the resolved accent slot.
    patch.accentDark = STUDIO_THEME_NAMED_COLORS[o.accentDark.trim().toLowerCase()]
      ? resolved.accentDark
      : resolved.accent;
  }
  if (o.fillShell !== undefined) {
    if (typeof o.fillShell !== "boolean") {
      return { ok: false, error: "fillShell must be a boolean" };
    }
    patch.fillShell = o.fillShell;
  } else if (patch.accent || patch.accentDark) {
    // Accent shortcuts from chat almost always mean "paint the shell", not chip-only.
    // Explicit fillShell:false still allowed; explicit color.bg skips this default.
    if (!o.color && !o.colorDark) {
      patch.fillShell = true;
    }
  }
  const light = parseColorMap(o.color, "color");
  if (!light.ok) return light;
  if (Object.keys(light.map).length) patch.color = light.map;
  const dark = parseColorMap(o.colorDark, "colorDark");
  if (!dark.ok) return dark;
  if (Object.keys(dark.map).length) patch.colorDark = dark.map;

  if (
    !patch.accent &&
    !patch.accentDark &&
    !patch.color &&
    !patch.colorDark
  ) {
    return {
      ok: false,
      error:
        "provide accent / accentDark and/or color / colorDark (e.g. color.bg.sidebar)",
    };
  }
  if (patch.fillShell && !patch.accent && !patch.accentDark && !patch.color?.bg) {
    return {
      ok: false,
      error:
        "fillShell requires accent / accentDark (or color.bg.*) to paint chrome backgrounds",
    };
  }
  return { ok: true, patch: expandFillShellPatch(patch) };
}

function mergeColorMap(
  existing: Record<string, unknown> | undefined,
  patch: StudioThemeColorMapPatch | undefined,
): Record<string, unknown> | undefined {
  if (!patch) return existing;
  const next: Record<string, unknown> = { ...(existing ?? {}) };
  for (const [group, values] of Object.entries(patch)) {
    const prevGroup =
      next[group] && typeof next[group] === "object" && !Array.isArray(next[group])
        ? { ...(next[group] as Record<string, unknown>) }
        : {};
    next[group] = { ...prevGroup, ...values };
  }
  return next;
}

/** Immutable merge of color fields into theme tokens JSON. */
export function applyStudioThemeColorPatch(
  tokens: StudioThemeTokensDoc,
  patch: StudioThemeColorPatch,
): StudioThemeTokensDoc {
  const expanded = expandFillShellPatch(patch);
  const next: StudioThemeTokensDoc = structuredClone(tokens);
  const light: StudioThemeColorMapPatch = { ...(expanded.color ?? {}) };
  if (expanded.accent) {
    light.fg = { ...(light.fg ?? {}), accent: expanded.accent };
  }
  const dark: StudioThemeColorMapPatch = { ...(expanded.colorDark ?? {}) };
  if (expanded.accentDark) {
    dark.fg = { ...(dark.fg ?? {}), accent: expanded.accentDark };
  } else if (expanded.accent && !expanded.colorDark) {
    dark.fg = { ...(dark.fg ?? {}), accent: expanded.accent };
  }
  if (Object.keys(light).length) {
    next.color = mergeColorMap(next.color as Record<string, unknown>, light) as StudioThemeTokensDoc["color"];
  }
  if (Object.keys(dark).length) {
    next.colorDark = mergeColorMap(
      next.colorDark as Record<string, unknown>,
      dark,
    ) as StudioThemeTokensDoc["colorDark"];
  }
  return next;
}

export function summarizeStudioThemeAccents(tokens: StudioThemeTokensDoc): {
  accent: string | null;
  accentDark: string | null;
} {
  return {
    accent:
      typeof tokens.color?.fg?.accent === "string"
        ? tokens.color.fg.accent
        : null,
    accentDark:
      typeof tokens.colorDark?.fg?.accent === "string"
        ? tokens.colorDark.fg.accent
        : null,
  };
}

/** Repo-relative path to default Studio chrome tokens. */
export const STUDIO_THEME_TOKENS_REL =
  "packages/studio/studio-theme-default/tokens.json";
