/**
 * Studio startup preference — first paint open set (destination + windows + split).
 * Pure: no I/O. Persisted on StudioConfig.startup.
 *
 * Desktop and compact/PWA surfaces are separate — phone must not inherit
 * desktop home-only (that flash: chat → home on load).
 */

import type { ViewMenuItemId } from "./view-menu-pure.js";
import { viewMenuItemIds } from "./view-menu-pure.js";

export type StartupDestination =
  | "agent-home"
  | "last-project"
  | "specific-project"
  | "blank";

export type StartupLeftTab = "none" | "nav" | "files" | "ai";

export type StartupLayoutMode = "single" | "split";

export type StartupSurface = "desktop" | "mobile";

/** Open-set for one chrome surface (desktop wide vs compact/PWA). */
export type StartupSurfacePreference = {
  windows: Partial<Record<ViewMenuItemId, boolean>>;
  focusKind: ViewMenuItemId | null;
  layoutMode: StartupLayoutMode;
  /** 2–4 kinds when layoutMode === "split" (desktop only). */
  splitPanes: ViewMenuItemId[];
  leftTab: StartupLeftTab;
};

export type StartupPreference = {
  destination: StartupDestination;
  /** Used when destination === "specific-project". */
  projectId: string;
  /**
   * Desktop / wide shell open set.
   * Flat fields below mirror `desktop` for legacy config JSON + Settings UI.
   */
  desktop: StartupSurfacePreference;
  /** Compact / PWA — Home+Chat focused on Chat by default. */
  mobile: StartupSurfacePreference;
  /** @deprecated Prefer `desktop.*` — kept in sync for legacy readers. */
  windows: Partial<Record<ViewMenuItemId, boolean>>;
  focusKind: ViewMenuItemId | null;
  layoutMode: StartupLayoutMode;
  splitPanes: ViewMenuItemId[];
  leftTab: StartupLeftTab;
};

/** Canvas / home URL flags that count as an explicit boot intent. */
export const STARTUP_CANVAS_PARAM_KEYS = [
  "home",
  "workspace",
  "settings",
  "code",
  "live",
  "design",
  "runtimes",
  "terminal",
  "chat",
  "calendar",
  "media",
  "data",
  "forms",
  "integrations",
  "workflows",
  "email",
  "messages",
  "analytics",
  "memory",
  "roadmap",
  "notes",
] as const;

/** True when the URL already lists an open canvas pane (`home=1`, `messages=1`, …). */
export function hasExplicitCanvasOpenFlags(params: URLSearchParams): boolean {
  for (const key of STARTUP_CANVAS_PARAM_KEYS) {
    const v = params.get(key);
    if (v !== null && v !== "" && v !== "0") return true;
  }
  return false;
}

/**
 * Focus hint when URL owns the open set (startup skipped).
 * Prefer the last non-home open flag so `?messages=1&home=1` focuses Messages.
 */
export function preferredFocusKindFromParams(
  params: URLSearchParams,
): ViewMenuItemId | null {
  const open: ViewMenuItemId[] = [];
  for (const key of STARTUP_CANVAS_PARAM_KEYS) {
    const v = params.get(key);
    if (v !== null && v !== "" && v !== "0") {
      open.push(key as ViewMenuItemId);
    }
  }
  if (open.length === 0) return null;
  const nonHome = open.filter((k) => k !== "home");
  return nonHome[nonHome.length - 1] ?? open[0] ?? null;
}

/** Desktop default: Agent Home only (Chat lives in the left rail). */
export function defaultDesktopStartupSurface(): StartupSurfacePreference {
  return {
    windows: { home: true },
    focusKind: "home",
    layoutMode: "single",
    splitPanes: [],
    leftTab: "none",
  };
}

/**
 * Compact / PWA default: Home + Chat tabs open, Chat in view.
 * Matches `compactShellEnterIntent` — no flash to home-only.
 */
export function defaultMobileStartupSurface(): StartupSurfacePreference {
  return {
    windows: { home: true, chat: true },
    focusKind: "chat",
    layoutMode: "single",
    splitPanes: [],
    leftTab: "ai",
  };
}

function withLegacyFlat(
  destination: StartupDestination,
  projectId: string,
  desktop: StartupSurfacePreference,
  mobile: StartupSurfacePreference,
): StartupPreference {
  return {
    destination,
    projectId,
    desktop,
    mobile,
    windows: desktop.windows,
    focusKind: desktop.focusKind,
    layoutMode: desktop.layoutMode,
    splitPanes: desktop.splitPanes,
    leftTab: desktop.leftTab,
  };
}

/**
 * Default: desktop = Agent Home; mobile = Home+Chat focused on Chat.
 */
export function defaultStartupPreference(): StartupPreference {
  return withLegacyFlat(
    "agent-home",
    "",
    defaultDesktopStartupSurface(),
    defaultMobileStartupSurface(),
  );
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function parseDestination(raw: unknown): StartupDestination {
  if (
    raw === "agent-home" ||
    raw === "last-project" ||
    raw === "specific-project" ||
    raw === "blank"
  ) {
    return raw;
  }
  return "agent-home";
}

function parseLeftTab(raw: unknown): StartupLeftTab {
  if (raw === "nav" || raw === "files" || raw === "ai" || raw === "none") {
    return raw;
  }
  return "none";
}

function parseLayoutMode(raw: unknown): StartupLayoutMode {
  return raw === "split" ? "split" : "single";
}

function parseViewKind(raw: unknown): ViewMenuItemId | null {
  if (typeof raw !== "string") return null;
  const id = raw.trim() as ViewMenuItemId;
  return viewMenuItemIds().includes(id) ? id : null;
}

function parseWindows(
  raw: unknown,
  fallback: Partial<Record<ViewMenuItemId, boolean>>,
): Partial<Record<ViewMenuItemId, boolean>> {
  if (!isRecord(raw)) return { ...fallback };
  const out: Partial<Record<ViewMenuItemId, boolean>> = {};
  for (const id of viewMenuItemIds()) {
    if (typeof raw[id] === "boolean") out[id] = raw[id] as boolean;
  }
  return Object.keys(out).length ? out : { ...fallback };
}

function parseSplitPanes(
  raw: unknown,
  fallback: ViewMenuItemId[],
): ViewMenuItemId[] {
  if (!Array.isArray(raw)) return [...fallback];
  const ids = raw
    .map(parseViewKind)
    .filter((k): k is ViewMenuItemId => k !== null);
  return ids.length >= 2 ? ids.slice(0, 4) : [...fallback];
}

function parseFocusKind(
  raw: unknown,
  undefinedMeans: ViewMenuItemId | null,
): ViewMenuItemId | null {
  if (raw === undefined) return undefinedMeans;
  if (raw === null || raw === "") return null;
  return parseViewKind(raw);
}

function parseSurface(
  raw: unknown,
  fallback: StartupSurfacePreference,
): StartupSurfacePreference {
  if (!isRecord(raw)) return { ...fallback, windows: { ...fallback.windows } };
  return {
    windows: parseWindows(raw.windows, fallback.windows),
    focusKind: parseFocusKind(raw.focusKind, fallback.focusKind),
    layoutMode: parseLayoutMode(raw.layoutMode ?? fallback.layoutMode),
    splitPanes: parseSplitPanes(raw.splitPanes, fallback.splitPanes),
    leftTab: parseLeftTab(
      raw.leftTab !== undefined ? raw.leftTab : fallback.leftTab,
    ),
  };
}

export function parseStartupPreference(raw: unknown): StartupPreference {
  const base = defaultStartupPreference();
  if (!isRecord(raw)) return base;

  const destination = parseDestination(raw.destination);
  const projectId =
    typeof raw.projectId === "string" ? raw.projectId.trim() : base.projectId;

  // Legacy flat JSON (pre mobile/desktop split) → desktop surface.
  const hasNestedDesktop = isRecord(raw.desktop);
  const hasNestedMobile = isRecord(raw.mobile);
  const hasLegacyFlat =
    raw.windows !== undefined ||
    raw.focusKind !== undefined ||
    raw.layoutMode !== undefined ||
    raw.leftTab !== undefined;

  let desktop: StartupSurfacePreference;
  if (hasNestedDesktop) {
    desktop = parseSurface(raw.desktop, base.desktop);
  } else if (hasLegacyFlat) {
    desktop = {
      windows: parseWindows(raw.windows, base.desktop.windows),
      focusKind: parseFocusKind(raw.focusKind, base.desktop.focusKind),
      layoutMode: parseLayoutMode(raw.layoutMode),
      splitPanes: parseSplitPanes(raw.splitPanes, base.desktop.splitPanes),
      leftTab: parseLeftTab(
        raw.leftTab !== undefined ? raw.leftTab : base.desktop.leftTab,
      ),
    };
  } else {
    desktop = { ...base.desktop, windows: { ...base.desktop.windows } };
  }

  const mobile = hasNestedMobile
    ? parseSurface(raw.mobile, base.mobile)
    : { ...base.mobile, windows: { ...base.mobile.windows } };

  return withLegacyFlat(destination, projectId, desktop, mobile);
}

/** Pick the open-set for the chrome surface (compact vs wide). */
export function startupSurfaceFor(
  preference: StartupPreference,
  surface: StartupSurface,
): StartupSurfacePreference {
  // Live/API configs may still be flat (pre-split) — never read .windows off undefined.
  const normalized = parseStartupPreference(preference);
  const s = surface === "mobile" ? normalized.mobile : normalized.desktop;
  // Compact never splits — DeskPane is single full-bleed.
  if (surface === "mobile") {
    return {
      ...s,
      windows: { ...s.windows },
      layoutMode: "single",
      splitPanes: [],
    };
  }
  return { ...s, windows: { ...s.windows } };
}

/**
 * True when Startup settings should own the open set.
 * Only bare index (no `project`, no open canvas flags) — shareable
 * `?messages=1&home=1` must keep those windows; Settings → Startup is the
 * default for plain `/` only.
 */
export function shouldApplyStartupPreference(
  params: URLSearchParams,
): boolean {
  if (params.get("project")?.trim()) return false;
  if (hasExplicitCanvasOpenFlags(params)) return false;
  return true;
}

export function resolveStartupProjectId(input: {
  preference: StartupPreference;
  projectIds: readonly string[];
  lastProjectId: string;
}): string {
  const ids = input.projectIds;
  const pref = input.preference;
  if (pref.destination === "agent-home" || pref.destination === "blank") {
    return "";
  }
  if (pref.destination === "specific-project") {
    const want = pref.projectId.trim();
    return want && ids.includes(want) ? want : "";
  }
  // last-project
  const last = input.lastProjectId.trim();
  return last && ids.includes(last) ? last : "";
}

export type StartupBootApply = {
  kind: "apply";
  /** Mutated copy of search params ready to navigate. */
  params: URLSearchParams;
  focusKind: ViewMenuItemId | null;
  layoutMode: StartupLayoutMode;
  splitPanes: ViewMenuItemId[];
  splitRatio: number;
  surface: StartupSurface;
};

export type StartupBootResult =
  | { kind: "skip" }
  | StartupBootApply;

/**
 * Project startup preference onto URL params (active flags only — omit closed).
 * Pass `surface: "mobile"` on compact/PWA so Home+Chat/Chat-focus wins.
 */
export function resolveStartupBoot(input: {
  params: URLSearchParams;
  preference: StartupPreference;
  projectIds: readonly string[];
  lastProjectId: string;
  /** Default desktop — callers must pass mobile when shell is compact. */
  surface?: StartupSurface;
}): StartupBootResult {
  if (!shouldApplyStartupPreference(input.params)) {
    return { kind: "skip" };
  }

  const surface = input.surface ?? "desktop";
  const pref = input.preference;
  const open = startupSurfaceFor(pref, surface);
  const next = new URLSearchParams(input.params.toString());
  const projectId = resolveStartupProjectId({
    preference: pref,
    projectIds: input.projectIds,
    lastProjectId: input.lastProjectId,
  });

  if (projectId) next.set("project", projectId);
  else next.delete("project");

  for (const key of STARTUP_CANVAS_PARAM_KEYS) {
    const on = open.windows[key as ViewMenuItemId] === true;
    if (on) next.set(key, "1");
    else next.delete(key);
  }

  if (open.leftTab === "none") next.delete("tab");
  else next.set("tab", open.leftTab);

  const openKinds = viewMenuItemIds().filter(
    (id) => open.windows[id] === true,
  );
  let focusKind = open.focusKind;
  if (focusKind && open.windows[focusKind] !== true) {
    focusKind = openKinds[0] ?? null;
  }

  let splitPanes = open.splitPanes.filter((k) => open.windows[k] === true);
  if (open.layoutMode === "split" && splitPanes.length < 2) {
    splitPanes = openKinds.slice(0, 2);
  }

  const layoutMode =
    surface === "mobile"
      ? "single"
      : open.layoutMode === "split" && splitPanes.length >= 2
        ? "split"
        : "single";

  if (focusKind) next.set("focus", focusKind);
  else next.delete("focus");

  return {
    kind: "apply",
    params: next,
    focusKind,
    layoutMode,
    splitPanes: layoutMode === "split" ? splitPanes : [],
    splitRatio: 0.5,
    surface,
  };
}

/** Merge a desktop or mobile surface patch into a full preference. */
export function patchStartupSurface(
  current: StartupPreference,
  surface: StartupSurface,
  patch: Partial<StartupSurfacePreference>,
): StartupPreference {
  const cur = parseStartupPreference(current);
  const base = surface === "mobile" ? cur.mobile : cur.desktop;
  const nextSurface: StartupSurfacePreference = {
    windows:
      patch.windows !== undefined
        ? { ...base.windows, ...patch.windows }
        : { ...base.windows },
    focusKind:
      patch.focusKind !== undefined ? patch.focusKind : base.focusKind,
    layoutMode:
      patch.layoutMode !== undefined ? patch.layoutMode : base.layoutMode,
    splitPanes:
      patch.splitPanes !== undefined
        ? [...patch.splitPanes]
        : [...base.splitPanes],
    leftTab: patch.leftTab !== undefined ? patch.leftTab : base.leftTab,
  };
  if (surface === "mobile") {
    return withLegacyFlat(cur.destination, cur.projectId, cur.desktop, {
      ...nextSurface,
      layoutMode: "single",
      splitPanes: [],
    });
  }
  return withLegacyFlat(
    cur.destination,
    cur.projectId,
    nextSurface,
    cur.mobile,
  );
}
