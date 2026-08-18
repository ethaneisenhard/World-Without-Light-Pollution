import { describe, expect, it } from "vitest";
import {
  backupHostOrchestrator,
  restoreHostOrchestrator,
  type HostBackupFs,
  type HostBackupOrchestratorDeps,
} from "./host-backup-orchestrator.js";

type Node = { kind: "file"; data: Uint8Array } | { kind: "dir" };

function createMemoryFs(): HostBackupFs & { store: Map<string, Node> } {
  const store = new Map<string, Node>();
  const norm = (p: string) => p.replace(/\/+/g, "/").replace(/\/$/, "") || "/";

  const ensureParentDir = async (filePath: string) => {
    const parts = norm(filePath).split("/").filter(Boolean);
    parts.pop();
    let cur = "";
    for (const part of parts) {
      cur = `${cur}/${part}`;
      const n = store.get(cur);
      if (!n) store.set(cur, { kind: "dir" });
      else if (n.kind !== "dir") throw new Error(`not a dir: ${cur}`);
    }
  };

  const fs: HostBackupFs & { store: Map<string, Node> } = {
    store,
    async mkdir(path, opts) {
      const p = norm(path);
      if (store.has(p)) return;
      if (opts?.recursive) await ensureParentDir(`${p}/x`);
      store.set(p, { kind: "dir" });
    },
    async writeFile(path, data, enc) {
      const p = norm(path);
      await ensureParentDir(p);
      const buf =
        typeof data === "string"
          ? new TextEncoder().encode(data)
          : data instanceof Uint8Array
            ? data
            : new TextEncoder().encode(String(data));
      void enc;
      store.set(p, { kind: "file", data: buf });
    },
    async readFile(path, enc) {
      void enc;
      const n = store.get(norm(path));
      if (!n || n.kind !== "file") throw new Error(`ENOENT ${path}`);
      return new TextDecoder().decode(n.data);
    },
    async readFileBuffer(path) {
      const n = store.get(norm(path));
      if (!n || n.kind !== "file") throw new Error(`ENOENT ${path}`);
      return n.data;
    },
    async copyFile(src, dest) {
      const n = store.get(norm(src));
      if (!n || n.kind !== "file") throw new Error(`ENOENT ${src}`);
      await fs.writeFile(dest, n.data);
    },
    async rm(path, opts) {
      const p = norm(path);
      const n = store.get(p);
      if (!n) {
        if (opts?.force) return;
        throw new Error(`ENOENT ${path}`);
      }
      if (n.kind === "file") {
        store.delete(p);
        return;
      }
      if (!opts?.recursive) throw new Error(`EISDIR ${path}`);
      for (const key of [...store.keys()]) {
        if (key === p || key.startsWith(`${p}/`)) store.delete(key);
      }
    },
    async readdir(path) {
      const p = norm(path);
      const prefix = `${p}/`;
      const names = new Set<string>();
      for (const key of store.keys()) {
        if (!key.startsWith(prefix)) continue;
        const rest = key.slice(prefix.length);
        const name = rest.split("/")[0];
        if (name) names.add(name);
      }
      return [...names];
    },
    async stat(path) {
      const n = store.get(norm(path));
      if (!n) throw new Error(`ENOENT ${path}`);
      return { isFile: n.kind === "file", isDirectory: n.kind === "dir" };
    },
    async pathExists(path) {
      return store.has(norm(path));
    },
  };
  return fs;
}

function makeDeps(
  fs: HostBackupFs,
  home: string,
): HostBackupOrchestratorDeps {
  const join = (...parts: string[]) =>
    parts.join("/").replace(/\/+/g, "/");
  return {
    fs,
    getStudioHome: () => home,
    joinPath: join,
    dirname: (p) => {
      const n = p.replace(/\/+/g, "/").replace(/\/$/, "");
      const i = n.lastIndexOf("/");
      return i <= 0 ? "/" : n.slice(0, i);
    },
    nowIso: () => "2026-07-22T12:00:00.000Z",
  };
}

describe("host-backup-orchestrator", () => {
  it("backup → restore round-trip on fake fs", async () => {
    const mem = createMemoryFs();
    const home = "/data/glassbox-studio";
    const deps = makeDeps(mem, home);

    await mem.mkdir(home, { recursive: true });
    await mem.mkdir(`${home}/workspaces/demo`, { recursive: true });
    await mem.writeFile(
      `${home}/registry.json`,
      JSON.stringify({ projects: [{ id: "demo", path: `${home}/workspaces/demo` }] }),
      "utf8",
    );
    await mem.writeFile(`${home}/config.json`, '{"ok":true}\n', "utf8");
    await mem.writeFile(
      `${home}/workspaces/demo/README.md`,
      "# demo\n",
      "utf8",
    );
    await mem.writeFile(`${home}/studio.db`, new Uint8Array([1, 2, 3, 4]));

    const backup = await backupHostOrchestrator(deps, {
      outDir: "/tmp/host-backup",
    });
    expect(backup.copied).toContain("registry.json");
    expect(backup.copied).toContain("workspaces");
    expect(backup.copied).toContain("db/studio.db");
    expect(backup.manifest.kind).toBe("glassbox-studio-host-backup");

    // Wipe source home
    await mem.rm(home, { recursive: true, force: true });
    expect(await mem.pathExists(`${home}/registry.json`)).toBe(false);

    const restored = await restoreHostOrchestrator(deps, {
      backupDir: "/tmp/host-backup",
      targetStudioHome: home,
    });
    expect(restored.restored).toContain("registry.json");
    expect(restored.restored).toContain("db/studio.db");

    const reg = JSON.parse(await mem.readFile(`${home}/registry.json`, "utf8"));
    expect(reg.projects[0].id).toBe("demo");
    expect(await mem.readFile(`${home}/workspaces/demo/README.md`, "utf8")).toBe(
      "# demo\n",
    );
    const db = await mem.readFileBuffer(`${home}/studio.db`);
    expect([...db]).toEqual([1, 2, 3, 4]);
  });

  it("refuses restore onto existing registry without force", async () => {
    const mem = createMemoryFs();
    const home = "/data/glassbox-studio";
    const deps = makeDeps(mem, home);
    await mem.mkdir(home, { recursive: true });
    await mem.writeFile(`${home}/registry.json`, '{"projects":[]}\n', "utf8");
    await mem.writeFile(`${home}/studio.db`, new Uint8Array([9]));

    await backupHostOrchestrator(deps, { outDir: "/b" });

    await expect(
      restoreHostOrchestrator(deps, { backupDir: "/b", targetStudioHome: home }),
    ).rejects.toThrow(/already has registry/);

    await restoreHostOrchestrator(deps, {
      backupDir: "/b",
      targetStudioHome: home,
      force: true,
    });
  });
});
