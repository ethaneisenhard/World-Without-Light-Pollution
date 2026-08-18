import { describe, expect, it } from "vitest";
import {
  DEFAULT_FORM_SANDBOX_FIELDS,
  DEFAULT_KNOWN_FORM_IDS,
  buildTestSubmitPayload,
  emptyFormDraft,
  formatPayloadValue,
  formatSubmittedAt,
  isTestSubmission,
  listFormSummaries,
  prettyJsonBody,
  resolveInboxColumns,
  submissionsForForm,
  visibleFormFields,
} from "./forms-inbox-ui-pure.js";

describe("forms-inbox-ui-pure", () => {
  it("defaults include email + message", () => {
    const visible = visibleFormFields(DEFAULT_FORM_SANDBOX_FIELDS);
    expect(visible.map((f) => f.name)).toEqual(["email", "name", "message"]);
    expect(visible.find((f) => f.name === "message")?.multiline).toBe(true);
  });

  it("builds test payload with source marker", () => {
    const draft = emptyFormDraft(DEFAULT_FORM_SANDBOX_FIELDS, {
      email: "a@b.c",
      name: "Ada",
      message: "Hi",
    });
    const payload = buildTestSubmitPayload(draft, DEFAULT_FORM_SANDBOX_FIELDS);
    expect(payload).toEqual({
      source: "studio-test",
      email: "a@b.c",
      name: "Ada",
      message: "Hi",
    });
    expect(isTestSubmission(payload)).toBe(true);
  });

  it("filters submissions by formId", () => {
    const rows = [
      { id: "1", formId: "contact", payload: {}, createdAt: 1 },
      { id: "2", formId: "newsletter", payload: {}, createdAt: 2 },
    ];
    expect(submissionsForForm(rows, "contact")).toHaveLength(1);
    expect(submissionsForForm(rows, "newsletter")[0]?.id).toBe("2");
  });

  it("lists form summaries from seeds + submissions", () => {
    expect(DEFAULT_KNOWN_FORM_IDS).toContain("contact");
    const rows = [
      { id: "1", formId: "contact", payload: {}, createdAt: 10 },
      { id: "2", formId: "newsletter", payload: {}, createdAt: 20 },
      { id: "3", formId: "contact", payload: {}, createdAt: 30 },
    ];
    const summaries = listFormSummaries(rows);
    expect(summaries.map((s) => s.formId)).toEqual(["contact", "newsletter"]);
    expect(summaries[0]).toMatchObject({
      formId: "contact",
      submissionCount: 2,
      lastSubmittedAt: 30,
    });
    expect(summaries[1]).toMatchObject({
      formId: "newsletter",
      submissionCount: 1,
      lastSubmittedAt: 20,
    });
    // Seed still present with zero rows
    expect(listFormSummaries([])).toEqual([
      { formId: "contact", submissionCount: 0, lastSubmittedAt: null },
    ]);
  });

  it("resolves columns from fields then extra payload keys", () => {
    const cols = resolveInboxColumns(DEFAULT_FORM_SANDBOX_FIELDS, [
      {
        id: "1",
        formId: "contact",
        payload: { email: "a@b.c", source: "studio-test", utm: "x" },
        createdAt: 1,
      },
    ]);
    expect(cols.map((c) => c.name)).toEqual(["email", "name", "message", "utm"]);
  });

  it("formats cells and json bodies", () => {
    expect(formatPayloadValue(true)).toBe("Yes");
    expect(formatPayloadValue(null)).toBe("—");
    expect(formatSubmittedAt(0)).toBe("—");
    expect(prettyJsonBody('{"ok":true}')).toContain("\n");
  });
});
