/**
 * Anthropic schema for studio.ask_user (kept out of tool-catalog megafile).
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

/** Returns schema for studio.ask_user, or null. */
export function tryDescribeAskUserTool(
  id: string,
  description: string,
): {
  description: string;
  input_schema: Record<string, unknown>;
} | null {
  if (id !== "studio.ask_user") return null;
  return schema(
    description,
    {
      question: {
        type: "string",
        description: "Clarifying question shown above the choice chips",
      },
      prompt: {
        type: "string",
        description: "Alias for question",
      },
      options: {
        type: "array",
        description:
          "1–8 choices — strings or { id?, label } objects. Labels paint as chips.",
        items: {
          oneOf: [
            { type: "string" },
            {
              type: "object",
              properties: {
                id: { type: "string" },
                label: { type: "string" },
                text: { type: "string" },
              },
            },
          ],
        },
      },
      allowMultiple: {
        type: "boolean",
        description: "When true, operator may select multiple chips before Submit",
      },
      allow_multiple: {
        type: "boolean",
        description: "Alias for allowMultiple",
      },
    },
    ["options"],
  );
}
