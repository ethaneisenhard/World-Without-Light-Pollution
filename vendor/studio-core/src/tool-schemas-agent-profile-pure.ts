/**
 * MCP schemas for agents.profile.* (kept out of tool-catalog-pure).
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

const AGENT_PROFILE_TOOL_IDS = new Set([
  "agents.profile.list",
  "agents.profile.create",
  "agents.profile.configure",
]);

export function isAgentProfileToolId(id: string): boolean {
  return AGENT_PROFILE_TOOL_IDS.has(id);
}

export function tryDescribeAgentProfileTool(
  id: string,
  description: string,
): {
  description: string;
  input_schema: Record<string, unknown>;
} | null {
  if (!isAgentProfileToolId(id)) return null;
  switch (id) {
    case "agents.profile.list":
      return schema(description, {});
    case "agents.profile.create":
      return schema(
        description,
        {
          id: { type: "string", description: "Slug (a-z0-9_-)" },
          title: { type: "string", description: "Display name" },
          description: { type: "string", description: "What this teammate helps with" },
          harnessId: { type: "string", description: "Default harness" },
          modelId: { type: "string" },
          petId: { type: "string" },
          avatar: {
            type: "object",
            description: "Face (bot shape/color, pet, upload, or generate)",
          },
          peerRef: {
            type: "object",
            description: "Optional peer facet (e.g. hermes-profile)",
          },
        },
        ["id"],
      );
    case "agents.profile.configure":
      return schema(
        description,
        {
          id: { type: "string", description: "Existing slug" },
          title: { type: "string" },
          description: { type: "string" },
          harnessId: { type: "string" },
          modelId: { type: "string" },
          petId: { type: "string" },
          avatar: { type: "object" },
          peerRef: { type: "object" },
        },
        ["id"],
      );
    default:
      return null;
  }
}
