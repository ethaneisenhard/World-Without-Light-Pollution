/**
 * Workspace registry CRUD orchestrator — link/list/get/patch/unlink/delete.
 */

import {
  normalizePublicSiteUrl,
  projectConfigWithOptionalProdUrl,
} from "./hosting-prod-url-pure.js";
import {
  collectTakenLivePortsFromConfigs,
  seedLinkedProjectConfig,
} from "./live-dev-ports-registry-pure.js";
import { loadProjectConfig } from "./registry.js";
import type { ProjectConfig, ProjectRegistry } from "./types.js";
import {
  findRegistryEntry,
  isPathUnderPlanningHome,
  isWorkspaceProtectedId,
  listWorkspaceRegistryEntries,
  parseWorkspaceDeleteInput,
  parseWorkspaceLinkInput,
  parseWorkspacePatchInput,
  parseWorkspaceUnlinkInput,
  registryWithoutProject,
  workspaceConfirmPhraseOk,
  type WorkspaceListItem,
} from "./workspace-registry-pure.js";
import type { PlanningWorkspaceOrchestratorDeps } from "./planning-workspace-orchestrator.js";
import {
  pickDefaultWorkspaceShellAccent,
  seededWorkspaceDesignJson,
} from "./workspace-shell-accent-pure.js";

export type WorkspaceCrudFs = PlanningWorkspaceOrchestratorDeps["fs"] & {
  rm?: (
    path: string,
    opts?: { recursive?: boolean; force?: boolean },
  ) => Promise<void>;
  realpath?: (path: string) => Promise<string>;
};

export type WorkspaceCrudOrchestratorDeps = Omit<
  PlanningWorkspaceOrchestratorDeps,
  "fs"
> & {
  fs: WorkspaceCrudFs;
  resolveProjectRoot: (repoRoot: string, entryPath: string) => string;
  repoRoot: string;
  normalizePath: (p: string) => string;
  loadProjectConfig?: typeof loadProjectConfig;
};

export async function listWorkspacesOrchestrator(
  deps: WorkspaceCrudOrchestratorDeps,
): Promise<WorkspaceListItem[]> {
  const registry = await deps.loadRegistry();
  const items = listWorkspaceRegistryEntries(registry);
  const loadConfig = deps.loadProjectConfig ?? loadProjectConfig;
  const out: WorkspaceListItem[] = [];
  for (const item of items) {
    const root = deps.resolveProjectRoot(deps.repoRoot, item.path);
    let kind: string | undefined;
    try {
      const cfg = await loadConfig(root);
      if (typeof cfg?.kind === "string" && cfg.kind.trim()) {
        kind = cfg.kind.trim();
      }
      if (cfg?.name?.trim() && !item.name) {
        out.push({ ...item, name: cfg.name.trim(), kind });
        continue;
      }
    } catch {
      /* ignore */
    }
    out.push({ ...item, kind });
  }
  return out;
}

export async function getWorkspaceOrchestrator(
  deps: WorkspaceCrudOrchestratorDeps,
  projectId: string,
): Promise<{
  id: string;
  name: string;
  path: string;
  absPath: string;
  kind?: string;
  config?: Record<string, unknown>;
}> {
  const registry = await deps.loadRegistry();
  const entry = findRegistryEntry(registry, projectId);
  if (!entry) throw new Error(`Unknown workspace id: ${projectId}`);
  const absPath = deps.resolveProjectRoot(deps.repoRoot, entry.path);
  const loadConfig = deps.loadProjectConfig ?? loadProjectConfig;
  const cfg = await loadConfig(absPath);
  return {
    id: entry.id,
    name: entry.name?.trim() || cfg?.name?.trim() || entry.id,
    path: entry.path,
    absPath,
    kind: typeof cfg?.kind === "string" ? cfg.kind : undefined,
    config: cfg ? (cfg as unknown as Record<string, unknown>) : undefined,
  };
}

export async function linkWorkspaceOrchestrator(
  deps: WorkspaceCrudOrchestratorDeps,
  raw: Record<string, unknown>,
): Promise<{ projectId: string; name: string; path: string }> {
  const parsed = parseWorkspaceLinkInput(raw);
  if (!parsed.ok) throw new Error(parsed.error);
  const registry = await deps.loadRegistry();
  if (registry.projects.some((p) => p.id === parsed.value.id)) {
    throw new Error(`Project already registered: ${parsed.value.id}`);
  }
  const abs = deps.resolveProjectRoot(deps.repoRoot, parsed.value.path);
  if (deps.pathExists && !(await deps.pathExists(abs))) {
    throw new Error(`Path does not exist: ${parsed.value.path}`);
  }
  const name = parsed.value.name ?? parsed.value.id;
  registry.projects.push({
    id: parsed.value.id,
    path: parsed.value.path,
    name,
  });
  await deps.saveRegistry(registry);

  // Seed project.json + design when missing (Live port from band / denylist).
  try {
    const asDir = deps.joinPath(abs, ".glassbox-studio");
    await deps.fs.mkdir(asDir, { recursive: true });

    const configRel = deps.joinPath(asDir, "project.json");
    const configMissing = deps.pathExists
      ? !(await deps.pathExists(configRel))
      : true;
    if (configMissing) {
      const loadConfig = deps.loadProjectConfig ?? loadProjectConfig;
      const siblingConfigs: Pick<ProjectConfig, "id" | "dev">[] = [];
      for (const entry of registry.projects) {
        if (entry.id === parsed.value.id) continue;
        try {
          const root = deps.resolveProjectRoot(deps.repoRoot, entry.path);
          const cfg = await loadConfig(root);
          if (cfg) siblingConfigs.push(cfg);
        } catch {
          /* ignore */
        }
      }
      const seed = seedLinkedProjectConfig({
        projectId: parsed.value.id,
        name,
        takenPorts: collectTakenLivePortsFromConfigs(siblingConfigs),
        placement: parsed.value.placement ?? "local",
      });
      await deps.fs.writeFile(
        configRel,
        `${JSON.stringify(seed, null, 2)}\n`,
        "utf8",
      );
    } else if (parsed.value.placement) {
      /* Stamp placement on existing project.json when link passes it. */
      try {
        const loadConfig = deps.loadProjectConfig ?? loadProjectConfig;
        const existing = await loadConfig(abs);
        if (existing) {
          const next = {
            ...existing,
            compute: {
              ...(existing.compute ?? {}),
              placement: parsed.value.placement,
            },
          };
          await deps.fs.writeFile(
            configRel,
            `${JSON.stringify(next, null, 2)}\n`,
            "utf8",
          );
        }
      } catch {
        /* ignore stamp failure */
      }
    }

    const designRel = deps.joinPath(asDir, "design.json");
    const designMissing = deps.pathExists
      ? !(await deps.pathExists(designRel))
      : true;
    if (designMissing) {
      const accent = pickDefaultWorkspaceShellAccent({
        projectId: parsed.value.id,
      });
      await deps.fs.writeFile(
        designRel,
        seededWorkspaceDesignJson(accent),
        "utf8",
      );
    }
  } catch {
    /* link still succeeds without seed */
  }

  return { projectId: parsed.value.id, name, path: parsed.value.path };
}

export async function patchWorkspaceOrchestrator(
  deps: WorkspaceCrudOrchestratorDeps,
  raw: Record<string, unknown>,
): Promise<{ projectId: string; name: string; path: string }> {
  const parsed = parseWorkspacePatchInput(raw);
  if (!parsed.ok) throw new Error(parsed.error);
  const registry = await deps.loadRegistry();
  const entry = findRegistryEntry(registry, parsed.value.projectId);
  if (!entry) {
    throw new Error(`Unknown workspace id: ${parsed.value.projectId}`);
  }
  if (parsed.value.name) {
    entry.name = parsed.value.name;
  }
  await deps.saveRegistry(registry);

  const absPath = deps.resolveProjectRoot(deps.repoRoot, entry.path);
  const loadConfig = deps.loadProjectConfig ?? loadProjectConfig;
  const cfg = (await loadConfig(absPath)) ?? {
    id: entry.id,
    name: entry.name,
  };
  if (parsed.value.name) cfg.name = parsed.value.name;
  if (parsed.value.brief !== undefined) {
    const readme = deps.joinPath(absPath, "README.md");
    const title = cfg.name ?? entry.id;
    const body = `# ${title}\n\n${parsed.value.brief}\n`;
    await deps.fs.writeFile(readme, body, "utf8");
  }
  if (parsed.value.placement) {
    cfg.compute = {
      ...(cfg.compute ?? {}),
      placement: parsed.value.placement,
    };
  }
  if (parsed.value.prodUrl !== undefined) {
    const normalized = normalizePublicSiteUrl(parsed.value.prodUrl);
    if (!normalized.ok) throw new Error(normalized.error);
    const patched = projectConfigWithOptionalProdUrl(cfg, normalized.value);
    if (patched.hosting === undefined) {
      delete cfg.hosting;
    } else {
      cfg.hosting = patched.hosting;
    }
  }
  const configPath = deps.joinPath(absPath, ".glassbox-studio", "project.json");
  try {
    await deps.fs.mkdir(deps.joinPath(absPath, ".glassbox-studio"), {
      recursive: true,
    });
    await deps.fs.writeFile(
      configPath,
      `${JSON.stringify(cfg, null, 2)}\n`,
      "utf8",
    );
  } catch {
    /* mapped projects may not allow write — registry name still updated */
  }

  return {
    projectId: entry.id,
    name: entry.name?.trim() || entry.id,
    path: entry.path,
  };
}

export async function unlinkWorkspaceOrchestrator(
  deps: WorkspaceCrudOrchestratorDeps,
  raw: Record<string, unknown>,
): Promise<{ projectId: string; path: string; name: string }> {
  const parsed = parseWorkspaceUnlinkInput(raw);
  if (!parsed.ok) throw new Error(parsed.error);
  if (isWorkspaceProtectedId(parsed.value.projectId)) {
    throw new Error(
      `Refusing to unlink protected workspace: ${parsed.value.projectId}`,
    );
  }
  const registry = await deps.loadRegistry();
  const { next, removed } = registryWithoutProject(
    registry,
    parsed.value.projectId,
  );
  if (!removed) {
    throw new Error(`Unknown workspace id: ${parsed.value.projectId}`);
  }
  await deps.saveRegistry(next);
  return {
    projectId: removed.id,
    path: removed.path,
    name: removed.name?.trim() || removed.id,
  };
}

export async function deleteWorkspaceOrchestrator(
  deps: WorkspaceCrudOrchestratorDeps,
  raw: Record<string, unknown>,
): Promise<{
  projectId: string;
  path: string;
  name: string;
  deletedFiles: boolean;
  absPath?: string;
}> {
  const parsed = parseWorkspaceDeleteInput(raw);
  if (!parsed.ok) throw new Error(parsed.error);
  if (isWorkspaceProtectedId(parsed.value.projectId)) {
    throw new Error(
      `Refusing to delete protected workspace: ${parsed.value.projectId}`,
    );
  }
  if (!workspaceConfirmPhraseOk(
    parsed.value.projectId,
    parsed.value.confirmPhrase,
  )) {
    throw new Error(
      `Double-confirm required: pass confirmPhrase matching the project id (e.g. confirmPhrase: "${parsed.value.projectId}" or "delete ${parsed.value.projectId}").`,
    );
  }

  const registry = await deps.loadRegistry();
  const entry = findRegistryEntry(registry, parsed.value.projectId);
  if (!entry) {
    throw new Error(`Unknown workspace id: ${parsed.value.projectId}`);
  }
  const absPath = deps.normalizePath(
    deps.resolveProjectRoot(deps.repoRoot, entry.path),
  );
  let deletedFiles = false;

  if (parsed.value.deleteFiles) {
    const under = isPathUnderPlanningHome(
      absPath,
      deps.getStudioHome(),
      deps.normalizePath,
    );
    if (!under) {
      throw new Error(
        `deleteFiles only allowed under ~/.glassbox-studio/workspaces — path is outside planning home: ${entry.path}. Use unlink to drop the registry row only.`,
      );
    }
    if (!deps.fs.rm) {
      throw new Error("fs.rm not configured");
    }
    await deps.fs.rm(absPath, { recursive: true, force: true });
    deletedFiles = true;
  }

  const { next, removed } = registryWithoutProject(
    registry,
    parsed.value.projectId,
  );
  if (!removed) {
    throw new Error(`Unknown workspace id: ${parsed.value.projectId}`);
  }
  await deps.saveRegistry(next);

  return {
    projectId: removed.id,
    path: removed.path,
    name: removed.name?.trim() || removed.id,
    deletedFiles,
    absPath,
  };
}

export type { ProjectRegistry };
