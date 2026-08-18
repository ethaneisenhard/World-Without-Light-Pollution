import { describe, expect, it } from "vitest";
import {
  COMPOSER_WORKFLOW_TEMPLATE_ID,
  DEFAULT_WORKFLOW_TEMPLATE_ID,
  getWorkflowTemplate,
  isWorkflowTemplateId,
  resolveWorkflowTemplateId,
  workflowIntentFromRoadmapCard,
  workflowTemplateN8nEditUrl,
} from "./workflow-template-registry-pure.js";

describe("workflow-template-registry-pure", () => {
  it("resolves known ids and defaults unknown", () => {
    expect(isWorkflowTemplateId("ship-with-approve")).toBe(true);
    expect(isWorkflowTemplateId("nope")).toBe(false);
    expect(resolveWorkflowTemplateId(undefined)).toBe(
      DEFAULT_WORKFLOW_TEMPLATE_ID,
    );
    expect(getWorkflowTemplate("ticket-build").id).toBe("ticket-build");
    expect(getWorkflowTemplate("missing").id).toBe("ship-with-approve");
  });

  it("builds prep → approve → finish steps with card meta", () => {
    const steps = getWorkflowTemplate("ship-with-approve").buildSteps({
      cardId: "card_1",
      title: "Ship notes",
      body: "Do the thing",
      projectId: "demo-blog",
    });
    expect(steps.map((s) => s.id)).toEqual(["prep", "gate", "finish"]);
    expect(steps[0]!.kind).toBe("run");
    expect(steps[0]!.input).toMatchObject({
      cardId: "card_1",
      projectId: "demo-blog",
    });
    expect(steps[1]!.kind).toBe("wait");
    expect(steps[1]!.event).toBe("task/approved");
    expect(steps[2]!.kind).toBe("emit");
  });

  it("formats intent from card", () => {
    const intent = workflowIntentFromRoadmapCard({
      title: "Dogfood",
      body: "x".repeat(100),
      templateId: "ticket-build",
    });
    expect(intent).toContain("[Ticket build]");
    expect(intent).toContain("Dogfood");
    expect(intent).toContain("…");
  });

  it("builds n8n edit URL from template path", () => {
    expect(
      workflowTemplateN8nEditUrl("ship-with-approve", "http://127.0.0.1:5678/"),
    ).toBe("http://127.0.0.1:5678/workflow/new");
  });

  it("composer-build has no Approve wait", () => {
    const steps = getWorkflowTemplate(COMPOSER_WORKFLOW_TEMPLATE_ID).buildSteps(
      {},
    );
    expect(steps.map((s) => s.id)).toEqual(["build", "finish"]);
    expect(steps.every((s) => s.kind !== "wait")).toBe(true);
  });
});
