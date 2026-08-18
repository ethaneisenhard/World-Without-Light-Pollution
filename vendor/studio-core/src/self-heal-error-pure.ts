/**
 * Self-heal errors — summarize caught Studio errors into a chat fix prompt.
 * Opt-in via `ui.selfHealErrors` (auto-send). Manual "Ask chat to fix" always OK.
 */

export type SelfHealErrorInput = {
  /** Stable surface id — e.g. live-preview, client-banner, boot */
  source: string;
  /** Short human title / first line */
  title: string;
  /** Raw log / stack / snip (optional) */
  detail?: string;
  /** Extra context lines (project id, shell, …) */
  context?: string[];
};

export const SELF_HEAL_AUTO_COOLDOWN_MS = 60_000;

export function selfHealErrorSignature(input: SelfHealErrorInput): string {
  const title = input.title.trim().slice(0, 240);
  const detail = (input.detail ?? "").trim().slice(0, 480);
  return `${input.source}\n${title}\n${detail}`;
}

/** Truncate + collapse whitespace for a single prompt block. */
export function clipSelfHealText(raw: string, max = 3500): string {
  const t = raw.replace(/\r\n/g, "\n").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}\n…(truncated)`;
}

/**
 * Build the user message sent to chat when self-heal fires.
 * Plain language — agent should fix, not just explain.
 */
export function summarizeSelfHealPrompt(input: SelfHealErrorInput): string {
  const title = input.title.trim() || "Unknown error";
  const detail = clipSelfHealText(input.detail ?? "");
  const ctx = (input.context ?? [])
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 8);

  const lines: string[] = [
    "## Studio error — please fix",
    "",
    `**Where:** ${input.source}`,
    `**What happened:** ${title}`,
  ];
  if (ctx.length) {
    lines.push("", "**Context:**");
    for (const c of ctx) lines.push(`- ${c}`);
  }
  if (detail) {
    lines.push("", "**Error detail:**", "```", detail, "```");
  }
  lines.push(
    "",
    "Diagnose and fix this so the feature works again. Prefer concrete file/config changes over explaining only. If you need more info, ask one short question.",
  );
  return lines.join("\n");
}

export type SelfHealAutoDecision = "fire" | "skip_disabled" | "skip_cooldown";

export function decideSelfHealAuto(input: {
  enabled: boolean;
  signature: string;
  lastSignature: string;
  lastAt: number;
  now: number;
  cooldownMs?: number;
}): SelfHealAutoDecision {
  if (!input.enabled) return "skip_disabled";
  const cool = input.cooldownMs ?? SELF_HEAL_AUTO_COOLDOWN_MS;
  if (
    input.signature &&
    input.signature === input.lastSignature &&
    input.now - input.lastAt < cool
  ) {
    return "skip_cooldown";
  }
  return "fire";
}
