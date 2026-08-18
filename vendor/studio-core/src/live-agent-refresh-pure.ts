/**
 * When an agent (or Undo) writes a project file, decide whether Live should
 * auto-open / refresh so the user sees the change without a manual Website Preview click.
 *
 * Path rules are project-agnostic — trees + extensions, not project ids.
 */

const PREVIEW_TREE =
  /^(content|src|public|design|app|client|pages|components|styles)\//i;

const PREVIEW_EXT =
  /\.(css|scss|sass|less|html|htm|mdx|svg|tsx|jsx|vue|svelte)$/i;

const PREVIEW_ROOT_FILE =
  /^(index|main|app|styles|globals|layout|page)\.(css|scss|ts|tsx|js|jsx|mjs)$/i;

const SKIP_SEGMENT =
  /(^|\/)(node_modules|\.git|\.wrangler|\.(?:glassbox|agent)-studio|dist|build|coverage)(\/|$)/i;

const SKIP_TEST = /\.(test|spec)\.(ts|tsx|js|jsx|mjs)$/i;

/** Normalize to forward-slash project-relative path. */
export function normalizeProjectWritePath(filePath: string): string {
  return filePath
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
}

/**
 * True when writing this path should open Live (if closed) and refresh iframes.
 */
export function shouldAutoOpenLiveAfterWrite(filePath: string): boolean {
  const p = normalizeProjectWritePath(filePath);
  if (!p || p.includes("..")) return false;
  if (SKIP_SEGMENT.test(p)) return false;
  if (SKIP_TEST.test(p)) return false;

  const base = p.split("/").pop() ?? "";
  if (!base || base.startsWith(".")) return false;

  if (PREVIEW_TREE.test(p)) return true;
  if (PREVIEW_EXT.test(p)) return true;
  if (!p.includes("/") && PREVIEW_ROOT_FILE.test(base)) return true;

  return false;
}
