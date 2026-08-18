import { describe, expect, it } from "vitest";
import {
  anthropicHarnessToolDefinitions,
  anthropicToolDefinitions,
  describeToolSchema,
  fromAnthropicToolName,
  HARNESS_PROGRESSIVE_TOOL_IDS,
  resolveAction,
  searchTools,
  toAnthropicToolName,
} from "./tool-catalog-pure.js";

describe("searchTools", () => {
  it("finds files tools by query", () => {
    const hits = searchTools("read");
    expect(hits.some((t) => t.id === "files.read")).toBe(true);
  });

  it("respects allowlist", () => {
    expect(searchTools("", ["files.read"]).map((t) => t.id)).toEqual([
      "files.read",
    ]);
  });

  it("excludes meta tools by default", () => {
    expect(searchTools("").some((t) => t.id === "tools.search")).toBe(false);
  });

  it("includes meta when opted in", () => {
    expect(
      searchTools("tools", undefined, { includeMeta: true }).some(
        (t) => t.id === "tools.search",
      ),
    ).toBe(true);
  });

  it("matches multi-word queries with AND tokens", () => {
    const hits = searchTools("workspace create");
    expect(hits.some((t) => t.id === "studio.workspace.create")).toBe(true);
    expect(searchTools("new project").some((t) => t.id === "studio.workspace.create")).toBe(
      true,
    );
    expect(
      searchTools("clone github").some((t) => t.id === "studio.workspace.cloneFromGit"),
    ).toBe(true);
  });
});

describe("resolveAction", () => {
  it("returns known action", () => {
    expect(resolveAction("files.list").id).toBe("files.list");
  });

  it("rejects unknown", () => {
    expect(() => resolveAction("files.delete")).toThrow(/Unknown action/);
  });

  it("rejects disallowed", () => {
    expect(() => resolveAction("files.write", ["files.read"])).toThrow(
      /not allowed/,
    );
  });
});

describe("anthropic tool names", () => {
  it("maps dots to underscores for Anthropic pattern", () => {
    expect(toAnthropicToolName("files.read")).toBe("files_read");
    expect(fromAnthropicToolName("files_apply_proposal")).toBe(
      "files.apply_proposal",
    );
  });

  it("emits schemas with legal names", () => {
    const defs = anthropicToolDefinitions(["files.read"]);
    expect(defs).toHaveLength(1);
    expect(defs[0]!.name).toBe("files_read");
    expect(defs[0]!.name).toMatch(/^[a-zA-Z0-9_-]{1,128}$/);
  });

  it("includes studio.theme.set schema", () => {
    const defs = anthropicToolDefinitions(["studio.theme.set"]);
    expect(defs[0]!.name).toBe("studio_theme_set");
    expect(fromAnthropicToolName("studio_theme_set")).toBe("studio.theme.set");
  });

  it("includes studio.brand.set, studio.pet.set, dock, home, and vision schemas", () => {
    const defs = anthropicToolDefinitions([
      "studio.brand.set",
      "studio.pet.set",
      "studio.dock.set",
      "studio.home.patch",
      "studio.vision.describe",
    ]);
    expect(defs.map((d) => d.name)).toEqual([
      "studio_brand_set",
      "studio_pet_set",
      "studio_dock_set",
      "studio_home_patch",
      "studio_vision_describe",
    ]);
  });
});

describe("anthropicHarnessToolDefinitions", () => {
  it("exposes only progressive surface + skills", () => {
    const defs = anthropicHarnessToolDefinitions();
    expect(defs.map((d) => d.name).sort()).toEqual(
      [...HARNESS_PROGRESSIVE_TOOL_IDS]
        .map((id) => toAnthropicToolName(id))
        .sort(),
    );
    expect(defs.length).toBeLessThan(10);
    expect(defs.some((d) => d.name === "studio_theme_set")).toBe(false);
  });

  it("describeToolSchema returns input_schema for concrete tools", () => {
    const d = describeToolSchema("files.write");
    expect(d.id).toBe("files.write");
    expect(d.input_schema).toMatchObject({ type: "object" });
  });

  it("describeToolSchema covers git.github.connect", () => {
    const d = describeToolSchema("git.github.connect");
    expect(d.id).toBe("git.github.connect");
    expect(d.input_schema).toMatchObject({ type: "object" });
  });

  it("describeToolSchema covers studio.chat.focus", () => {
    const d = describeToolSchema("studio.chat.focus");
    expect(d.id).toBe("studio.chat.focus");
    expect(d.input_schema).toMatchObject({ type: "object" });
  });

  it("describeToolSchema covers agents.profile.create", () => {
    const d = describeToolSchema("agents.profile.create");
    expect(d.id).toBe("agents.profile.create");
    expect(d.input_schema.required).toEqual(["id"]);
  });

  it("describeToolSchema covers studio.workspace.cloneFromGit", () => {
    const d = describeToolSchema("studio.workspace.cloneFromGit");
    expect(d.id).toBe("studio.workspace.cloneFromGit");
    expect(d.input_schema.required).toEqual(["url"]);
  });
});
