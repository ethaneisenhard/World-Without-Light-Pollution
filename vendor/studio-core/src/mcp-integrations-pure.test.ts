import { describe, expect, it } from "vitest";
import {
  applyMcpStarterPack,
  MCP_STARTER_PACKS,
} from "./mcp-starter-packs-pure.js";
import {
  mcpRegistrySuggestedId,
  parseMcpRegistrySearchPayload,
  parseMcpRegistryServerDetail,
  studioServerFromRegistryDetail,
} from "./mcp-registry-pure.js";

describe("mcp-starter-packs-pure", () => {
  it("lists starter packs", () => {
    expect(MCP_STARTER_PACKS.length).toBeGreaterThanOrEqual(2);
    expect(MCP_STARTER_PACKS.some((p) => p.id === "n8n-local")).toBe(true);
    expect(MCP_STARTER_PACKS.some((p) => p.id === "dbhub-d1")).toBe(true);
  });

  it("applies pack replacing same id", () => {
    const next = applyMcpStarterPack(
      [{ id: "n8n-local", kind: "http", enabled: false, url: "http://old" }],
      "n8n-local",
    );
    expect(next).toHaveLength(1);
    expect(next?.[0]?.enabled).toBe(true);
    expect(next?.[0]?.url).toContain("5678");
  });
});

describe("mcp-registry-pure", () => {
  it("suggests ids", () => {
    expect(mcpRegistrySuggestedId("io.github.user/Server Filesystem")).toBe(
      "user-server-filesystem",
    );
  });

  it("parses search payload", () => {
    const rows = parseMcpRegistrySearchPayload({
      servers: [
        {
          server: {
            name: "io.github.modelcontextprotocol/server-filesystem",
            title: "Filesystem",
            description: "Local files",
          },
        },
      ],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.title).toBe("Filesystem");
  });

  it("builds http server from remotes", () => {
    const detail = parseMcpRegistryServerDetail({
      name: "acme/remote",
      title: "Acme",
      remotes: [{ type: "streamable-http", url: "https://mcp.example/mcp" }],
    });
    expect(detail).not.toBeNull();
    const server = studioServerFromRegistryDetail(detail!);
    expect(server).toEqual({
      id: "acme-remote",
      kind: "http",
      enabled: true,
      url: "https://mcp.example/mcp",
      label: "Acme",
    });
  });

  it("builds stdio from npm package", () => {
    const server = studioServerFromRegistryDetail({
      name: "io.github.modelcontextprotocol/server-filesystem",
      title: "Filesystem",
      packages: [
        {
          registryType: "npm",
          identifier: "@modelcontextprotocol/server-filesystem",
        },
      ],
    });
    expect(server?.kind).toBe("stdio");
    expect(server?.command).toBe("npx");
    expect(server?.args).toContain("@modelcontextprotocol/server-filesystem");
  });
});
