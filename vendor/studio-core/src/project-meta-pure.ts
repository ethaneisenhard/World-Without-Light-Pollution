/**
 * Project meta dir — prefer `.glassbox-studio`, fall back `.agent-studio` (ADR-0020).
 * Writes use preferred; reads try preferred then legacy.
 */

export const PROJECT_META_DIRNAME_PREFERRED = ".glassbox-studio";
export const PROJECT_META_DIRNAME_LEGACY = ".agent-studio";

/** Rel path under project root for a meta file (writes / new scaffolds). */
export function projectMetaRel(...parts: string[]): string {
  return [PROJECT_META_DIRNAME_PREFERRED, ...parts.filter(Boolean)].join("/");
}

/** Candidate rel paths for dual-read (preferred first). */
export function projectMetaCandidates(...parts: string[]): readonly string[] {
  const tail = parts.filter(Boolean).join("/");
  if (!tail) {
    return [PROJECT_META_DIRNAME_PREFERRED, PROJECT_META_DIRNAME_LEGACY];
  }
  return [
    `${PROJECT_META_DIRNAME_PREFERRED}/${tail}`,
    `${PROJECT_META_DIRNAME_LEGACY}/${tail}`,
  ];
}

/** Match either meta dirname in a path segment (refresh / watch filters). */
export function isProjectMetaPathSegment(segment: string): boolean {
  switch (segment) {
    case PROJECT_META_DIRNAME_PREFERRED:
    case PROJECT_META_DIRNAME_LEGACY:
      return true;
    default:
      return false;
  }
}
