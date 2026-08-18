/**
 * Resolve SKILL.md target path — studio-wide vs project (no host _studio if).
 */

import { isStudioRootChatId } from "./chat-pure.js";
import { PROJECT_META_DIRNAME_PREFERRED } from "./project-meta-pure.js";

export function resolveSkillLearnTargetPath(input: {
  skillId: string;
  projectId: string | null | undefined;
  /** Absolute project root when project-scoped. */
  projectRoot: string | null;
  /** Absolute Studio home (already dual-read resolved). */
  homeDir: string;
  join: (...parts: string[]) => string;
}): { ok: true; targetPath: string } | { ok: false; error: string } {
  const skillId = input.skillId.trim();
  if (!skillId) return { ok: false, error: "skillId required" };

  const projectId = input.projectId?.trim() || null;
  if (projectId && !isStudioRootChatId(projectId)) {
    if (!input.projectRoot) return { ok: false, error: "unknown project" };
    return {
      ok: true,
      targetPath: input.join(
        input.projectRoot,
        PROJECT_META_DIRNAME_PREFERRED,
        "skills",
        skillId,
        "SKILL.md",
      ),
    };
  }

  return {
    ok: true,
    targetPath: input.join(input.homeDir, "skills", skillId, "SKILL.md"),
  };
}
