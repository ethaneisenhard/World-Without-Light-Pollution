/**
 * Map agent / IDE disk writes → Studio DeskPane panels that should refetch.
 * Twin of `live-agent-refresh-pure` (Live iframe); this is file-backed mini-apps.
 */
import { normalizeProjectWritePath } from "./live-agent-refresh-pure.js";

/** Panels that hydrate from API / file SoT (not Live iframe). */
export type StudioPanelRefreshKind = "roadmap" | "notes" | "memory";

/**
 * Live panel mutation from API / MCP (WS twin of chat file-write refresh).
 * Optional board payload lets Roadmap FLIP without a second GET.
 */
export type PanelAgentRefreshEvent = {
  kind: StudioPanelRefreshKind;
  /** Logical path for path→kind mapping / diagnostics. */
  path: string;
  scope?: "studio" | "project";
  projectId?: string | null;
  /** Moved / focused card — Roadmap FLIP highlight. */
  cardId?: string | null;
  /** When set, apply directly (agent roadmap move / create). */
  board?: unknown;
};

const ROADMAP_PATH = /(^|\/)(\.(?:glassbox|agent)-studio\/)?roadmap(\/|$)/i;
const NOTES_PATH = /(^|\/)(\.(?:glassbox|agent)-studio\/)?notes(\/|$)/i;
const MEMORY_PATH = /(^|\/)(\.(?:glassbox|agent)-studio\/)?memory(\/|$)/i;

/**
 * Which open panels should refresh after a write to `filePath`.
 * Project-agnostic — path shapes from studio config maps, not project ids.
 */
export function panelKindsForAgentWrite(
  filePath: string,
): StudioPanelRefreshKind[] {
  const p = normalizeProjectWritePath(filePath);
  if (!p || p.includes("..")) return [];
  const kinds: StudioPanelRefreshKind[] = [];
  if (ROADMAP_PATH.test(p)) kinds.push("roadmap");
  if (NOTES_PATH.test(p)) kinds.push("notes");
  if (MEMORY_PATH.test(p)) kinds.push("memory");
  return kinds;
}

/** Stable logical path for roadmap board publishes. */
export function roadmapBoardRefreshPath(
  scope: "studio" | "project",
  projectId?: string | null,
): string {
  if (scope === "project" && projectId?.trim()) {
    return `${projectId.trim()}/.glassbox-studio/roadmap/board.json`;
  }
  return ".glassbox-studio/roadmap/board.json";
}

/**
 * Whether a panel-refresh event targets the board currently shown.
 * Path-only events (no scope) always match — caller still checks pane open.
 */
export function panelRefreshMatchesOpenBoard(
  event: { scope?: "studio" | "project"; projectId?: string | null },
  open: { scope: "studio" | "project"; projectId: string | null },
): boolean {
  if (!event.scope) return true;
  if (event.scope !== open.scope) return false;
  if (event.scope === "studio") return true;
  const want = (event.projectId ?? "").trim();
  if (!want) return true;
  return want === (open.projectId ?? "").trim();
}
