import { describe, expect, it } from "vitest";
import {
  filterMcpServerTools,
  mcpServerToolAllowed,
} from "./mcp-server-tools-filter-pure.js";

const TOOLS = [
  { name: "list_issues", description: "List" },
  { name: "create_issue" },
  { name: "delete_workspace" },
];

describe("filterMcpServerTools", () => {
  it("passthrough when no policy", () => {
    expect(filterMcpServerTools(TOOLS, undefined)).toEqual(TOOLS);
  });

  it("include wins over exclude", () => {
    const out = filterMcpServerTools(TOOLS, {
      include: ["list_issues", "create_issue"],
      exclude: ["list_issues"],
    });
    expect(out.map((t) => t.name)).toEqual(["list_issues", "create_issue"]);
  });

  it("exclude only when include absent", () => {
    const out = filterMcpServerTools(TOOLS, {
      exclude: ["delete_workspace"],
    });
    expect(out.map((t) => t.name)).toEqual(["list_issues", "create_issue"]);
  });

  it("mcpServerToolAllowed", () => {
    expect(mcpServerToolAllowed("list_issues", { include: ["list_issues"] })).toBe(
      true,
    );
    expect(mcpServerToolAllowed("delete_workspace", { include: ["list_issues"] })).toBe(
      false,
    );
  });
});
