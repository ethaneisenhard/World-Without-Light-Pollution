/**
 * Create a planning workspace on disk and register it.
 */

import type { ProjectRegistry, ProjectRegistryEntry } from "./types.js";
import {
  buildPlanningWorkspaceFiles,
  parsePlanningWorkspaceCreateInput,
  planningWorkspacesHome,
  resolvePlanningWorkspaceSlug,
  type PlanningWorkspaceCreateInput,
} from "./planning-workspace-pure.js";

export type PlanningWorkspaceFs = {
  mkdir: (path: string, opts?: { recursive?: boolean }) => Promise<void>;
  writeFile: (path: string, data: string, enc?: "utf8") => Promise<void>;
  readFile: (path: string, enc: "utf8") => Promise<string>;
  access?: (path: string) => Promise<void>;
};

export type PlanningWorkspaceOrchestratorDeps = {
  fs: PlanningWorkspaceFs;
  getStudioHome: () => string;
  getRegistryPath: () => string;
  loadRegistry: () => Promise<ProjectRegistry>;
  saveRegistry: (registry: ProjectRegistry) => Promise<void>;
  joinPath: (...parts: string[]) => string;
  /** Optional: path exists check. */
  pathExists?: (path: string) => Promise<boolean>;
};

export type CreatePlanningWorkspaceResult = {
  projectId: string;
  name: string;
  path: string;
  created: boolean;
};

async function ensureUniqueSlug(
  deps: PlanningWorkspaceOrchestratorDeps,
  base: string,
  registry: ProjectRegistry,
): Promise<string> {
  let slug = base;
  let n = 2;
  const home = planningWorkspacesHome(deps.getStudioHome());
  for (;;) {
    const idTaken = registry.projects.some((p) => p.id === slug);
    const dir = deps.joinPath(home, slug);
    const exists = deps.pathExists
      ? await deps.pathExists(dir)
      : false;
    if (!idTaken && !exists) return slug;
    slug = `${base}-${n}`;
    n += 1;
    if (n > 99) throw new Error("Could not allocate unique workspace id");
  }
}

export async function createPlanningWorkspaceOrchestrator(
  deps: PlanningWorkspaceOrchestratorDeps,
  raw: PlanningWorkspaceCreateInput | Record<string, unknown>,
): Promise<CreatePlanningWorkspaceResult> {
  const parsed = parsePlanningWorkspaceCreateInput(
    raw as Record<string, unknown>,
  );
  if (!parsed.ok) throw new Error(parsed.error);

  const registry = await deps.loadRegistry();
  const baseSlug = resolvePlanningWorkspaceSlug(parsed.value);
  const projectId = await ensureUniqueSlug(deps, baseSlug, registry);
  const name = parsed.value.name.trim();
  const root = deps.joinPath(
    planningWorkspacesHome(deps.getStudioHome()),
    projectId,
  );

  const files = buildPlanningWorkspaceFiles({
    id: projectId,
    name,
    brief: parsed.value.brief,
    placement: parsed.value.placement,
  });

  await deps.fs.mkdir(root, { recursive: true });
  for (const file of files) {
    const abs = deps.joinPath(root, file.relativePath);
    const parent = abs.replace(/\/[^/]+$/, "");
    if (parent && parent !== abs) {
      await deps.fs.mkdir(parent, { recursive: true });
    }
    await deps.fs.writeFile(abs, file.content, "utf8");
  }

  const entry: ProjectRegistryEntry = {
    id: projectId,
    path: root,
    name,
  };
  registry.projects.push(entry);
  await deps.saveRegistry(registry);

  return {
    projectId,
    name,
    path: root,
    created: true,
  };
}
