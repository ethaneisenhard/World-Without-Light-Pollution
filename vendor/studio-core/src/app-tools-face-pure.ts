/**
 * Every DeskPane app must declare MCP catalog prefixes (ADR 0012 / ui-mcp-cli-parity).
 * Empty prefixes = open-only debt — shrink only; never add a new window here empty.
 */

import type { StudioCanvasWindowId } from "./canvas-window-registry-pure.js";
import { canvasWindowIds } from "./canvas-window-registry-pure.js";
import { STUDIO_TOOL_CATALOG } from "./tool-catalog-pure.js";

export type AppToolsDebt = "open-only";

export type AppToolsFace = {
  /** Catalog id prefixes that own this app’s job (`messages.`, `studio.home.`). */
  prefixes: readonly string[];
  /** Known gap — shrink only. `open-only` = nav exists, no domain tools yet. */
  debt?: AppToolsDebt;
  /** Missing verbs while prefixes already exist (partial catalog). */
  gap?: string;
};

export const APP_TOOLS_FACE = {
  home: { prefixes: ["studio.home."] },
  workspace: { prefixes: ["studio.workspace."] },
  settings: {
    prefixes: [
      "studio.config.",
      "studio.theme.",
      "studio.brand.",
      "studio.pet.",
      "studio.dock.",
    ],
    gap: "not every Settings control",
  },
  code: { prefixes: ["files.", "git."] },
  live: {
    prefixes: ["studio.nav"],
    gap: "in-page click → browser.*",
  },
  design: {
    prefixes: ["design."],
    gap: "surfaces + open; Inspect pixel compose stays UI",
  },
  runtimes: { prefixes: ["runtimes.", "services."] },
  ops: { prefixes: ["ops.", "agents."] },
  terminal: { prefixes: ["shell."], gap: "one-shot, not live xterm" },
  chat: { prefixes: ["studio.chat."] },
  calendar: { prefixes: ["calendar."] },
  media: { prefixes: ["media."] },
  converter: { prefixes: ["convert."] },
  browser: { prefixes: ["browser."] },
  data: { prefixes: ["data."] },
  sheets: { prefixes: ["sheets."] },
  forms: { prefixes: ["forms."], gap: "inbox yes; form builder UI" },
  integrations: { prefixes: ["integrations."] },
  workflows: { prefixes: ["workflows."] },
  email: { prefixes: ["email."] },
  messages: { prefixes: ["messages."] },
  notifications: { prefixes: ["notifications."] },
  analytics: { prefixes: ["analytics."] },
  memory: { prefixes: ["memory."] },
  roadmap: { prefixes: ["roadmap."] },
  notes: { prefixes: ["notes."] },
} as const satisfies Record<StudioCanvasWindowId, AppToolsFace>;

export function catalogHitsForPrefixes(
  prefixes: readonly string[],
  catalog: readonly { id: string }[] = STUDIO_TOOL_CATALOG,
): readonly string[] {
  if (!prefixes.length) return [];
  return catalog
    .filter((t) =>
      prefixes.some((p) => (p.endsWith(".") ? t.id.startsWith(p) : t.id === p)),
    )
    .map((t) => t.id);
}

export function appToolsFaceDebtIds(
  face: typeof APP_TOOLS_FACE = APP_TOOLS_FACE,
): readonly StudioCanvasWindowId[] {
  return canvasWindowIds().filter((id) => face[id].debt === "open-only");
}
