/**
 * ContextBundle — one packet every harness gets (studio / cursor / kody / …).
 */

export type ContextBundleV1 = {
  version: 1;
  projectId: string;
  /** Merged rules + skills + UI context. */
  system: string;
  /** Effective tool allowlist; null = all catalog tools; [] = none. */
  allowTools: readonly string[] | null;
  harnessId: string;
};

export function buildContextBundle(input: {
  projectId: string;
  harnessId: string;
  systemParts: readonly (string | null | undefined)[];
  allowTools: readonly string[] | null;
}): ContextBundleV1 {
  const system = input.systemParts
    .map((p) => (typeof p === "string" ? p.trim() : ""))
    .filter(Boolean)
    .join("\n\n");
  return {
    version: 1,
    projectId: input.projectId,
    system,
    allowTools: input.allowTools,
    harnessId: input.harnessId,
  };
}

/**
 * Intersect allowlists. null = unrestricted at that layer.
 * Empty array at any layer → no tools.
 */
export function intersectAllowlists(
  ...layers: Array<readonly string[] | null | undefined>
): readonly string[] | null {
  let current: readonly string[] | null = null;
  for (const layer of layers) {
    if (layer === undefined) continue;
    if (layer === null) continue;
    if (layer.length === 0) return [];
    if (current === null) {
      current = [...layer];
      continue;
    }
    const set = new Set(layer);
    current = current.filter((id) => set.has(id));
    if (current.length === 0) return [];
  }
  return current;
}
