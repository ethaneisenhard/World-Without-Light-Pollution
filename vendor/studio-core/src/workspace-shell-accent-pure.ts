/**
 * Default shell accents for workspaces + Global Studio.
 * Distinct hues so switching workspaces (and Global) is obvious at a glance.
 */

import { designDocWithShellAccents } from "./design-pure.js";
import type { ProjectDesign } from "./types.js";
import {
  STUDIO_THEME_NAMED_COLORS,
  type StudioThemeColorPatch,
} from "./studio-theme-pure.js";

/** Soft cycle for new workspaces — avoids Global green + common app blues. */
export const WORKSPACE_SHELL_ACCENT_CYCLE = [
  "teal",
  "purple",
  "orange",
  "pink",
  "cyan",
  "gold",
  "violet",
  "red",
  "lime",
  "fusion-blue",
] as const;

/** Global Studio (no `?project=`) — distinct from workspace cycle. */
export const GLOBAL_STUDIO_SHELL_COLOR_NAME = "green";

export const GLOBAL_STUDIO_SHELL_OWNER_ID = "_studio";

export type WorkspaceShellAccent = {
  name: string;
  accent: string;
  accentDark: string;
};

export function globalStudioShellAccent(): WorkspaceShellAccent {
  const pair = STUDIO_THEME_NAMED_COLORS[GLOBAL_STUDIO_SHELL_COLOR_NAME]!;
  return {
    name: GLOBAL_STUDIO_SHELL_COLOR_NAME,
    accent: pair.accent,
    accentDark: pair.accentDark,
  };
}

/** Stable index into the cycle from project id (scales without registry scan). */
export function workspaceShellAccentIndex(projectId: string): number {
  const id = projectId.trim().toLowerCase();
  if (!id) return 0;
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h % WORKSPACE_SHELL_ACCENT_CYCLE.length;
}

export function pickDefaultWorkspaceShellAccent(input: {
  projectId: string;
  /** Hex accents already in use — skip when possible. */
  takenAccentHexes?: readonly string[];
}): WorkspaceShellAccent {
  const taken = new Set(
    (input.takenAccentHexes ?? []).map((h) => h.trim().toLowerCase()),
  );
  const start = workspaceShellAccentIndex(input.projectId);
  const n = WORKSPACE_SHELL_ACCENT_CYCLE.length;
  for (let i = 0; i < n; i += 1) {
    const name = WORKSPACE_SHELL_ACCENT_CYCLE[(start + i) % n]!;
    const pair = STUDIO_THEME_NAMED_COLORS[name]!;
    if (!taken.has(pair.accent.toLowerCase())) {
      return { name, accent: pair.accent, accentDark: pair.accentDark };
    }
  }
  const name = WORKSPACE_SHELL_ACCENT_CYCLE[start]!;
  const pair = STUDIO_THEME_NAMED_COLORS[name]!;
  return { name, accent: pair.accent, accentDark: pair.accentDark };
}

/** Seed design.json shell (fillShell chrome) for a new workspace. */
export function seededWorkspaceDesignDoc(
  accent: WorkspaceShellAccent,
): ProjectDesign {
  const patch: StudioThemeColorPatch = {
    accent: accent.accent,
    accentDark: accent.accentDark,
    fillShell: true,
  };
  return designDocWithShellAccents(patch);
}

export function seededWorkspaceDesignJson(
  accent: WorkspaceShellAccent,
): string {
  return `${JSON.stringify(seededWorkspaceDesignDoc(accent), null, 2)}\n`;
}

export function globalStudioDesignDoc(): ProjectDesign {
  return seededWorkspaceDesignDoc(globalStudioShellAccent());
}
