import { describe, expect, it } from "vitest";
import {
  discoverWorkspaceImportCandidatesOrchestrator,
  importWorkspaceCandidatesOrchestrator,
} from "./workspace-import-orchestrator.js";
import type { ProjectRegistry } from "./types.js";

describe("workspace-import-orchestrator", () => {
  it("discovers dirs under Studio folder and imports selected", async () => {
    const files = new Map<string, string>([
      [
        "/repo/browserui-org/.glassbox-studio/project.json",
        JSON.stringify({ id: "browserui-org", name: "BrowserUI" }),
      ],
      [
        "/repo/demo-blog/.glassbox-studio/project.json",
        JSON.stringify({ id: "demo-blog", name: "Demo Blog" }),
      ],
    ]);
    let registry: ProjectRegistry = {
      version: 1,
      projects: [
        {
          id: "demo-blog",
          path: "demo-blog",
          name: "Demo Blog",
        },
      ],
    };

    const deps = {
      fs: {
        mkdir: async () => {},
        writeFile: async (p: string, data: string) => {
          files.set(p, data);
        },
        readFile: async (p: string) => {
          const v = files.get(p);
          if (v == null) throw new Error(`missing ${p}`);
          return v;
        },
      },
      getStudioHome: () => "/home/.glassbox-studio",
      getRegistryPath: () => "/home/.glassbox-studio/registry.json",
      loadRegistry: async () => registry,
      saveRegistry: async (next: ProjectRegistry) => {
        registry = next;
      },
      joinPath: (...parts: string[]) => parts.join("/").replace(/\/+/g, "/"),
      pathExists: async (p: string) =>
        files.has(p) || p === "/repo" || p.startsWith("/repo/"),
      resolveProjectRoot: (repo: string, entryPath: string) =>
        entryPath.startsWith("/") ? entryPath : `${repo}/${entryPath}`,
      repoRoot: "/repo",
      fsRoot: "/",
      homeDir: "/home",
      normalizePath: (p: string) => p,
      readdir: async (p: string) => {
        if (p === "/repo") {
          return [
            { name: "demo-blog", isDirectory: () => true },
            { name: "browserui-org", isDirectory: () => true },
            { name: "_template", isDirectory: () => true },
            { name: "node_modules", isDirectory: () => true },
            { name: "README.md", isDirectory: () => false },
          ];
        }
        return [];
      },
    };

    const discovered = await discoverWorkspaceImportCandidatesOrchestrator(
      deps,
      { scanRoot: "." },
    );
    expect(discovered.scanRoot).toBe(".");
    expect(discovered.scanRootAbs).toBe("/repo");
    expect(discovered.parentScanRoot).toBe("/");
    const children = discovered.candidates.filter((c) => !c.isScanRoot);
    expect(children.map((c) => c.id).sort()).toEqual([
      "browserui-org",
      "demo-blog",
    ]);
    expect(
      discovered.candidates.find((c) => c.id === "demo-blog")?.registered,
    ).toBe(true);
    expect(
      discovered.candidates.find((c) => c.id === "browserui-org")?.path,
    ).toBe("browserui-org");
    expect(discovered.linkedWorkspaces).toEqual([
      { id: "demo-blog", name: "Demo Blog", path: "/repo/demo-blog" },
    ]);

    const imported = await importWorkspaceCandidatesOrchestrator(deps, {
      selectedIds: ["browserui-org", "demo-blog"],
      scanRoot: ".",
    });
    expect(imported.linked.map((l) => l.id)).toEqual(["browserui-org"]);
    expect(imported.alreadyRegistered).toEqual(["demo-blog"]);
    expect(registry.projects.some((p) => p.id === "browserui-org")).toBe(true);
  });

  it("discovers folders at the computer disk root", async () => {
    let registry: ProjectRegistry = { version: 1, projects: [] };
    const deps = {
      fs: {
        mkdir: async () => {},
        writeFile: async () => {},
        readFile: async () => {
          throw new Error("none");
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
      resolveProjectRoot: (repo: string, entryPath: string) =>
        entryPath.startsWith("/") ? entryPath : `${repo}/${entryPath}`,
      repoRoot: "/repo",
      fsRoot: "/",
      homeDir: "/Users/sam",
      normalizePath: (p: string) => p,
      readdir: async (p: string) => {
        if (p === "/") {
          return [
            { name: "Users", isDirectory: () => true },
            { name: "Applications", isDirectory: () => true },
            { name: ".hidden", isDirectory: () => true },
          ];
        }
        return [];
      },
    };

    const discovered = await discoverWorkspaceImportCandidatesOrchestrator(
      deps,
    );
    expect(discovered.scanRoot).toBe("/");
    expect(discovered.canSelectAll).toBe(false);
    expect(discovered.parentScanRoot).toBe(null);
    expect(discovered.homeDir).toBe("/Users/sam");
    expect(discovered.candidates.some((c) => c.isScanRoot)).toBe(false);
    expect(discovered.candidates.map((c) => c.path).sort()).toEqual([
      "/.hidden",
      "/Applications",
      "/Users",
    ]);
    expect(discovered.linkedWorkspaces).toEqual([]);
  });
});
