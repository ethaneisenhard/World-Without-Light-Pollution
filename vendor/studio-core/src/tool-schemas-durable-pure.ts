/**
 * MCP input schemas for durable.* tools (kept out of tool-catalog-pure).
 */

function schema(
  description: string,
  properties: Record<string, unknown>,
  required?: string[],
): {
  description: string;
  input_schema: Record<string, unknown>;
} {
  return {
    description,
    input_schema: {
      type: "object",
      properties,
      ...(required?.length ? { required } : {}),
    },
  };
}

const DURABLE_TOOL_IDS = new Set([
  "durable.run",
  "durable.runFromRoadmap",
  "durable.get",
  "durable.list",
  "durable.signal",
  "durable.cancel",
]);

export function isDurableToolId(id: string): boolean {
  return DURABLE_TOOL_IDS.has(id);
}

/** Returns schema for durable tools, or null if id is not owned. */
export function tryDescribeDurableTool(
  id: string,
  description: string,
): {
  description: string;
  input_schema: Record<string, unknown>;
} | null {
  if (!isDurableToolId(id)) return null;

  if (id === "durable.run") {
    return schema(
      description,
      {
        intent: {
          type: "string",
          description: "What the background run should accomplish",
        },
        chatId: {
          type: "string",
          description: "Optional parent chat/session id (trigger chat-background)",
        },
        intentKind: {
          type: "string",
          enum: ["background", "swarm", "dag", "cron"],
          description: "Routing hint — swarm→agent-room, background→inngest/fake",
        },
        substrate: {
          type: "string",
          enum: ["fake", "inngest", "agent-room", "n8n", "cf-workflows"],
          description: "Optional substrate override",
        },
        requireApproval: {
          type: "boolean",
          description:
            "When true (default), insert a wait step for event task/approved before finish",
        },
        steps: {
          type: "array",
          description:
            "Optional explicit steps [{id, kind, action?, event?}]. Default template used when omitted.",
          items: { type: "object" },
        },
      },
      ["intent"],
    );
  }

  if (id === "durable.runFromRoadmap") {
    return schema(
      description,
      {
        cardId: {
          type: "string",
          description: "Roadmap card id to start from",
        },
        scope: {
          type: "string",
          enum: ["studio", "project"],
          description: "Board scope (default: project when projectId set)",
        },
        projectId: {
          type: "string",
          description: "Project board id (null/omit for studio board)",
        },
        templateId: {
          type: "string",
          description:
            "Workflow template id (default: card.workflowTemplateId or ship-with-approve)",
        },
      },
      ["cardId"],
    );
  }

  if (id === "durable.get") {
    return schema(
      description,
      { runId: { type: "string", description: "Durable run id" } },
      ["runId"],
    );
  }

  if (id === "durable.list") {
    return schema(description, {
      projectId: {
        type: "string",
        description: "Optional project filter (default: current scope)",
      },
    });
  }

  if (id === "durable.signal") {
    return schema(
      description,
      {
        runId: { type: "string", description: "Durable run id" },
        event: {
          type: "string",
          description: "Wait event name (e.g. task/approved)",
        },
        data: {
          type: "object",
          description: "Optional payload recorded on the wait step",
        },
      },
      ["runId", "event"],
    );
  }

  // durable.cancel
  return schema(
    description,
    { runId: { type: "string", description: "Durable run id" } },
    ["runId"],
  );
}
