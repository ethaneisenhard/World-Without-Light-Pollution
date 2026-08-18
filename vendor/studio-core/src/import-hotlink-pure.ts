/**
 * Relative import hotlinks for Code preview (Cmd/Ctrl-click to open).
 * Pure — no fs / fetch. Existence checks stay in the host.
 */

import { pathDirname } from "./path-pure.js";

export type ImportHotlink = {
  /** Specifier as written (`../inspect-attrs.ts`). */
  specifier: string;
  /** Project-relative path candidates (first is preferred). */
  candidates: string[];
  /** Inclusive start index of specifier in source (not quotes). */
  start: number;
  /** Exclusive end index of specifier in source. */
  end: number;
};

const FROM_RE = /\bfrom\s+['"](\.[^'"]+)['"]/g;
const SIDE_EFFECT_IMPORT_RE = /\bimport\s+['"](\.[^'"]+)['"]/g;
const CALL_IMPORT_RE = /\b(?:require|import)\s*\(\s*['"](\.[^'"]+)['"]/g;

function pushMatch(
  source: string,
  re: RegExp,
  into: Map<string, ImportHotlink>,
  fromFile: string,
): void {
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const specifier = m[1]!;
    if (into.has(specifier)) continue;
    const base = resolveRelativeImportPath(fromFile, specifier);
    if (!base) continue;
    const start = m.index + m[0]!.lastIndexOf(specifier);
    into.set(specifier, {
      specifier,
      candidates: extensionCandidates(fromFile, base),
      start,
      end: start + specifier.length,
    });
  }
}

/** Normalize `a/b/../c` → `a/c`; reject escape above project root. */
export function normalizeProjectRelativePath(path: string): string | null {
  const parts: string[] = [];
  for (const seg of path.replace(/\\/g, "/").split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") {
      if (parts.length === 0) return null;
      parts.pop();
      continue;
    }
    parts.push(seg);
  }
  return parts.join("/");
}

/**
 * Resolve `./` / `../` specifier against the file that contains the import.
 * Returns null for bare / package imports.
 */
export function resolveRelativeImportPath(
  fromFile: string,
  specifier: string,
): string | null {
  const spec = specifier.trim();
  if (!spec.startsWith("./") && !spec.startsWith("../")) return null;
  const dir = pathDirname(fromFile.replace(/\\/g, "/"));
  const joined = dir ? `${dir}/${spec}` : spec;
  return normalizeProjectRelativePath(joined);
}

function extensionCandidates(fromFile: string, base: string): string[] {
  if (/\.[a-zA-Z0-9]+$/.test(base)) return [base];
  const fromExt = fromFile.match(/\.[a-zA-Z0-9]+$/)?.[0] ?? ".ts";
  const exts = [
    fromExt,
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".css",
    ".json",
  ];
  const unique = [...new Set(exts)];
  const out: string[] = [];
  for (const e of unique) {
    out.push(`${base}${e}`);
  }
  for (const e of unique) {
    out.push(`${base}/index${e}`);
  }
  return out;
}

/** Scan source for relative import/export/require/dynamic-import string literals. */
export function listRelativeImportHotlinks(
  fromFile: string,
  source: string,
): ImportHotlink[] {
  const map = new Map<string, ImportHotlink>();
  pushMatch(source, FROM_RE, map, fromFile);
  pushMatch(source, SIDE_EFFECT_IMPORT_RE, map, fromFile);
  pushMatch(source, CALL_IMPORT_RE, map, fromFile);
  return [...map.values()];
}

/**
 * Every relative-import occurrence (including repeats) — for editor decorations.
 */
export function listAllRelativeImportHotlinkRanges(
  fromFile: string,
  source: string,
): ImportHotlink[] {
  const out: ImportHotlink[] = [];
  const pushAll = (re: RegExp) => {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(source)) !== null) {
      const specifier = m[1]!;
      const base = resolveRelativeImportPath(fromFile, specifier);
      if (!base) continue;
      const start = m.index + m[0]!.lastIndexOf(specifier);
      out.push({
        specifier,
        candidates: extensionCandidates(fromFile, base),
        start,
        end: start + specifier.length,
      });
    }
  };
  pushAll(FROM_RE);
  pushAll(SIDE_EFFECT_IMPORT_RE);
  pushAll(CALL_IMPORT_RE);
  return out;
}

/** Hit-test source offset (e.g. textarea caret) against import string + quotes. */
export function importHotlinkAtOffset(
  fromFile: string,
  source: string,
  offset: number,
): ImportHotlink | null {
  if (offset < 0 || offset > source.length) return null;
  for (const link of listRelativeImportHotlinks(fromFile, source)) {
    // Include surrounding quotes so Cmd-click on `"` still works.
    if (offset >= link.start - 1 && offset <= link.end + 1) return link;
  }
  return null;
}

/**
 * Preferred open path when the host has not probed existence yet.
 * Prefer explicit extension; else same extension as the current file.
 */
export function preferredImportHotlinkPath(link: ImportHotlink): string {
  return link.candidates[0] ?? "";
}
