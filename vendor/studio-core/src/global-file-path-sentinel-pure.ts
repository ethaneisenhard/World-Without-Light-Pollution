/**
 * Hermes-style path discipline for Global / files.* resolve.
 *
 * Hermes refuses cwd sentinels (`.`, `auto`, …) as real directories so a stale
 * string cannot silently anchor edits to the wrong tree. Studio steals that
 * for disk-relative segments after alias parse: `.` / empty = root, and
 * `@studio` / `@ws` must never reach `listFiles(root, rel)` as a folder name.
 */
import { assertPathInProject } from "./project-scope-pure.js";

/** Mean "root / unset" — never a directory name to scandir. */
export const FILE_REL_SENTINELS = new Set(["", ".", "./"]);

/**
 * Alias catalog (ship bar): new `@…` disk root → add here + `parseGlobalFilePath`
 * case + matrix test in `global-file-path-sentinel-pure.test.ts` same PR.
 * Docs: `docs/architecture/shell-vs-harness.md` § Path roots.
 */
export const FILE_PATH_ALIAS_ROOTS = ["@studio", "@ws"] as const;

export function isFileRelSentinel(rel: string): boolean {
  const t = rel.trim().replace(/\\/g, "/");
  return FILE_REL_SENTINELS.has(t);
}

/** Collapse Hermes-style rel sentinels to monorepo/project root (`""`). */
export function normalizeFileRelSentinel(rel: string): string {
  const t = rel.trim().replace(/\\/g, "/");
  if (isFileRelSentinel(t)) return "";
  return t;
}

/**
 * First path segment is a Studio path alias → parse leaked; refuse disk join.
 * Nested `@scope` packages (`node_modules/@types/…`) stay allowed.
 */
export function assertNoLeakedPathAlias(rel: string): void {
  const t = normalizeFileRelSentinel(rel);
  if (!t) return;
  const first = t.split("/").find((p) => p.length > 0 && p !== ".") ?? "";
  for (const alias of FILE_PATH_ALIAS_ROOTS) {
    if (first === alias) {
      throw new Error(
        `Path alias "${alias}" leaked as a disk-relative path — use @studio/… or @ws/<projectId>/… (parse before join)`,
      );
    }
  }
}

/**
 * Normalize + project-scope + alias-leak check for a path under an already
 * chosen root. Empty / `.` → `""` (list root).
 */
export function toDiskRel(relRaw: string): string {
  const n = normalizeFileRelSentinel(relRaw);
  if (!n) return "";
  const rel = assertPathInProject(n);
  assertNoLeakedPathAlias(rel);
  return rel;
}
