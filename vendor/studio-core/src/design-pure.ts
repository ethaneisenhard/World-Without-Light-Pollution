/**
 * Per-project `.glassbox-studio/design.json` — brand + shell chrome overrides.
 * Light/dark mode stays global; shell accents swap with the active project.
 */

import {
  deskCanvasCssVars,
  parseDeskCanvasConfig,
  type DeskCanvasConfig,
} from "./desk-canvas-pure.js";
import {
  expandFillShellPatch,
  type StudioThemeColorPatch,
} from "./studio-theme-pure.js";
import { normalizeBrandEmoji } from "./workspace-brand-emoji-pure.js";
import type { WindowColorOverrides } from "./window-colors-pure.js";

export type ProjectDesignThemeRef = {
  source: "package" | "file";
  package?: string;
  path?: string;
};

export type ProjectDesignBrand = {
  name?: string;
  /** Explicit mark text (e.g. "NL"). Falls back to initials from name/id. */
  initials?: string;
  tagline?: string;
  /** Optional image URL/path for future logo mark. */
  logo?: string;
  /** Optional emoji mark for workspace list / home (user content). */
  emoji?: string;
};

/** Partial token color map — same nesting as theme-default `color` / `colorDark`. */
export type ProjectShellColorOverrides = Record<string, Record<string, string>>;

export type ProjectDesignShell = {
  color?: ProjectShellColorOverrides;
  colorDark?: ProjectShellColorOverrides;
  /** Compact dock tab order override (3–5 catalog ids). */
  mobileDock?: { tabs?: string[] };
  /**
   * Desk well under DeskPane windows (not tab strip, not window body).
   * kind: solid (default) | image | dots — prepare for asset backgrounds.
   */
  deskCanvas?: DeskCanvasConfig;
};

/** Codex gallery slug (codex-pet.com / Petdex). */
export type StudioPetId = string;

/** Shipped with Studio under `/pets/<id>/` — also appear in Settings picker. */
export const STUDIO_PET_SHIPPED_IDS = ["airring", "battle-beast"] as const;

/** @deprecated Use STUDIO_PET_SHIPPED_IDS — kept as alias for callers. */
export const STUDIO_PET_IDS: readonly StudioPetId[] = STUDIO_PET_SHIPPED_IDS;

export const DEFAULT_STUDIO_PET_ID: StudioPetId = "airring";

/** Legacy bichito / dragon ids — resolve to default Codex pet. */
const LEGACY_STUDIO_PET_IDS = new Set([
  "ariel",
  "cain",
  "samael",
  "thor",
  "loki",
  "pizza",
  "dragon",
]);

/** Catalog for Settings picker (shipped only). Chat can set any gallery slug. */
export type StudioPetOption = {
  id: StudioPetId;
  label: string;
  species: "codex";
  blurb: string;
};

export const STUDIO_PET_OPTIONS: readonly StudioPetOption[] = [
  {
    id: "airring",
    label: "AirRing",
    species: "codex",
    blurb: "Codex gallery · idle + busy",
  },
  {
    id: "battle-beast",
    label: "Battle Beast",
    species: "codex",
    blurb: "Codex gallery · idle + busy",
  },
] as const;

export const STUDIO_PET_GALLERY_LINKS = [
  { label: "codex-pet.com", href: "https://codex-pet.com/" },
  { label: "petdex.dev", href: "https://petdex.dev/" },
] as const;

/** Lowercase kebab slug used by Codex pet galleries. */
export function isValidStudioPetId(id: string): boolean {
  return (
    typeof id === "string" &&
    id.length >= 1 &&
    id.length <= 64 &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) &&
    !LEGACY_STUDIO_PET_IDS.has(id)
  );
}

export function normalizeStudioPetId(
  id: string | null | undefined,
): StudioPetId {
  if (!id || typeof id !== "string") return DEFAULT_STUDIO_PET_ID;
  const slug = id.trim().toLowerCase();
  if (LEGACY_STUDIO_PET_IDS.has(slug)) return DEFAULT_STUDIO_PET_ID;
  if (!isValidStudioPetId(slug)) return DEFAULT_STUDIO_PET_ID;
  return slug;
}

/** Max length for a custom pet nickname in design.json. */
export const STUDIO_PET_NAME_MAX_LEN = 32;

export type ProjectDesignPet = {
  /** Default true when pet block present; set false to hide. */
  enabled?: boolean;
  /** Codex pet slug — shipped or any gallery id via studio.pet.set */
  id?: StudioPetId;
  /** Optional nickname; empty / omit → catalog / slug label. */
  name?: string;
  /** Render size px (default 28). */
  size?: number;
};

export type ProjectDesign = {
  theme?: ProjectDesignThemeRef;
  brand?: ProjectDesignBrand;
  /** Studio chrome overrides (accent, sidebar tint, …) — not the Live preview theme. */
  shell?: ProjectDesignShell;
  /** Optional composer toolbar pixel pet. */
  pet?: ProjectDesignPet;
  /** Optional per-project window/tab hue overrides (kind → palette id). */
  windowColors?: WindowColorOverrides;
  primitives?: string;
  patterns?: string | null;
};

/** Patch or clear design.json shell.mobileDock.tabs. */
export function applyMobileDockTabsToDesign(
  design: ProjectDesign,
  tabs: string[] | null,
): ProjectDesign {
  const next: ProjectDesign = structuredClone(design);
  if (tabs == null) {
    if (!next.shell) return next;
    const { mobileDock: _drop, ...rest } = next.shell;
    if (Object.keys(rest).length === 0) delete next.shell;
    else next.shell = rest;
    return next;
  }
  next.shell = {
    ...(next.shell ?? {}),
    mobileDock: { tabs: [...tabs] },
  };
  return next;
}

export type ResolvedShellBrand = {
  displayName: string;
  initials: string;
  logo?: string;
  emoji?: string;
};

const WORD_SPLIT = /[\s_\-./]+/;

/** Derive 1–2 letter mark from brand name or project id. */
export function initialsFromLabel(label: string): string {
  const cleaned = label.trim();
  if (!cleaned) return "?";
  const words = cleaned.split(WORD_SPLIT).filter(Boolean);
  if (words.length >= 2) {
    const a = words[0]![0] ?? "";
    const b = words[1]![0] ?? "";
    return `${a}${b}`.toUpperCase();
  }
  const compact = cleaned.replace(/[^a-zA-Z0-9]/g, "");
  if (compact.length >= 2) return compact.slice(0, 2).toUpperCase();
  if (compact.length === 1) return compact.toUpperCase();
  return "?";
}

export function resolveShellBrand(input: {
  design?: ProjectDesign | null;
  projectName?: string;
  projectId?: string;
}): ResolvedShellBrand {
  const brand = input.design?.brand;
  /**
   * Workspace / chrome label prefers `project.json` name over design brand.
   * Clones often leave brand stuck on “Studio Starter” after rename.
   * Initials / logo still come from brand when set.
   */
  const displayName =
    input.projectName?.trim() ||
    brand?.name?.trim() ||
    input.projectId?.trim() ||
    "Project";
  const initials =
    brand?.initials?.trim().slice(0, 3).toUpperCase() ||
    initialsFromLabel(displayName);
  const emoji = normalizeBrandEmoji(brand?.emoji) ?? undefined;
  return {
    displayName,
    initials,
    logo: brand?.logo?.trim() || undefined,
    ...(emoji ? { emoji } : {}),
  };
}

export type BrandPatch = {
  name?: string | null;
  initials?: string | null;
  /** Image URL/path for mark; empty string / null clears. */
  logo?: string | null;
  /** Emoji mark; empty string / null clears back to initials. */
  emoji?: string | null;
};

/** Patch project design.json brand (name / initials / logo). */
export function applyBrandPatchToDesign(
  design: ProjectDesign,
  patch: BrandPatch,
): ProjectDesign {
  const next: ProjectDesign = structuredClone(design);
  const brand: ProjectDesignBrand = { ...(next.brand ?? {}) };
  if (patch.name !== undefined) {
    const v = typeof patch.name === "string" ? patch.name.trim() : "";
    if (v) brand.name = v;
    else delete brand.name;
  }
  if (patch.initials !== undefined) {
    const v =
      typeof patch.initials === "string"
        ? patch.initials.trim().slice(0, 3).toUpperCase()
        : "";
    if (v) brand.initials = v;
    else delete brand.initials;
  }
  if (patch.logo !== undefined) {
    const v = typeof patch.logo === "string" ? patch.logo.trim() : "";
    if (v) brand.logo = v;
    else delete brand.logo;
  }
  if (patch.emoji !== undefined) {
    const v =
      typeof patch.emoji === "string"
        ? normalizeBrandEmoji(patch.emoji)
        : null;
    if (v) brand.emoji = v;
    else delete brand.emoji;
  }
  if (Object.keys(brand).length === 0) delete next.brand;
  else next.brand = brand;
  return next;
}

export function parseBrandPatch(input: unknown):
  | { ok: true; patch: BrandPatch }
  | { ok: false; error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "brand patch must be an object" };
  }
  const o = input as Record<string, unknown>;
  const patch: BrandPatch = {};
  let any = false;
  for (const key of ["name", "initials", "logo", "emoji"] as const) {
    if (o[key] === undefined) continue;
    if (o[key] !== null && typeof o[key] !== "string") {
      return { ok: false, error: `${key} must be a string or null` };
    }
    patch[key] = o[key] as string | null;
    any = true;
  }
  if (!any) return { ok: false, error: "provide name, initials, logo, and/or emoji" };
  return { ok: true, patch };
}

export type ResolvedShellPet = {
  enabled: boolean;
  id: StudioPetId;
  /** Display label — custom nickname or catalog / title-cased slug. */
  name: string;
  size: number;
};

/** Catalog label for shipped pets; otherwise Title Case from kebab slug. */
export function studioPetCatalogLabel(id: StudioPetId): string {
  const known = STUDIO_PET_OPTIONS.find((p) => p.id === id)?.label;
  if (known) return known;
  return id
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Normalize a custom nickname; empty → null (clear / use catalog). */
export function normalizeStudioPetName(
  name: string | null | undefined,
): string | null {
  if (name == null || typeof name !== "string") return null;
  const trimmed = name.trim().slice(0, STUDIO_PET_NAME_MAX_LEN);
  return trimmed || null;
}

export function resolveShellPet(design?: ProjectDesign | null): ResolvedShellPet {
  const pet = design?.pet;
  const id = normalizeStudioPetId(pet?.id);
  const size =
    typeof pet?.size === "number" && pet.size >= 16 && pet.size <= 64
      ? Math.round(pet.size)
      : 28;
  const enabled = pet ? pet.enabled !== false : true;
  const custom = normalizeStudioPetName(pet?.name);
  const name = custom ?? studioPetCatalogLabel(id);
  return { enabled, id, name, size };
}

/** True when project design carries any pet fields (overrides studio default). */
export function projectPetOverridesStudio(
  project?: ProjectDesignPet | null,
): boolean {
  if (!project || typeof project !== "object") return false;
  return Object.keys(project).length > 0;
}

/**
 * Field-merge studio default + project override → effective pet.
 * Each of enabled / id / name / size: project if set, else studio, else code default.
 * `forceGlobal` → ignore project (Settings → Appearance global toggle).
 */
export function resolveEffectiveShellPet(input?: {
  studio?: ProjectDesignPet | null;
  project?: ProjectDesignPet | null;
  forceGlobal?: boolean;
}): ResolvedShellPet {
  const studio = input?.studio ?? undefined;
  const project = input?.forceGlobal ? undefined : (input?.project ?? undefined);
  const merged: ProjectDesignPet = {};
  if (project?.enabled !== undefined) merged.enabled = project.enabled;
  else if (studio?.enabled !== undefined) merged.enabled = studio.enabled;
  if (project?.id !== undefined) merged.id = project.id;
  else if (studio?.id !== undefined) merged.id = studio.id;
  if (project?.name !== undefined) merged.name = project.name;
  else if (studio?.name !== undefined) merged.name = studio.name;
  if (project?.size !== undefined) merged.size = project.size;
  else if (studio?.size !== undefined) merged.size = studio.size;
  if (Object.keys(merged).length === 0) return resolveShellPet(null);
  return resolveShellPet({ pet: merged });
}

/** Parse a raw pet block (config / design.json) into ProjectDesignPet. */
export function parseProjectDesignPet(raw: unknown): ProjectDesignPet {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const o = raw as Record<string, unknown>;
  const pet: ProjectDesignPet = {};
  if (typeof o.enabled === "boolean") pet.enabled = o.enabled;
  if (typeof o.id === "string" && o.id.trim()) {
    pet.id = normalizeStudioPetId(o.id);
  }
  if (typeof o.name === "string") {
    const n = normalizeStudioPetName(o.name);
    if (n) pet.name = n;
  }
  if (typeof o.size === "number" && o.size >= 16 && o.size <= 64) {
    pet.size = Math.round(o.size);
  }
  return pet;
}

export type PetPatch = {
  enabled?: boolean;
  id?: StudioPetId | null;
  /** Nickname; null / "" clears to catalog default. */
  name?: string | null;
  size?: number | null;
};

/** Patch project design.json pet (toolbar mascot). */
export function applyPetPatchToDesign(
  design: ProjectDesign,
  patch: PetPatch,
): ProjectDesign {
  const next: ProjectDesign = structuredClone(design);
  const pet: ProjectDesignPet = { ...(next.pet ?? {}) };
  if (patch.enabled !== undefined) pet.enabled = patch.enabled;
  if (patch.id !== undefined) {
    if (patch.id === null) delete pet.id;
    else if (isValidStudioPetId(patch.id) || LEGACY_STUDIO_PET_IDS.has(patch.id)) {
      pet.id = normalizeStudioPetId(patch.id);
    }
  }
  if (patch.name !== undefined) {
    const v = normalizeStudioPetName(patch.name);
    if (v) pet.name = v;
    else delete pet.name;
  }
  if (patch.size !== undefined) {
    if (patch.size === null) delete pet.size;
    else if (
      typeof patch.size === "number" &&
      patch.size >= 16 &&
      patch.size <= 64
    ) {
      pet.size = Math.round(patch.size);
    }
  }
  if (Object.keys(pet).length === 0) delete next.pet;
  else next.pet = pet;
  return next;
}

/** Patch a standalone pet block (e.g. StudioConfig.ui.pet). */
export function applyPetPatchToPetBlock(
  current: ProjectDesignPet | null | undefined,
  patch: PetPatch,
): ProjectDesignPet | undefined {
  const next = applyPetPatchToDesign({ pet: current ?? undefined }, patch);
  return next.pet;
}

export function parsePetPatch(input: unknown):
  | { ok: true; patch: PetPatch }
  | { ok: false; error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "pet patch must be an object" };
  }
  const o = input as Record<string, unknown>;
  const patch: PetPatch = {};
  let any = false;
  if (o.enabled !== undefined) {
    if (typeof o.enabled !== "boolean") {
      return { ok: false, error: "enabled must be a boolean" };
    }
    patch.enabled = o.enabled;
    any = true;
  }
  if (o.id !== undefined) {
    if (o.id === null) {
      patch.id = null;
      any = true;
    } else if (typeof o.id === "string") {
      const slug = o.id.trim().toLowerCase();
      if (!isValidStudioPetId(slug) && !LEGACY_STUDIO_PET_IDS.has(slug)) {
        return {
          ok: false,
          error:
            "id must be a Codex pet slug (e.g. airring, battle-beast) from codex-pet.com or petdex.dev",
        };
      }
      patch.id = normalizeStudioPetId(slug);
      any = true;
    } else {
      return { ok: false, error: "id must be a string or null" };
    }
  }
  if (o.name !== undefined) {
    if (o.name === null) {
      patch.name = null;
      any = true;
    } else if (typeof o.name === "string") {
      if (o.name.trim().length > STUDIO_PET_NAME_MAX_LEN) {
        return {
          ok: false,
          error: `name must be ${STUDIO_PET_NAME_MAX_LEN} characters or fewer`,
        };
      }
      patch.name = o.name;
      any = true;
    } else {
      return { ok: false, error: "name must be a string or null" };
    }
  }
  if (o.size !== undefined) {
    if (o.size === null) {
      patch.size = null;
      any = true;
    } else if (typeof o.size === "number" && o.size >= 16 && o.size <= 64) {
      patch.size = o.size;
      any = true;
    } else {
      return { ok: false, error: "size must be 16–64 or null" };
    }
  }
  if (!any) {
    return { ok: false, error: "provide enabled, id, name, and/or size" };
  }
  return { ok: true, patch };
}

/** Flatten nested color groups → `--as-color-{group}-{key}` (matches ui-tokens). */
export function shellColorOverridesToCssVars(
  color: ProjectShellColorOverrides,
): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [group, values] of Object.entries(color)) {
    if (!values || typeof values !== "object") continue;
    for (const [key, value] of Object.entries(values)) {
      if (typeof value !== "string" || !value.trim()) continue;
      vars[`--as-color-${group}-${key}`.replace(/_/g, "-")] = value.trim();
    }
  }
  return vars;
}

/**
 * List/API `summarizeProjectShell` is accents-only. Coerce that (or a full
 * design.shell) into a paint-ready shell. Never treat a summary as “no shell”
 * — callers used to inject the summary and wipe fillShell CSS.
 */
export type ProjectShellAccentSummary = {
  accent?: string;
  accentDark?: string;
  initials?: string;
  displayName?: string;
};

export function coerceProjectShellForTheme(
  shell?: ProjectDesignShell | ProjectShellAccentSummary | null,
): ProjectDesignShell | null {
  if (!shell || typeof shell !== "object") return null;
  const asDesign = shell as ProjectDesignShell;
  if (asDesign.color || asDesign.colorDark || asDesign.deskCanvas) {
    const desk = parseDeskCanvasConfig(asDesign.deskCanvas);
    if (!desk) {
      const { deskCanvas: _drop, ...rest } = asDesign;
      return rest;
    }
    return { ...asDesign, deskCanvas: desk };
  }

  const summary = shell as ProjectShellAccentSummary;
  const accent =
    typeof summary.accent === "string" ? summary.accent.trim() : "";
  const accentDark =
    typeof summary.accentDark === "string" ? summary.accentDark.trim() : "";
  if (!accent && !accentDark) return null;
  return {
    ...(accent ? { color: { fg: { accent } } } : {}),
    colorDark: {
      fg: { accent: accentDark || accent },
    },
  };
}

/** Parse Host config / design.json shell (color maps only — ignore junk). */
export function parseProjectDesignShell(raw: unknown): ProjectDesignShell | undefined {
  if (raw == null) return undefined;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const coerced = coerceProjectShellForTheme(raw as ProjectDesignShell);
  return coerced ?? undefined;
}

function cssDeclBlock(selector: string, vars: Record<string, string>): string {
  const lines = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`);
  if (lines.length === 0) return "";
  return `${selector} {\n${lines.join("\n")}\n}`;
}

/**
 * CSS that overrides theme-default vars for the active project.
 * Light → `:root`; dark → `.dark` (same as `themeStyleBlock`).
 */
export function shellOverrideStyleBlock(shell?: ProjectDesignShell | null): string {
  if (!shell) return "";
  const desk = deskCanvasCssVars(parseDeskCanvasConfig(shell.deskCanvas));
  const light = {
    ...(shell.color ? shellColorOverridesToCssVars(shell.color) : {}),
    ...desk,
  };
  const darkBase = shell.colorDark
    ? shellColorOverridesToCssVars(shell.colorDark)
    : shell.color
      ? shellColorOverridesToCssVars(shell.color)
      : {};
  const dark = { ...darkBase, ...desk };
  return [cssDeclBlock(":root", light), cssDeclBlock(".dark", dark)]
    .filter(Boolean)
    .join("\n\n");
}

/** Patch project design.json shell colors (accent, sidebar bg, muted, …). */
export function applyShellColorPatchToDesign(
  design: ProjectDesign,
  patch: StudioThemeColorPatch,
): ProjectDesign {
  const expanded = expandFillShellPatch(patch);
  const next: ProjectDesign = structuredClone(design);
  next.shell = next.shell ?? {};

  const merge = (
    existing: ProjectShellColorOverrides | undefined,
    map: Record<string, Record<string, string>> | undefined,
  ): ProjectShellColorOverrides | undefined => {
    if (!map) return existing;
    const out: ProjectShellColorOverrides = { ...(existing ?? {}) };
    for (const [group, values] of Object.entries(map)) {
      out[group] = { ...(out[group] ?? {}), ...values };
    }
    return out;
  };

  let light = merge(next.shell.color, expanded.color);
  let dark = merge(next.shell.colorDark, expanded.colorDark);

  if (expanded.accent) {
    light = light ?? {};
    light.fg = { ...(light.fg ?? {}), accent: expanded.accent };
  }
  if (expanded.accentDark) {
    dark = dark ?? {};
    dark.fg = { ...(dark.fg ?? {}), accent: expanded.accentDark };
  } else if (expanded.accent && !expanded.colorDark) {
    dark = dark ?? {};
    dark.fg = { ...(dark.fg ?? {}), accent: expanded.accent };
  }

  if (light) next.shell.color = light;
  if (dark) next.shell.colorDark = dark;
  return next;
}

/** @deprecated use applyShellColorPatchToDesign */
export function applyShellAccentPatchToDesign(
  design: ProjectDesign,
  patch: { accent?: string; accentDark?: string },
): ProjectDesign {
  return applyShellColorPatchToDesign(design, patch);
}

/** Minimal design.json when a project has none yet. */
export function designDocWithShellAccents(patch: {
  accent?: string;
  accentDark?: string;
  color?: Record<string, Record<string, string>>;
  colorDark?: Record<string, Record<string, string>>;
}): ProjectDesign {
  return applyShellColorPatchToDesign({}, patch);
}

/**
 * Project list / workspace-row shell — accents for marks + full color maps
 * when design.json has them (click-path optimistic chrome paint).
 */
export function summarizeProjectShell(input: {
  design?: ProjectDesign | null;
  projectName?: string;
  projectId?: string;
}): {
  initials: string;
  displayName: string;
  emoji?: string;
  accent?: string;
  accentDark?: string;
  color?: ProjectShellColorOverrides;
  colorDark?: ProjectShellColorOverrides;
} {
  const brand = resolveShellBrand(input);
  const color = input.design?.shell?.color;
  const colorDark = input.design?.shell?.colorDark;
  const accent =
    typeof color?.fg?.accent === "string" ? color.fg.accent : undefined;
  const accentDark =
    typeof colorDark?.fg?.accent === "string"
      ? colorDark.fg.accent
      : accent;
  return {
    initials: brand.initials,
    displayName: brand.displayName,
    ...(brand.emoji ? { emoji: brand.emoji } : {}),
    ...(accent ? { accent } : {}),
    ...(accentDark ? { accentDark } : {}),
    ...(color ? { color } : {}),
    ...(colorDark ? { colorDark } : {}),
  };
}
