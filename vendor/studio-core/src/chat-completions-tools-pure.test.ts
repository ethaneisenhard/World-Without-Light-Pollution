import { describe, expect, it } from "vitest";
import {
  chatCompletionsToolsFromSchemaDefs,
  parseChatCompletionsAssistantMessage,
} from "./chat-completions-tools-pure.js";

describe("chatCompletionsToolsFromSchemaDefs", () => {
  it("maps input_schema to parameters", () => {
    const out = chatCompletionsToolsFromSchemaDefs([
      {
        name: "tools_search",
        description: "Search tools",
        input_schema: {
          type: "object",
          properties: { query: { type: "string" } },
        },
      },
    ]);
    expect(out).toEqual([
      {
        type: "function",
        function: {
          name: "tools_search",
          description: "Search tools",
          parameters: {
            type: "object",
            properties: { query: { type: "string" } },
          },
        },
      },
    ]);
  });
});

describe("parseChatCompletionsAssistantMessage", () => {
  it("parses content, reasoning, and JSON tool arguments", () => {
    const parsed = parseChatCompletionsAssistantMessage({
      content: "ok",
      reasoning_content: "hmm",
      tool_calls: [
        {
          id: "call_1",
          type: "function",
          function: {
            name: "tools_call",
            arguments: JSON.stringify({
              action: "studio.theme.set",
              input: { accent: "#ff69b4" },
            }),
          },
        },
      ],
    });
    expect(parsed.content).toBe("ok");
    expect(parsed.reasoningContent).toBe("hmm");
    expect(parsed.toolCalls).toEqual([
      {
        id: "call_1",
        name: "tools_call",
        arguments: {
          action: "studio.theme.set",
          input: { accent: "#ff69b4" },
        },
      },
    ]);
  });

  it("keeps empty tool_calls when finish is text-only", () => {
    expect(
      parseChatCompletionsAssistantMessage({ content: "hi", tool_calls: null }),
    ).toEqual({
      content: "hi",
      reasoningContent: "",
      toolCalls: [],
    });
  });

  it("surfaces bad JSON args as empty object + argumentsRaw", () => {
    const parsed = parseChatCompletionsAssistantMessage({
      content: "",
      tool_calls: [
        {
          id: "x",
          function: { name: "tools_call", arguments: "{not-json" },
        },
      ],
    });
    expect(parsed.toolCalls[0]?.arguments).toEqual({});
    expect(parsed.toolCalls[0]?.argumentsRaw).toBe("{not-json");
  });
});
