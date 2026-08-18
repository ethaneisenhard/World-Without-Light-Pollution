/**
 * Cursor-style clarifying questions — pure shapes + validation.
 * Store / SSE / harness park live in studio-server.
 */

export type AskUserOption = {
  id: string;
  label: string;
};

export type PendingAskUser = {
  id: string;
  projectId: string;
  question: string;
  options: AskUserOption[];
  /** When true, client may select more than one option before Submit. */
  allowMultiple: boolean;
  createdAt: number;
};

export type AskUserAnswer = {
  selectedOptionIds: string[];
  freeText?: string;
  cancelled?: boolean;
};

const MAX_OPTIONS = 8;
const MAX_QUESTION = 2000;
const MAX_LABEL = 200;
const MAX_ID = 64;

function slugOptionId(raw: string, index: number): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_ID);
  return cleaned || `opt_${index + 1}`;
}

/**
 * Normalize tool input → PendingAskUser fields (without id / createdAt).
 * Returns error string when invalid.
 */
export function parseAskUserInput(
  input: Record<string, unknown>,
  projectId: string,
):
  | { ok: true; question: string; options: AskUserOption[]; allowMultiple: boolean }
  | { ok: false; error: string } {
  const questionRaw =
    typeof input.question === "string"
      ? input.question
      : typeof input.prompt === "string"
        ? input.prompt
        : "";
  const question = questionRaw.trim();
  if (!question) return { ok: false, error: "question required" };
  if (question.length > MAX_QUESTION) {
    return { ok: false, error: `question max ${MAX_QUESTION} chars` };
  }

  const rawOpts = Array.isArray(input.options) ? input.options : null;
  if (!rawOpts || rawOpts.length === 0) {
    return { ok: false, error: "options required (1–8)" };
  }
  if (rawOpts.length > MAX_OPTIONS) {
    return { ok: false, error: `options max ${MAX_OPTIONS}` };
  }

  const options: AskUserOption[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < rawOpts.length; i++) {
    const row = rawOpts[i];
    if (typeof row === "string") {
      const label = row.trim().slice(0, MAX_LABEL);
      if (!label) continue;
      const id = slugOptionId(label, i);
      if (seen.has(id)) continue;
      seen.add(id);
      options.push({ id, label });
      continue;
    }
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const o = row as Record<string, unknown>;
    const label =
      typeof o.label === "string"
        ? o.label.trim().slice(0, MAX_LABEL)
        : typeof o.text === "string"
          ? o.text.trim().slice(0, MAX_LABEL)
          : "";
    if (!label) continue;
    const idRaw = typeof o.id === "string" ? o.id : label;
    const id = slugOptionId(idRaw, i);
    if (seen.has(id)) continue;
    seen.add(id);
    options.push({ id, label });
  }
  if (options.length === 0) {
    return { ok: false, error: "options required (1–8 with labels)" };
  }

  const allowMultiple =
    input.allowMultiple === true ||
    input.allow_multiple === true ||
    input.multi === true;

  if (!projectId.trim()) {
    return { ok: false, error: "projectId required" };
  }

  return { ok: true, question, options, allowMultiple };
}

/** Validate answer against pending ask. */
export function validateAskUserAnswer(
  ask: PendingAskUser,
  answer: AskUserAnswer,
): { ok: true; answer: AskUserAnswer } | { ok: false; error: string } {
  if (answer.cancelled === true) {
    return { ok: true, answer: { selectedOptionIds: [], cancelled: true } };
  }
  const ids = Array.isArray(answer.selectedOptionIds)
    ? answer.selectedOptionIds.map((id) => String(id).trim()).filter(Boolean)
    : [];
  const allowed = new Set(ask.options.map((o) => o.id));
  for (const id of ids) {
    if (!allowed.has(id)) {
      return { ok: false, error: `unknown option id: ${id}` };
    }
  }
  if (ids.length === 0 && !(typeof answer.freeText === "string" && answer.freeText.trim())) {
    return { ok: false, error: "select an option or provide freeText" };
  }
  if (!ask.allowMultiple && ids.length > 1) {
    return { ok: false, error: "allowMultiple is false — pick one option" };
  }
  const freeText =
    typeof answer.freeText === "string" && answer.freeText.trim()
      ? answer.freeText.trim().slice(0, MAX_QUESTION)
      : undefined;
  return {
    ok: true,
    answer: {
      selectedOptionIds: ask.allowMultiple ? [...new Set(ids)] : ids.slice(0, 1),
      ...(freeText ? { freeText } : {}),
    },
  };
}

/** Tool-result JSON the model sees after the user answers. */
export function formatAskUserAnsweredPayload(input: {
  askId: string;
  question: string;
  answer: AskUserAnswer;
  options: AskUserOption[];
}): Record<string, unknown> {
  if (input.answer.cancelled) {
    return {
      ok: true,
      kind: "ask_user_answered",
      askId: input.askId,
      question: input.question,
      cancelled: true,
      hint: "User skipped this question. Continue with a reasonable default or ask differently.",
    };
  }
  const labels = input.answer.selectedOptionIds.map((id) => {
    const opt = input.options.find((o) => o.id === id);
    return opt ? { id, label: opt.label } : { id, label: id };
  });
  return {
    ok: true,
    kind: "ask_user_answered",
    askId: input.askId,
    question: input.question,
    selectedOptionIds: input.answer.selectedOptionIds,
    selected: labels,
    ...(input.answer.freeText ? { freeText: input.answer.freeText } : {}),
  };
}
