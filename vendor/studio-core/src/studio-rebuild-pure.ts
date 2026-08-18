/**
 * Studio shell client rebuild — workspace menu / API contract (pure).
 */

/** Relative to repo root — `pnpm build:client` lives here. */
export const STUDIO_CLIENT_REBUILD_REL_DIR = "apps/studio";

export const STUDIO_CLIENT_REBUILD_COMMAND = "pnpm";

export const STUDIO_CLIENT_REBUILD_ARGS = ["build:client"] as const;

/** Workspace context-menu label (Studio UI, not project preview). */
export function workspaceRebuildStudioClientLabel(): string {
  return "Rebuild Studio client";
}

export function studioClientRebuildCwd(repoRoot: string): string {
  const base = repoRoot.replace(/\/+$/, "");
  return `${base}/${STUDIO_CLIENT_REBUILD_REL_DIR}`;
}
