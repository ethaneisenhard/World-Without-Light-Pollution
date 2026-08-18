/**
 * Global Chat (`_studio`) file roots — Studio monorepo + registered workspaces.
 * Default: both on (workspaces = all). accessMode does not gate these roots.
 */

export const GLOBAL_WORKSPACE_PATH_PREFIX = "@ws/";

export type GlobalFileAccessWorkspaces = "all" | "none" | string[];

export type GlobalFileAccessConfig = {
  /** Edit Glass Box Studio monorepo via `@studio/…`. Default true. */
  studioMonorepo: boolean;
  /** Which registered workspace ids Global may edit. Default `"all"`. */
  workspaces: GlobalFileAccessWorkspaces;
};

export const DEFAULT_GLOBAL_FILE_ACCESS: GlobalFileAccessConfig = {
  studioMonorepo: true,
  workspaces: "all",
};

export function defaultGlobalFileAccess(): GlobalFileAccessConfig {
  return {
    studioMonorepo: DEFAULT_GLOBAL_FILE_ACCESS.studioMonorepo,
    workspaces: DEFAULT_GLOBAL_FILE_ACCESS.workspaces,
  };
}

export function parseGlobalFileAccess(raw: unknown): GlobalFileAccessConfig {
  const base = defaultGlobalFileAccess();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const o = raw as Record<string, unknown>;
  const studioMonorepo =
    typeof o.studioMonorepo === "boolean" ? o.studioMonorepo : base.studioMonorepo;
  let workspaces: GlobalFileAccessWorkspaces = base.workspaces;
  if (o.workspaces === "all" || o.workspaces === "none") {
    workspaces = o.workspaces;
  } else if (Array.isArray(o.workspaces)) {
    workspaces = o.workspaces
      .filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
      .map((id) => id.trim())
      .slice(0, 200);
  }
  return { studioMonorepo, workspaces };
}

export function mergeGlobalFileAccessPatch(
  current: GlobalFileAccessConfig,
  patch: unknown,
): GlobalFileAccessConfig {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return current;
  }
  return parseGlobalFileAccess({ ...current, ...(patch as object) });
}

export function isGlobalStudioMonorepoAllowed(
  config: GlobalFileAccessConfig,
): boolean {
  return config.studioMonorepo === true;
}

export function isGlobalWorkspaceFileAllowed(
  config: GlobalFileAccessConfig,
  projectId: string,
): boolean {
  const id = projectId.trim();
  if (!id) return false;
  const w = config.workspaces;
  if (w === "none") return false;
  if (w === "all") return true;
  return w.includes(id);
}

/** True when Global should expose files.* / git.* on the root allowlist. */
export function globalFileAccessEnablesDiskTools(
  config: GlobalFileAccessConfig,
): boolean {
  if (config.studioMonorepo) return true;
  if (config.workspaces === "all") return true;
  return Array.isArray(config.workspaces) && config.workspaces.length > 0;
}

export type ParsedGlobalFilePath =
  | { kind: "studio"; rel: string }
  | { kind: "workspace"; projectId: string; rel: string }
  | { kind: "scoped"; path: string };

/**
 * Parse `@studio/…`, `@ws/<projectId>/…`, or plain project-relative path.
 * Does not consult allow config — caller gates with isGlobal*Allowed.
 */
export function parseGlobalFilePath(filePath: string): ParsedGlobalFilePath {
  const raw = filePath.trim();
  // Bare `@ws` (no id) — parse as workspace with empty id; resolve rejects.
  if (raw === "@ws") {
    return { kind: "workspace", projectId: "", rel: "" };
  }
  if (raw.startsWith(GLOBAL_WORKSPACE_PATH_PREFIX)) {
    const rest = raw.slice(GLOBAL_WORKSPACE_PATH_PREFIX.length);
    const slash = rest.indexOf("/");
    if (slash <= 0) {
      const projectId = rest.trim();
      return {
        kind: "workspace",
        projectId,
        rel: "",
      };
    }
    return {
      kind: "workspace",
      projectId: rest.slice(0, slash).trim(),
      rel: rest.slice(slash + 1).trim(),
    };
  }
  // Re-export studio parse shape without importing access-mode (avoid cycle risk).
  // Bare `@studio` (models often drop the trailing slash) = monorepo root.
  const studioPrefix = "@studio/";
  if (raw === "@studio" || raw.startsWith(studioPrefix)) {
    return {
      kind: "studio",
      rel: raw === "@studio" ? "" : raw.slice(studioPrefix.length),
    };
  }
  return { kind: "scoped", path: raw };
}
