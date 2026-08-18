import { describe, expect, it } from "vitest";
import {
  mcpPlaneDirectoryEntry,
  queryMcpToolsDirectory,
  queryProvidersDirectory,
  queryRulesDirectory,
  querySkillsDirectory,
} from "./settings-directory-pure.js";
import type { MergedRule } from "./rules-manifest-pure.js";
import { STUDIO_TOOL_CATALOG } from "./tool-catalog-pure.js";

describe("settings-directory-pure", () => {
  it("paginates mcp tools", () => {
    const page = queryMcpToolsDirectory({
      catalog: STUDIO_TOOL_CATALOG,
      toolsEnabled: {},
      category: "all",
      search: "",
      page: 1,
      pageSize: 9,
    });
    expect(page.items.length).toBeLessThanOrEqual(9);
    expect(page.total).toBe(STUDIO_TOOL_CATALOG.length);
  });

  it("prepends Kody MCP plane as a directory card, not a sidecar", () => {
    const kody = mcpPlaneDirectoryEntry({
      id: "mcp:kody",
      title: "Kody",
      description: "Kent’s tool plane",
      readinessStatus: "needs-setup",
      action: "connect",
      actionLabel: "Connect (URL)",
      hint: "Set KODY_BASE_URL then connect.",
    });
    expect(kody.kind).toBe("mcp-plane");
    expect(kody.category).toBe("mcp");
    expect(kody.status).toBe("off");
    const page = queryMcpToolsDirectory({
      catalog: STUDIO_TOOL_CATALOG,
      toolsEnabled: {},
      extraEntries: [kody],
      category: "all",
      search: "",
      page: 1,
      pageSize: 9,
    });
    expect(page.items[0]?.id).toBe("mcp:kody");
    expect(page.total).toBe(STUDIO_TOOL_CATALOG.length + 1);
    const mcpOnly = queryMcpToolsDirectory({
      catalog: STUDIO_TOOL_CATALOG,
      toolsEnabled: {},
      extraEntries: [kody],
      category: "mcp",
      search: "kody",
      page: 1,
    });
    expect(mcpOnly.items.some((e) => e.id === "mcp:kody")).toBe(true);
  });

  it("filters skills by source including studio", () => {
    const page = querySkillsDirectory({
      skills: [
        { id: "vendor/a", name: "A", source: "bundled" },
        { id: "engineering/b", name: "B", source: "studio", folder: "engineering" },
        { id: "ops/c", name: "C", source: "project", folder: "ops" },
      ],
      category: "studio",
      search: "",
      page: 1,
    });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.title).toBe("B");
    expect(page.items[0]?.meta).toContain("engineering/b");
  });

  it("filters enabled rules", () => {
    const rules: MergedRule[] = [
      { id: "r1", path: "a.md", enabled: true, scope: "studio" },
      { id: "r2", path: "b.md", enabled: false, scope: "project" },
    ];
    const page = queryRulesDirectory({
      rules,
      category: "enabled",
      search: "",
      page: 1,
    });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.id).toBe("studio:r1");
  });

  it("lists providers", () => {
    const page = queryProvidersDirectory({
      providers: { calendar: { plugin: "@x/cal" }, media: {} },
      category: "configured",
      search: "",
      page: 1,
    });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.id).toBe("calendar");
  });
});
