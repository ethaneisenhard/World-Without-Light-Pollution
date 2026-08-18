/**
 * Forms inbox UI projection — field schema, table columns, cell formatters.
 * Mirrors BrowserUI form-destination preview (sandbox + submissions table).
 * Pure: no I/O / DOM.
 */

export type StudioFormFieldType =
  | "string"
  | "email"
  | "url"
  | "tel"
  | "number"
  | "boolean"
  | "date";

export type StudioFormField = {
  name: string;
  label: string;
  type: StudioFormFieldType;
  required?: boolean;
  hidden?: boolean;
  helpText?: string;
  placeholder?: string;
  autocomplete?: string;
  multiline?: boolean;
  rows?: number;
};

/** Default contact-shaped schema when project has no form-destination fields yet. */
export const DEFAULT_FORM_SANDBOX_FIELDS: readonly StudioFormField[] = [
  {
    name: "email",
    label: "Email",
    type: "email",
    required: true,
    placeholder: "you@example.com",
    autocomplete: "email",
  },
  {
    name: "name",
    label: "Name",
    type: "string",
    placeholder: "Jane Doe",
  },
  {
    name: "message",
    label: "Message",
    type: "string",
    multiline: true,
    rows: 4,
    placeholder: "How can we help?",
  },
];

export type FormSubmissionLike = {
  id: string;
  formId: string;
  payload: Record<string, unknown>;
  createdAt: number;
};

export type FormInboxColumn = {
  name: string;
  label: string;
  multiline: boolean;
};

export type FormSubmitOutcome = {
  ok: boolean;
  status: number;
  bodyPretty: string;
  durationMs: number;
};

const INTERNAL_PAYLOAD_KEYS = new Set(["source", "test"]);

export function visibleFormFields(
  fields: readonly StudioFormField[],
): StudioFormField[] {
  return fields.filter((f) => !f.hidden);
}

export function fieldIsMultiline(field: Pick<StudioFormField, "type" | "multiline">): boolean {
  return field.type === "string" && Boolean(field.multiline);
}

export function isTestSubmission(payload: Record<string, unknown>): boolean {
  if (payload.test === true) return true;
  return payload.source === "studio-test";
}

export function formatSubmittedAt(createdAt: number, now = Date.now()): string {
  if (!Number.isFinite(createdAt) || createdAt <= 0) return "—";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "—";
  // Stable-ish relative for recent; absolute for older — keep simple absolute.
  void now;
  return date.toLocaleString();
}

export function formatPayloadValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function emptyFormDraft(
  fields: readonly StudioFormField[],
  seed?: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of visibleFormFields(fields)) {
    out[f.name] = seed?.[f.name] ?? "";
  }
  return out;
}

/** Build submit payload from draft + studio test marker. */
export function buildTestSubmitPayload(
  draft: Record<string, string>,
  fields: readonly StudioFormField[],
): Record<string, unknown> {
  const payload: Record<string, unknown> = { source: "studio-test" };
  for (const f of fields) {
    if (f.hidden) continue;
    const raw = draft[f.name];
    if (raw === undefined) continue;
    const trimmed = raw.trim();
    if (!trimmed && !f.required) continue;
    if (f.type === "number" && trimmed) {
      const n = Number(trimmed);
      payload[f.name] = Number.isFinite(n) ? n : trimmed;
    } else if (f.type === "boolean") {
      payload[f.name] = raw === "true" || raw === "on" || raw === "1";
    } else {
      payload[f.name] = trimmed || raw;
    }
  }
  return payload;
}

export function submissionsForForm(
  rows: readonly FormSubmissionLike[],
  formId: string,
): FormSubmissionLike[] {
  const id = formId.trim() || "contact";
  return rows.filter((r) => r.formId === id);
}

/** Seed form ids always shown on the Forms index (even with zero submissions). */
export const DEFAULT_KNOWN_FORM_IDS: readonly string[] = ["contact"];

export type FormInboxSummary = {
  formId: string;
  submissionCount: number;
  lastSubmittedAt: number | null;
};

/**
 * Multi-form index rows: seed ids + distinct formIds from submissions.
 * Sorted by most recent submission, then formId.
 */
export function listFormSummaries(
  rows: readonly FormSubmissionLike[],
  seedIds: readonly string[] = DEFAULT_KNOWN_FORM_IDS,
): FormInboxSummary[] {
  const byId = new Map<string, FormInboxSummary>();
  for (const seed of seedIds) {
    const id = seed.trim();
    if (!id || byId.has(id)) continue;
    byId.set(id, {
      formId: id,
      submissionCount: 0,
      lastSubmittedAt: null,
    });
  }
  for (const row of rows) {
    const id = String(row.formId ?? "").trim();
    if (!id) continue;
    const prev = byId.get(id);
    const created =
      Number.isFinite(row.createdAt) && row.createdAt > 0 ? row.createdAt : null;
    if (!prev) {
      byId.set(id, {
        formId: id,
        submissionCount: 1,
        lastSubmittedAt: created,
      });
      continue;
    }
    prev.submissionCount += 1;
    if (
      created != null &&
      (prev.lastSubmittedAt == null || created > prev.lastSubmittedAt)
    ) {
      prev.lastSubmittedAt = created;
    }
  }
  return [...byId.values()].sort((a, b) => {
    const at = a.lastSubmittedAt ?? 0;
    const bt = b.lastSubmittedAt ?? 0;
    if (bt !== at) return bt - at;
    return a.formId.localeCompare(b.formId);
  });
}

/** Inbox columns: declared fields first, then extra payload keys from rows. */
export function resolveInboxColumns(
  fields: readonly StudioFormField[],
  rows: readonly FormSubmissionLike[],
): FormInboxColumn[] {
  const cols: FormInboxColumn[] = [];
  const seen = new Set<string>();
  for (const f of visibleFormFields(fields)) {
    cols.push({
      name: f.name,
      label: f.label,
      multiline: fieldIsMultiline(f),
    });
    seen.add(f.name);
  }
  for (const row of rows) {
    for (const key of Object.keys(row.payload)) {
      if (seen.has(key) || INTERNAL_PAYLOAD_KEYS.has(key)) continue;
      seen.add(key);
      cols.push({
        name: key,
        label: key,
        multiline: false,
      });
    }
  }
  return cols;
}

export function prettyJsonBody(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}
