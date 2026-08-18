/**
 * Skill learn inbox — staged creates/patches before they land in skills dirs.
 */

export type SkillLearnOrigin =
  | "self_learn"
  | "imported"
  | "hand_authored"
  | "harness_synced";

export type SkillLearnStatus = "staged" | "approved" | "rejected" | "active";

export type SkillLearnEntry = {
  id: string;
  skillId: string;
  origin: SkillLearnOrigin;
  status: SkillLearnStatus;
  source: string | null;
  /** Relative path under pending skills root. */
  pendingPath: string;
  /** Target path when approved (project or bundled override). */
  targetPath: string;
  summary: string;
  createdAt: number;
  updatedAt: number;
};

export type SkillLearnManifest = {
  version: 1;
  entries: SkillLearnEntry[];
};

export function emptySkillLearnManifest(): SkillLearnManifest {
  return { version: 1, entries: [] };
}

export function createSkillLearnId(now = Date.now()): string {
  return `learn_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function parseSkillLearnManifest(raw: unknown): SkillLearnManifest {
  const empty = emptySkillLearnManifest();
  if (!raw || typeof raw !== "object") return empty;
  const entriesRaw = Array.isArray((raw as { entries?: unknown }).entries)
    ? (raw as { entries: unknown[] }).entries
    : [];
  const entries: SkillLearnEntry[] = [];
  for (const e of entriesRaw) {
    if (!e || typeof e !== "object") continue;
    const o = e as Record<string, unknown>;
    if (typeof o.id !== "string" || typeof o.skillId !== "string") continue;
    entries.push({
      id: o.id,
      skillId: o.skillId,
      origin:
        o.origin === "imported" ||
        o.origin === "hand_authored" ||
        o.origin === "harness_synced"
          ? o.origin
          : "self_learn",
      status:
        o.status === "approved" ||
        o.status === "rejected" ||
        o.status === "active"
          ? o.status
          : "staged",
      source: typeof o.source === "string" ? o.source : null,
      pendingPath: typeof o.pendingPath === "string" ? o.pendingPath : "",
      targetPath: typeof o.targetPath === "string" ? o.targetPath : "",
      summary: typeof o.summary === "string" ? o.summary : "",
      createdAt: typeof o.createdAt === "number" ? o.createdAt : 0,
      updatedAt: typeof o.updatedAt === "number" ? o.updatedAt : 0,
    });
  }
  return { version: 1, entries };
}

export function stageSkillLearn(
  manifest: SkillLearnManifest,
  entry: Omit<SkillLearnEntry, "status"> & { status?: SkillLearnStatus },
): SkillLearnManifest {
  const next: SkillLearnEntry = {
    ...entry,
    status: entry.status ?? "staged",
  };
  const others = manifest.entries.filter((e) => e.id !== next.id);
  return { version: 1, entries: [next, ...others] };
}

export function setSkillLearnStatus(
  manifest: SkillLearnManifest,
  id: string,
  status: SkillLearnStatus,
): SkillLearnManifest {
  return {
    version: 1,
    entries: manifest.entries.map((e) =>
      e.id === id ? { ...e, status, updatedAt: Date.now() } : e,
    ),
  };
}
