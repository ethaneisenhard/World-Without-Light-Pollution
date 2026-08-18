import { describe, expect, it } from "vitest";
import {
  applyMcpConnectToolsInclude,
  seedMcpConnectSelected,
  toggleMcpConnectTool,
} from "./mcp-connect-checklist-pure.js";

const TOOLS = [
  { name: "a", description: "A" },
  { name: "b" },
  { name: "c" },
];

describe("mcp-connect-checklist-pure", () => {
  it("seeds all when no prior include", () => {
    expect(seedMcpConnectSelected(TOOLS)).toEqual(["a", "b", "c"]);
  });

  it("keeps prior ∩ discovered", () => {
    expect(seedMcpConnectSelected(TOOLS, ["a", "z"])).toEqual(["a"]);
  });

  it("toggles selection", () => {
    expect(toggleMcpConnectTool(["a", "b"], "b")).toEqual(["a"]);
    expect(toggleMcpConnectTool(["a"], "c")).toEqual(["a", "c"]);
  });

  it("applies include + enable; omits include when all selected", () => {
    const base = {
      id: "linear",
      kind: "http" as const,
      enabled: false,
      url: "https://mcp.example/mcp",
      auth: "oauth" as const,
    };
    const partial = applyMcpConnectToolsInclude(base, ["a", "b"], {
      discoveredCount: 3,
    });
    expect(partial.enabled).toBe(true);
    expect(partial.tools?.include).toEqual(["a", "b"]);

    const all = applyMcpConnectToolsInclude(base, ["a", "b", "c"], {
      discoveredCount: 3,
    });
    expect(all.tools?.include).toBeUndefined();
  });
});
