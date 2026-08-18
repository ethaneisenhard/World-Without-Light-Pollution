/** Directory / file names skipped when walking a project tree for Studio Files. */
export const TREE_SKIP_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  ".wrangler",
  ".turbo",
  "coverage",
]);

/** True when an entry name should be omitted from the recursive file tree. */
export function shouldSkipTreeEntry(name: string): boolean {
  if (!name || name === "." || name === "..") return true;
  if (name.startsWith(".")) return true;
  return TREE_SKIP_NAMES.has(name);
}
