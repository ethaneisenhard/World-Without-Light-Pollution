/**
 * Cross-project prefs inject policy (Wave 6).
 */

import type { MemoryRow } from "./memory-pure.js";
import { isMemoryPref } from "./memory-retrieve-pure.js";

export type PrefsInjectPolicy = "studio_only" | "studio_and_project" | "off";

export function parsePrefsInjectPolicy(raw: unknown): PrefsInjectPolicy {
  if (raw === "off" || raw === "studio_only" || raw === "studio_and_project") {
    return raw;
  }
  return "studio_and_project";
}

/** Filter which Memory rows may inject for a chat scope. */
export function filterPrefsForInject(input: {
  rows: readonly MemoryRow[];
  /** null / _studio = Global chat. */
  projectId: string | null;
  policy: PrefsInjectPolicy;
}): MemoryRow[] {
  if (input.policy === "off") return [];
  const prefs = input.rows.filter(
    (r) => r.status === "active" && isMemoryPref(r),
  );
  if (input.policy === "studio_only") {
    return prefs.filter((r) => r.scope === "studio");
  }
  // studio_and_project: studio prefs always; project prefs when in project
  if (!input.projectId) {
    return prefs.filter((r) => r.scope === "studio");
  }
  return prefs.filter(
    (r) =>
      r.scope === "studio" ||
      (r.scope === "project" && r.projectId === input.projectId),
  );
}
