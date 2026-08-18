import { describe, expect, it } from "vitest";
import {
  createAutomationEnvelope,
  emptyAutomationIntegration,
  matchWorkflowTargets,
  parseAutomationEnvelope,
  parseAutomationIntegration,
  resolveWebhookUrl,
  workflowMatchesEvent,
} from "./automation-pure.js";
import { serializeAutomationIntegration } from "./workflow-triggers-pure.js";

const FIXTURE = {
  kind: "automation",
  version: "1.0.0",
  provider: "n8n",
  connection: {
    baseUrl: "http://127.0.0.1:5678",
    auth: {
      kind: "header",
      headerName: "Authorization",
      keyRef: "env:N8N_API_KEY",
    },
  },
  workflows: [
    {
      id: "manual-test",
      title: "Manual / smoke test",
      tags: ["smoke"],
      events: ["workflow.manual"],
      enabled: true,
      n8n: { mode: "webhook", webhookPath: "/webhook/manual-test" },
    },
    {
      id: "blog-publish",
      title: "Blog publish",
      tags: ["blog"],
      events: ["record.blog.published"],
      enabled: true,
      n8n: { mode: "webhook", webhookPath: "/webhook/blog-publish" },
    },
    {
      id: "disabled",
      title: "Off",
      tags: [],
      events: ["workflow.manual"],
      enabled: false,
      n8n: { mode: "webhook", webhookPath: "/webhook/off" },
    },
  ],
  inbound: {
    serviceTokenRef: "env:AGENT_STUDIO_AUTOMATION_TOKEN",
    allowedCollections: [],
  },
  dispatch: {
    analyticsForward: [],
    retry: { maxAttempts: 3, backoffMs: 1000 },
  },
};

describe("parseAutomationIntegration", () => {
  it("parses BrowserUI-shaped registry", () => {
    const parsed = parseAutomationIntegration(FIXTURE);
    expect(parsed?.kind).toBe("automation");
    expect(parsed?.workflows).toHaveLength(3);
    expect(parsed?.connection.baseUrl).toBe("http://127.0.0.1:5678");
  });

  it("rejects non-automation kind", () => {
    expect(parseAutomationIntegration({ kind: "forms" })).toBeNull();
  });
});

describe("emptyAutomationIntegration", () => {
  it("round-trips through parse/serialize with zero workflows", () => {
    const empty = emptyAutomationIntegration({
      baseUrl: "http://127.0.0.1:5678",
    });
    expect(empty.workflows).toEqual([]);
    const again = parseAutomationIntegration(
      serializeAutomationIntegration(empty),
    );
    expect(again?.workflows).toEqual([]);
    expect(again?.provider).toBe("n8n");
    expect(again?.connection.baseUrl).toBe("http://127.0.0.1:5678");
  });
});

describe("matchWorkflowTargets", () => {
  it("matches enabled workflows for event", () => {
    const integration = parseAutomationIntegration(FIXTURE)!;
    const envelope = createAutomationEnvelope({
      event: "workflow.manual",
      projectId: "demo-marketing",
      eventId: "00000000-0000-4000-8000-000000000001",
      timestamp: "2026-07-11T12:00:00.000Z",
    });
    const targets = matchWorkflowTargets(integration, envelope);
    expect(targets).toHaveLength(1);
    expect(targets[0]!.workflow.id).toBe("manual-test");
    expect(targets[0]!.url).toBe("http://127.0.0.1:5678/webhook/manual-test");
  });

  it("skips disabled", () => {
    const integration = parseAutomationIntegration(FIXTURE)!;
    const envelope = createAutomationEnvelope({
      event: "workflow.manual",
      projectId: "demo-marketing",
    });
    expect(
      workflowMatchesEvent(
        integration.workflows.find((w) => w.id === "disabled")!,
        envelope,
      ),
    ).toBe(false);
  });
});

describe("resolveWebhookUrl", () => {
  it("joins base + path", () => {
    const integration = parseAutomationIntegration(FIXTURE)!;
    const w = integration.workflows[0]!;
    expect(resolveWebhookUrl(integration, w)).toBe(
      "http://127.0.0.1:5678/webhook/manual-test",
    );
  });
});

describe("createAutomationEnvelope / parse", () => {
  it("round-trips", () => {
    const envelope = createAutomationEnvelope({
      event: "record.blog.published",
      projectId: "demo-blog",
      payload: { slug: "hello" },
      eventId: "00000000-0000-4000-8000-000000000002",
      timestamp: "2026-07-11T12:00:00.000Z",
    });
    expect(parseAutomationEnvelope(envelope)).toEqual(envelope);
  });

  it("rejects unknown event", () => {
    expect(
      parseAutomationEnvelope({
        spec: "glassbox-studio.automation.event@1",
        event: "not.real",
        eventId: "00000000-0000-4000-8000-000000000003",
        projectId: "demo-blog",
        timestamp: "2026-07-11T12:00:00.000Z",
        workflowTags: [],
        payload: {},
      }),
    ).toBeNull();
  });
});
