/**
 * SES-lite skill promote — version + score delta on forge/approve (Wave 3).
 */

import type { SkillLearnEntry } from "./skill-learn-pure.js";

export type SkillPromoteMeta = {
  version: number;
  scoreDelta: number;
  kind: "skill.forged" | "skill.patched";
};

/** Parse `version: N` from SKILL.md frontmatter body (default 1). */
export function parseSkillBodyVersion(body: string): number {
  const m = body.match(/^version:\s*(\d+)\s*$/m);
  if (!m) return 1;
  const n = Number(m[1]);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

/** Next version after promote (bump when target already existed). */
export function nextSkillPromoteVersion(input: {
  pendingBody: string;
  targetExisted: boolean;
}): number {
  const base = parseSkillBodyVersion(input.pendingBody);
  return input.targetExisted ? base + 1 : base;
}

export function skillPromoteMeta(input: {
  entry: SkillLearnEntry;
  confidence?: number;
  targetExisted?: boolean;
  pendingBody?: string;
}): SkillPromoteMeta {
  const forged =
    (input.entry.source ?? "").includes("session:") ||
    input.entry.origin === "self_learn";
  const version = nextSkillPromoteVersion({
    pendingBody: input.pendingBody ?? "",
    targetExisted: input.targetExisted === true,
  });
  const scoreDelta = Math.min(
    1,
    Math.max(0, typeof input.confidence === "number" ? input.confidence : 0.5),
  );
  return {
    version,
    scoreDelta,
    kind: forged ? "skill.forged" : "skill.patched",
  };
}
