/**
 * Host backup / restore — cutover bundle shape (ADR 0014).
 * Pure: no fs/fetch. Orchestrator copies bytes.
 */

export const HOST_BACKUP_FORMAT_VERSION = 1 as const;
export const HOST_BACKUP_KIND = "glassbox-studio-host-backup" as const;

/** Relative paths under `$AGENT_STUDIO_HOME` included in the bundle. */
export const HOST_BACKUP_HOME_ENTRIES = [
  { logicalPath: "registry.json", kind: "file" as const },
  { logicalPath: "config.json", kind: "file" as const },
  { logicalPath: "secrets.json", kind: "file" as const },
  { logicalPath: "preview-routes.json", kind: "file" as const },
  { logicalPath: "notes", kind: "dir" as const },
  { logicalPath: "roadmap", kind: "dir" as const },
  { logicalPath: "workspaces", kind: "dir" as const },
  { logicalPath: "media", kind: "dir" as const },
  { logicalPath: "integrations", kind: "dir" as const },
  { logicalPath: "experiences", kind: "dir" as const },
  { logicalPath: "plugins", kind: "dir" as const },
] as const;

export type HostBackupDbRole = "ledger" | "messages" | "notifications";

export const HOST_BACKUP_DB_ROLES: readonly HostBackupDbRole[] = [
  "ledger",
  "messages",
  "notifications",
] as const;

export function hostBackupDbLogicalPath(role: HostBackupDbRole): string {
  const name =
    role === "ledger"
      ? "studio.db"
      : role === "messages"
        ? "messages.db"
        : "notifications.db";
  return `db/${name}`;
}

export type HostBackupEntryKind = "file" | "dir";

export type HostBackupManifestEntry = {
  logicalPath: string;
  kind: HostBackupEntryKind;
  /** Present for SQLite roles that may live outside studio home. */
  role?: HostBackupDbRole;
};

export type HostBackupManifest = {
  formatVersion: typeof HOST_BACKUP_FORMAT_VERSION;
  kind: typeof HOST_BACKUP_KIND;
  createdAt: string;
  /** Source studio home (diagnostic only). */
  studioHomeHint: string;
  entries: HostBackupManifestEntry[];
};

export type HostBackupPlanEntry = {
  logicalPath: string;
  kind: HostBackupEntryKind;
  /** Absolute path on the source Host. */
  sourceAbs: string;
  role?: HostBackupDbRole;
};

export type HostBackupDbSources = Partial<Record<HostBackupDbRole, string>>;

export function joinHostBackupDataPath(
  joinPath: (...parts: string[]) => string,
  outDir: string,
  logicalPath: string,
): string {
  return joinPath(outDir, "data", ...logicalPath.split("/").filter(Boolean));
}

export function buildHostBackupPlan(input: {
  studioHome: string;
  dbSources: HostBackupDbSources;
  joinPath: (...parts: string[]) => string;
}): HostBackupPlanEntry[] {
  const { studioHome, dbSources, joinPath } = input;
  const plan: HostBackupPlanEntry[] = [];

  for (const row of HOST_BACKUP_HOME_ENTRIES) {
    plan.push({
      logicalPath: row.logicalPath,
      kind: row.kind,
      sourceAbs: joinPath(studioHome, row.logicalPath),
    });
  }

  for (const role of HOST_BACKUP_DB_ROLES) {
    const abs = dbSources[role]?.trim();
    if (!abs) continue;
    plan.push({
      logicalPath: hostBackupDbLogicalPath(role),
      kind: "file",
      sourceAbs: abs,
      role,
    });
  }

  return plan;
}

export function buildHostBackupManifest(input: {
  studioHome: string;
  createdAt: string;
  /** Only entries that were actually present on disk. */
  present: HostBackupPlanEntry[];
}): HostBackupManifest {
  return {
    formatVersion: HOST_BACKUP_FORMAT_VERSION,
    kind: HOST_BACKUP_KIND,
    createdAt: input.createdAt,
    studioHomeHint: input.studioHome,
    entries: input.present.map((e) => ({
      logicalPath: e.logicalPath,
      kind: e.kind,
      ...(e.role ? { role: e.role } : {}),
    })),
  };
}

export type ValidateHostBackupManifestResult =
  | { ok: true; manifest: HostBackupManifest }
  | { ok: false; error: string };

export function parseHostBackupManifest(
  raw: unknown,
): ValidateHostBackupManifestResult {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "manifest must be an object" };
  }
  const o = raw as Record<string, unknown>;
  if (o.kind !== HOST_BACKUP_KIND) {
    return { ok: false, error: `manifest.kind must be ${HOST_BACKUP_KIND}` };
  }
  if (o.formatVersion !== HOST_BACKUP_FORMAT_VERSION) {
    return {
      ok: false,
      error: `unsupported formatVersion (want ${HOST_BACKUP_FORMAT_VERSION})`,
    };
  }
  if (typeof o.createdAt !== "string" || !o.createdAt.trim()) {
    return { ok: false, error: "manifest.createdAt required" };
  }
  if (typeof o.studioHomeHint !== "string") {
    return { ok: false, error: "manifest.studioHomeHint required" };
  }
  if (!Array.isArray(o.entries)) {
    return { ok: false, error: "manifest.entries must be an array" };
  }
  const entries: HostBackupManifestEntry[] = [];
  for (const row of o.entries) {
    if (!row || typeof row !== "object") {
      return { ok: false, error: "invalid manifest entry" };
    }
    const e = row as Record<string, unknown>;
    if (typeof e.logicalPath !== "string" || !e.logicalPath.trim()) {
      return { ok: false, error: "entry.logicalPath required" };
    }
    if (e.logicalPath.includes("..") || e.logicalPath.startsWith("/")) {
      return { ok: false, error: `unsafe logicalPath: ${e.logicalPath}` };
    }
    if (e.kind !== "file" && e.kind !== "dir") {
      return { ok: false, error: `entry.kind invalid for ${e.logicalPath}` };
    }
    const role = e.role;
    if (
      role !== undefined &&
      role !== "ledger" &&
      role !== "messages" &&
      role !== "notifications"
    ) {
      return { ok: false, error: `entry.role invalid for ${e.logicalPath}` };
    }
    entries.push({
      logicalPath: e.logicalPath,
      kind: e.kind,
      ...(role ? { role } : {}),
    });
  }
  return {
    ok: true,
    manifest: {
      formatVersion: HOST_BACKUP_FORMAT_VERSION,
      kind: HOST_BACKUP_KIND,
      createdAt: o.createdAt,
      studioHomeHint: o.studioHomeHint,
      entries,
    },
  };
}

export type HostRestorePlanEntry = {
  logicalPath: string;
  kind: HostBackupEntryKind;
  /** Path inside the backup bundle (`outDir/data/...`). */
  bundleAbs: string;
  /** Absolute restore destination on the target Host. */
  destAbs: string;
  role?: HostBackupDbRole;
};

/**
 * Map manifest entries → restore destinations.
 * DB roles use `targetDbPaths`; everything else lands under `targetStudioHome`.
 */
export function buildHostRestorePlan(input: {
  manifest: HostBackupManifest;
  backupDir: string;
  targetStudioHome: string;
  targetDbPaths: HostBackupDbSources;
  joinPath: (...parts: string[]) => string;
}): HostRestorePlanEntry[] | { error: string } {
  const { manifest, backupDir, targetStudioHome, targetDbPaths, joinPath } =
    input;
  const out: HostRestorePlanEntry[] = [];
  for (const e of manifest.entries) {
    const bundleAbs = joinHostBackupDataPath(
      joinPath,
      backupDir,
      e.logicalPath,
    );
    let destAbs: string;
    if (e.role) {
      const dest = targetDbPaths[e.role]?.trim();
      if (!dest) {
        return {
          error: `target DB path missing for role ${e.role}`,
        };
      }
      destAbs = dest;
    } else {
      destAbs = joinPath(targetStudioHome, e.logicalPath);
    }
    out.push({
      logicalPath: e.logicalPath,
      kind: e.kind,
      bundleAbs,
      destAbs,
      role: e.role,
    });
  }
  return out;
}

/** Default DB paths under a studio home (preferred when AGENT_STUDIO_*_DB unset). */
export function defaultHostBackupDbPathsUnderHome(
  studioHome: string,
  joinPath: (...parts: string[]) => string,
): Required<HostBackupDbSources> {
  return {
    ledger: joinPath(studioHome, "studio.db"),
    messages: joinPath(studioHome, "messages.db"),
    notifications: joinPath(studioHome, "notifications.db"),
  };
}
