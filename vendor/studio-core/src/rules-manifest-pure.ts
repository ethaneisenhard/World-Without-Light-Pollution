/**
 * Studio + project rules manifests — merge (project overlays studio on id).
 */

export type RulesManifestEntry = {
  id: string;
  /** Relative path under rules/ dir (e.g. "writing.md"). */
  path: string;
  enabled: boolean;
  title?: string;
};

export type RulesManifest = {
  version: 1;
  rules: RulesManifestEntry[];
};

export type MergedRule = RulesManifestEntry & {
  scope: "studio" | "project";
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function emptyRulesManifest(): RulesManifest {
  return { version: 1, rules: [] };
}

export function parseRulesManifest(raw: unknown): RulesManifest {
  if (!isRecord(raw) || !Array.isArray(raw.rules)) return emptyRulesManifest();
  const rules: RulesManifestEntry[] = [];
  for (const item of raw.rules) {
    if (!isRecord(item) || typeof item.id !== "string" || !item.id.trim()) {
      continue;
    }
    if (typeof item.path !== "string" || !item.path.trim()) continue;
    rules.push({
      id: item.id.trim(),
      path: item.path.trim().replace(/^\/+/, ""),
      enabled: item.enabled !== false,
      title: typeof item.title === "string" ? item.title : undefined,
    });
  }
  return { version: 1, rules };
}

/** Project entries replace studio entries with the same id. */
export function mergeRulesManifests(
  studio: RulesManifest,
  project: RulesManifest | null | undefined,
): MergedRule[] {
  const map = new Map<string, MergedRule>();
  for (const r of studio.rules) {
    map.set(r.id, { ...r, scope: "studio" });
  }
  if (project) {
    for (const r of project.rules) {
      map.set(r.id, { ...r, scope: "project" });
    }
  }
  return [...map.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/** Set enabled flag on a rule id; returns new manifest. */
export function setRuleEnabled(
  manifest: RulesManifest,
  id: string,
  enabled: boolean,
): RulesManifest {
  return {
    version: 1,
    rules: manifest.rules.map((r) =>
      r.id === id ? { ...r, enabled } : r,
    ),
  };
}

/**
 * Build system preamble from enabled rule bodies.
 * `bodies` maps rule id → file text.
 */
export function buildRulesSystemPreamble(
  merged: readonly MergedRule[],
  bodies: ReadonlyMap<string, string> | Record<string, string>,
): string {
  const get =
    bodies instanceof Map
      ? (id: string) => bodies.get(id)
      : (id: string) => bodies[id];
  const chunks: string[] = [];
  for (const rule of merged) {
    if (!rule.enabled) continue;
    const body = get(rule.id)?.trim();
    if (!body) continue;
    const title = rule.title ?? rule.id;
    chunks.push(`### Rule: ${title} (${rule.scope})\n${body}`);
  }
  if (!chunks.length) return "";
  return `Studio rules (follow when relevant):\n\n${chunks.join("\n\n")}`;
}
