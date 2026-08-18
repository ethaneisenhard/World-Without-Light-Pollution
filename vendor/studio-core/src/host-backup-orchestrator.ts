/**
 * Host backup / restore cutover — injected fs; pure plans the layout.
 */

import {
  buildHostBackupManifest,
  buildHostBackupPlan,
  buildHostRestorePlan,
  defaultHostBackupDbPathsUnderHome,
  joinHostBackupDataPath,
  parseHostBackupManifest,
  type HostBackupDbSources,
  type HostBackupManifest,
  type HostBackupPlanEntry,
} from "./host-backup-pure.js";

export type HostBackupFs = {
  mkdir: (path: string, opts?: { recursive?: boolean }) => Promise<void>;
  writeFile: (
    path: string,
    data: string | Uint8Array,
    enc?: "utf8",
  ) => Promise<void>;
  readFile: (path: string, enc: "utf8") => Promise<string>;
  readFileBuffer: (path: string) => Promise<Uint8Array>;
  copyFile: (src: string, dest: string) => Promise<void>;
  rm: (
    path: string,
    opts?: { recursive?: boolean; force?: boolean },
  ) => Promise<void>;
  readdir: (path: string) => Promise<string[]>;
  stat: (path: string) => Promise<{ isFile: boolean; isDirectory: boolean }>;
  pathExists: (path: string) => Promise<boolean>;
};

export type HostBackupOrchestratorDeps = {
  fs: HostBackupFs;
  getStudioHome: () => string;
  /**
   * Resolved absolute DB paths for backup source / restore target.
   * Defaults: `$STUDIO_HOME/{studio,messages,notifications}.db`.
   */
  resolveDbPaths?: (studioHome: string) => HostBackupDbSources;
  joinPath: (...parts: string[]) => string;
  dirname: (path: string) => string;
  nowIso?: () => string;
};

function resolveDbs(
  deps: HostBackupOrchestratorDeps,
  studioHome: string,
): HostBackupDbSources {
  if (deps.resolveDbPaths) return deps.resolveDbPaths(studioHome);
  return defaultHostBackupDbPathsUnderHome(studioHome, deps.joinPath);
}

async function copyTree(
  deps: HostBackupOrchestratorDeps,
  src: string,
  dest: string,
): Promise<void> {
  const st = await deps.fs.stat(src);
  if (st.isFile) {
    await deps.fs.mkdir(deps.dirname(dest), { recursive: true });
    await deps.fs.copyFile(src, dest);
    return;
  }
  if (!st.isDirectory) return;
  await deps.fs.mkdir(dest, { recursive: true });
  const kids = await deps.fs.readdir(src);
  for (const name of kids) {
    await copyTree(
      deps,
      deps.joinPath(src, name),
      deps.joinPath(dest, name),
    );
  }
}

export type HostBackupResult = {
  outDir: string;
  manifest: HostBackupManifest;
  copied: string[];
  skippedMissing: string[];
};

export async function backupHostOrchestrator(
  deps: HostBackupOrchestratorDeps,
  input: { outDir: string },
): Promise<HostBackupResult> {
  const outDir = input.outDir.trim();
  if (!outDir) throw new Error("outDir required");

  const studioHome = deps.getStudioHome();
  const dbSources = resolveDbs(deps, studioHome);
  const plan = buildHostBackupPlan({
    studioHome,
    dbSources,
    joinPath: deps.joinPath,
  });

  await deps.fs.mkdir(outDir, { recursive: true });
  await deps.fs.mkdir(deps.joinPath(outDir, "data"), { recursive: true });

  const present: HostBackupPlanEntry[] = [];
  const skippedMissing: string[] = [];
  const copied: string[] = [];

  for (const entry of plan) {
    const exists = await deps.fs.pathExists(entry.sourceAbs);
    if (!exists) {
      skippedMissing.push(entry.logicalPath);
      continue;
    }
    const dest = joinHostBackupDataPath(
      deps.joinPath,
      outDir,
      entry.logicalPath,
    );
    await copyTree(deps, entry.sourceAbs, dest);
    present.push(entry);
    copied.push(entry.logicalPath);
  }

  const manifest = buildHostBackupManifest({
    studioHome,
    createdAt: deps.nowIso?.() ?? new Date().toISOString(),
    present,
  });
  await deps.fs.writeFile(
    deps.joinPath(outDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  return { outDir, manifest, copied, skippedMissing };
}

export type HostRestoreResult = {
  targetStudioHome: string;
  restored: string[];
  manifest: HostBackupManifest;
};

export async function restoreHostOrchestrator(
  deps: HostBackupOrchestratorDeps,
  input: {
    backupDir: string;
    /** Defaults to getStudioHome(). */
    targetStudioHome?: string;
    /** When false (default), refuse if target registry.json already exists. */
    force?: boolean;
  },
): Promise<HostRestoreResult> {
  const backupDir = input.backupDir.trim();
  if (!backupDir) throw new Error("backupDir required");

  const targetStudioHome = (
    input.targetStudioHome?.trim() || deps.getStudioHome()
  ).trim();
  const force = Boolean(input.force);

  const manifestRaw = await deps.fs.readFile(
    deps.joinPath(backupDir, "manifest.json"),
    "utf8",
  );
  const parsed = parseHostBackupManifest(JSON.parse(manifestRaw) as unknown);
  if (!parsed.ok) throw new Error(parsed.error);

  const registryDest = deps.joinPath(targetStudioHome, "registry.json");
  if (!force && (await deps.fs.pathExists(registryDest))) {
    throw new Error(
      `target Host already has registry.json at ${registryDest} (pass force:true to overwrite)`,
    );
  }

  const targetDbPaths = resolveDbs(deps, targetStudioHome);
  const planOrErr = buildHostRestorePlan({
    manifest: parsed.manifest,
    backupDir,
    targetStudioHome,
    targetDbPaths,
    joinPath: deps.joinPath,
  });
  if ("error" in planOrErr) throw new Error(planOrErr.error);

  await deps.fs.mkdir(targetStudioHome, { recursive: true });
  const restored: string[] = [];

  for (const entry of planOrErr) {
    const exists = await deps.fs.pathExists(entry.bundleAbs);
    if (!exists) {
      throw new Error(`backup missing data for ${entry.logicalPath}`);
    }
    if (force && (await deps.fs.pathExists(entry.destAbs))) {
      await deps.fs.rm(entry.destAbs, { recursive: true, force: true });
    }
    await copyTree(deps, entry.bundleAbs, entry.destAbs);
    restored.push(entry.logicalPath);
  }

  return {
    targetStudioHome,
    restored,
    manifest: parsed.manifest,
  };
}
