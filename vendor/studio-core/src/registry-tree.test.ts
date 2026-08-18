import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { listProjectFilePaths } from "./registry.js";

describe("listProjectFilePaths", () => {
  let tmp: string;

  afterEach(async () => {
    if (tmp) await fs.rm(tmp, { recursive: true, force: true });
  });

  it("returns sorted file paths and skips node_modules / .git / dist", async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), "as-tree-"));
    await fs.mkdir(path.join(tmp, "src"), { recursive: true });
    await fs.mkdir(path.join(tmp, "node_modules", "pkg"), { recursive: true });
    await fs.mkdir(path.join(tmp, ".git"), { recursive: true });
    await fs.mkdir(path.join(tmp, "dist"), { recursive: true });
    await fs.writeFile(path.join(tmp, "package.json"), "{}");
    await fs.writeFile(path.join(tmp, "src", "index.ts"), "export {}");
    await fs.writeFile(path.join(tmp, "node_modules", "pkg", "index.js"), "");
    await fs.writeFile(path.join(tmp, ".git", "config"), "");
    await fs.writeFile(path.join(tmp, "dist", "out.js"), "");

    const paths = await listProjectFilePaths(tmp);
    expect(paths).toEqual(["package.json", "src/index.ts"]);
  });
});
