import { describe, expect, it } from "vitest";
import { createPlanningWorkspaceOrchestrator } from "./planning-workspace-orchestrator.js";
import {
  deleteWorkspaceOrchestrator,
  listWorkspacesOrchestrator,
  unlinkWorkspaceOrchestrator,
} from "./workspace-crud-orchestrator.js";
import type { ProjectRegistry } from "./types.js";

describe("workspace-crud-orchestrator", () => {
  it("create → list → unlink", async () => {
    const files = new Map<string, string>();
    let registry: ProjectRegistry = { version: 1, projects: [] };
    const deps = {
      fs: {
        mkdir: async () => {},
        writeFile: async (p: string, data: string) => {
          files.set(p, data);
        },
        readFile: async () => "",
        rm: async (p: string) => {
          for (const key of [...files.keys()]) {
            if (key === p || key.startsWith(p + "/")) files.delete(key);
          }
        },
      },
      getStudioHome: () => "/home/.glassbox-studio",
      getRegistryPath: () => "/home/.glassbox-studio/registry.json",
      loadRegistry: async () => registry,
      saveRegistry: async (next: ProjectRegistry) => {
        registry = next;
      },
      joinPath: (...parts: string[]) => parts.join("/").replace(/\/+/g, "/"),
      pathExists: async () => false,
      resolveProjectRoot: (_repo: string, entryPath: string) => entryPath,
      repoRoot: "/repo",
      normalizePath: (p: string) => p,
      loadProjectConfig: async () => ({ id: "x", kind: "planning" }),
    };

    await createPlanningWorkspaceOrchestrator(deps, { name: "Trip" });
    const listed = await listWorkspacesOrchestrator(deps);
    expect(listed.some((w) => w.id === "trip")).toBe(true);

    await unlinkWorkspaceOrchestrator(deps, { projectId: "trip" });
    expect(registry.projects).toEqual([]);
  });

  it("delete requires phrase and planning-home for files", async () => {
    const files = new Map<string, string>();
    let registry: ProjectRegistry = {
      version: 1,
      projects: [
        {
          id: "van-build",
          path: "/home/.glassbox-studio/workspaces/van-build",
          name: "Van Build",
        },
      ],
    };
    const deps = {
      fs: {
        mkdir: async () => {},
        writeFile: async () => {},
        readFile: async () => "",
        rm: async (p: string) => {
          files.set(`rm:${p}`, "1");
        },
      },
      getStudioHome: () => "/home/.glassbox-studio",
      getRegistryPath: () => "/home/.glassbox-studio/registry.json",
      loadRegistry: async () => registry,
      saveRegistry: async (next: ProjectRegistry) => {
        registry = next;
      },
      joinPath: (...parts: string[]) => parts.join("/"),
      pathExists: async () => true,
      resolveProjectRoot: (_r: string, p: string) => p,
      repoRoot: "/repo",
      normalizePath: (p: string) => p,
    };

    await expect(
      deleteWorkspaceOrchestrator(deps, {
        projectId: "van-build",
        deleteFiles: true,
      }),
    ).rejects.toThrow(/confirmPhrase/);

    const deleted = await deleteWorkspaceOrchestrator(deps, {
      projectId: "van-build",
      deleteFiles: true,
      confirmPhrase: "van-build",
    });
    expect(deleted.deletedFiles).toBe(true);
    expect(files.has("rm:/home/.glassbox-studio/workspaces/van-build")).toBe(true);
    expect(registry.projects).toEqual([]);
  });
});
