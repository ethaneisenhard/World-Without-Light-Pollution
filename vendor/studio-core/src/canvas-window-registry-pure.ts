/**
 * Single declarative registry for Studio DeskPane / canvas windows.
 * View menu, URL flags, staging factories, and colors derive from this.
 */

export type CanvasWindowVisibility =
  | { mode: "always" }
  | { mode: "kinds"; kinds: readonly string[] }
  | { mode: "experiences"; experiences: readonly string[] };

export type CanvasWindowVisibilityContext = {
  kind?: string | null;
  experiences?: readonly string[];
  /**
   * Global Studio shell — no workspace project selected.
   * When true, defs may swap copy via `globalShell` (not a host one-off).
   */
  globalShell?: boolean;
};

export type CanvasViewMenuGroupId = "studio" | "canvas" | "runtime" | "panels";

/** Optional Global Studio face — any window can declare one. */
export type CanvasWindowShellFace = {
  label?: string;
  title?: string;
  hint?: string;
};

export type CanvasWindowDef = {
  id: string;
  /** DeskPane / tab title. */
  title: string;
  /** Short label (menus, tabs). */
  label: string;
  /** View menu hint; ignored when viewGroup is null. */
  hint: string;
  /**
   * Copy when `ctx.globalShell` — e.g. workspace → "Workspaces".
   * Omit to keep title/label/hint in every shell.
   */
  globalShell?: CanvasWindowShellFace;
  /** null = canvas kind exists but omitted from View menu (e.g. messages). */
  viewGroup: CanvasViewMenuGroupId | null;
  /** Order within viewGroup (and stable registry order). */
  order: number;
  /** URL search-param flag (usually same as id). */
  urlFlag: string;
  windowId: string;
  /** Heroicons kebab name. */
  icon: string;
  /** Accent class on `.dp-window`. */
  accentClass: string;
  visibility: CanvasWindowVisibility;
};

/** Label / title / hint for a window under the current shell context. */
export function resolveCanvasWindowPresentation(
  def: Pick<CanvasWindowDef, "label" | "title" | "hint" | "globalShell">,
  ctx: CanvasWindowVisibilityContext = {},
): { label: string; title: string; hint: string } {
  if (ctx.globalShell && def.globalShell) {
    return {
      label: def.globalShell.label ?? def.label,
      title: def.globalShell.title ?? def.globalShell.label ?? def.title,
      hint: def.globalShell.hint ?? def.hint,
    };
  }
  return { label: def.label, title: def.title, hint: def.hint };
}

/** View menu group band order. */
export const CANVAS_VIEW_MENU_GROUP_ORDER: readonly CanvasViewMenuGroupId[] = [
  "studio",
  "canvas",
  "runtime",
  "panels",
] as const;

/**
 * Builtin canvas windows — add new kinds here (then factory + tests).
 * Wave 1: visibility always; Wave 2 filters by kind/experiences.
 */
export const CANVAS_WINDOW_REGISTRY = [
  {
    id: "home",
    title: "Home",
    label: "Home",
    hint: "Studio overview",
    viewGroup: "studio",
    order: 10,
    urlFlag: "home",
    windowId: "studio-home",
    icon: "home",
    accentClass: "studio-win--home",
    visibility: { mode: "always" },
  },
  {
    id: "workspace",
    title: "Workspace Home",
    label: "Workspace Home",
    hint: "Selected workspace overview",
    globalShell: {
      label: "Workspaces",
      title: "Workspaces",
      hint: "All linked workspaces",
    },
    viewGroup: "studio",
    order: 20,
    urlFlag: "workspace",
    windowId: "studio-workspace",
    icon: "home",
    accentClass: "studio-win--workspace",
    visibility: { mode: "always" },
  },
  {
    id: "settings",
    title: "Settings",
    label: "Settings",
    hint: "Conductor config",
    viewGroup: "studio",
    order: 30,
    urlFlag: "settings",
    windowId: "studio-settings",
    icon: "cog-6-tooth",
    accentClass: "studio-win--settings",
    visibility: { mode: "always" },
  },
  {
    id: "code",
    title: "Code",
    label: "Code",
    hint: "Code window",
    viewGroup: "canvas",
    order: 10,
    urlFlag: "code",
    windowId: "studio-code",
    icon: "code-bracket",
    accentClass: "studio-win--code",
    visibility: { mode: "kinds", kinds: ["app"] },
  },
  {
    id: "live",
    title: "Website Preview",
    label: "Website Preview",
    hint: "Running website in Studio",
    viewGroup: "canvas",
    order: 20,
    urlFlag: "live",
    windowId: "studio-live",
    icon: "globe-alt",
    accentClass: "studio-win--live",
    visibility: { mode: "kinds", kinds: ["app"] },
  },
  {
    id: "design",
    title: "Design",
    label: "Design",
    hint: "Design canvas",
    viewGroup: "canvas",
    order: 30,
    urlFlag: "design",
    windowId: "studio-design",
    icon: "swatch",
    accentClass: "studio-win--design",
    visibility: { mode: "kinds", kinds: ["app"] },
  },
  {
    id: "runtimes",
    title: "Servers",
    label: "Servers",
    hint: "Cloud/local health, Studio services (n8n / Voice), and project Dev servers",
    viewGroup: "runtime",
    order: 10,
    urlFlag: "runtimes",
    windowId: "studio-runtimes",
    icon: "server",
    accentClass: "studio-win--runtimes",
    visibility: { mode: "kinds", kinds: ["app"] },
  },
  {
    id: "ops",
    title: "Orchestrator",
    label: "Orchestrator",
    hint: "Voice + agent job board",
    viewGroup: "runtime",
    order: 15,
    urlFlag: "ops",
    windowId: "studio-ops",
    icon: "clipboard-document-list",
    accentClass: "studio-win--ops",
    visibility: { mode: "always" },
  },
  {
    id: "terminal",
    title: "Terminal",
    label: "Terminal",
    hint: "Process logs",
    viewGroup: "runtime",
    order: 20,
    urlFlag: "terminal",
    windowId: "studio-terminal",
    icon: "command-line",
    accentClass: "studio-win--terminal",
    visibility: { mode: "kinds", kinds: ["app"] },
  },
  {
    id: "chat",
    title: "Chat",
    label: "Chat",
    hint: "Harness chat",
    viewGroup: "runtime",
    order: 30,
    urlFlag: "chat",
    windowId: "studio-chat",
    icon: "chat-bubble-left-right",
    accentClass: "studio-win--chat",
    visibility: { mode: "always" },
  },
  {
    id: "calendar",
    title: "Calendar",
    label: "Calendar",
    hint: "Ledger events",
    viewGroup: "panels",
    order: 10,
    urlFlag: "calendar",
    windowId: "studio-calendar",
    icon: "calendar",
    accentClass: "studio-win--calendar",
    visibility: { mode: "always" },
  },
  {
    id: "media",
    title: "Media",
    label: "Media",
    hint: "Media library",
    viewGroup: "panels",
    order: 20,
    urlFlag: "media",
    windowId: "studio-media",
    icon: "photo",
    accentClass: "studio-win--media",
    visibility: { mode: "always" },
  },
  {
    id: "converter",
    title: "File Converter",
    label: "File Converter",
    hint: "Host FFmpeg convert",
    viewGroup: "panels",
    order: 30,
    urlFlag: "converter",
    windowId: "studio-converter",
    icon: "arrows-right-left",
    accentClass: "studio-win--converter",
    visibility: { mode: "kinds", kinds: ["app"] },
  },
  {
    id: "browser",
    title: "Browser",
    label: "Browser",
    hint: "Host Chromium — agent + human controllable",
    viewGroup: "canvas",
    order: 25,
    urlFlag: "browser",
    windowId: "studio-browser",
    icon: "computer-desktop",
    accentClass: "studio-win--browser",
    visibility: { mode: "kinds", kinds: ["app"] },
  },
  {
    id: "data",
    title: "Data",
    label: "Data",
    hint: "Destinations + SQLite",
    viewGroup: "panels",
    order: 40,
    urlFlag: "data",
    windowId: "studio-data",
    icon: "circle-stack",
    accentClass: "studio-win--data",
    visibility: { mode: "kinds", kinds: ["app"] },
  },
  {
    id: "sheets",
    title: "Sheets",
    label: "Sheets",
    hint: "Workbook / formulas",
    viewGroup: "panels",
    order: 45,
    urlFlag: "sheets",
    windowId: "studio-sheets",
    icon: "table-cells",
    accentClass: "studio-win--sheets",
    visibility: { mode: "kinds", kinds: ["app"] },
  },
  {
    id: "forms",
    title: "Forms",
    label: "Forms",
    hint: "Form inbox",
    viewGroup: "panels",
    order: 50,
    urlFlag: "forms",
    windowId: "studio-forms",
    icon: "inbox",
    accentClass: "studio-win--forms",
    visibility: { mode: "kinds", kinds: ["app"] },
  },
  {
    id: "integrations",
    title: "Integrations",
    label: "Integrations",
    hint: "Integration catalog",
    viewGroup: "panels",
    order: 60,
    urlFlag: "integrations",
    windowId: "studio-integrations",
    icon: "puzzle-piece",
    accentClass: "studio-win--integrations",
    visibility: { mode: "kinds", kinds: ["app"] },
  },
  {
    id: "workflows",
    title: "Workflows",
    label: "Workflows",
    hint: "n8n triggers",
    viewGroup: "panels",
    order: 70,
    urlFlag: "workflows",
    windowId: "studio-workflows",
    icon: "arrow-path",
    accentClass: "studio-win--workflows",
    visibility: { mode: "kinds", kinds: ["app"] },
  },
  {
    id: "email",
    title: "Email",
    label: "Email",
    hint: "Campaigns + deliverability",
    viewGroup: "panels",
    order: 80,
    urlFlag: "email",
    windowId: "studio-email",
    icon: "envelope",
    accentClass: "studio-win--email",
    visibility: { mode: "kinds", kinds: ["app"] },
  },
  {
    id: "messages",
    title: "Messages",
    label: "Messages",
    hint: "Inbox",
    viewGroup: null,
    order: 85,
    urlFlag: "messages",
    windowId: "studio-messages",
    icon: "inbox-stack",
    accentClass: "studio-win--messages",
    visibility: { mode: "kinds", kinds: ["app"] },
  },
  {
    id: "notifications",
    title: "Notifications",
    label: "Notifications",
    hint: "Unified feed + prefs",
    viewGroup: "studio",
    order: 12,
    urlFlag: "notifications",
    windowId: "studio-notifications",
    icon: "bell",
    accentClass: "studio-win--notifications",
    visibility: { mode: "always" },
  },
  {
    id: "analytics",
    title: "Analytics",
    label: "Analytics",
    hint: "First-party CDP",
    viewGroup: "panels",
    order: 90,
    urlFlag: "analytics",
    windowId: "studio-analytics",
    icon: "chart-bar",
    accentClass: "studio-win--analytics",
    visibility: { mode: "kinds", kinds: ["app"] },
  },
  {
    id: "memory",
    title: "Memory",
    label: "Memory",
    hint: "Agent beliefs + learn inbox",
    viewGroup: "panels",
    order: 100,
    urlFlag: "memory",
    windowId: "studio-memory",
    icon: "circle-stack",
    accentClass: "studio-win--memory",
    visibility: { mode: "always" },
  },
  {
    id: "roadmap",
    title: "Roadmap",
    label: "Roadmap",
    hint: "Studio + project kanban",
    viewGroup: "panels",
    order: 110,
    urlFlag: "roadmap",
    windowId: "studio-roadmap",
    icon: "queue-list",
    accentClass: "studio-win--roadmap",
    visibility: { mode: "always" },
  },
  {
    id: "notes",
    title: "Notes",
    label: "Notes",
    hint: "Scoped global vault (Studio + per-project select)",
    viewGroup: "panels",
    order: 120,
    urlFlag: "notes",
    windowId: "studio-notes",
    icon: "document-text",
    accentClass: "studio-win--notes",
    visibility: { mode: "always" },
  },
] as const satisfies readonly CanvasWindowDef[];

export type StudioCanvasWindowId = (typeof CANVAS_WINDOW_REGISTRY)[number]["id"];

export type WindowKindDef = {
  id: StudioCanvasWindowId;
  windowId: string;
  title: string;
  label: string;
  accentClass: string;
  icon: string;
};

export function canvasWindowById(
  id: string,
): CanvasWindowDef | undefined {
  return CANVAS_WINDOW_REGISTRY.find((d) => d.id === id);
}

export function canvasWindowIds(): readonly StudioCanvasWindowId[] {
  return CANVAS_WINDOW_REGISTRY.map((d) => d.id as StudioCanvasWindowId);
}

export function canvasUrlFlagKeys(): readonly string[] {
  return CANVAS_WINDOW_REGISTRY.map((d) => d.urlFlag);
}

function normalizeCanvasKind(kind?: string | null): string {
  const value = kind?.trim();
  return value ? value : "app";
}

export function isCanvasWindowVisible(
  def: CanvasWindowDef,
  ctx: CanvasWindowVisibilityContext = {},
): boolean {
  if (def.visibility.mode === "always") return true;
  if (def.visibility.mode === "kinds") {
    const kind = normalizeCanvasKind(ctx.kind);
    return def.visibility.kinds.includes(kind);
  }
  if (!ctx.experiences?.length) return false;
  const experiences = new Set(
    ctx.experiences.map((value) => value.trim()).filter(Boolean),
  );
  return def.visibility.experiences.some((experience) => experiences.has(experience));
}

export function visibleCanvasWindows(
  registry: readonly CanvasWindowDef[] = CANVAS_WINDOW_REGISTRY,
  ctx: CanvasWindowVisibilityContext = {},
): readonly CanvasWindowDef[] {
  return registry.filter((def) => isCanvasWindowVisible(def, ctx));
}

/** MCP / agent row for `studio.windows.list`. */
export type CanvasWindowListRow = {
  id: string;
  title: string;
  label: string;
  hint: string;
  viewGroup: CanvasViewMenuGroupId | null;
  urlFlag: string;
  windowId: string;
  icon: string;
  inViewMenu: boolean;
};

/**
 * List canvas windows for agents — optional visibility filter by project kind.
 * Prefer this before `studio.nav` when unsure which `kind` to open.
 */
export function listCanvasWindows(input?: {
  registry?: readonly CanvasWindowDef[];
  /** Workspace `project.json` kind — omit / empty = app (full set). */
  projectKind?: string | null;
  experiences?: readonly string[];
  /** When true (default), apply visibility filter. */
  visibleOnly?: boolean;
}): readonly CanvasWindowListRow[] {
  const registry = input?.registry ?? getActiveCanvasWindowRegistry();
  const visibleOnly = input?.visibleOnly !== false;
  const ctx: CanvasWindowVisibilityContext = {
    kind: input?.projectKind,
    experiences: input?.experiences,
  };
  const defs = visibleOnly ? visibleCanvasWindows(registry, ctx) : registry;
  return defs.map((d) => {
    const face = resolveCanvasWindowPresentation(d, ctx);
    return {
      id: d.id,
      title: face.title,
      label: face.label,
      hint: face.hint,
      viewGroup: d.viewGroup,
      urlFlag: d.urlFlag,
      windowId: d.windowId,
      icon: d.icon,
      inViewMenu: d.viewGroup != null,
    };
  });
}

/** Record shape used by DeskPane chrome (`STUDIO_WINDOW_KINDS`). */
export function studioWindowKindsRecord(): Record<
  StudioCanvasWindowId,
  WindowKindDef
> {
  const out = {} as Record<StudioCanvasWindowId, WindowKindDef>;
  for (const d of CANVAS_WINDOW_REGISTRY) {
    const id = d.id as StudioCanvasWindowId;
    out[id] = {
      id,
      windowId: d.windowId,
      title: d.title,
      label: d.label,
      accentClass: d.accentClass,
      icon: d.icon,
    };
  }
  return out;
}

export type DerivedViewMenuItemDef = {
  id: string;
  label: string;
  hint: string;
};

export type DerivedViewMenuGroup = {
  id: CanvasViewMenuGroupId;
  items: readonly DerivedViewMenuItemDef[];
};

/** View menu groups — only defs with a non-null viewGroup. */
export function deriveViewMenuGroups(
  registry: readonly CanvasWindowDef[] = CANVAS_WINDOW_REGISTRY,
  ctx: CanvasWindowVisibilityContext = {},
): readonly DerivedViewMenuGroup[] {
  return CANVAS_VIEW_MENU_GROUP_ORDER.map((groupId) => {
    const items = registry
      .filter((d) => d.viewGroup === groupId)
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((d) => {
        const face = resolveCanvasWindowPresentation(d, ctx);
        return {
          id: d.id as StudioCanvasWindowId,
          label: face.label,
          hint: face.hint,
        };
      });
    return { id: groupId, items };
  }).filter((g) => g.items.length > 0);
}

export function visibleViewMenuGroups(
  ctx: CanvasWindowVisibilityContext = {},
  registry: readonly CanvasWindowDef[] = getActiveCanvasWindowRegistry(),
): readonly DerivedViewMenuGroup[] {
  return deriveViewMenuGroups(visibleCanvasWindows(registry, ctx), ctx);
}

export function kindFromCanvasWindowId(
  windowId: string,
): StudioCanvasWindowId | null {
  if (windowId === "studio-sandbox") return "design";
  for (const d of CANVAS_WINDOW_REGISTRY) {
    if (d.windowId === windowId) return d.id as StudioCanvasWindowId;
  }
  return null;
}

export function assertCanvasWindowRegistryInvariants(
  registry: readonly CanvasWindowDef[] = CANVAS_WINDOW_REGISTRY,
): void {
  const ids = new Set<string>();
  const flags = new Set<string>();
  const windowIds = new Set<string>();
  for (const d of registry) {
    if (ids.has(d.id)) throw new Error(`duplicate canvas window id: ${d.id}`);
    ids.add(d.id);
    if (flags.has(d.urlFlag)) {
      throw new Error(`duplicate urlFlag: ${d.urlFlag}`);
    }
    flags.add(d.urlFlag);
    if (windowIds.has(d.windowId)) {
      throw new Error(`duplicate windowId: ${d.windowId}`);
    }
    windowIds.add(d.windowId);
  }
}

export type MergeCanvasWindowRegistryResult = {
  registry: CanvasWindowDef[];
  /** Contrib rows skipped (default: builtin id wins). */
  skipped: readonly { id: string; reason: string }[];
};

export type MergeCanvasWindowRegistryOptions = {
  /**
   * When true, contrib replaces a builtin with the same id.
   * Default false — plugin loses on collision.
   */
  allowOverride?: boolean;
};

/**
 * Merge plugin `canvas.windows[]` into builtins.
 * Collision policy (default): skip contrib; builtin keeps the id.
 */
export function mergeCanvasWindowRegistry(
  builtins: readonly CanvasWindowDef[],
  contrib: readonly CanvasWindowDef[],
  opts: MergeCanvasWindowRegistryOptions = {},
): MergeCanvasWindowRegistryResult {
  const allowOverride = opts.allowOverride === true;
  const byId = new Map<string, CanvasWindowDef>();
  for (const def of builtins) {
    byId.set(def.id, { ...def });
  }
  const skipped: { id: string; reason: string }[] = [];
  for (const raw of contrib) {
    const def: CanvasWindowDef = {
      ...raw,
      visibility: raw.visibility ?? { mode: "always" },
    };
    if (byId.has(def.id) && !allowOverride) {
      skipped.push({
        id: def.id,
        reason: "id conflicts with builtin (allowOverride=false)",
      });
      continue;
    }
    byId.set(def.id, def);
  }
  const registry = [...byId.values()];
  assertCanvasWindowRegistryInvariants(registry);
  return { registry, skipped };
}

/** Runtime registry (builtins ∪ plugin contrib). Starts as builtins. */
let activeCanvasWindowRegistry: readonly CanvasWindowDef[] =
  CANVAS_WINDOW_REGISTRY;

export function getActiveCanvasWindowRegistry(): readonly CanvasWindowDef[] {
  return activeCanvasWindowRegistry;
}

export function setActiveCanvasWindowRegistry(
  registry: readonly CanvasWindowDef[],
): void {
  assertCanvasWindowRegistryInvariants(registry);
  activeCanvasWindowRegistry = registry;
}

export function resetActiveCanvasWindowRegistry(): void {
  activeCanvasWindowRegistry = CANVAS_WINDOW_REGISTRY;
}

/**
 * Apply plugin contrib at shell boot (empty array = builtins only).
 * Returns skipped collisions for diagnostics.
 */
export function applyCanvasWindowPluginContrib(
  contrib: readonly CanvasWindowDef[],
  opts?: MergeCanvasWindowRegistryOptions,
): MergeCanvasWindowRegistryResult {
  const merged = mergeCanvasWindowRegistry(
    CANVAS_WINDOW_REGISTRY,
    contrib,
    opts,
  );
  setActiveCanvasWindowRegistry(merged.registry);
  return merged;
}
