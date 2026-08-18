/**
 * Agent skills catalog — progressive disclosure (agentskills.io shape).
 * Skills live in folder trees; ids are path-relative from each skills root.
 */

export type SkillSource = "bundled" | "studio" | "project";

export type SkillSummary = {
  /** Path-relative id within the skills root (e.g. engineering/mvp-drain). */
  id: string;
  name: string;
  description: string;
  /** Absolute or repo-relative path to SKILL.md */
  path: string;
  source: SkillSource;
  /** Parent folder path within the skills root ("" if skill sits at root). */
  folder: string;
};

/** Parse YAML-ish frontmatter name/description from SKILL.md */
export function parseSkillFrontmatter(raw: string): {
  name?: string;
  description?: string;
  body: string;
} {
  const trimmed = raw.replace(/^\uFEFF/, "");
  if (!trimmed.startsWith("---")) {
    return { body: trimmed };
  }
  const end = trimmed.indexOf("\n---", 3);
  if (end < 0) return { body: trimmed };
  const fm = trimmed.slice(3, end).trim();
  const body = trimmed.slice(end + 4).replace(/^\n+/, "");
  let name: string | undefined;
  let description: string | undefined;
  for (const line of fm.split("\n")) {
    const m = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line.trim());
    if (!m) continue;
    const key = m[1]!.toLowerCase();
    const val = m[2]!.trim().replace(/^["']|["']$/g, "");
    if (key === "name" && val) name = val;
    if (key === "description" && val) description = val;
  }
  return { name, description, body };
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/\/+/g, "/");
}

/**
 * Skill id = relative path from skills root to the skill folder (no SKILL.md).
 * Prefers `skillsRoot` when provided; otherwise strips a trailing `/skills/` segment.
 */
export function skillIdFromPath(
  skillMdPath: string,
  skillsRoot?: string | null,
): string {
  const norm = normalizePath(skillMdPath);
  const rootNorm = skillsRoot
    ? normalizePath(skillsRoot).replace(/\/$/, "")
    : "";

  let rel = norm;
  if (rootNorm && (norm === rootNorm || norm.startsWith(`${rootNorm}/`))) {
    rel = norm.slice(rootNorm.length).replace(/^\//, "");
  } else {
    const marker = "/skills/";
    const idx = norm.toLowerCase().lastIndexOf(marker);
    if (idx >= 0) {
      rel = norm.slice(idx + marker.length);
    }
  }

  rel = rel.replace(/\/skill\.md$/i, "").replace(/^\/+|\/+$/g, "");
  if (rel) return rel;

  // Last resort: parent folder name of SKILL.md
  const parts = norm.split("/").filter(Boolean);
  const skillIdx = parts.findIndex((p) => p.toLowerCase() === "skill.md");
  if (skillIdx > 0) return parts[skillIdx - 1]!;
  const base = parts[parts.length - 1] ?? "skill";
  return base.replace(/\.md$/i, "") || "skill";
}

/** Folder containing the skill (id without the leaf segment). */
export function skillFolderFromId(id: string): string {
  const norm = normalizePath(id).replace(/^\/+|\/+$/g, "");
  const slash = norm.lastIndexOf("/");
  if (slash < 0) return "";
  return norm.slice(0, slash);
}

export function buildSkillSummary(input: {
  path: string;
  raw: string;
  source: SkillSource;
  /** Skills tree root used to build a path-relative id. */
  skillsRoot?: string | null;
  id?: string;
}): SkillSummary {
  const id = input.id ?? skillIdFromPath(input.path, input.skillsRoot);
  const parsed = parseSkillFrontmatter(input.raw);
  const leaf = id.includes("/") ? id.slice(id.lastIndexOf("/") + 1) : id;
  const name = parsed.name ?? leaf;
  let description = parsed.description ?? "";
  if (!description) {
    const heading = /^#\s+(.+)$/m.exec(parsed.body);
    description = heading?.[1]?.trim() ?? `Skill ${name}`;
  }
  return {
    id,
    name,
    description: description.slice(0, 280),
    path: input.path,
    source: input.source,
    folder: skillFolderFromId(id),
  };
}

export function filterSkills(
  skills: readonly SkillSummary[],
  query?: string,
): SkillSummary[] {
  const q = (query ?? "").trim().toLowerCase();
  if (!q) return [...skills];
  return skills.filter(
    (s) =>
      s.id.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.folder.toLowerCase().includes(q),
  );
}

/** Compact catalog for system context (names + one-line descriptions). */
export function buildSkillsCatalogPreamble(
  skills: readonly SkillSummary[],
): string {
  if (!skills.length) return "";
  const lines = skills.map(
    (s) => `- ${s.id}: ${s.description} (skills.read id="${s.id}")`,
  );
  return [
    "## Available skills",
    "Use skills.list / skills.read for progressive disclosure. Prefer a matching skill before inventing process.",
    "Skill ids are folder paths (e.g. engineering/mvp-drain). Nested folders are supported.",
    ...lines,
  ].join("\n");
}
