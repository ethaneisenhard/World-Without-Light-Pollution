/**
 * Compact mobile dock — catalog + resolve (global vs workspace).
 * Paint / MCP / config all call this; no DOM.
 */

export const MOBILE_DOCK_TAB_IDS = [
  "nav",
  "files",
  "ai",
  "workspaces",
  "settings",
  "calendar",
  "messages",
] as const;

export type MobileDockTabId = (typeof MOBILE_DOCK_TAB_IDS)[number];

export type MobileDockTabKind = "drawer" | "canvas";

export type MobileDockTabDef = {
  id: MobileDockTabId;
  label: string;
  title: string;
  kind: MobileDockTabKind;
  /** Drawer id when kind=drawer; canvas window kind when kind=canvas. */
  target: string;
};

export const MOBILE_DOCK_CATALOG: Readonly<
  Record<MobileDockTabId, MobileDockTabDef>
> = {
  nav: {
    id: "nav",
    label: "Nav",
    title: "Site navigation",
    kind: "drawer",
    target: "nav",
  },
  files: {
    id: "files",
    label: "Files",
    title: "Project files",
    kind: "drawer",
    target: "files",
  },
  ai: {
    id: "ai",
    label: "Chat",
    title: "Open chat window",
    kind: "canvas",
    target: "chat",
  },
  workspaces: {
    id: "workspaces",
    label: "Workspaces",
    title: "Workspaces & Studio",
    kind: "drawer",
    target: "workspaces",
  },
  settings: {
    id: "settings",
    label: "Settings",
    title: "Studio settings",
    kind: "canvas",
    target: "settings",
  },
  calendar: {
    id: "calendar",
    label: "Calendar",
    title: "Calendar",
    kind: "canvas",
    target: "calendar",
  },
  messages: {
    id: "messages",
    label: "Messages",
    title: "Messages inbox",
    kind: "canvas",
    target: "messages",
  },
};

/** Global Studio (no project) — no Nav/Files. */
export const DEFAULT_MOBILE_DOCK_TABS_GLOBAL: readonly MobileDockTabId[] = [
  "settings",
  "calendar",
  "messages",
  "ai",
  "workspaces",
] as const;

/** Workspace — project trees + chat + workspaces picker. */
export const DEFAULT_MOBILE_DOCK_TABS_WORKSPACE: readonly MobileDockTabId[] = [
  "nav",
  "files",
  "ai",
  "workspaces",
] as const;

export const MOBILE_DOCK_TABS_MIN = 3;
export const MOBILE_DOCK_TABS_MAX = 5;

export function isMobileDockTabId(value: unknown): value is MobileDockTabId {
  return (
    typeof value === "string" &&
    (MOBILE_DOCK_TAB_IDS as readonly string[]).includes(value)
  );
}

/**
 * Validate + normalize a tabs array. Returns error string or cleaned ids.
 */
export function parseMobileDockTabs(
  raw: unknown,
): { ok: true; tabs: MobileDockTabId[] } | { ok: false; error: string } {
  if (!Array.isArray(raw)) {
    return { ok: false, error: "tabs must be an array" };
  }
  if (
    raw.length < MOBILE_DOCK_TABS_MIN ||
    raw.length > MOBILE_DOCK_TABS_MAX
  ) {
    return {
      ok: false,
      error: `tabs length must be ${MOBILE_DOCK_TABS_MIN}–${MOBILE_DOCK_TABS_MAX}`,
    };
  }
  const seen = new Set<string>();
  const tabs: MobileDockTabId[] = [];
  for (const item of raw) {
    if (!isMobileDockTabId(item)) {
      return {
        ok: false,
        error: `unknown dock tab: ${String(item)}`,
      };
    }
    if (seen.has(item)) {
      return { ok: false, error: `duplicate dock tab: ${item}` };
    }
    seen.add(item);
    tabs.push(item);
  }
  return { ok: true, tabs };
}

export type MobileDockScope = "global" | "workspace";

export function resolveMobileDockTabs(input: {
  scope: MobileDockScope;
  /** From Studio config ui.mobileDock.tabs */
  globalTabs?: readonly string[] | null;
  /** From design.json shell.mobileDock.tabs */
  projectTabs?: readonly string[] | null;
}): MobileDockTabDef[] {
  const defaults =
    input.scope === "global"
      ? DEFAULT_MOBILE_DOCK_TABS_GLOBAL
      : DEFAULT_MOBILE_DOCK_TABS_WORKSPACE;

  let raw: readonly string[] | null | undefined =
    input.scope === "workspace" && input.projectTabs?.length
      ? input.projectTabs
      : input.globalTabs;

  // Workspace with no project override still uses workspace defaults (not global list).
  if (input.scope === "workspace" && !input.projectTabs?.length) {
    raw = defaults;
  }
  if (input.scope === "global" && !input.globalTabs?.length) {
    raw = defaults;
  }

  const parsed = parseMobileDockTabs(raw ?? defaults);
  const ids = parsed.ok ? parsed.tabs : [...defaults];
  return ids.map((id) => MOBILE_DOCK_CATALOG[id]);
}

export function mobileDockGridColsClass(count: number): string {
  if (count <= 3) return "grid-cols-3";
  if (count === 4) return "grid-cols-4";
  return "grid-cols-5";
}

export type MobileDockConfig = {
  tabs?: MobileDockTabId[];
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Parse ui.mobileDock / shell.mobileDock — invalid tabs → empty (use defaults). */
export function parseMobileDockConfig(raw: unknown): MobileDockConfig {
  if (!isRecord(raw)) return {};
  const parsed = parseMobileDockTabs(raw.tabs);
  if (!parsed.ok) return {};
  return { tabs: parsed.tabs };
}
