/**
 * Notifications prefs — studio defaults + per-workspace overrides.
 * Workspace id = DeskPane id (projectId or `_studio_home`).
 */

export const STUDIO_HOME_NOTIFICATION_WORKSPACE_ID = "_studio_home";

export const NOTIFICATION_SOURCES = [
  "messages",
  "forms",
  "calendar",
  "workflows",
  "chat",
  "memory",
  "skills",
  "projects",
  "build",
] as const;

export type NotificationSourceId = (typeof NOTIFICATION_SOURCES)[number];

export type NotificationSourceDefaults = Record<NotificationSourceId, boolean>;

/** README default-on matrix. */
export const DEFAULT_NOTIFICATION_SOURCE_ON: NotificationSourceDefaults = {
  messages: true,
  forms: true,
  calendar: false,
  workflows: true,
  /** Chat job / turn finished — alert so operators can notify users. */
  chat: true,
  memory: true,
  skills: true,
  projects: true,
  build: true,
};

export type NotificationWorkspacePrefs = {
  sources?: Partial<Record<NotificationSourceId, boolean>>;
  toast?: boolean;
};

export type StudioNotificationsConfig = {
  defaults: {
    sources: Partial<Record<NotificationSourceId, boolean>>;
    toast: boolean;
  };
  byWorkspace: Record<string, NotificationWorkspacePrefs>;
};

export type EffectiveNotificationPrefs = {
  sources: NotificationSourceDefaults;
  toast: boolean;
};

export function isNotificationSourceId(
  raw: unknown,
): raw is NotificationSourceId {
  return (
    typeof raw === "string" &&
    (NOTIFICATION_SOURCES as readonly string[]).includes(raw)
  );
}

export function defaultStudioNotificationsConfig(): StudioNotificationsConfig {
  return {
    defaults: {
      sources: {},
      toast: true,
    },
    byWorkspace: {},
  };
}

function parseSourcesPartial(
  raw: unknown,
): Partial<Record<NotificationSourceId, boolean>> {
  const out: Partial<Record<NotificationSourceId, boolean>> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  const rec = raw as Record<string, unknown>;
  for (const id of NOTIFICATION_SOURCES) {
    if (typeof rec[id] === "boolean") out[id] = rec[id];
  }
  return out;
}

export function parseStudioNotificationsConfig(
  raw: unknown,
): StudioNotificationsConfig {
  const base = defaultStudioNotificationsConfig();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const rec = raw as Record<string, unknown>;

  if (rec.defaults && typeof rec.defaults === "object" && !Array.isArray(rec.defaults)) {
    const d = rec.defaults as Record<string, unknown>;
    base.defaults.sources = parseSourcesPartial(d.sources);
    if (typeof d.toast === "boolean") base.defaults.toast = d.toast;
  } else if (rec.sources !== undefined || typeof rec.toast === "boolean") {
    // Legacy flat shape from early PRD draft
    base.defaults.sources = parseSourcesPartial(rec.sources);
    if (typeof rec.toast === "boolean") base.defaults.toast = rec.toast;
  }

  if (rec.byWorkspace && typeof rec.byWorkspace === "object" && !Array.isArray(rec.byWorkspace)) {
    const by: Record<string, NotificationWorkspacePrefs> = {};
    for (const [wsId, val] of Object.entries(
      rec.byWorkspace as Record<string, unknown>,
    )) {
      const key = wsId.trim();
      if (!key || !val || typeof val !== "object" || Array.isArray(val)) continue;
      const v = val as Record<string, unknown>;
      const entry: NotificationWorkspacePrefs = {};
      if (v.sources !== undefined) entry.sources = parseSourcesPartial(v.sources);
      if (typeof v.toast === "boolean") entry.toast = v.toast;
      by[key] = entry;
    }
    base.byWorkspace = by;
  }
  return base;
}

export function workspaceIdForNotificationProject(
  projectId: string | null | undefined,
): string {
  const id = typeof projectId === "string" ? projectId.trim() : "";
  return id || STUDIO_HOME_NOTIFICATION_WORKSPACE_ID;
}

/** Resolve effective toggles for a workspace (overrides inherit defaults / README). */
export function resolveNotificationPrefs(
  config: StudioNotificationsConfig,
  workspaceId: string | null | undefined,
): EffectiveNotificationPrefs {
  const ws =
    typeof workspaceId === "string" && workspaceId.trim()
      ? workspaceId.trim()
      : STUDIO_HOME_NOTIFICATION_WORKSPACE_ID;
  const override = config.byWorkspace[ws];
  const sources = { ...DEFAULT_NOTIFICATION_SOURCE_ON };
  for (const id of NOTIFICATION_SOURCES) {
    if (typeof config.defaults.sources[id] === "boolean") {
      sources[id] = config.defaults.sources[id]!;
    }
    if (override?.sources && typeof override.sources[id] === "boolean") {
      sources[id] = override.sources[id]!;
    }
  }
  let toast = config.defaults.toast;
  if (typeof override?.toast === "boolean") toast = override.toast;
  return { sources, toast };
}

export function isNotificationSourceEnabled(
  config: StudioNotificationsConfig,
  workspaceId: string | null | undefined,
  source: NotificationSourceId,
): boolean {
  return resolveNotificationPrefs(config, workspaceId).sources[source] === true;
}

/** Patch merge for notifications config section. */
export function mergeNotificationsConfigPatch(
  current: StudioNotificationsConfig,
  patch: unknown,
): StudioNotificationsConfig {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return current;
  }
  const p = patch as Record<string, unknown>;
  const next: StudioNotificationsConfig = {
    defaults: {
      sources: { ...current.defaults.sources },
      toast: current.defaults.toast,
    },
    byWorkspace: { ...current.byWorkspace },
  };

  if (p.defaults && typeof p.defaults === "object" && !Array.isArray(p.defaults)) {
    const d = p.defaults as Record<string, unknown>;
    if (d.sources !== undefined) {
      next.defaults.sources = {
        ...next.defaults.sources,
        ...parseSourcesPartial(d.sources),
      };
    }
    if (typeof d.toast === "boolean") next.defaults.toast = d.toast;
  }

  if (p.byWorkspace && typeof p.byWorkspace === "object" && !Array.isArray(p.byWorkspace)) {
    for (const [wsId, val] of Object.entries(
      p.byWorkspace as Record<string, unknown>,
    )) {
      const key = wsId.trim();
      if (!key) continue;
      if (val == null) {
        delete next.byWorkspace[key];
        continue;
      }
      if (typeof val !== "object" || Array.isArray(val)) continue;
      const v = val as Record<string, unknown>;
      const prev = next.byWorkspace[key] ?? {};
      const entry: NotificationWorkspacePrefs = {
        sources: { ...(prev.sources ?? {}) },
      };
      if (typeof prev.toast === "boolean") entry.toast = prev.toast;
      if (v.sources !== undefined) {
        entry.sources = {
          ...entry.sources,
          ...parseSourcesPartial(v.sources),
        };
      }
      if (typeof v.toast === "boolean") entry.toast = v.toast;
      next.byWorkspace[key] = entry;
    }
  }

  return next;
}
