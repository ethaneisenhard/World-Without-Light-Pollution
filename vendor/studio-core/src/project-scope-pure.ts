/**
 * ProjectScope — relative paths under a project; reject escape.
 * Pure: no fs, no path module.
 */

/** Normalize to project-relative POSIX path; throw if escapes root via `..`. */
export function assertPathInProject(filePath: string): string {
  const raw = filePath.trim().replace(/\\/g, "/");
  if (!raw) throw new Error("Path required");
  if (raw.startsWith("/") || /^[a-zA-Z]:/.test(raw)) {
    throw new Error("Path escapes project root");
  }
  const parts = raw.split("/").filter((p) => p.length > 0 && p !== ".");
  const out: string[] = [];
  for (const part of parts) {
    if (part === "..") {
      if (out.length === 0) throw new Error("Path escapes project root");
      out.pop();
      continue;
    }
    out.push(part);
  }
  return out.join("/");
}
