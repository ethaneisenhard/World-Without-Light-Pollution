import { describe, expect, it } from "vitest";
import { cloneWorkspaceFromGitOrchestrator } from "./workspace-clone-from-git-orchestrator.js";
import type { ProjectRegistry } from "./types.js";

function makeDeps(overrides?: {
  signedIn?: boolean;
  ghPresent?: boolean;
  registry?: ProjectRegistry;
  pathExists?: (p: string) => Promise<boolean>;
  cloneOk?: boolean;
}) {
  let registry: ProjectRegistry = overrides?.registry ?? {
    version: 1,
    projects: [],
  };
  const files = new Set<string>();
  return {
    files,
    get registry() {
      return registry;
    },
    deps: {
      fs: {
        mkdir: async (p: string) => {
          files.add(`dir:${p}`);
        },
        writeFile: async (p: string) => {
          files.add(p);
        },
        readFile: async () => "",
      },
      getStudioHome: () => "/home/.glassbox-studio",
      getRegistryPath: () => "/home/.glassbox-studio/registry.json",
      loadRegistry: async () => registry,
      saveRegistry: async (next: ProjectRegistry) => {
        registry = next;
      },
      joinPath: (...parts: string[]) => parts.join("/").replace(/\/+/g, "/"),
      pathExists:
        overrides?.pathExists ??
        (async (p: string) =>
          [...files].some((f) => f.startsWith(`clone:${p}:`))),
      resolveProjectRoot: (_repo: string, entryPath: string) => entryPath,
      repoRoot: "/repo",
      normalizePath: (p: string) => p,
      loadProjectConfig: async () => ({ id: "x", kind: "app" }),
      probeGithub: async () => ({
        ghPresent: overrides?.ghPresent ?? true,
        signedIn: overrides?.signedIn ?? true,
        face: overrides?.signedIn === false ? "not signed in" : "signed in",
      }),
      startGithubConnect: async () => ({
        ok: true,
        text: "Open https://github.com/login/device. Enter this code: ABCD-1234.",
        loginUrl: "https://github.com/login/device",
        userCode: "ABCD-1234",
      }),
      cloneRepo: async (input: { url: string; destDir: string }) => {
        if (overrides?.cloneOk === false) {
          return { ok: false as const, error: "clone failed" };
        }
        files.add(`clone:${input.destDir}:${input.url}`);
        return { ok: true as const };
      },
    },
  };
}

describe("cloneWorkspaceFromGitOrchestrator", () => {
  it("clones then links when signed in", async () => {
    const { deps, files } = makeDeps({ signedIn: true });
    const result = await cloneWorkspaceFromGitOrchestrator(deps, {
      url: "acme/widgets",
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.needsGithubConnect) throw new Error("expected clone");
    expect(result.projectId).toBe("widgets");
    expect(result.cloned).toBe(true);
    expect(result.path).toBe("/home/.glassbox-studio/workspaces/widgets");
    expect([...files].some((f) => f.startsWith("clone:"))).toBe(true);
  });

  it("returns GitHub device connect when signed out", async () => {
    const { deps } = makeDeps({ signedIn: false });
    const result = await cloneWorkspaceFromGitOrchestrator(deps, {
      url: "acme/widgets",
    });
    expect(result.ok).toBe(true);
    if (!result.ok || !result.needsGithubConnect) {
      throw new Error("expected connect");
    }
    expect(result.userCode).toBe("ABCD-1234");
    expect(result.text).toMatch(/ABCD-1234/);
  });

  it("errors when gh is missing", async () => {
    const { deps } = makeDeps({ ghPresent: false, signedIn: false });
    const result = await cloneWorkspaceFromGitOrchestrator(deps, {
      url: "acme/widgets",
    });
    expect(result.ok).toBe(false);
  });

  it("skips clone when already registered", async () => {
    const { deps } = makeDeps({
      signedIn: true,
      registry: {
        version: 1,
        projects: [
          {
            id: "widgets",
            path: "/home/.glassbox-studio/workspaces/widgets",
            name: "Widgets",
          },
        ],
      },
    });
    const result = await cloneWorkspaceFromGitOrchestrator(deps, {
      url: "acme/widgets",
    });
    expect(result.ok).toBe(true);
    if (!result.ok || result.needsGithubConnect) throw new Error("expected skip");
    expect(result.cloned).toBe(false);
  });
});
