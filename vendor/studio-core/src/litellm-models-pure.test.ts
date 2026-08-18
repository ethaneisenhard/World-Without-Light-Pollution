import { describe, expect, it } from "vitest";
import {
  mergeLitellmModelCatalog,
  parseOpenAiModelsList,
} from "./litellm-models-pure.js";

describe("litellm-models-pure", () => {
  it("parses OpenAI models list", () => {
    expect(
      parseOpenAiModelsList({
        data: [{ id: "claude-sonnet" }, { id: "gpt-4o-mini" }, { id: "claude-sonnet" }],
      }),
    ).toEqual([
      { id: "claude-sonnet", label: "claude-sonnet" },
      { id: "gpt-4o-mini", label: "gpt-4o-mini" },
    ]);
  });

  it("merge prefers live over seed", () => {
    expect(
      mergeLitellmModelCatalog({
        live: [{ id: "x", label: "x" }],
        seed: [{ id: "claude-sonnet", label: "Claude" }],
      }),
    ).toEqual([{ id: "x", label: "x" }]);
    expect(
      mergeLitellmModelCatalog({
        live: [],
        seed: [{ id: "claude-sonnet", label: "Claude" }],
      }),
    ).toEqual([{ id: "claude-sonnet", label: "Claude" }]);
  });
});
