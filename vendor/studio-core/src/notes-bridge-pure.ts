/**
 * Notes = plain markdown vaults (studio-wide + per-project).
 * Studio bridges search / retrieve / promote + DeskPane editor I/O.
 */

export type NotesScope = "studio" | "project";

export type NotesVaultConfig = {
  /**
   * Legacy studio vault override (`~/…` or absolute).
   * When non-empty, preferred over `studioRoot` for studio scope.
   */
  vault: string;
  /** Studio-wide notes root (default `~/.glassbox-studio/notes`). */
  studioRoot: string;
  /** Per-project relative notes dir (default `.glassbox-studio/notes`). */
  projectRel: string;
  /** Inject vault hits into chat turns when a vault resolves (default true). */
  injectOnTurn?: boolean;
  /** Max notes per turn. */
  injectLimit?: number;
};

export type NotesPromoteFrontmatter = {
  origin: "self_learn" | "imported" | "hand_authored";
  scope: "studio" | "project";
  projectId?: string | null;
  sourceRun?: string | null;
};

export type NoteHit = { path: string; snippet: string };

export type NotesTreeNode = {
  name: string;
  /** Vault-relative path using `/` separators. */
  path: string;
  kind: "dir" | "file";
  children?: NotesTreeNode[];
  /** File mtime (ms since epoch). Dirs omit or use max child mtime when set. */
  mtimeMs?: number;
};

/** Expand ~/ for display; does not touch the filesystem. */
export function normalizeVaultPath(raw: string, homeDir: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (t.startsWith("~/")) {
    const home = homeDir.replace(/\/$/, "");
    return `${home}/${t.slice(2)}`;
  }
  return t;
}

/** Effective studio notes root string from config (before ~/ expand). */
export function notesStudioRootRaw(notes: {
  vault: string;
  studioRoot: string;
}): string {
  const vault = notes.vault.trim();
  if (vault) return vault;
  return notes.studioRoot.trim() || "~/.glassbox-studio/notes";
}

export function notesBridgeEnabled(vaultOrRoot: string): boolean {
  return vaultOrRoot.trim().length > 0;
}

/**
 * Resolve a vault-relative path to an absolute path under `vaultRoot`.
 * Returns null when the path escapes the vault or is invalid.
 */
export function resolveNotesVaultRelativePath(
  vaultRoot: string,
  relPath: string,
): string | null {
  const root = vaultRoot.replace(/\/+$/, "");
  if (!root) return null;
  const rel = relPath.replace(/\\/g, "/").replace(/^\/+/, "").trim();
  if (!rel) return null;
  if (rel.includes("\0")) return null;
  const parts = rel.split("/").filter((p) => p.length > 0);
  if (!parts.length) return null;
  for (const part of parts) {
    if (part === "." || part === "..") return null;
    if (part.startsWith(".")) return null;
  }
  const abs = `${root}/${parts.join("/")}`;
  // Soft check: normalized form must stay under root + "/"
  const normRoot = root;
  if (abs !== normRoot && !abs.startsWith(`${normRoot}/`)) return null;
  return abs;
}

/** Sanitize a single path segment for create/mkdir. */
export function sanitizeNotesPathSegment(raw: string): string | null {
  const t = raw.trim().replace(/[/\\]/g, "");
  if (!t || t === "." || t === "..") return null;
  if (t.startsWith(".")) return null;
  if (/[\0]/.test(t)) return null;
  return t;
}

export function ensureMarkdownNoteRelPath(relPath: string): string | null {
  const cleaned = relPath.replace(/\\/g, "/").replace(/^\/+/, "").trim();
  if (!cleaned.toLowerCase().endsWith(".md")) return null;
  return resolveNotesVaultRelativePath("/virtual", cleaned) ? cleaned : null;
}

export function buildNotePromoteMarkdown(
  title: string,
  body: string,
  meta: NotesPromoteFrontmatter,
): string {
  const lines = [
    "---",
    `origin: ${meta.origin}`,
    `scope: ${meta.scope}`,
  ];
  if (meta.projectId) lines.push(`projectId: ${meta.projectId}`);
  if (meta.sourceRun) lines.push(`source_run: ${meta.sourceRun}`);
  lines.push("---", "", `# ${title.trim() || "Note"}`, "", body.trim(), "");
  return lines.join("\n");
}

/** Simple case-insensitive substring match over path + content snippets. */
export function filterNoteHits(
  hits: readonly { path: string; snippet: string }[],
  query: string,
  limit = 12,
): { path: string; snippet: string }[] {
  const q = query.trim().toLowerCase();
  const list = !q
    ? [...hits]
    : hits.filter(
        (h) =>
          h.path.toLowerCase().includes(q) ||
          h.snippet.toLowerCase().includes(q),
      );
  return list.slice(0, Math.max(1, limit));
}

export function formatNotesBundleSlice(
  hits: readonly NoteHit[] | readonly string[],
): string {
  if (!hits.length) return "";
  const lines = hits.map((h, i) => {
    if (typeof h === "string") return `${i + 1}. ${h}`;
    const snip = h.snippet.trim() ? ` — ${h.snippet.slice(0, 160)}` : "";
    return `${i + 1}. ${h.path}${snip}`;
  });
  return [
    "## Notes (vault, retrieved)",
    "Vault notes selected for this turn (glass-box — paths are vault-relative):",
    ...lines,
  ].join("\n");
}

/** Build a short search query from the latest user message for vault retrieve. */
export function noteQueryFromUserMessage(content: string): string {
  const t = content.trim().replace(/\s+/g, " ");
  if (!t) return "";
  if (t.length < 3) return "";
  return t.slice(0, 200);
}

export function notesInjectEnabled(notes: {
  vault: string;
  studioRoot?: string;
  injectOnTurn?: boolean;
}): boolean {
  const root = notesStudioRootRaw({
    vault: notes.vault,
    studioRoot: notes.studioRoot ?? "~/.glassbox-studio/notes",
  });
  if (!notesBridgeEnabled(root)) return false;
  return notes.injectOnTurn !== false;
}

/** Sort dirs first, then files, by name. */
export function sortNotesTreeNodes(
  nodes: NotesTreeNode[],
): NotesTreeNode[] {
  return [...nodes].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}
