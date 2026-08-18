import { describe, expect, it } from "vitest";
import {
  clampDirectoryPage,
  filterDirectoryByQuery,
  paginateDirectory,
} from "./directory-pure.js";
import {
  buildMcpDirectoryEntries,
  DEFAULT_MCP_DIRECTORY_CATEGORY,
  MCP_DIRECTORY_CATALOG,
  MCP_DIRECTORY_NAV,
  queryMcpDirectory,
} from "./mcp-directory-pure.js";

describe("directory-pure", () => {
  it("paginates and clamps", () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    const p1 = paginateDirectory(items, 1, 9);
    expect(p1.items).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(p1.totalPages).toBe(3);
    expect(p1.hasNext).toBe(true);
    const p3 = paginateDirectory(items, 99, 9);
    expect(p3.page).toBe(3);
    expect(clampDirectoryPage(0, 5)).toBe(1);
  });

  it("filters by query", () => {
    expect(
      filterDirectoryByQuery(
        [{ title: "n8n" }, { title: "GitHub" }],
        "git",
        (x) => [x.title],
      ),
    ).toEqual([{ title: "GitHub" }]);
  });
});

describe("mcp-directory-pure", () => {
  it("has nav groups and catalog", () => {
    expect(MCP_DIRECTORY_NAV[0]?.id).toBe("explore");
    expect(MCP_DIRECTORY_CATALOG.length).toBeGreaterThanOrEqual(8);
    expect(DEFAULT_MCP_DIRECTORY_CATEGORY).toBe("popular");
  });

  it("marks connected servers from config", () => {
    const entries = buildMcpDirectoryEntries([
      {
        id: "n8n-local",
        kind: "http",
        enabled: true,
        url: "http://127.0.0.1:5678/mcp-server/http",
        label: "n8n MCP",
      },
    ]);
    const n8n = entries.find((e) => e.server.id === "n8n-local");
    expect(n8n?.status).toBe("connected");
    expect(entries.some((e) => e.status === "available")).toBe(true);
  });

  it("queries popular page", () => {
    const page = queryMcpDirectory({
      servers: [],
      category: "popular",
      search: "",
      page: 1,
    });
    expect(page.items.every((e) => e.popular)).toBe(true);
    expect(page.items.length).toBeGreaterThan(0);
  });

  it("filters project configs in the same directory", () => {
    const page = queryMcpDirectory({
      servers: [],
      category: "project",
      search: "",
      page: 1,
      projectConfigs: [
        { id: "zap", path: "integrations/zap.json", config: { kind: "n8n" } },
      ],
    });
    expect(page.total).toBe(1);
    expect(page.items[0]?.entryKind).toBe("project");
    expect(page.items[0]?.title).toBe("zap");
  });

  it("excludes project configs from popular", () => {
    const page = queryMcpDirectory({
      servers: [],
      category: "popular",
      search: "",
      page: 1,
      projectConfigs: [
        { id: "zap", path: "integrations/zap.json", config: { kind: "n8n" } },
      ],
    });
    expect(page.items.every((e) => e.entryKind !== "project")).toBe(true);
  });
});
