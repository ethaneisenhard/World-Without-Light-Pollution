/**
 * SkillForge-like — trace → staged skill candidate (Wave 3).
 * Studio-owned; no AGNT Goals OS.
 */

export type SkillForgeTraceInput = {
  projectId: string;
  sessionId: string | null;
  /** Concatenated tool names / brief trail. */
  toolTrail: readonly string[];
  userIntent: string;
  assistantSummary?: string;
};

export type SkillForgeCandidate = {
  id: string;
  title: string;
  body: string;
  confidence: number;
  source: string;
};

export function createSkillForgeId(now = Date.now()): string {
  return `forge_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Heuristic candidate from a successful tool-heavy turn.
 * Low confidence unless enough tools — human Approve still required.
 */
export function forgeSkillCandidateFromTrace(
  input: SkillForgeTraceInput,
  now = Date.now(),
): SkillForgeCandidate | null {
  const tools = input.toolTrail.map((t) => t.trim()).filter(Boolean);
  const intent = input.userIntent.trim();
  if (!intent || tools.length < 2) return null;

  const title = intent.slice(0, 60).replace(/\s+/g, " ");
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "forged-skill";

  const body = [
    `---`,
    `name: ${slug}`,
    `description: Forged from Studio turn — review before promote.`,
    `---`,
    ``,
    `# ${title}`,
    ``,
    `## When to use`,
    ``,
    intent.slice(0, 400),
    ``,
    `## Tool trail observed`,
    ``,
    ...tools.slice(0, 20).map((t) => `- \`${t}\``),
    ``,
    input.assistantSummary?.trim()
      ? `## Notes\n\n${input.assistantSummary.trim().slice(0, 800)}\n`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const confidence = Math.min(0.9, 0.35 + tools.length * 0.08);
  return {
    id: createSkillForgeId(now),
    title: slug,
    body,
    confidence,
    source: `session:${input.sessionId ?? "none"}:project:${input.projectId}`,
  };
}
