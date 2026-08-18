import { describe, expect, it } from "vitest";
import { shouldRunContentGenerate } from "./content-generate-pure.js";

describe("shouldRunContentGenerate", () => {
  const gen = {
    content_generate: {
      command: "node",
      args: ["scripts/generate-posts.mjs"],
    },
  };

  it("true for content paths", () => {
    expect(shouldRunContentGenerate("content/blog/hello.mdx", gen)).toBe(true);
    expect(shouldRunContentGenerate("content/pages/home.md", gen)).toBe(true);
  });

  it("false outside content", () => {
    expect(shouldRunContentGenerate("src/index.ts", gen)).toBe(false);
    expect(shouldRunContentGenerate("package.json", gen)).toBe(false);
  });

  it("false without config", () => {
    expect(shouldRunContentGenerate("content/blog/a.mdx", {})).toBe(false);
    expect(shouldRunContentGenerate("content/blog/a.mdx", null)).toBe(false);
  });

  it("respects custom prefixes", () => {
    const hosting = {
      content_generate: {
        command: "node",
        args: ["scripts/gen.mjs"],
        path_prefixes: ["docs/"],
      },
    };
    expect(shouldRunContentGenerate("docs/a.md", hosting)).toBe(true);
    expect(shouldRunContentGenerate("content/a.md", hosting)).toBe(false);
  });
});
