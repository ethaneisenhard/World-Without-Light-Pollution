import { describe, expect, it } from "vitest";
import {
  studioMcpConnectedFact,
  studioMcpStatusFact,
} from "./studio-mcp-status-fact-pure.js";
import {
  buildStudioMcpUrlFromOrigin,
  resolveStudioMcpOrigin,
} from "./studio-mcp-origin-pure.js";

describe("resolveStudioMcpOrigin", () => {
  it("defaults to Host loopback", () => {
    expect(resolveStudioMcpOrigin({})).toBe("http://127.0.0.1:3847");
  });

  it("uses STUDIO_API_ORIGIN without trailing slash", () => {
    expect(
      resolveStudioMcpOrigin({ STUDIO_API_ORIGIN: "https://api.example.com/" }),
    ).toBe("https://api.example.com");
  });
});

describe("buildStudioMcpUrlFromOrigin", () => {
  it("attaches projectId", () => {
    expect(
      buildStudioMcpUrlFromOrigin({
        origin: "http://127.0.0.1:3847",
        projectId: "demo-blog",
      }),
    ).toBe("http://127.0.0.1:3847/api/mcp?projectId=demo-blog");
  });
});

describe("studioMcpStatusFact", () => {
  it("ready does not say mere connected without tools/list", () => {
    const fact = studioMcpStatusFact({
      state: "ready",
      mcpUrl: "http://127.0.0.1:3847/api/mcp?projectId=x",
      toolCount: 9,
      writtenPaths: ["/proj/.cursor/mcp.json"],
    });
    expect(fact).toContain("ready");
    expect(fact).toContain("tools/list ok (9 tools)");
    expect(fact).not.toMatch(/Studio MCP connected \(/);
  });

  it("disabled is honest", () => {
    const fact = studioMcpStatusFact({
      state: "disabled",
      reason: "AS_INJECT_STUDIO_MCP disabled",
      mcpUrl: "http://127.0.0.1:3847/api/mcp?projectId=x",
    });
    expect(fact).toContain("disabled");
    expect(fact).not.toContain("ready");
  });

  it("unsupported peers do not claim Host inject", () => {
    const fact = studioMcpStatusFact({
      state: "unsupported",
      harness: "kody",
      reason: "no Host file-inject path for this peer",
      mcpUrl: "http://127.0.0.1:3847/api/mcp?projectId=x",
    });
    expect(fact).toContain("kody");
    expect(fact).toContain("not wired");
  });

  it("legacy studioMcpConnectedFact is unverified configured", () => {
    const fact = studioMcpConnectedFact("http://127.0.0.1:3847/api/mcp");
    expect(fact).toContain("configured");
    expect(fact).toContain("not verified");
    expect(fact).not.toMatch(/^Studio MCP connected/);
  });
});
