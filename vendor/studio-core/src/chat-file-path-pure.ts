/**
 * Detect project-relative file paths in chat markdown (codespans / links)
 * so the Studio shell can open them in the Code panel — harness-agnostic.
 */
import { GLOBAL_WORKSPACE_PATH_PREFIX } from "./global-file-access-pure.js";
import { normalizeProjectRelativePath } from "./import-hotlink-pure.js";

/** DOM attr stamped on chat file links (click host). */
export const CHAT_OPEN_FILE_ATTR = "data-studio-open-file";

/** Monorepo citation: `projects/<workspaceId>/…` (Global / _studio chat). */
const PROJECTS_WORKSPACE_PATH_RE = /^projects\/([^/]+)\/(.+)$/;

/** Source / config / docs extensions agents commonly cite. */
const FILE_EXT_RE =
  /\.(?:tsx?|jsx?|m?[jt]sx?|cts|mts|mjs|cjs|jsonc?|mdx?|mdc|css|scss|less|html?|toml|ya?ml|svg|png|jpe?g|gif|webp|avif|ico|txt|csv|tsv|xml|sh|bash|zsh|sql|py|rs|go|java|kt|swift|rb|php|vue|svelte|astro|wasm|map|lock|env|example|prisma|graphql|gql|proto|tf|hcl|plist|conf|ini|cfg|properties|gradle|cmake|mk)$/i;

const LINE_COL_SUFFIX_RE = /:(\d+)(?::\d+)?$/;
const TRAILING_PUNCT_RE = /[.,;:!?)\]}'"`]+$/;
const LEADING_PUNCT_RE = /^[('"`]+/;
/** Cursor / agent citation: `12:15:path/to/file.ts` */
const CITE_LINE_RANGE_RE = /^(\d+):(\d+):(.+)$/;
/** Prose abbreviations that look like `x.y` after punct strip. */
const ABBREV_RE = /^(?:e\.g|i\.e|etc|vs|mr|mrs|dr|approx|fig|vol|pp|cf|al)\.?$/i;

/**
 * If `raw` looks like a project-relative source path, return normalized path.
 * Otherwise null (URLs, absolutes, package pins, prose abbreviations).
 */
export function parseChatFilePath(raw: string): string | null {
  let t = String(raw ?? "").trim();
  if (!t || t.length > 512) return null;

  const cite = t.match(CITE_LINE_RANGE_RE);
  if (cite) t = cite[3]!.trim();

  t = t.replace(LEADING_PUNCT_RE, "").replace(TRAILING_PUNCT_RE, "");
  t = t.replace(/\\/g, "/").replace(/^\.\//, "");
  t = t.replace(LINE_COL_SUFFIX_RE, "");

  if (!t) return null;
  if (ABBREV_RE.test(t)) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return null; // http:, mailto:, …
  if (t.startsWith("/") || t.startsWith("~")) return null;
  if (t.includes("\0") || t.includes("://")) return null;
  // npm-style pin without path: react@18.2.0
  if (/^@?[a-zA-Z0-9._-]+@\d/.test(t) && !t.includes("/")) return null;

  const leaf = t.split("/").pop() ?? t;
  if (!FILE_EXT_RE.test(leaf)) return null;
  // Bare filenames OK; reject dotted type tokens without a known ext already handled.

  return normalizeProjectRelativePath(t);
}

/**
 * Map a chat file citation to shell nav: optional workspace switch + project-relative path.
 * - `projects/<id>/rel` → enter workspace `id`, open `rel`
 * - `@ws/<id>/rel` → same
 * - otherwise → keep current workspace, open path as-is
 */
export type ChatOpenFileNav = {
  /** Workspace to enter; null = stay on current shell project. */
  projectId: string | null;
  /** Path for `/api/projects/:id/files/read` (project-relative). */
  filePath: string;
};

export function resolveChatOpenFileNav(raw: string): ChatOpenFileNav | null {
  const path = parseChatFilePath(raw);
  if (!path) return null;

  if (path.startsWith(GLOBAL_WORKSPACE_PATH_PREFIX)) {
    const rest = path.slice(GLOBAL_WORKSPACE_PATH_PREFIX.length);
    const slash = rest.indexOf("/");
    if (slash <= 0) return null;
    const projectId = rest.slice(0, slash).trim();
    const filePath = rest.slice(slash + 1).trim();
    if (!projectId || !filePath) return null;
    return { projectId, filePath };
  }

  const projects = path.match(PROJECTS_WORKSPACE_PATH_RE);
  if (projects) {
    const projectId = projects[1]!.trim();
    const filePath = projects[2]!.trim();
    if (!projectId || !filePath) return null;
    return { projectId, filePath };
  }

  return { projectId: null, filePath: path };
}

/** True when a codespan / link text should become a Code-panel opener. */
export function isChatFilePath(raw: string): boolean {
  return parseChatFilePath(raw) != null;
}

/**
 * Escape for HTML attribute / text (paths are already sanitized; keep XSS-safe).
 */
export function escapeChatFilePathHtml(raw: string): string {
  return raw
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Build an inline file link wrapping a codespan (or plain label).
 */
export function chatFileLinkHtml(opts: {
  path: string;
  labelHtml?: string;
  wrapCode?: boolean;
}): string {
  const path = parseChatFilePath(opts.path);
  if (!path) return opts.labelHtml ?? escapeChatFilePathHtml(opts.path);
  const label =
    opts.labelHtml ??
    (opts.wrapCode !== false
      ? `<code>${escapeChatFilePathHtml(path)}</code>`
      : escapeChatFilePathHtml(path));
  const attr = escapeChatFilePathHtml(path);
  return `<a href="#studio-file" class="as-chat-file-link" ${CHAT_OPEN_FILE_ATTR}="${attr}" title="Open in Code">${label}</a>`;
}
