/**
 * Studio chat response-style prefs → system prompt hints.
 */

export type ChatResponseVerbosity = "concise" | "balanced" | "detailed";
export type ChatResponseStructure = "freeform" | "structured";

export type ChatResponseStyle = {
  verbosity: ChatResponseVerbosity;
  structure: ChatResponseStructure;
};

export const DEFAULT_CHAT_RESPONSE_STYLE: ChatResponseStyle = {
  verbosity: "balanced",
  structure: "structured",
};

const VERBOSITIES: readonly ChatResponseVerbosity[] = [
  "concise",
  "balanced",
  "detailed",
];

const STRUCTURES: readonly ChatResponseStructure[] = [
  "freeform",
  "structured",
];

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseChatResponseVerbosity(
  raw: unknown,
): ChatResponseVerbosity {
  if (typeof raw === "string" && (VERBOSITIES as readonly string[]).includes(raw)) {
    return raw as ChatResponseVerbosity;
  }
  return DEFAULT_CHAT_RESPONSE_STYLE.verbosity;
}

export function parseChatResponseStructure(
  raw: unknown,
): ChatResponseStructure {
  if (typeof raw === "string" && (STRUCTURES as readonly string[]).includes(raw)) {
    return raw as ChatResponseStructure;
  }
  return DEFAULT_CHAT_RESPONSE_STYLE.structure;
}

/** Parse unknown JSON into ChatResponseStyle (fills defaults). */
export function parseChatResponseStyle(raw: unknown): ChatResponseStyle {
  if (!isRecord(raw)) return { ...DEFAULT_CHAT_RESPONSE_STYLE };
  return {
    verbosity: parseChatResponseVerbosity(raw.verbosity),
    structure: parseChatResponseStructure(raw.structure),
  };
}

/** Extra system lines for the active response-style prefs. */
export function systemHintForResponseStyle(style: ChatResponseStyle): string {
  const verbosityLine =
    style.verbosity === "concise"
      ? "Response length: concise — short answers; skip preamble and filler."
      : style.verbosity === "detailed"
        ? "Response length: detailed — thorough explanations when helpful; still prefer clear structure."
        : "Response length: balanced — enough detail to act; avoid walls of text.";

  const structureBlock =
    style.structure === "structured"
      ? [
          "Structure (required for Studio chat):",
          "- **HUMAN READABILITY FIRST.** Every response breathes on mobile. Treat the screen like a person's face.",
          "- BLANK LINES between every distinct thought, idea, status, section. No walls of text. No multi-thought paragraphs.",
          "- Max 2–3 sentences per paragraph. When you want to add another sentence, hit Enter twice instead.",
          "- Bullet lists for multi-step work only (one action per line). No nested bullets. Bullets end with periods.",
          "- Status narration gets its own line: \"Checking…\" / \"Found X\" / \"Moving on\" — separate from reasoning.",
          "- **TABLES: ONLY when data is truly tabular** (rows × columns matter for comparison). Never pseudo-tables with pipes for layout.",
          "- **NO fake tables with pipes.** \"Option A | cost | effort\" → break into readable sections with bold + line breaks instead.",
          "- Markdown: headings (##), bold (**bold**), bullet lists (no nesting). No emoji, no fancy formatting cruft.",
          "- Fenced code blocks only when showing actual code / shell / JSON that needs to run. Text snippets → inline code or plain text.",
          "- Close every task response with exactly one Handoff block (never repeat it):",
          "  ## Handoff",
          "  **Done:** …",
          "  **You:** …",
          "  **Blocked on you:** …",
          "  **I'll do next (no ask):** …",
          "- Keep each `**Label:**` on one line — never split `**You` / `:**` across blank lines.",
          "- Never emit a second ## Handoff or re-paste the body after Handoff.",
          "- On mobile, your response should be scrollable and natural to read — not dense, not requiring side-scrolling, not table-heavy.",
        ].join("\n")
      : "Structure: freeform prose OK, but always blank lines between thoughts — never run-on. Lists/tables only when they truly help.";

  return `Response style:\n${verbosityLine}\n${structureBlock}`;
}
