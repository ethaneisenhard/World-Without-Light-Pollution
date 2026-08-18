/**
 * Workspace registry CRUD — list/link/patch/unlink/delete helpers (pure).
 */

import type { ComputePlacement } from "./compute-placement-pure.js";
import {
  planningWorkspacesHome,
  slugifyPlanningWorkspaceName,
} from "./planning-workspace-pure.js";
import type { ProjectRegistry, ProjectRegistryEntry } from "./types.js";

/** Never unlink/delete these without explicit force (product monorepo roots). */
export const WORKSPACE_PROTECTED_IDS = new Set(["glassbox-studio", "_studio"]);

/** Product source — always a registry workspace pointing at Host repo root. */
export const STUDIO_SELF_WORKSPACE_ID = "glassbox-studio";
export const STUDIO_SELF_WORKSPACE_NAME = "Glass Box Studio";
/** Relative to Host `repoRoot` (`/opt/glassbox-studio` on Cloud desk). */
export const STUDIO_SELF_WORKSPACE_PATH = ".";

export type WorkspaceListItem = {
  id: string;
  name: string;
  path: string;
  kind?: string;
};

export type WorkspaceLinkInput = {
  id: string;
  path: string;
  name?: string;
  /** ADR 0016 — default local on link. */
  placement?: ComputePlacement;
};

export type WorkspacePatchInput = {
  projectId: string;
  name?: string;
  brief?: string;
  /** ADR 0016 — iCloud-style app storage (hosted | local | byo). */
  placement?: ComputePlacement;
  /**
   * Public site address → `hosting.prod_url`.
   * `null` or `""` clears; omit = leave unchanged.
   */
  prodUrl?: string | null;
};

export type WorkspaceUnlinkInput = {
  projectId: string;
};

export type WorkspaceDeleteInput = {
  projectId: string;
  /** When true, also rm -rf planning workspace dir (only under workspaces home). */
  deleteFiles?: boolean;
  confirmPhrase?: string;
};

export function isWorkspaceProtectedId(projectId: string): boolean {
  return WORKSPACE_PROTECTED_IDS.has(projectId.trim());
}

/**
 * Every Host registry includes Glass Box Studio as a selectable workspace
 * (Cloud + laptop). Agents can switch Chat into product source instead of
 * guessing Global `@studio/` only.
 */
export function ensureStudioSelfWorkspace(
  registry: ProjectRegistry,
): { next: ProjectRegistry; inserted: boolean } {
  const projects = Array.isArray(registry.projects) ? registry.projects : [];
  if (projects.some((p) => p.id === STUDIO_SELF_WORKSPACE_ID)) {
    return { next: registry, inserted: false };
  }
  return {
    next: {
      ...registry,
      version: registry.version || 1,
      projects: [
        {
          id: STUDIO_SELF_WORKSPACE_ID,
          path: STUDIO_SELF_WORKSPACE_PATH,
          name: STUDIO_SELF_WORKSPACE_NAME,
        },
        ...projects,
      ],
    },
    inserted: true,
  };
}

export function isPathUnderPlanningHome(
  absPath: string,
  studioHome: string,
  normalize: (p: string) => string,
): boolean {
  const home = normalize(planningWorkspacesHome(studioHome)).replace(
    /[/\\]+$/,
    "",
  );
  const target = normalize(absPath);
  const homeSlash = home.replace(/\\/g, "/");
  const targetSlash = target.replace(/\\/g, "/");
  return (
    targetSlash === homeSlash || targetSlash.startsWith(`${homeSlash}/`)
  );
}

export function workspaceConfirmPhraseOk(
  projectId: string,
  phrase: string | undefined,
): boolean {
  const want = projectId.trim();
  const got = (phrase ?? "").trim();
  if (!want || !got) return false;
  return (
    got === want ||
    got.toLowerCase() === `delete ${want}`.toLowerCase() ||
    got.toLowerCase() === `unlink ${want}`.toLowerCase()
  );
}

export function listWorkspaceRegistryEntries(
  registry: ProjectRegistry,
): WorkspaceListItem[] {
  return registry.projects.map((p) => ({
    id: p.id,
    name: p.name?.trim() || p.id,
    path: p.path,
  }));
}

export function findRegistryEntry(
  registry: ProjectRegistry,
  projectId: string,
): ProjectRegistryEntry | null {
  const id = projectId.trim();
  return registry.projects.find((p) => p.id === id) ?? null;
}

export function parseWorkspaceLinkInput(
  input: Record<string, unknown>,
): { ok: true; value: WorkspaceLinkInput } | { ok: false; error: string } {
  const path =
    typeof input.path === "string" ? input.path.trim() : "";
  const rawId =
    typeof input.id === "string" && input.id.trim()
      ? input.id.trim()
      : typeof input.projectId === "string"
        ? input.projectId.trim()
        : "";
  const id = rawId
    ? slugifyPlanningWorkspaceName(rawId)
    : "";
  if (!id) return { ok: false, error: "id (or projectId) is required" };
  if (!path) return { ok: false, error: "path is required" };
  if (isWorkspaceProtectedId(id) && id === "_studio") {
    return { ok: false, error: "cannot link reserved id _studio" };
  }
  const name =
    typeof input.name === "string" && input.name.trim()
      ? input.name.trim()
      : undefined;
  const placementRaw =
    typeof input.placement === "string"
      ? input.placement.trim()
      : typeof (input.compute as { placement?: unknown } | undefined)
            ?.placement === "string"
        ? String(
            (input.compute as { placement: string }).placement,
          ).trim()
        : "";
  const placement =
    placementRaw === "hosted" ||
    placementRaw === "local" ||
    placementRaw === "byo"
      ? placementRaw
      : undefined;
  return { ok: true, value: { id, path, name, placement } };
}

export function parseWorkspacePatchInput(
  input: Record<string, unknown>,
): { ok: true; value: WorkspacePatchInput } | { ok: false; error: string } {
  const projectId =
    typeof input.projectId === "string"
      ? input.projectId.trim()
      : typeof input.id === "string"
        ? input.id.trim()
        : "";
  if (!projectId) return { ok: false, error: "projectId is required" };
  const name =
    typeof input.name === "string" && input.name.trim()
      ? input.name.trim()
      : undefined;
  const brief =
    typeof input.brief === "string" ? input.brief.trim() : undefined;
  const placementRaw =
    typeof input.placement === "string"
      ? input.placement.trim()
      : typeof (input.compute as { placement?: unknown } | undefined)
            ?.placement === "string"
        ? String(
            (input.compute as { placement: string }).placement,
          ).trim()
        : "";
  const placement =
    placementRaw === "hosted" ||
    placementRaw === "local" ||
    placementRaw === "byo"
      ? placementRaw
      : undefined;
  const hasProdUrlKey =
    Object.prototype.hasOwnProperty.call(input, "prodUrl") ||
    Object.prototype.hasOwnProperty.call(input, "prod_url");
  let prodUrl: string | null | undefined;
  if (hasProdUrlKey) {
    const raw =
      typeof input.prodUrl === "string"
        ? input.prodUrl
        : typeof input.prod_url === "string"
          ? input.prod_url
          : input.prodUrl == null && input.prod_url == null
            ? null
            : undefined;
    if (raw === undefined && input.prodUrl !== null && input.prod_url !== null) {
      return { ok: false, error: "prodUrl must be a string or null" };
    }
    prodUrl = raw === undefined ? null : raw;
  }
  if (
    name === undefined &&
    brief === undefined &&
    placement === undefined &&
    prodUrl === undefined
  ) {
    return {
      ok: false,
      error: "name, brief, placement, and/or prodUrl required",
    };
  }
  return { ok: true, value: { projectId, name, brief, placement, prodUrl } };
}

export function parseWorkspaceUnlinkInput(
  input: Record<string, unknown>,
): { ok: true; value: WorkspaceUnlinkInput } | { ok: false; error: string } {
  const projectId =
    typeof input.projectId === "string"
      ? input.projectId.trim()
      : typeof input.id === "string"
        ? input.id.trim()
        : "";
  if (!projectId) return { ok: false, error: "projectId is required" };
  return { ok: true, value: { projectId } };
}

export function parseWorkspaceDeleteInput(
  input: Record<string, unknown>,
): { ok: true; value: WorkspaceDeleteInput } | { ok: false; error: string } {
  const base = parseWorkspaceUnlinkInput(input);
  if (!base.ok) return base;
  const deleteFiles = input.deleteFiles === true;
  const confirmPhrase =
    typeof input.confirmPhrase === "string"
      ? input.confirmPhrase
      : undefined;
  return {
    ok: true,
    value: {
      projectId: base.value.projectId,
      deleteFiles,
      confirmPhrase,
    },
  };
}

/** Registry after removing an id (pure). */
export function registryWithoutProject(
  registry: ProjectRegistry,
  projectId: string,
): { next: ProjectRegistry; removed: ProjectRegistryEntry | null } {
  const id = projectId.trim();
  const removed = registry.projects.find((p) => p.id === id) ?? null;
  if (!removed) return { next: registry, removed: null };
  return {
    next: {
      ...registry,
      projects: registry.projects.filter((p) => p.id !== id),
    },
    removed,
  };
}
