/**
 * Window kind color tags — Tailwind hue palette, derive engine, effective resolve.
 * Hosts paint from derived tokens; never hard-code kind hex.
 */

import {
  circularHueDistance,
  deriveHairlineBorder,
  hexToHueDegrees,
  mixHex,
  parseHexRgb,
  pickReadableInk,
  rgbToHex,
} from "./color-contrast-pure.js";
import type { StudioCanvasWindowId } from "./canvas-window-registry-pure.js";

/** Canvas / DeskPane window kinds — aligned with `CANVAS_WINDOW_REGISTRY`. */
export type StudioWindowColorKind = StudioCanvasWindowId;

/** Tailwind-hue ids (swappable registry — seed hex lives only here). */
export type WindowHueId =
  | "rose"
  | "orange"
  | "amber"
  | "yellow"
  | "lime"
  | "emerald"
  | "cyan"
  | "blue"
  | "violet"
  | "fuchsia"
  | "slate";

export type WindowHueDef = {
  id: WindowHueId;
  /** Short picker label */
  label: string;
  /** Tailwind default-500 seed (palette source of truth). */
  seed: string;
};

/**
 * Default Studio window palette — Tailwind CSS default hue-500 seeds.
 * Swap this registry (or provide via deps) to retheme without host edits.
 */
export const DEFAULT_WINDOW_COLOR_PALETTE: readonly WindowHueDef[] = [
  { id: "rose", label: "Rose", seed: "#f43f5e" },
  { id: "orange", label: "Orange", seed: "#f97316" },
  { id: "amber", label: "Amber", seed: "#f59e0b" },
  { id: "yellow", label: "Yellow", seed: "#eab308" },
  { id: "lime", label: "Lime", seed: "#84cc16" },
  { id: "emerald", label: "Emerald", seed: "#10b981" },
  { id: "cyan", label: "Cyan", seed: "#06b6d4" },
  { id: "blue", label: "Blue", seed: "#3b82f6" },
  { id: "violet", label: "Violet", seed: "#8b5cf6" },
  { id: "fuchsia", label: "Fuchsia", seed: "#d946ef" },
  { id: "slate", label: "Slate", seed: "#64748b" },
] as const;

/** Built-in kind → hue (matches prior Studio accent intent). */
export const DEFAULT_WINDOW_KIND_HUES: Readonly<
  Record<StudioWindowColorKind, WindowHueId>
> = {
  code: "blue",
  live: "emerald",
  design: "violet",
  runtimes: "slate",
  ops: "orange",
  terminal: "cyan",
  chat: "amber",
  home: "cyan",
  workspace: "emerald",
  settings: "slate",
  calendar: "blue",
  media: "rose",
  converter: "orange",
  browser: "blue",
  data: "cyan",
  sheets: "emerald",
  forms: "orange",
  integrations: "violet",
  workflows: "fuchsia",
  email: "cyan",
  messages: "blue",
  notifications: "amber",
  analytics: "violet",
  memory: "amber",
  roadmap: "lime",
  notes: "yellow",
};

export const STUDIO_WINDOW_COLOR_KINDS = Object.keys(
  DEFAULT_WINDOW_KIND_HUES,
) as StudioWindowColorKind[];

export type WindowHuePaint = {
  /** Seed accent (palette or custom). */
  accent: string;
  /** Title-bar / active-tab fill. */
  headerBg: string;
  /** Window frame / tab edge wash. */
  border: string;
  /** Title + control ink on header. */
  titleInk: string;
  /** Softer control ink. */
  btnInk: string;
};

export type WindowHuePaintOverrides = Partial<WindowHuePaint>;

export type DeriveWindowHuePaintInput = {
  /** Palette seed or arbitrary hex. */
  seed: string;
  /**
   * Surface to mix the seed onto for header (dark slate default preserves
   * historical DeskPane header depth). Light shells can pass a paper/sidebar hex.
   */
  surfaceBase?: string;
  /** 0–1 mix of seed onto surface (default 0.42 — prior chrome). */
  mixAmount?: number;
  /** Explicit field overrides after derive. */
  overrides?: WindowHuePaintOverrides;
};

const DEFAULT_SURFACE_BASE = "#0f172a";
/** Accent onto header surface — high enough that active tabs / title bars pop. */
const DEFAULT_MIX = 0.5;

/**
 * Min circular hue distance (° ) between a tab seed and shell accent.
 * Below this, emerald/lime tabs melt into green fillShell (etc.).
 */
export const WINDOW_HUE_SHELL_MIN_DISTANCE = 50;

function normalizeHex(raw: string): string | null {
  const rgb = parseHexRgb(raw.trim());
  return rgb ? rgbToHex(rgb) : null;
}

/** True when tab seed hue is too close to shell chrome accent. */
export function windowHueCollidesWithShell(
  seedHex: string,
  shellAccentHex: string,
  minDistance = WINDOW_HUE_SHELL_MIN_DISTANCE,
): boolean {
  const seedHue = hexToHueDegrees(seedHex);
  const shellHue = hexToHueDegrees(shellAccentHex);
  if (seedHue == null || shellHue == null) return false;
  return circularHueDistance(seedHue, shellHue) < minDistance;
}

/**
 * Remap palette hues that collide with the shell accent onto safer hues.
 * Non-colliding ids stay identity. Colliding ids get distinct safe targets
 * (farthest-from-shell first) so kinds don’t all collapse to one color.
 */
export function buildShellSafeWindowHueRemap(
  shellAccentHex: string | null | undefined,
  opts?: {
    palette?: readonly WindowHueDef[];
    minDistance?: number;
  },
): Record<WindowHueId, WindowHueId> {
  const palette = opts?.palette ?? DEFAULT_WINDOW_COLOR_PALETTE;
  const minDistance = opts?.minDistance ?? WINDOW_HUE_SHELL_MIN_DISTANCE;
  const identity = {} as Record<WindowHueId, WindowHueId>;
  for (const h of palette) identity[h.id] = h.id;

  const shell = typeof shellAccentHex === "string" ? shellAccentHex.trim() : "";
  if (!shell || !normalizeHex(shell)) return identity;
  const shellHue = hexToHueDegrees(shell);
  if (shellHue == null) return identity;

  const colliding: WindowHueDef[] = [];
  const safe: { def: WindowHueDef; dist: number }[] = [];
  for (const def of palette) {
    const seedHue = hexToHueDegrees(def.seed);
    if (seedHue == null) {
      safe.push({ def, dist: 180 });
      continue;
    }
    const dist = circularHueDistance(seedHue, shellHue);
    if (dist < minDistance) colliding.push(def);
    else safe.push({ def, dist });
  }
  if (colliding.length === 0 || safe.length === 0) return identity;

  safe.sort((a, b) => {
    if (b.dist !== a.dist) return b.dist - a.dist;
    return palette.indexOf(a.def) - palette.indexOf(b.def);
  });

  const remap = { ...identity };
  let i = 0;
  for (const c of colliding) {
    remap[c.id] = safe[i % safe.length]!.def.id;
    i += 1;
  }
  return remap;
}

/** Apply shell-safe remap to an effective kind→hue map (paint-time only). */
export function resolveShellSafeWindowHueMap(
  effective: Readonly<Record<StudioWindowColorKind, WindowHueId>>,
  shellAccentHex?: string | null,
  opts?: {
    palette?: readonly WindowHueDef[];
    minDistance?: number;
  },
): Record<StudioWindowColorKind, WindowHueId> {
  const remap = buildShellSafeWindowHueRemap(shellAccentHex, opts);
  const out = {} as Record<StudioWindowColorKind, WindowHueId>;
  for (const kind of STUDIO_WINDOW_COLOR_KINDS) {
    const hue = effective[kind];
    out[kind] = remap[hue] ?? hue;
  }
  return out;
}

/**
 * Smart expand: one seed → header fill + readable ink + hue-matched border.
 * Power users pass `overrides` for any field.
 */
export function deriveWindowHuePaint(
  input: DeriveWindowHuePaintInput,
): WindowHuePaint | null {
  const accent = normalizeHex(input.seed);
  if (!accent) return null;
  const surface =
    normalizeHex(input.surfaceBase ?? DEFAULT_SURFACE_BASE) ??
    DEFAULT_SURFACE_BASE;
  const mix = Math.max(0, Math.min(1, input.mixAmount ?? DEFAULT_MIX));
  const headerBg = mixHex(surface, accent, mix) ?? accent;
  const titleInk = pickReadableInk(headerBg);
  const btnInk =
    deriveHairlineBorder(headerBg, titleInk, 0.72) ?? titleInk;
  const border =
    deriveHairlineBorder(headerBg, accent, 0.5) ??
    mixHex(headerBg, accent, 0.35) ??
    accent;
  const base: WindowHuePaint = {
    accent,
    headerBg,
    border,
    titleInk,
    btnInk,
  };
  const o = input.overrides;
  if (!o) return base;
  return {
    accent: o.accent && normalizeHex(o.accent) ? normalizeHex(o.accent)! : base.accent,
    headerBg:
      o.headerBg && normalizeHex(o.headerBg)
        ? normalizeHex(o.headerBg)!
        : base.headerBg,
    border:
      o.border && normalizeHex(o.border) ? normalizeHex(o.border)! : base.border,
    titleInk:
      o.titleInk && normalizeHex(o.titleInk)
        ? normalizeHex(o.titleInk)!
        : base.titleInk,
    btnInk:
      o.btnInk && normalizeHex(o.btnInk) ? normalizeHex(o.btnInk)! : base.btnInk,
  };
}

export function isWindowHueId(raw: unknown): raw is WindowHueId {
  return (
    typeof raw === "string" &&
    DEFAULT_WINDOW_COLOR_PALETTE.some((h) => h.id === raw)
  );
}

export function isStudioWindowColorKind(
  raw: unknown,
): raw is StudioWindowColorKind {
  return (
    typeof raw === "string" &&
    (STUDIO_WINDOW_COLOR_KINDS as string[]).includes(raw)
  );
}

export function paletteHueSeed(
  hue: WindowHueId,
  palette: readonly WindowHueDef[] = DEFAULT_WINDOW_COLOR_PALETTE,
): string | null {
  return palette.find((h) => h.id === hue)?.seed ?? null;
}

export type WindowColorOverrides = Partial<
  Record<StudioWindowColorKind, WindowHueId>
>;

/**
 * Effective hue: project override → global → built-in default.
 * `null` / missing in a layer means fall through.
 */
export function resolveEffectiveWindowHue(
  kind: StudioWindowColorKind,
  input?: {
    global?: WindowColorOverrides | null;
    project?: WindowColorOverrides | null;
    defaults?: Readonly<Record<StudioWindowColorKind, WindowHueId>>;
  },
): WindowHueId {
  const defaults = input?.defaults ?? DEFAULT_WINDOW_KIND_HUES;
  const project = input?.project?.[kind];
  if (project && isWindowHueId(project)) return project;
  const global = input?.global?.[kind];
  if (global && isWindowHueId(global)) return global;
  return defaults[kind];
}

export function resolveEffectiveWindowHueMap(input?: {
  global?: WindowColorOverrides | null;
  project?: WindowColorOverrides | null;
  defaults?: Readonly<Record<StudioWindowColorKind, WindowHueId>>;
}): Record<StudioWindowColorKind, WindowHueId> {
  const out = {} as Record<StudioWindowColorKind, WindowHueId>;
  for (const kind of STUDIO_WINDOW_COLOR_KINDS) {
    out[kind] = resolveEffectiveWindowHue(kind, input);
  }
  return out;
}

/** Kinds that currently resolve to this hue (for picker owner labels). */
export function kindsOwningWindowHue(
  hue: WindowHueId,
  effective: Readonly<Record<StudioWindowColorKind, WindowHueId>>,
): StudioWindowColorKind[] {
  return STUDIO_WINDOW_COLOR_KINDS.filter((k) => effective[k] === hue);
}

export function paintForWindowHue(
  hue: WindowHueId,
  opts?: {
    palette?: readonly WindowHueDef[];
    surfaceBase?: string;
    mixAmount?: number;
    overrides?: WindowHuePaintOverrides;
  },
): WindowHuePaint | null {
  const seed = paletteHueSeed(hue, opts?.palette);
  if (!seed) return null;
  return deriveWindowHuePaint({
    seed,
    surfaceBase: opts?.surfaceBase,
    mixAmount: opts?.mixAmount,
    overrides: opts?.overrides,
  });
}

export function paintMapForEffectiveHues(
  effective: Readonly<Record<StudioWindowColorKind, WindowHueId>>,
  opts?: {
    palette?: readonly WindowHueDef[];
    surfaceBase?: string;
    mixAmount?: number;
    /** Shell accent — remap tab hues that would melt into chrome. */
    shellAccent?: string | null;
  },
): Record<StudioWindowColorKind, WindowHuePaint> {
  const hues = opts?.shellAccent
    ? resolveShellSafeWindowHueMap(effective, opts.shellAccent, {
        palette: opts.palette,
      })
    : effective;
  const out = {} as Record<StudioWindowColorKind, WindowHuePaint>;
  for (const kind of STUDIO_WINDOW_COLOR_KINDS) {
    const paint = paintForWindowHue(hues[kind], opts);
    if (!paint) {
      throw new Error(`Missing paint for hue ${hues[kind]} (${kind})`);
    }
    out[kind] = paint;
  }
  return out;
}

/**
 * CSS custom properties + shared rules for canvas tab color tags.
 * Per-kind blocks only set vars; selectors stay generic.
 *
 * DeskPane `.dp-header` stays theme chrome (`--dp-window-header-bg`) —
 * kind hue paints the canvas tab only (not a solid titlebar fill).
 */
export function buildWindowColorStyleBlock(
  paints: Readonly<Record<StudioWindowColorKind, WindowHuePaint>>,
): string {
  const lines: string[] = [
    "/* studio window colors — generated from palette + derive */",
  ];
  for (const kind of STUDIO_WINDOW_COLOR_KINDS) {
    const p = paints[kind]!;
    lines.push(
      `.dp-window.studio-win--${kind}, .studio-canvas-tab.studio-win--${kind} {`,
      `  --studio-win-accent: ${p.accent};`,
      `  --studio-win-header-bg: ${p.headerBg};`,
      `  --studio-win-border: ${p.border};`,
      `  --studio-win-title: ${p.titleInk};`,
      `  --studio-win-btn: ${p.btnInk};`,
      `}`,
    );
  }
  lines.push(
    `.studio-canvas-tab[class*="studio-win--"] {`,
    `  --studio-tab-accent: var(--studio-win-accent);`,
    `  --studio-tab-header-bg: var(--studio-win-header-bg);`,
    `  --studio-tab-title: var(--studio-win-title);`,
    `}`,
  );
  return `${lines.join("\n")}\n`;
}

/** Parse override map from unknown JSON (config / design.json). */
export function parseWindowColorOverrides(
  raw: unknown,
): WindowColorOverrides {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: WindowColorOverrides = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isStudioWindowColorKind(key)) continue;
    if (value === null || value === undefined || value === "") continue;
    if (isWindowHueId(value)) out[key] = value;
  }
  return out;
}

/** Apply one kind set/clear onto an overrides map (immutable). */
export function patchWindowColorOverride(
  current: WindowColorOverrides,
  kind: StudioWindowColorKind,
  hue: WindowHueId | null,
): WindowColorOverrides {
  const next = { ...current };
  if (hue == null) {
    delete next[kind];
  } else {
    next[kind] = hue;
  }
  return next;
}
