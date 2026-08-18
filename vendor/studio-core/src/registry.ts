import fs from "node:fs";
import fsPromises from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";
import type { ProjectDesign } from "./design-pure.js";
import type { ProjectConfig, ProjectRegistry } from "./types.js";
import { normalizeProjectConfig } from "./project-runtime-pure.js";
import { resolveStudioHomePath, STUDIO_HOME_DIRNAME_LEGACY, STUDIO_HOME_DIRNAME_PREFERRED } from "./studio-home-pure.js";
import { shouldSkipTreeEntry } from "./tree-pure.js";
import { projectMetaCandidates } from "./project-meta-pure.js";
import { ensureStudioSelfWorkspace } from "./workspace-registry-pure.js";

const REGISTRY_FILENAMES = ["registry.json"] as const;
const PROJECT_CONFIG_PATHS = [
  "project.json",
  ...projectMetaCandidates("project.json"),
] as const;
const PROJECT_DESIGN_PATHS = [
  ...projectMetaCandidates("design.json"),
  "design/design-system/design.json",
  "design.json",
] as const;

/** Host config root — `GLASSBOX_STUDIO_HOME` / `AGENT_STUDIO_HOME` or dual-read home dirs. */
export function getStudioHome(): string {
  const envOverride =
    process.env.GLASSBOX_STUDIO_HOME?.trim() ||
    process.env.AGENT_STUDIO_HOME?.trim() ||
    null;
  const homeDir = process.env.HOME ?? "";
  const preferred = path.join(homeDir, STUDIO_HOME_DIRNAME_PREFERRED);
  const legacy = path.join(homeDir, STUDIO_HOME_DIRNAME_LEGACY);
  return resolveStudioHomePath({
    envOverride,
    homeDir,
    preferredExists: envOverride ? false : fs.existsSync(preferred),
    legacyExists: envOverride ? false : fs.existsSync(legacy),
  });
}

export function getRegistryPath(): string {
  return path.join(getStudioHome(), "registry.json");
}

export async function loadRegistry(registryPath = getRegistryPath()): Promise<ProjectRegistry> {
  let registry: ProjectRegistry;
  try {
    const raw = await fsPromises.readFile(registryPath, "utf8");
    const parsed = JSON.parse(raw) as ProjectRegistry;
    registry =
      parsed && Array.isArray(parsed.projects)
        ? parsed
        : { version: 1, projects: [] };
  } catch {
    registry = { version: 1, projects: [] };
  }
  const { next, inserted } = ensureStudioSelfWorkspace(registry);
  if (inserted) {
    try {
      await saveRegistry(next, registryPath);
    } catch {
      /* picker still works in-process if disk is read-only */
    }
    return next;
  }
  return registry;
}

export async function saveRegistry(
  registry: ProjectRegistry,
  registryPath = getRegistryPath(),
): Promise<void> {
  await fsPromises.mkdir(path.dirname(registryPath), { recursive: true });
  await fsPromises.writeFile(
    registryPath,
    `${JSON.stringify(registry, null, 2)}\n`,
    "utf8",
  );
}

export async function loadProjectConfig(projectRoot: string): Promise<ProjectConfig | null> {
  for (const rel of PROJECT_CONFIG_PATHS) {
    const configPath = path.join(projectRoot, rel);
    try {
      const raw = await fsPromises.readFile(configPath, "utf8");
      return normalizeProjectConfig(JSON.parse(raw) as ProjectConfig);
    } catch {
      // try next path
    }
  }
  return null;
}

export async function loadProjectDesign(projectRoot: string): Promise<ProjectDesign | null> {
  for (const rel of PROJECT_DESIGN_PATHS) {
    const designPath = path.join(projectRoot, rel);
    try {
      const raw = await fsPromises.readFile(designPath, "utf8");
      return JSON.parse(raw) as ProjectDesign;
    } catch {
      // try next path
    }
  }
  return null;
}

export function resolveProjectRoot(repoRoot: string, entryPath: string): string {
  return path.isAbsolute(entryPath) ? entryPath : path.join(repoRoot, entryPath);
}

export async function listProjectFiles(
  projectRoot: string,
  subPath = "",
): Promise<Array<{ path: string; name: string; type: "file" | "dir" }>> {
  const target = path.join(projectRoot, subPath);
  const entries: Dirent[] = await fsPromises.readdir(target, { withFileTypes: true });
  return entries
    .filter((e) => !e.name.startsWith("."))
    .map((e) => ({
      name: e.name,
      path: path.join(subPath, e.name).replace(/\\/g, "/"),
      type: e.isDirectory() ? ("dir" as const) : ("file" as const),
    }))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

/**
 * Recursive file paths under project root for path-first trees (e.g. @pierre/trees).
 * Skips dot dirs/files, node_modules, .git, dist, .wrangler, etc.
 */
export async function listProjectFilePaths(projectRoot: string): Promise<string[]> {
  const root = path.resolve(projectRoot);
  const paths: string[] = [];

  async function walk(absDir: string, relDir: string): Promise<void> {
    let entries: Dirent[];
    try {
      entries = await fsPromises.readdir(absDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (shouldSkipTreeEntry(entry.name)) continue;
      const rel = relDir ? `${relDir}/${entry.name}` : entry.name;
      const abs = path.join(absDir, entry.name);
      if (entry.isDirectory()) {
        await walk(abs, rel);
      } else if (entry.isFile()) {
        paths.push(rel.replace(/\\/g, "/"));
      }
    }
  }

  await walk(root, "");
  paths.sort((a, b) => a.localeCompare(b));
  return paths;
}

export async function readProjectFile(projectRoot: string, filePath: string): Promise<string> {
  const resolved = path.resolve(projectRoot, filePath);
  if (!resolved.startsWith(path.resolve(projectRoot))) {
    throw new Error("Path escapes project root");
  }
  return fsPromises.readFile(resolved, "utf8");
}

/** Read a path relative to the monorepo root (e.g. shared component manifests). */
export async function readRepoRelativeFile(
  repoRoot: string,
  filePath: string,
): Promise<string> {
  const root = path.resolve(repoRoot);
  const resolved = path.resolve(root, filePath);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error("Path escapes repo root");
  }
  return fsPromises.readFile(resolved, "utf8");
}

export async function writeProjectFile(
  projectRoot: string,
  filePath: string,
  content: string,
): Promise<void> {
  const resolved = path.resolve(projectRoot, filePath);
  if (!resolved.startsWith(path.resolve(projectRoot))) {
    throw new Error("Path escapes project root");
  }
  await fsPromises.mkdir(path.dirname(resolved), { recursive: true });
  await fsPromises.writeFile(resolved, content, "utf8");
}

export async function deleteProjectFile(
  projectRoot: string,
  filePath: string,
): Promise<void> {
  const resolved = path.resolve(projectRoot, filePath);
  if (!resolved.startsWith(path.resolve(projectRoot))) {
    throw new Error("Path escapes project root");
  }
  await fsPromises.unlink(resolved);
}
