/**
 * Settings shell theme cards — soft + fill variants of yellow/purple/green/blue.
 * Pure: no DOM/fetch. Live paint uses design.shell / ui.shell (never package tokens).
 */

import { designDocWithShellAccents } from "./design-pure.js";
import type { ProjectDesignShell } from "./design-pure.js";
import {
  STUDIO_THEME_NAMED_COLORS,
  STUDIO_THEME_SOFT_SHELLS,
  type StudioThemeColorMapPatch,
} from "./studio-theme-pure.js";

export const STUDIO_SHELL_THEME_SOFT_KEYS = [
  "yellow",
  "purple",
  "green",
  "blue",
] as const;

export type StudioShellThemeSoftKey =
  (typeof STUDIO_SHELL_THEME_SOFT_KEYS)[number];

export type StudioShellThemeCardKind = "soft" | "fill";

export type StudioShellThemeCardId =
  | `${StudioShellThemeSoftKey}-soft`
  | `${StudioShellThemeSoftKey}-fill`;

export type StudioShellThemeCard = {
  id: StudioShellThemeCardId;
  softKey: StudioShellThemeSoftKey;
  kind: StudioShellThemeCardKind;
  label: string;
  blurb: string;
  /** Light canvas for swatch. */
  swatchCanvas: string;
  /** Light accent for swatch chip. */
  swatchAccent: string;
};

const CARD_COPY: Record<
  StudioShellThemeSoftKey,
  { softBlurb: string; fillBlurb: string; softLabel: string; fillLabel: string }
> = {
  yellow: {
    softLabel: "Yellow soft",
    fillLabel: "Yellow fill",
    softBlurb: "Warm parchment — readable muted chrome.",
    fillBlurb: "Vivid gold wash across canvas and rails.",
  },
  purple: {
    softLabel: "Purple soft",
    fillLabel: "Purple fill",
    softBlurb: "Soft violet surfaces — calm focus.",
    fillBlurb: "Full violet hue scale from accent.",
  },
  green: {
    softLabel: "Green soft",
    fillLabel: "Green fill",
    softBlurb: "Default Global Studio green — soft.",
    fillBlurb: "Lush green fillShell chrome.",
  },
  blue: {
    softLabel: "Blue soft",
    fillLabel: "Blue fill",
    softBlurb: "Cool slate-blue surfaces.",
    fillBlurb: "Deep blue fill across the shell.",
  },
};

function softShellMaps(key: StudioShellThemeSoftKey): {
  accent: string;
  accentDark: string;
  color: StudioThemeColorMapPatch;
  colorDark: StudioThemeColorMapPatch;
} {
  const soft = STUDIO_THEME_SOFT_SHELLS[key];
  if (!soft) {
    throw new Error(`missing soft shell: ${key}`);
  }
  return soft;
}

function buildCards(): readonly StudioShellThemeCard[] {
  const cards: StudioShellThemeCard[] = [];
  for (const softKey of STUDIO_SHELL_THEME_SOFT_KEYS) {
    const soft = softShellMaps(softKey);
    const copy = CARD_COPY[softKey];
    const named = STUDIO_THEME_NAMED_COLORS[softKey]!;
    cards.push({
      id: `${softKey}-soft`,
      softKey,
      kind: "soft",
      label: copy.softLabel,
      blurb: copy.softBlurb,
      swatchCanvas: soft.color.bg?.canvas ?? "#ffffff",
      swatchAccent: soft.accent,
    });
    const fillShell = designDocWithShellAccents({
      accent: named.accent,
      accentDark: named.accentDark,
      fillShell: true,
    }).shell;
    cards.push({
      id: `${softKey}-fill`,
      softKey,
      kind: "fill",
      label: copy.fillLabel,
      blurb: copy.fillBlurb,
      swatchCanvas: fillShell?.color?.bg?.canvas ?? named.accent,
      swatchAccent: named.accent,
    });
  }
  return cards;
}

/** Catalog for Settings theme card grid (8 cards). */
export const STUDIO_SHELL_THEME_CARDS: readonly StudioShellThemeCard[] =
  buildCards();

export function listStudioShellThemeCards(): readonly StudioShellThemeCard[] {
  return STUDIO_SHELL_THEME_CARDS;
}

export function getStudioShellThemeCard(
  id: string,
): StudioShellThemeCard | undefined {
  const key = id.trim() as StudioShellThemeCardId;
  return STUDIO_SHELL_THEME_CARDS.find((c) => c.id === key);
}

/** Build ProjectDesignShell for a card id. */
export function shellFromThemeCardId(
  id: string,
): ProjectDesignShell | null {
  const card = getStudioShellThemeCard(id);
  if (!card) return null;
  if (card.kind === "soft") {
    const soft = softShellMaps(card.softKey);
    return {
      color: soft.color,
      colorDark: soft.colorDark,
    };
  }
  const named = STUDIO_THEME_NAMED_COLORS[card.softKey]!;
  return (
    designDocWithShellAccents({
      accent: named.accent,
      accentDark: named.accentDark,
      fillShell: true,
    }).shell ?? null
  );
}

function normHex(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase();
}

/**
 * Match painted shell → card id (canvas + accent fingerprint).
 * Returns null when custom / unmatched.
 */
export function matchStudioShellThemeCardId(
  shell?: ProjectDesignShell | null,
): StudioShellThemeCardId | null {
  if (!shell?.color && !shell?.colorDark) return null;
  const canvas = normHex(shell.color?.bg?.canvas);
  const accent = normHex(shell.color?.fg?.accent);
  if (!canvas && !accent) return null;
  for (const card of STUDIO_SHELL_THEME_CARDS) {
    const expected = shellFromThemeCardId(card.id);
    if (!expected) continue;
    const ec = normHex(expected.color?.bg?.canvas);
    const ea = normHex(expected.color?.fg?.accent);
    if (canvas && ec && canvas === ec) return card.id;
    if (!canvas && accent && ea && accent === ea) return card.id;
  }
  return null;
}

/** True when project design.shell has painted bg (override vs inherit Global). */
export function projectShellThemeOverridesStudio(
  shell?: ProjectDesignShell | null,
): boolean {
  if (!shell) return false;
  for (const map of [shell.color, shell.colorDark]) {
    const bg = map?.bg;
    if (!bg) continue;
    for (const key of ["canvas", "surface", "sidebar", "muted"] as const) {
      if (typeof bg[key] === "string" && bg[key]!.trim()) return true;
    }
  }
  return Boolean(
    (typeof shell.color?.fg?.accent === "string" &&
      shell.color.fg.accent.trim()) ||
      (typeof shell.colorDark?.fg?.accent === "string" &&
        shell.colorDark.fg.accent.trim()),
  );
}

/**
 * Effective shell for paint — Global wins when `forceGlobal`, else project
 * override when painted, else Global inherit.
 */
export function resolveEffectiveShellTheme(input?: {
  studio?: ProjectDesignShell | null;
  project?: ProjectDesignShell | null;
  forceGlobal?: boolean;
}): ProjectDesignShell | null {
  if (input?.forceGlobal) {
    return input.studio ?? null;
  }
  if (projectShellThemeOverridesStudio(input?.project)) {
    return input?.project ?? null;
  }
  return input?.studio ?? null;
}
