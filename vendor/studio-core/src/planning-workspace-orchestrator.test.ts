import { describe, expect, it } from "vitest";
import { createPlanningWorkspaceOrchestrator } from "./planning-workspace-orchestrator.js";
import type { ProjectRegistry } from "./types.js";

describe("createPlanningWorkspaceOrchestrator", () => {
  it("writes scaffold and registers", async () => {
    const files = new Map<string, string>();
    const dirs = new Set<string>();
    let registry: ProjectRegistry = { version: 1, projects: [] };

    const result = await createPlanningWorkspaceOrchestrator(
      {
        fs: {
          mkdir: async (p) => {
            dirs.add(p);
          },
          writeFile: async (p, data) => {
            files.set(p, data);
          },
          readFile: async () => "",
        },
        getStudioHome: () => "/home/.glassbox-studio",
        getRegistryPath: () => "/home/.glassbox-studio/registry.json",
        loadRegistry: async () => registry,
        saveRegistry: async (next) => {
          registry = next;
        },
        joinPath: (...parts) => parts.join("/").replace(/\/+/g, "/"),
        pathExists: async () => false,
      },
      { name: "Van Build", brief: "sauna" },
    );

    expect(result.projectId).toBe("van-build");
    expect(result.path).toBe("/home/.glassbox-studio/workspaces/van-build");
    expect(registry.projects).toEqual([
      {
        id: "van-build",
        path: "/home/.glassbox-studio/workspaces/van-build",
        name: "Van Build",
      },
    ]);
    expect(
      files.get(
        "/home/.glassbox-studio/workspaces/van-build/.glassbox-studio/project.json",
      ),
    ).toContain('"kind": "planning"');
  });
});
