import { describe, expect, it } from "vitest";
import { studioMcpServerToHermesYamlEntry } from "./hermes-mcp-server-yaml-pure.js";

describe("studioMcpServerToHermesYamlEntry", () => {
  it("emits oauth + tools.include for HTTP server", () => {
    const yaml = studioMcpServerToHermesYamlEntry({
      id: "linear",
      kind: "http",
      enabled: true,
      url: "https://mcp.linear.app/mcp/",
      auth: "oauth",
      tools: { include: ["list_issues", "create_issue"], resources: true },
    });
    expect(yaml).toContain("  linear:");
    expect(yaml).toContain('url: "https://mcp.linear.app/mcp"');
    expect(yaml).toContain("auth: oauth");
    expect(yaml).toContain("tools:");
    expect(yaml).toContain('"list_issues"');
    expect(yaml).toContain("resources: true");
  });

  it("emits bearer env header when authHeaderEnv set", () => {
    const yaml = studioMcpServerToHermesYamlEntry({
      id: "n8n-local",
      kind: "http",
      enabled: true,
      url: "https://example.com/mcp",
      authHeaderEnv: "N8N_MCP_TOKEN",
    });
    expect(yaml).toContain("headers:");
    expect(yaml).toContain("Bearer ${N8N_MCP_TOKEN}");
    expect(yaml).not.toContain("auth: oauth");
  });

  it("emits stdio command + args", () => {
    const yaml = studioMcpServerToHermesYamlEntry({
      id: "fs",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem"],
    });
    expect(yaml).toContain('command: "npx"');
    expect(yaml).toContain("args:");
    expect(yaml).toContain('"@modelcontextprotocol/server-filesystem"');
  });
});
