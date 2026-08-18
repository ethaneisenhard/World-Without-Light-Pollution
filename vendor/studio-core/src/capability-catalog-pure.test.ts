import { describe, expect, it } from "vitest";
import { MCP_STARTER_PACKS } from "./mcp-starter-packs-pure.js";
import {
  CAPABILITY_CATALOG,
  CAPABILITY_STACKS,
  flattenStacks,
  getCapability,
  getCapabilityStack,
  harnessIdFromCapabilityId,
  listCapabilitiesByKind,
  parseStudioStacksEnv,
  studioAiSeedFromStacks,
} from "./capability-catalog-pure.js";

describe("capability-catalog-pure", () => {
  it("includes harness rows for anthropic and cursor", () => {
    expect(getCapability("harness:anthropic")?.kind).toBe("harness");
    expect(getCapability("harness:cursor")?.install.bin).toBe("cursor-agent");
  });

  it("Kody is mcp:kody (MCP plane), not a harness; legacy id aliases", () => {
    expect(getCapability("mcp:kody")?.kind).toBe("mcp");
    expect(getCapability("mcp:kody")?.auth.env).toBe("KODY_BASE_URL");
    expect(getCapability("harness:kody")?.id).toBe("mcp:kody");
    expect(listCapabilitiesByKind("harness").some((r) => r.id === "mcp:kody")).toBe(
      false,
    );
  });

  it("maps every MCP starter pack to mcp:<id>", () => {
    for (const pack of MCP_STARTER_PACKS) {
      const row = getCapability(`mcp:${pack.id}`);
      expect(row?.kind).toBe("mcp");
      expect(row?.install.kind).toBe("mcp-starter-pack");
      expect(row?.install.ref).toBe(pack.id);
    }
  });

  it("api-only stack is default cloud path (anthropic, not cursor)", () => {
    const stack = getCapabilityStack("api-only");
    expect(stack).toBeTruthy();
    expect(stack!.capabilities).toContain("harness:anthropic");
    expect(stack!.capabilities).not.toContain("harness:cursor");
    expect(flattenStacks(["api-only"])).toEqual([
      "harness:anthropic",
      "mcp:studio-http",
      "skill:chrome",
    ]);
  });

  it("flattenStacks dedupes across stacks", () => {
    const ids = flattenStacks(["api-only", "coding-cursor"]);
    expect(ids.filter((id) => id === "mcp:studio-http")).toHaveLength(1);
    expect(ids).toContain("harness:cursor");
    expect(ids).toContain("harness:anthropic");
  });

  it("harnessIdFromCapabilityId strips prefix", () => {
    expect(harnessIdFromCapabilityId("harness:cursor")).toBe("cursor");
    expect(harnessIdFromCapabilityId("mcp:studio-http")).toBeNull();
  });

  it("listCapabilitiesByKind filters", () => {
    expect(listCapabilitiesByKind("harness").length).toBeGreaterThanOrEqual(4);
    expect(CAPABILITY_STACKS.some((s) => s.id === "automation-n8n")).toBe(true);
    expect(CAPABILITY_CATALOG.every((r) => r.id.includes(":"))).toBe(true);
  });

  it("parseStudioStacksEnv defaults to api-only for cloud", () => {
    expect(parseStudioStacksEnv(undefined)).toEqual(["api-only"]);
    expect(parseStudioStacksEnv("")).toEqual(["api-only"]);
    expect(parseStudioStacksEnv("coding-cursor,api-only")).toEqual([
      "coding-cursor",
      "api-only",
    ]);
  });

  it("studioAiSeedFromStacks api-only → anthropic not cursor", () => {
    const seed = studioAiSeedFromStacks(["api-only"]);
    expect(seed.defaultHarness).toBe("anthropic");
    expect(seed.desiredCapabilities).not.toContain("harness:cursor");
  });
});
