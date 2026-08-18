import { describe, expect, it } from "vitest";
import { parseAutomationIntegration } from "./automation-pure.js";
import {
  collectWorkflowTags,
  deleteWorkflowById,
  draftToWorkflowEntry,
  emptyWorkflowDraft,
  filterWorkflows,
  formatWorkflowEvents,
  isCatalogIntegration,
  parseWorkflowEvents,
  serializeAutomationIntegration,
  toggleWorkflowEnabled,
  upsertWorkflowEntry,
  validateWorkflowDraft,
  workflowEventsTriggerLabel,
} from "./workflow-triggers-pure.js";

const FIXTURE = {
  kind: "automation",
  version: "1.0.0",
  provider: "n8n",
  connection: { baseUrl: "http://127.0.0.1:5678" },
  workflows: [
    {
      id: "a",
      title: "Alpha",
      tags: ["smoke"],
      events: ["workflow.manual"],
      enabled: true,
      n8n: { mode: "webhook", webhookPath: "/webhook/a" },
    },
    {
      id: "b",
      title: "Beta",
      tags: ["blog"],
      events: ["record.blog.published"],
      enabled: false,
      n8n: { mode: "webhook", webhookPath: "/webhook/b" },
    },
  ],
  inbound: { serviceTokenRef: "env:TOKEN", allowedCollections: [] },
  dispatch: {
    analyticsForward: [],
    retry: { maxAttempts: 3, backoffMs: 1000 },
  },
};

describe("workflow-triggers-pure", () => {
  it("filters by status/query/tag", () => {
    const integration = parseAutomationIntegration(FIXTURE)!;
    expect(
      filterWorkflows(integration.workflows, {
        query: "",
        event: "",
        tag: "",
        status: "enabled",
      }),
    ).toHaveLength(1);
    expect(
      filterWorkflows(integration.workflows, {
        query: "beta",
        event: "",
        tag: "",
        status: "all",
      })[0]?.id,
    ).toBe("b");
    expect(
      filterWorkflows(integration.workflows, {
        query: "",
        event: "",
        tag: "smoke",
        status: "all",
      })[0]?.id,
    ).toBe("a");
  });

  it("validates and converts drafts", () => {
    const draft = emptyWorkflowDraft();
    expect(validateWorkflowDraft(draft)).toMatch(/Name/);
    draft.title = "My Hook";
    draft.events = ["workflow.manual"];
    expect(validateWorkflowDraft(draft)).toBeNull();
    const entry = draftToWorkflowEntry(draft);
    expect(entry.id).toBe("my-hook");
    expect(entry.n8n?.webhookPath).toBe("/webhook/my-hook");
  });

  it("parses and formats comma-separated events", () => {
    expect(parseWorkflowEvents(" workflow.manual , form.submitted ")).toEqual([
      "workflow.manual",
      "form.submitted",
    ]);
    expect(formatWorkflowEvents(["a", "b"])).toBe("a, b");
  });

  it("labels multi-select trigger for events", () => {
    expect(workflowEventsTriggerLabel([])).toBe("Select events…");
    expect(workflowEventsTriggerLabel(["workflow.manual"])).toBe(
      "workflow.manual",
    );
    expect(
      workflowEventsTriggerLabel(["workflow.manual", "form.submitted"]),
    ).toBe("2 events");
  });

  it("toggles / deletes / upserts", () => {
    const integration = parseAutomationIntegration(FIXTURE)!;
    const off = toggleWorkflowEnabled(integration.workflows, "a", false);
    expect(off.find((w) => w.id === "a")?.enabled).toBe(false);
    const gone = deleteWorkflowById(off, "b");
    expect(gone.map((w) => w.id)).toEqual(["a"]);
    const next = upsertWorkflowEntry(
      gone,
      {
        id: "c",
        title: "Gamma",
        tags: [],
        events: ["form.submitted"],
        enabled: true,
        n8n: { mode: "webhook", webhookPath: "/webhook/c" },
      },
      null,
    );
    expect(next).toHaveLength(2);
    expect(collectWorkflowTags(next)).toEqual(["smoke"]);
  });

  it("round-trips serialize → parse", () => {
    const integration = parseAutomationIntegration(FIXTURE)!;
    const raw = serializeAutomationIntegration(integration);
    const again = parseAutomationIntegration(raw);
    expect(again?.workflows).toHaveLength(2);
    expect(again?.connection.baseUrl).toBe("http://127.0.0.1:5678");
  });

  it("excludes automation from catalog", () => {
    expect(
      isCatalogIntegration({
        id: "automation",
        config: { kind: "automation" },
      }),
    ).toBe(false);
    expect(
      isCatalogIntegration({ id: "ai", config: { kind: "ai" } }),
    ).toBe(true);
  });
});
