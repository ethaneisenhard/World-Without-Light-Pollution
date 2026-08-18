/**
 * Workspace rail (Nav / Files) experience — slots + virtual nav projection.
 * Projection renames/reorders/groups for display; does not rename disk paths.
 */

import {
  DEFAULT_LEFT_RAIL_LAYOUT,
  normalizeWorkspaceSlots,
  type WorkspaceSlotId,
} from "./left-rail-layout-pure.js";
import type { NavTreeItem } from "./nav-pure.js";
import type { ProjectConfig, ProjectNavEntry } from "./types.js";

/** Stable projection node — id matches nav map key / tree id. */
export type NavProjectionNode = {
  id: string;
  label?: string;
  hidden?: boolean;
  /** Ordered child ids (reorder + regroup under this node). */
  children?: string[];
  /** Virtual folder — no disk path; only groups children. */
  virtual?: boolean;
};

export type NavExperienceSpec = {
  /** Top-level section ids to keep (omit = all base). */
  include?: string[];
  /** Top-level section ids to drop. */
  exclude?: string[];
  /** Rename / reorder / virtual groups. */
  projection?: NavProjectionNode[];
};

export type WorkspaceRailProfile = {
  id: string;
  label: string;
  workspaceSlots?: WorkspaceSlotId[];
  nav?: NavExperienceSpec;
  studioPanels?: { include?: string[]; exclude?: string[] };
};

/** Persisted user/global overlay (partial). */
export type WorkspaceRailOverlay = {
  profileId?: string;
  workspaceSlots?: WorkspaceSlotId[];
  nav?: NavExperienceSpec;
  studioPanels?: { include?: string[]; exclude?: string[] };
};

export type WorkspaceRailExperienceSources = {
  projectId: string;
  profileId?: string;
  userId?: string;
};

/** Resolved document for paint + API. */
export type WorkspaceRailExperience = {
  workspaceSlots: WorkspaceSlotId[];
  nav: NavExperienceSpec;
  studioPanels?: { include?: string[]; exclude?: string[] };
  sources: WorkspaceRailExperienceSources;
};

export type ProjectExperiencesConfig = {
  default?: string;
  profiles?: Record<string, WorkspaceRailProfile>;
};

export const DEFAULT_WORKSPACE_RAIL_SLOTS: readonly WorkspaceSlotId[] =
  DEFAULT_LEFT_RAIL_LAYOUT.workspaceSlots;

export const BUILTIN_WORKSPACE_RAIL_PROFILES: readonly WorkspaceRailProfile[] = [
  {
    id: "builder",
    label: "Builder",
    workspaceSlots: ["nav", "files"],
    nav: {},
  },
  {
    id: "nav-only",
    label: "Navigation only",
    workspaceSlots: ["nav"],
    nav: {},
    studioPanels: { exclude: ["*"] },
  },
  {
    id: "legal",
    label: "Legal",
    workspaceSlots: ["nav"],
    nav: {
      include: ["website", "pages", "docs", "legal"],
      projection: [
        {
          id: "resources",
          label: "Resources",
          virtual: true,
          children: ["legal", "docs", "website", "pages"],
        },
        { id: "legal", label: "Legal" },
        { id: "docs", label: "Documents" },
        { id: "website", label: "Site" },
        { id: "pages", label: "Pages" },
      ],
    },
    studioPanels: { exclude: ["*"] },
  },
] as const;

export function builtinWorkspaceRailProfileMap(): Record<
  string,
  WorkspaceRailProfile
> {
  const out: Record<string, WorkspaceRailProfile> = {};
  for (const p of BUILTIN_WORKSPACE_RAIL_PROFILES) {
    out[p.id] = p;
  }
  return out;
}

function mergeNavSpec(
  base: NavExperienceSpec | undefined,
  overlay: NavExperienceSpec | undefined,
): NavExperienceSpec {
  if (!base && !overlay) return {};
  if (!overlay) return { ...base, projection: base?.projection?.map((n) => ({ ...n })) };
  if (!base) {
    return {
      ...overlay,
      projection: overlay.projection?.map((n) => ({ ...n })),
    };
  }
  const projection =
    overlay.projection != null
      ? overlay.projection.map((n) => ({ ...n }))
      : base.projection?.map((n) => ({ ...n }));
  return {
    include: overlay.include ?? base.include,
    exclude: overlay.exclude ?? base.exclude,
    projection,
  };
}

function mergeStudioPanels(
  base: WorkspaceRailProfile["studioPanels"] | undefined,
  overlay: WorkspaceRailOverlay["studioPanels"] | undefined,
): WorkspaceRailProfile["studioPanels"] | undefined {
  if (!base && !overlay) return undefined;
  if (!overlay) return base ? { ...base } : undefined;
  if (!base) return { ...overlay };
  return {
    include: overlay.include ?? base.include,
    exclude: overlay.exclude ?? base.exclude,
  };
}

/** Merge profile + user overlay into one experience document. */
export function resolveWorkspaceRailExperience(input: {
  projectId: string;
  userId?: string;
  projectExperiences?: ProjectExperiencesConfig | null;
  globalProfiles?: Record<string, WorkspaceRailProfile> | null;
  userOverlay?: WorkspaceRailOverlay | null;
  defaultSlots?: readonly WorkspaceSlotId[];
}): WorkspaceRailExperience {
  const builtins = builtinWorkspaceRailProfileMap();
  const global = { ...builtins, ...(input.globalProfiles ?? {}) };
  const projectProfiles = input.projectExperiences?.profiles ?? {};

  const requestedId =
    input.userOverlay?.profileId?.trim() ||
    input.projectExperiences?.default?.trim() ||
    "builder";

  const profile: WorkspaceRailProfile =
    projectProfiles[requestedId] ??
    global[requestedId] ??
    builtins.builder!;

  const overlay = input.userOverlay ?? {};
  const slotsRaw =
    overlay.workspaceSlots ??
    profile.workspaceSlots ??
    input.defaultSlots ??
    DEFAULT_WORKSPACE_RAIL_SLOTS;
  let workspaceSlots = normalizeWorkspaceSlots(slotsRaw);
  if (!workspaceSlots.length) {
    workspaceSlots = [...DEFAULT_WORKSPACE_RAIL_SLOTS];
  }
  // Always keep at least nav when slots normalize empty of nav — Files-only is odd.
  if (!workspaceSlots.includes("nav") && !workspaceSlots.includes("files")) {
    workspaceSlots = ["nav"];
  }

  const nav = mergeNavSpec(profile.nav, overlay.nav);
  const studioPanels = mergeStudioPanels(profile.studioPanels, overlay.studioPanels);

  return {
    workspaceSlots,
    nav,
    ...(studioPanels ? { studioPanels } : {}),
    sources: {
      projectId: input.projectId,
      profileId: profile.id,
      ...(input.userId ? { userId: input.userId } : {}),
    },
  };
}

/** If URL tab is Files but experience hid Files → nav. */
export function coerceWorkspaceTabForExperience(
  tab: string | null | undefined,
  slots: readonly WorkspaceSlotId[],
): "nav" | "files" | "ai" {
  const t = tab === "files" || tab === "ai" ? tab : "nav";
  if (t === "files" && !slots.includes("files")) return "nav";
  if (t === "ai" && !slots.includes("chat")) {
    // chat slot optional; ai tab may still exist via other chrome — leave ai
    return "ai";
  }
  return t;
}

function topLevelId(id: string): string {
  const i = id.indexOf(".");
  return i === -1 ? id : id.slice(0, i);
}

/** Filter project.json nav map by include/exclude (top-level keys). */
export function filterProjectNavMap(
  nav: ProjectConfig["nav"] | undefined,
  spec: NavExperienceSpec,
): ProjectConfig["nav"] {
  if (!nav) return {};
  const keys = Object.keys(nav);
  const include = spec.include?.map((s) => s.trim()).filter(Boolean);
  const exclude = new Set(
    (spec.exclude ?? []).map((s) => s.trim()).filter(Boolean),
  );
  let keep = keys;
  if (include?.length) {
    const allow = new Set(include);
    keep = keys.filter((k) => allow.has(k));
  }
  keep = keep.filter((k) => !exclude.has(k));
  const out: Record<string, ProjectNavEntry | string> = {};
  for (const k of keep) {
    const v = nav[k];
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function cloneNavItem(item: NavTreeItem): NavTreeItem {
  return {
    ...item,
    children: item.children?.map(cloneNavItem),
  };
}

function indexNavById(items: readonly NavTreeItem[]): Map<string, NavTreeItem> {
  const map = new Map<string, NavTreeItem>();
  const walk = (nodes: readonly NavTreeItem[]) => {
    for (const n of nodes) {
      map.set(n.id, n);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(items);
  return map;
}

function filterTopLevel(
  items: readonly NavTreeItem[],
  spec: NavExperienceSpec,
): NavTreeItem[] {
  const include = spec.include?.map((s) => s.trim()).filter(Boolean);
  const exclude = new Set(
    (spec.exclude ?? []).map((s) => s.trim()).filter(Boolean),
  );
  let list = [...items];
  if (include?.length) {
    const allow = new Set(include);
    list = list.filter((n) => allow.has(n.id) || allow.has(topLevelId(n.id)));
  }
  list = list.filter((n) => !exclude.has(n.id) && !exclude.has(topLevelId(n.id)));
  return list.map(cloneNavItem);
}

/**
 * Apply include/exclude + projection onto an expanded Nav tree.
 * Unknown projection ids skipped; leftovers append in base order.
 */
export function applyNavProjection(
  baseTree: readonly NavTreeItem[],
  spec: NavExperienceSpec,
): NavTreeItem[] {
  const filtered = filterTopLevel(baseTree, spec);
  const byId = indexNavById(filtered);
  // Also index original base for virtual regroup pulling from filtered set
  const filteredTop = new Map(filtered.map((n) => [n.id, n]));

  const projection = spec.projection ?? [];
  if (!projection.length) {
    return filtered;
  }

  const used = new Set<string>();
  const out: NavTreeItem[] = [];

  const resolveChild = (childId: string): NavTreeItem | null => {
    const node = byId.get(childId) ?? filteredTop.get(childId);
    if (!node || node.hidden) return null;
    used.add(childId);
    return cloneNavItem(node);
  };

  for (const proj of projection) {
    if (proj.hidden) {
      used.add(proj.id);
      continue;
    }
    if (proj.virtual) {
      const kids: NavTreeItem[] = [];
      for (const cid of proj.children ?? []) {
        const child = resolveChild(cid);
        if (child) {
          if (proj.label && child.id === cid && !child.label) {
            /* keep */
          }
          kids.push(
            proj.children
              ? { ...child, label: child.label }
              : child,
          );
        }
      }
      // Apply label overrides from sibling projection entries already handled via resolveChild
      out.push({
        id: proj.id,
        label: proj.label?.trim() || formatFallbackLabel(proj.id),
        path: "",
        kind: "group",
        children: kids.length ? kids : undefined,
      });
      used.add(proj.id);
      continue;
    }

    // Already nested under a virtual/parent group — label via applyLabelOverrides only.
    if (used.has(proj.id)) continue;
    const base = byId.get(proj.id) ?? filteredTop.get(proj.id);
    if (!base) continue;
    used.add(proj.id);
    let item = cloneNavItem(base);
    if (proj.label?.trim()) item = { ...item, label: proj.label.trim() };
    if (proj.children?.length) {
      const kids: NavTreeItem[] = [];
      for (const cid of proj.children) {
        const child = resolveChild(cid);
        if (child) kids.push(child);
      }
      item = { ...item, children: kids.length ? kids : undefined };
    }
    out.push(item);
  }

  for (const item of filtered) {
    if (used.has(item.id)) continue;
    out.push(item);
  }

  // Apply label-only overrides for nodes that appeared as children
  return applyLabelOverrides(out, projection);
}

function applyLabelOverrides(
  items: NavTreeItem[],
  projection: readonly NavProjectionNode[],
): NavTreeItem[] {
  const labels = new Map<string, string>();
  for (const p of projection) {
    if (p.label?.trim() && !p.hidden) labels.set(p.id, p.label.trim());
  }
  if (!labels.size) return items;
  const walk = (nodes: NavTreeItem[]): NavTreeItem[] =>
    nodes.map((n) => {
      const label = labels.get(n.id);
      const children = n.children ? walk(n.children) : undefined;
      return {
        ...n,
        ...(label ? { label } : {}),
        children,
      };
    });
  return walk(items);
}

function formatFallbackLabel(id: string): string {
  const key = id.includes(".") ? id.slice(id.lastIndexOf(".") + 1) : id;
  return key
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Drop studio panel virtual sections when experience excludes them. */
export function filterStudioPanelNavItems(
  items: readonly NavTreeItem[],
  studioPanels?: { include?: string[]; exclude?: string[] },
): NavTreeItem[] {
  if (!studioPanels) return [...items];
  const excludeAll =
    studioPanels.exclude?.includes("*") ||
    studioPanels.exclude?.includes("__studio__");
  if (excludeAll) {
    return items.filter((n) => !n.id.startsWith("__studio__") && !n.path.startsWith("__studio__/"));
  }
  const exclude = new Set(studioPanels.exclude ?? []);
  const include = studioPanels.include?.length
    ? new Set(studioPanels.include)
    : null;
  return items.filter((n) => {
    const isStudio = n.id.startsWith("__studio__") || n.path.startsWith("__studio__/");
    if (!isStudio) return true;
    if (exclude.has(n.id) || exclude.has(n.path)) return false;
    if (include && !include.has(n.id) && !include.has(n.path)) return false;
    return true;
  });
}

/** Deep-merge patch onto user overlay (JSON-friendly). */
export function patchWorkspaceRailOverlay(
  current: WorkspaceRailOverlay | null | undefined,
  patch: WorkspaceRailOverlay,
): WorkspaceRailOverlay {
  const base: WorkspaceRailOverlay = { ...(current ?? {}) };
  if (patch.profileId !== undefined) {
    const id = patch.profileId?.trim() ?? "";
    if (id) base.profileId = id;
    else delete base.profileId;
    // Selecting a profile clears slot overrides so the profile's defaults apply
    // unless this same patch also sets workspaceSlots.
    if (patch.workspaceSlots === undefined) {
      delete base.workspaceSlots;
    }
  }
  if (patch.workspaceSlots !== undefined) {
    const slots = normalizeWorkspaceSlots(patch.workspaceSlots);
    if (slots.length) base.workspaceSlots = slots;
    else delete base.workspaceSlots;
  }
  if (patch.nav !== undefined) {
    base.nav = mergeNavSpec(base.nav, patch.nav);
  }
  if (patch.studioPanels !== undefined) {
    base.studioPanels = mergeStudioPanels(base.studioPanels, patch.studioPanels);
  }
  return base;
}

/** Parse loose JSON into overlay (API body). */
export function parseWorkspaceRailOverlay(raw: unknown): WorkspaceRailOverlay {
  if (raw == null || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const out: WorkspaceRailOverlay = {};
  if (typeof o.profileId === "string") out.profileId = o.profileId;
  if (Array.isArray(o.workspaceSlots)) {
    out.workspaceSlots = normalizeWorkspaceSlots(
      o.workspaceSlots.filter((s): s is string => typeof s === "string"),
    );
  }
  if (o.nav != null && typeof o.nav === "object") {
    out.nav = parseNavExperienceSpec(o.nav);
  }
  if (o.studioPanels != null && typeof o.studioPanels === "object") {
    const sp = o.studioPanels as Record<string, unknown>;
    out.studioPanels = {
      ...(Array.isArray(sp.include)
        ? {
            include: sp.include.filter((s): s is string => typeof s === "string"),
          }
        : {}),
      ...(Array.isArray(sp.exclude)
        ? {
            exclude: sp.exclude.filter((s): s is string => typeof s === "string"),
          }
        : {}),
    };
  }
  return out;
}

export function parseNavExperienceSpec(raw: unknown): NavExperienceSpec {
  if (raw == null || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const spec: NavExperienceSpec = {};
  if (Array.isArray(o.include)) {
    spec.include = o.include.filter((s): s is string => typeof s === "string");
  }
  if (Array.isArray(o.exclude)) {
    spec.exclude = o.exclude.filter((s): s is string => typeof s === "string");
  }
  if (Array.isArray(o.projection)) {
    spec.projection = o.projection
      .filter((n): n is Record<string, unknown> => n != null && typeof n === "object")
      .map((n) => {
        const node: NavProjectionNode = {
          id: String(n.id ?? "").trim(),
        };
        if (!node.id) return null;
        if (typeof n.label === "string") node.label = n.label;
        if (n.hidden === true) node.hidden = true;
        if (n.virtual === true) node.virtual = true;
        if (Array.isArray(n.children)) {
          node.children = n.children.filter(
            (c): c is string => typeof c === "string" && Boolean(c.trim()),
          );
        }
        return node;
      })
      .filter((n): n is NavProjectionNode => n != null);
  }
  return spec;
}

export function parseProjectExperiencesConfig(
  raw: unknown,
): ProjectExperiencesConfig | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const out: ProjectExperiencesConfig = {};
  if (typeof o.default === "string") out.default = o.default;
  if (o.profiles != null && typeof o.profiles === "object") {
    const profiles: Record<string, WorkspaceRailProfile> = {};
    for (const [id, val] of Object.entries(
      o.profiles as Record<string, unknown>,
    )) {
      if (val == null || typeof val !== "object") continue;
      const p = val as Record<string, unknown>;
      profiles[id] = {
        id: typeof p.id === "string" ? p.id : id,
        label: typeof p.label === "string" ? p.label : id,
        ...(Array.isArray(p.workspaceSlots)
          ? {
              workspaceSlots: normalizeWorkspaceSlots(
                p.workspaceSlots.filter(
                  (s): s is string => typeof s === "string",
                ),
              ),
            }
          : {}),
        ...(p.nav != null ? { nav: parseNavExperienceSpec(p.nav) } : {}),
        ...(p.studioPanels != null && typeof p.studioPanels === "object"
          ? {
              studioPanels: parseWorkspaceRailOverlay({
                studioPanels: p.studioPanels,
              }).studioPanels,
            }
          : {}),
      };
    }
    out.profiles = profiles;
  }
  return out;
}
