import { describe, expect, it } from "vitest";
import {
  harnessContextTier,
  selectContextSystemParts,
} from "./harness-context-tier-pure.js";
import { studioMcpStatusFact } from "./studio-mcp-status-fact-pure.js";

describe("harnessContextTier", () => {
  it("studio-full for studio, anthropic, and deepseek", () => {
    expect(harnessContextTier("studio")).toBe("studio-full");
    expect(harnessContextTier("anthropic")).toBe("studio-full");
    expect(harnessContextTier("deepseek")).toBe("studio-full");
    expect(harnessContextTier("cursor")).toBe("peer-minimal");
    expect(harnessContextTier("grok")).toBe("peer-minimal");
  });
});

describe("selectContextSystemParts", () => {
  it("peer-minimal drops rules/skills/memory", () => {
    expect(
      selectContextSystemParts({
        tier: "peer-minimal",
        viewportContext: "Viewport: chat focused",
        mcpFact: studioMcpStatusFact({
          state: "ready",
          mcpUrl: "http://127.0.0.1:3847/api/mcp?projectId=demo",
          toolCount: 12,
        }),
        fullParts: [
          "Viewport: chat focused",
          "RULES…",
          "SKILLS…",
          "MEMORY…",
        ],
      }),
    ).toEqual([
      "Viewport: chat focused",
      studioMcpStatusFact({
        state: "ready",
        mcpUrl: "http://127.0.0.1:3847/api/mcp?projectId=demo",
        toolCount: 12,
      }),
    ]);
  });

  it("studio-full keeps all parts", () => {
    expect(
      selectContextSystemParts({
        tier: "studio-full",
        viewportContext: "V",
        fullParts: ["V", "RULES", "SKILLS"],
      }),
    ).toEqual(["V", "RULES", "SKILLS"]);
  });
});
