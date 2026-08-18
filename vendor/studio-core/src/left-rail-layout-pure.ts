/**
 * Declarative left-rail layout — zone order + workspace sub-slots.
 * Hosts walk DEFAULT_LEFT_RAIL_LAYOUT (or a merged plugin contrib);
 * rearrange without forking app.tsx JSX.
 */

/** Top-level vertical zones in the left sidebar. */
export type LeftRailZoneId = "studio" | "chats" | "workspaces" | "global-chat";

/**
 * Per-workspace sub-tabs (Nav / Files). Chat lives in the top-level Chats zone.
 * `chat` remains a valid slot id for URL/plugin compat (`?tab=ai`).
 */
export type WorkspaceSlotId = "nav" | "files" | "chat";

/** URL / boot wire for left-rail project tab. */
export type LeftRailTabWire = "nav" | "files" | "ai";

export type LeftRailLayout = {
  /** Vertical order of zones. */
  zones: readonly LeftRailZoneId[];
  /** Sub-tabs under an expanded workspace. */
  workspaceSlots: readonly WorkspaceSlotId[];
};

/** Plugin contribution — reorder zones/slots; unknown ids ignored. */
export type LeftRailLayoutContribution = {
  zones?: readonly LeftRailZoneId[];
  workspaceSlots?: readonly WorkspaceSlotId[];
};

export const WORKSPACE_SLOT_LABELS: Readonly<Record<WorkspaceSlotId, string>> = {
  nav: "Nav",
  files: "Files",
  chat: "Chat",
};

export const LEFT_RAIL_ZONE_LABELS: Readonly<
  Partial<Record<LeftRailZoneId, string>>
> = {
  studio: "Studio",
  chats: "Chats",
  workspaces: "Workspaces",
  "global-chat": "Global Chat",
};

/** Default IA: Studio → Chats → Workspaces (Nav/Files) → pinned AI chat. */
export const DEFAULT_LEFT_RAIL_LAYOUT: LeftRailLayout = {
  zones: ["studio", "chats", "workspaces", "global-chat"],
  workspaceSlots: ["nav", "files"],
};

const ZONE_SET = new Set<LeftRailZoneId>([
  "studio",
  "chats",
  "workspaces",
  "global-chat",
]);

const SLOT_SET = new Set<WorkspaceSlotId>(["nav", "files", "chat"]);

export function workspaceSlotToTab(slot: WorkspaceSlotId): LeftRailTabWire {
  return slot === "chat" ? "ai" : slot;
}

export function tabToWorkspaceSlot(tab: LeftRailTabWire): WorkspaceSlotId {
  return tab === "ai" ? "chat" : tab;
}

export function parseLeftRailTabWire(
  value: string | null | undefined,
): LeftRailTabWire {
  if (value === "ai") return "ai";
  if (value === "files") return "files";
  return "nav";
}

/** Filter to known zone ids, preserve order, drop dupes. */
export function normalizeLeftRailZones(
  zones: readonly string[],
): LeftRailZoneId[] {
  const seen = new Set<LeftRailZoneId>();
  const out: LeftRailZoneId[] = [];
  for (const z of zones) {
    if (!ZONE_SET.has(z as LeftRailZoneId)) continue;
    const id = z as LeftRailZoneId;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/** Filter to known slot ids, preserve order, drop dupes. */
export function normalizeWorkspaceSlots(
  slots: readonly string[],
): WorkspaceSlotId[] {
  const seen = new Set<WorkspaceSlotId>();
  const out: WorkspaceSlotId[] = [];
  for (const s of slots) {
    if (!SLOT_SET.has(s as WorkspaceSlotId)) continue;
    const id = s as WorkspaceSlotId;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * Merge plugin contrib onto base. Contrib replaces zone/slot lists when
 * provided (after normalize); empty contrib lists fall back to base.
 */
export function mergeLeftRailLayout(
  base: LeftRailLayout,
  contrib?: LeftRailLayoutContribution | null,
): LeftRailLayout {
  if (!contrib) {
    return {
      zones: [...base.zones],
      workspaceSlots: [...base.workspaceSlots],
    };
  }
  const zones =
    contrib.zones != null
      ? normalizeLeftRailZones(contrib.zones)
      : [...base.zones];
  const workspaceSlots =
    contrib.workspaceSlots != null
      ? normalizeWorkspaceSlots(contrib.workspaceSlots)
      : [...base.workspaceSlots];
  return {
    zones: zones.length > 0 ? zones : [...base.zones],
    workspaceSlots:
      workspaceSlots.length > 0 ? workspaceSlots : [...base.workspaceSlots],
  };
}

/**
 * Accordion expand map — only `expandId` true; every listed project id set.
 */
export function accordionExpandWorkspace(
  projectIds: readonly string[],
  expandId: string,
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const id of projectIds) {
    out[id] = id === expandId;
  }
  return out;
}

/**
 * Workspace row click: expand (accordion) + select project + open Nav.
 */
export function projectWorkspaceRowClick(input: {
  projectId: string;
  allProjectIds: readonly string[];
}): {
  workspaceExpanded: Record<string, boolean>;
  projectId: string;
  tab: LeftRailTabWire;
} {
  return {
    workspaceExpanded: accordionExpandWorkspace(
      input.allProjectIds,
      input.projectId,
    ),
    projectId: input.projectId,
    tab: "nav",
  };
}

/**
 * Activate a workspace sub-tab (Nav / Files / Chat) — expand + select + tab.
 */
export function activateWorkspaceSlot(input: {
  projectId: string;
  slot: WorkspaceSlotId;
  allProjectIds: readonly string[];
}): {
  workspaceExpanded: Record<string, boolean>;
  projectId: string;
  tab: LeftRailTabWire;
} {
  return {
    workspaceExpanded: accordionExpandWorkspace(
      input.allProjectIds,
      input.projectId,
    ),
    projectId: input.projectId,
    tab: workspaceSlotToTab(input.slot),
  };
}

/**
 * Chevron toggle under accordion policy.
 * Expanding collapses others; collapsing only clears this id.
 */
export function toggleWorkspaceAccordion(input: {
  projectId: string;
  currentlyExpanded: boolean;
  allProjectIds: readonly string[];
  previousMap: Record<string, boolean>;
}): Record<string, boolean> {
  if (input.currentlyExpanded) {
    return { ...input.previousMap, [input.projectId]: false };
  }
  return accordionExpandWorkspace(input.allProjectIds, input.projectId);
}

/** Whether the active tab body should render for this workspace. */
export function workspaceTabBodyVisible(input: {
  workspaceId: string;
  activeProjectId: string | null | undefined;
  expanded: boolean;
  activeTab: LeftRailTabWire;
  slot: WorkspaceSlotId;
}): boolean {
  if (!input.expanded) return false;
  if (input.activeProjectId !== input.workspaceId) return false;
  return tabToWorkspaceSlot(input.activeTab) === input.slot;
}
