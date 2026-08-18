/**
 * Glass Box boot splash prefs — palettes + animation params (no DOM).
 * Default: Violet palette + dual spin. Settings can customize / pick System (Ink/Noir).
 */

export const BOOT_SPLASH_STORAGE_KEY = "glassbox-studio:boot-splash";

/** Dogfood: hold boot splash forever — skip client hydrate (`?splash=1|still|edit`). */
export const BOOT_SPLASH_HOLD_PARAM = "splash";

function bootSplashSearchParams(
  urlOrSearch: string | null | undefined,
): URLSearchParams {
  const raw = typeof urlOrSearch === "string" ? urlOrSearch : "";
  const q = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
  return new URLSearchParams(q);
}

/**
 * True when URL asks to preview only the loading screen (`?splash=1|still|edit`).
 * Accepts a full request URL (SSR) or a `?…` search string.
 */
export function urlWantsBootSplashHold(
  urlOrSearch: string | null | undefined,
): boolean {
  try {
    const v = bootSplashSearchParams(urlOrSearch).get(BOOT_SPLASH_HOLD_PARAM);
    return v === "1" || v === "still" || v === "edit";
  } catch {
    return false;
  }
}

/**
 * True when loading-screen hold should freeze the glass box (no auto spin).
 * `?splash=still` — favicon / screenshot capture of the real Remix SSR splash.
 */
export function urlWantsBootSplashStill(
  urlOrSearch: string | null | undefined,
): boolean {
  try {
    const params = bootSplashSearchParams(urlOrSearch);
    if (params.get(BOOT_SPLASH_HOLD_PARAM) === "still") return true;
    if (params.get(BOOT_SPLASH_HOLD_PARAM) !== "1") return false;
    return params.get("still") === "1";
  } catch {
    return false;
  }
}

/**
 * True when hold should mount the animation toggles panel (`showEditor`).
 * `?splash=1` / `?splash=edit` — play; `?splash=still` stays capture-clean.
 */
export function urlWantsBootSplashEdit(
  urlOrSearch: string | null | undefined,
): boolean {
  if (urlWantsBootSplashStill(urlOrSearch)) return false;
  try {
    const v = bootSplashSearchParams(urlOrSearch).get(BOOT_SPLASH_HOLD_PARAM);
    return v === "edit" || v === "1";
  } catch {
    return false;
  }
}

export type BootSplashColorKey =
  | "bg"
  | "boxFront"
  | "boxBack"
  | "ocean"
  | "globeStroke"
  | "land"
  | "gratOcean"
  | "gratLand";

export type BootSplashColors = Record<BootSplashColorKey, string>;

export type BootSplashPaletteId =
  | "system"
  | "ink"
  | "noir"
  | "blueprint"
  | "sunset"
  | "forest"
  | "violet"
  | "paper"
  | "terminal"
  | "custom";

export type BootSplashParams = {
  spin: boolean;
  spinSpeed: number;
  tilt: number;
  spinBox: boolean;
  boxSpinSpeed: number;
  boxYaw: number;
  boxPitch: number;
  reverseGlobeSpin: boolean;
  reverseBoxSpin: boolean;
  dragMove: boolean;
  dragRotate: boolean;
  dragRotateBox: boolean;
  reverseGlobeDrag: boolean;
  reverseBoxDrag: boolean;
  showBox: boolean;
  showBoxFront: boolean;
  showBoxBack: boolean;
  backDashed: boolean;
  showGlobe: boolean;
  solidGlobe: boolean;
  showLand: boolean;
  showGratOcean: boolean;
  showGratLand: boolean;
  clipToBox: boolean;
  frontStroke: number;
  backStroke: number;
  globeStroke: number;
  gratStroke: number;
  gratStep: number;
  paletteId: BootSplashPaletteId;
  colors: BootSplashColors;
};

export type BootSplashPalette = {
  id: Exclude<BootSplashPaletteId, "system" | "custom">;
  name: string;
  swatches: [string, string, string];
  colors: BootSplashColors;
};

export const BOOT_SPLASH_PALETTES: readonly BootSplashPalette[] = [
  {
    id: "ink",
    name: "Ink",
    swatches: ["#ffffff", "#000000", "#111111"],
    colors: {
      bg: "#ffffff",
      boxFront: "#000000",
      boxBack: "#000000",
      ocean: "#ffffff",
      globeStroke: "#000000",
      land: "#000000",
      gratOcean: "#000000",
      gratLand: "#ffffff",
    },
  },
  {
    id: "noir",
    name: "Noir",
    swatches: ["#0a0a0a", "#fafafa", "#a3a3a3"],
    colors: {
      bg: "#0a0a0a",
      boxFront: "#fafafa",
      boxBack: "#a3a3a3",
      ocean: "#171717",
      globeStroke: "#e5e5e5",
      land: "#f5f5f5",
      gratOcean: "#737373",
      gratLand: "#262626",
    },
  },
  {
    id: "blueprint",
    name: "Blueprint",
    swatches: ["#0b1f3a", "#7dd3fc", "#e0f2fe"],
    colors: {
      bg: "#0b1f3a",
      boxFront: "#7dd3fc",
      boxBack: "#38bdf8",
      ocean: "#082f49",
      globeStroke: "#bae6fd",
      land: "#e0f2fe",
      gratOcean: "#38bdf8",
      gratLand: "#0c4a6e",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    swatches: ["#1c0a0a", "#fb923c", "#fef3c7"],
    colors: {
      bg: "#1c0a0a",
      boxFront: "#fb923c",
      boxBack: "#f97316",
      ocean: "#2a1210",
      globeStroke: "#fdba74",
      land: "#fef3c7",
      gratOcean: "#ea580c",
      gratLand: "#9a3412",
    },
  },
  {
    id: "forest",
    name: "Forest",
    swatches: ["#ecfdf5", "#166534", "#052e16"],
    colors: {
      bg: "#ecfdf5",
      boxFront: "#166534",
      boxBack: "#15803d",
      ocean: "#d1fae5",
      globeStroke: "#14532d",
      land: "#052e16",
      gratOcean: "#16a34a",
      gratLand: "#bbf7d0",
    },
  },
  {
    id: "violet",
    name: "Violet",
    swatches: ["#0f0a1a", "#c4b5fd", "#ede9fe"],
    colors: {
      bg: "#0f0a1a",
      boxFront: "#c4b5fd",
      boxBack: "#a78bfa",
      ocean: "#1e1533",
      globeStroke: "#ddd6fe",
      land: "#ede9fe",
      gratOcean: "#8b5cf6",
      gratLand: "#4c1d95",
    },
  },
  {
    id: "paper",
    name: "Paper",
    swatches: ["#f5f0e8", "#3f3a34", "#8a8178"],
    colors: {
      bg: "#f5f0e8",
      boxFront: "#3f3a34",
      boxBack: "#8a8178",
      ocean: "#efe8dc",
      globeStroke: "#2c2824",
      land: "#2c2824",
      gratOcean: "#6b635a",
      gratLand: "#f5f0e8",
    },
  },
  {
    id: "terminal",
    name: "Terminal",
    swatches: ["#020617", "#4ade80", "#22c55e"],
    colors: {
      bg: "#020617",
      boxFront: "#4ade80",
      boxBack: "#22c55e",
      ocean: "#020617",
      globeStroke: "#86efac",
      land: "#bbf7d0",
      gratOcean: "#16a34a",
      gratLand: "#14532d",
    },
  },
] as const;

/** Tuned demo defaults (yaw/pitch pose + dual spin). */
export const BOOT_SPLASH_PARAM_DEFAULTS: Omit<BootSplashParams, "colors"> = {
  spin: true,
  spinSpeed: 0.14,
  tilt: -12,
  spinBox: true,
  boxSpinSpeed: 0.35,
  boxYaw: -137.7,
  boxPitch: 23.5,
  reverseGlobeSpin: false,
  reverseBoxSpin: false,
  dragMove: false,
  dragRotate: true,
  dragRotateBox: true,
  reverseGlobeDrag: true,
  reverseBoxDrag: true,
  showBox: true,
  showBoxFront: true,
  showBoxBack: true,
  backDashed: true,
  showGlobe: true,
  solidGlobe: true,
  showLand: true,
  showGratOcean: true,
  showGratLand: true,
  clipToBox: true,
  frontStroke: 8,
  backStroke: 1.8,
  globeStroke: 2.5,
  gratStroke: 0.8,
  gratStep: 18,
  paletteId: "violet",
};

/** Page face behind boot splash / Building Studio (matches Violet palette). */
export const BOOT_SPLASH_FACE_CSS = {
  bg: "#0f0a1a",
  fg: "#ede9fe",
} as const;

const COLOR_KEYS: BootSplashColorKey[] = [
  "bg",
  "boxFront",
  "boxBack",
  "ocean",
  "globeStroke",
  "land",
  "gratOcean",
  "gratLand",
];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isHexColor(v: unknown): v is string {
  return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v.trim());
}

export function getBootSplashPalette(
  id: string,
): BootSplashPalette | undefined {
  return BOOT_SPLASH_PALETTES.find((p) => p.id === id);
}

/** Resolve concrete palette id (ink/noir/…) from system or explicit choice. */
export function resolveBootSplashPaletteId(
  paletteId: BootSplashPaletteId | string | undefined,
  prefersDark: boolean,
): Exclude<BootSplashPaletteId, "system"> {
  switch (paletteId) {
    case undefined:
    case "system":
      return prefersDark ? "noir" : "ink";
    case "ink":
    case "noir":
    case "blueprint":
    case "sunset":
    case "forest":
    case "violet":
    case "paper":
    case "terminal":
    case "custom":
      return paletteId;
    default:
      return prefersDark ? "noir" : "ink";
  }
}

export function resolveBootSplashColors(input: {
  paletteId?: BootSplashPaletteId | string;
  colors?: Partial<BootSplashColors> | null;
  prefersDark: boolean;
}): BootSplashColors {
  const resolved = resolveBootSplashPaletteId(input.paletteId, input.prefersDark);
  if (resolved === "custom" && input.colors) {
    const ink = getBootSplashPalette("ink")!.colors;
    const out = { ...ink };
    for (const key of COLOR_KEYS) {
      const v = input.colors[key];
      if (isHexColor(v)) out[key] = v.trim();
    }
    return out;
  }
  const pal = getBootSplashPalette(resolved === "custom" ? "ink" : resolved);
  return { ...(pal ?? getBootSplashPalette("ink")!).colors };
}

export function defaultBootSplashParams(prefersDark: boolean): BootSplashParams {
  const cfg = defaultStudioBootSplashConfig();
  const resolved = resolveBootSplashPaletteId(cfg.paletteId, prefersDark);
  return {
    ...BOOT_SPLASH_PARAM_DEFAULTS,
    paletteId: cfg.paletteId,
    colors: {
      ...(getBootSplashPalette(resolved === "custom" ? "violet" : resolved) ??
        getBootSplashPalette("violet")!).colors,
    },
  };
}

export function parseBootSplashParams(raw: unknown, prefersDark = false): BootSplashParams {
  const base = defaultBootSplashParams(prefersDark);
  if (!isRecord(raw)) return base;

  const next: BootSplashParams = { ...base, colors: { ...base.colors } };

  const boolKeys = [
    "spin",
    "spinBox",
    "reverseGlobeSpin",
    "reverseBoxSpin",
    "dragMove",
    "dragRotate",
    "dragRotateBox",
    "reverseGlobeDrag",
    "reverseBoxDrag",
    "showBox",
    "showBoxFront",
    "showBoxBack",
    "backDashed",
    "showGlobe",
    "solidGlobe",
    "showLand",
    "showGratOcean",
    "showGratLand",
    "clipToBox",
  ] as const;
  for (const key of boolKeys) {
    if (typeof raw[key] === "boolean") next[key] = raw[key];
  }

  const numKeys = [
    "spinSpeed",
    "tilt",
    "boxSpinSpeed",
    "boxYaw",
    "boxPitch",
    "frontStroke",
    "backStroke",
    "globeStroke",
    "gratStroke",
    "gratStep",
  ] as const;
  for (const key of numKeys) {
    if (typeof raw[key] === "number" && Number.isFinite(raw[key])) {
      next[key] = raw[key];
    }
  }

  if (typeof raw.paletteId === "string" && raw.paletteId.trim()) {
    const id = raw.paletteId.trim();
    if (
      id === "system" ||
      id === "ink" ||
      id === "noir" ||
      id === "blueprint" ||
      id === "sunset" ||
      id === "forest" ||
      id === "violet" ||
      id === "paper" ||
      id === "terminal" ||
      id === "custom"
    ) {
      next.paletteId = id;
    }
  }

  if (isRecord(raw.colors)) {
    let anyCustom = false;
    for (const key of COLOR_KEYS) {
      const v = raw.colors[key];
      if (isHexColor(v)) {
        next.colors[key] = v.trim();
        anyCustom = true;
      }
    }
    if (anyCustom && next.paletteId === "custom") {
      /* keep custom colors */
    } else if (next.paletteId !== "custom") {
      next.colors = resolveBootSplashColors({
        paletteId: next.paletteId,
        prefersDark,
      });
    }
  } else if (next.paletteId !== "custom") {
    next.colors = resolveBootSplashColors({
      paletteId: next.paletteId,
      prefersDark,
    });
  }

  return next;
}

/** Optional brand mark from Media library (boot + Glass Cube Studio). */
export type BootSplashMarkAsset = {
  scope: "studio" | "project";
  assetId: string;
  /** Required when scope is project. */
  projectId?: string;
  /** Display name from Media (optional). */
  label?: string;
};

export function parseBootSplashMarkAsset(
  raw: unknown,
): BootSplashMarkAsset | null {
  if (!isRecord(raw)) return null;
  const assetId =
    typeof raw.assetId === "string" && raw.assetId.trim()
      ? raw.assetId.trim()
      : "";
  if (!assetId) return null;
  const scope = raw.scope === "project" ? "project" : "studio";
  const projectId =
    typeof raw.projectId === "string" && raw.projectId.trim()
      ? raw.projectId.trim()
      : undefined;
  if (scope === "project" && !projectId) return null;
  const label =
    typeof raw.label === "string" && raw.label.trim()
      ? raw.label.trim()
      : undefined;
  return scope === "project"
    ? { scope, assetId, projectId, label }
    : { scope, assetId, label };
}

/** Config / localStorage bag stored under ui.bootSplash. */
export type StudioBootSplashConfig = {
  /** Named palette or system (follows color scheme). */
  paletteId: BootSplashPaletteId;
  /** Full param bag when customized; omitted → defaults + palette. */
  params?: Partial<BootSplashParams>;
  /** Custom brand mark from Media library (null clears). */
  markAsset?: BootSplashMarkAsset | null;
};

export function defaultStudioBootSplashConfig(): StudioBootSplashConfig {
  return { paletteId: "violet" };
}

export function parseStudioBootSplashConfig(raw: unknown): StudioBootSplashConfig {
  if (!isRecord(raw)) return defaultStudioBootSplashConfig();
  const paletteRaw =
    typeof raw.paletteId === "string" && raw.paletteId.trim()
      ? raw.paletteId.trim()
      : "system";
  const paletteId: BootSplashPaletteId =
    paletteRaw === "system" ||
    paletteRaw === "ink" ||
    paletteRaw === "noir" ||
    paletteRaw === "blueprint" ||
    paletteRaw === "sunset" ||
    paletteRaw === "forest" ||
    paletteRaw === "violet" ||
    paletteRaw === "paper" ||
    paletteRaw === "terminal" ||
    paletteRaw === "custom"
      ? paletteRaw
      : "system";
  const out: StudioBootSplashConfig = { paletteId };
  if (isRecord(raw.params)) {
    out.params = parseBootSplashParams(
      { ...raw.params, paletteId },
      false,
    );
  }
  if ("markAsset" in raw) {
    out.markAsset = parseBootSplashMarkAsset(raw.markAsset);
  }
  return out;
}

/** Resolve mountable params for boot / settings preview. */
export function resolveBootSplashMountParams(input: {
  config?: StudioBootSplashConfig | null;
  prefersDark: boolean;
}): BootSplashParams {
  const cfg = input.config ?? defaultStudioBootSplashConfig();
  const parsed = parseBootSplashParams(
    {
      ...BOOT_SPLASH_PARAM_DEFAULTS,
      ...(cfg.params ?? {}),
      paletteId: cfg.paletteId,
      colors: cfg.params?.colors,
    },
    input.prefersDark,
  );
  if (cfg.paletteId === "system") {
    parsed.paletteId = "system";
    parsed.colors = resolveBootSplashColors({
      paletteId: "system",
      prefersDark: input.prefersDark,
    });
  }
  return parsed;
}

/**
 * Face CSS vars for `#as-boot-splash` / Building Studio overlay.
 * Prefer saved config colors; fall back to Violet defaults.
 */
export function resolveBootSplashFaceCss(input: {
  config?: StudioBootSplashConfig | null;
  prefersDark: boolean;
}): { bg: string; fg: string } {
  const colors = resolveBootSplashMountParams({
    config: input.config,
    prefersDark: input.prefersDark,
  }).colors;
  return {
    bg: colors.bg || BOOT_SPLASH_FACE_CSS.bg,
    fg: colors.land || colors.globeStroke || BOOT_SPLASH_FACE_CSS.fg,
  };
}

/** Status line under the boot cube — paints with the still frame on first HTML. */
export const BOOT_SPLASH_STATUS_COPY = "Connecting to the world...";

/** Rebuild overlay (local esbuild + phone→desk) — same splash, this status. */
export const BOOT_SPLASH_REBUILD_COPY = "Updating Glass Box Studio";

/**
 * Cover z-index — must beat compact dock (`z-[320]`) / sheets (`z-[310]`).
 * Chrome paints under the splash; one reveal when the overlay is removed.
 */
export const BOOT_SPLASH_COVER_Z_INDEX = 400;

/** Keep the flip-loader `...` on any splash status title. */
export function bootSplashStatusFace(copy: string): string {
  const t = copy.trim();
  if (!t) return BOOT_SPLASH_STATUS_COPY;
  if (t.endsWith("...") || t.endsWith("…")) return t;
  return `${t}...`;
}

/**
 * Map workspace shell tokens → splash face. Lives after `--as-color-*` in the
 * document so first paint is the real theme, not the Settings violet palette.
 */
export const BOOT_SPLASH_THEME_CSS = `
:root{
  --as-splash-bg:var(--as-color-bg-canvas,#0f0a1a);
  --as-splash-fg:var(--as-color-fg-primary,#ede9fe);
  --as-splash-box-front:var(--as-color-fg-accent,var(--as-splash-fg));
  --as-splash-box-back:color-mix(in srgb,var(--as-splash-box-front) 48%,var(--as-splash-bg));
  --as-splash-ocean:var(--as-color-bg-surface,var(--as-splash-bg));
  --as-splash-land:var(--as-splash-fg);
  --as-splash-globe:var(--as-splash-fg);
  --as-splash-grat:color-mix(in srgb,var(--as-splash-fg) 28%,transparent);
  --as-splash-grat-land:var(--as-splash-bg);
}
`.replace(/\n/g, "");

/**
 * Inline `<style>` for `#as-boot-splash` — must paint before `styles.css`.
 * Tailwind `fixed inset-0` is too late on hard refresh (blank page, then chrome).
 * Still SVG is visible from frame one; live overlay swaps on `data-as-boot-splash-ready`.
 */
export const BOOT_SPLASH_LAYOUT_CSS = `
#as-boot-splash{
  position:fixed;inset:0;z-index:${BOOT_SPLASH_COVER_Z_INDEX};
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:1.25rem;padding:1.5rem;box-sizing:border-box;
  width:100%;min-height:100dvh;min-height:100lvh;
  background:var(--as-splash-bg,#0f0a1a);
  color:var(--as-splash-fg,#ede9fe);
  pointer-events:auto;
}
html:not([data-as-boot="hydrated"]),
html:not([data-as-boot="hydrated"]) body{
  background:var(--as-splash-bg,#0f0a1a);
}
html:not([data-as-boot="hydrated"]) #root{
  visibility:hidden;
  pointer-events:none;
  overflow:hidden;
  transform:translateZ(0);
}
html:not([data-as-boot="hydrated"]) [data-studio-mobile-dock]{
  display:none;
}
#as-boot-splash[data-as-boot-splash-edit="1"]{
  justify-content:flex-start;align-items:center;overflow:auto;
}
#as-boot-splash:not([data-as-boot-splash-edit="1"]):not([data-as-boot-splash-still="1"]) [data-as-boot-splash-globe]{
  width:min(38vmin,220px);height:min(38vmin,220px);
  position:relative;flex:0 0 auto;overflow:hidden;
  display:flex;align-items:center;justify-content:center;
}
#as-boot-splash[data-as-boot-splash-still="1"] [data-as-boot-splash-globe]{
  width:min(92vmin,512px);height:min(92vmin,512px);
  position:relative;flex:0 0 auto;overflow:hidden;
}
#as-boot-splash [data-as-boot-splash-still-frame]{
  position:absolute;inset:0;width:100%;height:100%;display:block;
}
#as-boot-splash [data-as-boot-splash-globe] .as-glass-box-splash{
  position:absolute;inset:0;width:100%;height:100%;max-width:100%;max-height:100%;
}
#as-boot-splash[data-as-boot-splash-ready="1"] [data-as-boot-splash-still-frame]{
  visibility:hidden;pointer-events:none;
}
#as-boot-splash [data-as-boot-splash-stage]{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:1.25rem;
}
.as-boot-splash-status{
  display:inline-grid;
  margin:0;
  font:700 16px/1.2em ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
  letter-spacing:0;
  color:transparent;
  overflow:hidden;
  height:1.2em;
  white-space:nowrap;
}
.as-boot-splash-status::before,
.as-boot-splash-status::after{
  content:attr(data-as-boot-splash-status-copy);
  grid-area:1/1;
  -webkit-mask:linear-gradient(90deg,#000 50%,#0000 0) 0 50%/2ch 100%;
  mask:linear-gradient(90deg,#000 50%,#0000 0) 0 50%/2ch 100%;
  color:#0000;
  text-shadow:0 0 0 var(--as-splash-fg,#ede9fe),0 calc(var(--s,1)*1.2em) 0 var(--as-splash-fg,#ede9fe);
  animation:as-boot-splash-status-flip 1s infinite;
}
.as-boot-splash-status::after{
  -webkit-mask-position:1ch 50%;
  mask-position:1ch 50%;
  --s:-1;
}
@keyframes as-boot-splash-status-flip{
  80%,100%{text-shadow:0 calc(var(--s,1)*-1.2em) 0 var(--as-splash-fg,#ede9fe),0 0 0 var(--as-splash-fg,#ede9fe)}
}
@media (prefers-reduced-motion:reduce){
  .as-boot-splash-status::before,
  .as-boot-splash-status::after{
    animation:none;
    -webkit-mask:none;
    mask:none;
    color:var(--as-splash-fg,#ede9fe);
    text-shadow:none;
  }
  .as-boot-splash-status::after{content:none}
}
`.replace(/\n/g, "");

export const BOOT_SPLASH_CRITICAL_CSS =
  BOOT_SPLASH_THEME_CSS + BOOT_SPLASH_LAYOUT_CSS;
