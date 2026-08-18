/**
 * BrowserUI-shaped Studio panel nav — virtual left-rail sections that open
 * DeskPane mini-studios (Analytics, Integrations, …), not disk folders.
 */

import type { NavTreeItem } from "./nav-pure.js";
import {
  SETTINGS_NAV_SECTIONS,
  type SettingsNavSection,
} from "./settings-nav-pure.js";

export const STUDIO_PANEL_PATH_PREFIX = "__studio__";

export type StudioPanelWindow =
  | "home"
  | "workspace"
  | "settings"
  | "data"
  | "forms"
  | "integrations"
  | "workflows"
  | "email"
  | "messages"
  | "analytics"
  | "calendar"
  | "media"
  | "memory"
  | "roadmap";

export type AnalyticsNavSection =
  | "overview"
  | "funnels"
  | "tracking-plan"
  | "events";

export type EmailNavSection = "campaigns" | "audiences" | "deliverability";

export type StudioPanelNavHit = {
  window: StudioPanelWindow;
  /** Analytics / email / settings subsection when present. */
  section?: string;
};

export const ANALYTICS_NAV_SECTIONS: ReadonlyArray<{
  id: AnalyticsNavSection;
  label: string;
}> = [
  { id: "overview", label: "Overview" },
  { id: "funnels", label: "Funnels" },
  { id: "tracking-plan", label: "Tracking plan" },
  { id: "events", label: "Live events" },
];

export const EMAIL_NAV_SECTIONS: ReadonlyArray<{
  id: EmailNavSection;
  label: string;
}> = [
  { id: "campaigns", label: "Campaigns" },
  { id: "audiences", label: "Audiences" },
  { id: "deliverability", label: "Deliverability" },
];

/** Render order — Workspace Home / Settings first in Nav; Agent Home is left-rail Studio. */
export const STUDIO_PANEL_NAV_ORDER: readonly StudioPanelWindow[] = [
  "home",
  "workspace",
  "settings",
  "data",
  "integrations",
  "workflows",
  "email",
  "messages",
  "analytics",
  "calendar",
  "media",
  "memory",
  "roadmap",
  "forms",
] as const;

export function studioPanelPath(
  window: StudioPanelWindow,
  section?: string,
): string {
  const base = `${STUDIO_PANEL_PATH_PREFIX}/${window}`;
  return section ? `${base}/${section}` : base;
}

export function isStudioPanelPath(path: string): boolean {
  return path === STUDIO_PANEL_PATH_PREFIX || path.startsWith(`${STUDIO_PANEL_PATH_PREFIX}/`);
}

export function resolveStudioPanelNav(path: string): StudioPanelNavHit | null {
  if (!isStudioPanelPath(path)) return null;
  const rest = path
    .slice(STUDIO_PANEL_PATH_PREFIX.length)
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean);
  const window = rest[0] as StudioPanelWindow | undefined;
  if (!window || !STUDIO_PANEL_NAV_ORDER.includes(window)) return null;
  const section = rest[1];
  return section ? { window, section } : { window };
}

function panelLeaf(
  id: string,
  label: string,
  window: StudioPanelWindow,
  section?: string,
): NavTreeItem {
  return {
    id,
    label,
    path: studioPanelPath(window, section),
    kind: "studio-panel",
  };
}

/**
 * Virtual panel groups for the Studio Nav rail (BrowserUI parity).
 * Paths are synthetic (`__studio__/…`) — never disk.
 * Declaration: leaf mini-studios first, then expandable folders.
 */
export function buildStudioPanelNavItems(): NavTreeItem[] {
  return [
    // Leaf mini-studios (no children) — above folders so S-pages sit atop the tree.
    panelLeaf("studio.workspace", "Workspace Home", "workspace"),
    {
      id: "studio.integrations",
      label: "Integrations",
      path: studioPanelPath("integrations"),
      kind: "studio-panel",
    },
    {
      id: "studio.workflows",
      label: "Workflows",
      path: studioPanelPath("workflows"),
      kind: "studio-panel",
    },
    panelLeaf("studio.calendar", "Calendar", "calendar"),
    panelLeaf("studio.media", "Media", "media"),
    panelLeaf("studio.messages", "Messages", "messages"),
    panelLeaf("studio.memory", "Memory", "memory"),
    panelLeaf("studio.roadmap", "Roadmap", "roadmap"),
    panelLeaf("studio.forms", "Forms", "forms"),
    {
      id: "studio.settings",
      label: "Settings",
      path: studioPanelPath("settings"),
      kind: "studio-panel",
      children: SETTINGS_NAV_SECTIONS.map((s) =>
        panelLeaf(`studio.settings.${s.id}`, s.label, "settings", s.id),
      ),
    },
    {
      id: "studio.data",
      label: "Data",
      path: studioPanelPath("data"),
      kind: "studio-panel",
      children: [
        panelLeaf("studio.data.sources", "Sources", "data", "sources"),
        panelLeaf(
          "studio.data.destinations",
          "Destinations",
          "data",
          "destinations",
        ),
      ],
    },
    {
      id: "studio.email",
      label: "Email",
      path: studioPanelPath("email"),
      kind: "studio-panel",
      children: EMAIL_NAV_SECTIONS.map((s) =>
        panelLeaf(`studio.email.${s.id}`, s.label, "email", s.id),
      ),
    },
    {
      id: "studio.analytics",
      label: "Analytics",
      path: studioPanelPath("analytics"),
      kind: "studio-panel",
      children: ANALYTICS_NAV_SECTIONS.map((s) =>
        panelLeaf(`studio.analytics.${s.id}`, s.label, "analytics", s.id),
      ),
    },
  ];
}

export function isNavFolderItem(item: NavTreeItem): boolean {
  return Boolean(item.children?.length);
}

/**
 * Partition folders vs leaves — stable within each group (declaration order).
 */
export function partitionNavFoldersAndLeaves(
  items: readonly NavTreeItem[],
): { folders: NavTreeItem[]; leaves: NavTreeItem[] } {
  const folders: NavTreeItem[] = [];
  const leaves: NavTreeItem[] = [];
  for (const item of items) {
    if (isNavFolderItem(item)) folders.push(item);
    else leaves.push(item);
  }
  return { folders, leaves };
}

/**
 * @deprecated Prefer mergeStudioNavWithPanels — kept for callers/tests.
 * BrowserUI historically: folders first. Studio rail now wants leaves first.
 */
export function orderNavFoldersThenLeaves(
  items: readonly NavTreeItem[],
): NavTreeItem[] {
  const { folders, leaves } = partitionNavFoldersAndLeaves(items);
  return [...folders, ...leaves];
}

/** Studio S-pages (leaves) above folders. */
export function orderNavLeavesThenFolders(
  items: readonly NavTreeItem[],
): NavTreeItem[] {
  const { folders, leaves } = partitionNavFoldersAndLeaves(items);
  return [...leaves, ...folders];
}

/**
 * Nav rail order:
 * 1. Studio panel leaves (Workspace Home, Integrations, …)
 * 2. Studio panel folders (Settings, Data, …)
 * 3. Project page folders (Website, Design, …)
 * 4. Orphan project leaves
 */
export function mergeStudioNavWithPanels(
  pageViews: readonly NavTreeItem[],
  panels: readonly NavTreeItem[] = buildStudioPanelNavItems(),
): NavTreeItem[] {
  const panelParts = partitionNavFoldersAndLeaves(panels);
  const pageParts = partitionNavFoldersAndLeaves(pageViews);
  return [
    ...panelParts.leaves,
    ...panelParts.folders,
    ...pageParts.folders,
    ...pageParts.leaves,
  ];
}

export type StudioPanelCanvasFlag =
  | "home"
  | "workspace"
  | "settings"
  | "data"
  | "forms"
  | "integrations"
  | "workflows"
  | "email"
  | "messages"
  | "analytics"
  | "calendar"
  | "media"
  | "memory"
  | "roadmap";

/** Canvas URL flags to open/close for a panel window. */
export function canvasParamsForPanelWindow(
  window: StudioPanelWindow,
  open = true,
): Partial<Record<StudioPanelCanvasFlag, boolean>> & {
  ssect?: SettingsNavSection;
} {
  if (window === "settings") {
    return { settings: open };
  }
  return { [window]: open };
}
