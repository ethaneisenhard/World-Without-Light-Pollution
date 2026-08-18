import { describe, expect, it } from "vitest";
import {
  buildNotePromoteMarkdown,
  ensureMarkdownNoteRelPath,
  filterNoteHits,
  formatNotesBundleSlice,
  noteQueryFromUserMessage,
  normalizeVaultPath,
  notesBridgeEnabled,
  notesInjectEnabled,
  notesStudioRootRaw,
  resolveNotesVaultRelativePath,
  sanitizeNotesPathSegment,
  sortNotesTreeNodes,
} from "./notes-bridge-pure.js";

describe("notes-bridge-pure", () => {
  it("normalizes home vault and builds promote md", () => {
    expect(normalizeVaultPath("~/Notes", "/Users/me")).toBe("/Users/me/Notes");
    expect(notesBridgeEnabled("")).toBe(false);
    const md = buildNotePromoteMarkdown("Hello", "body", {
      origin: "self_learn",
      scope: "project",
      projectId: "demo-blog",
      sourceRun: "run_1",
    });
    expect(md).toContain("origin: self_learn");
    expect(md).toContain("# Hello");
  });

  it("prefers legacy vault over studioRoot", () => {
    expect(
      notesStudioRootRaw({
        vault: "~/Legacy",
        studioRoot: "~/.glassbox-studio/notes",
      }),
    ).toBe("~/Legacy");
    expect(
      notesStudioRootRaw({ vault: "", studioRoot: "~/.glassbox-studio/notes" }),
    ).toBe("~/.glassbox-studio/notes");
  });

  it("filters note hits", () => {
    const hits = filterNoteHits(
      [
        { path: "a.md", snippet: "dark mode" },
        { path: "b.md", snippet: "other" },
      ],
      "dark",
    );
    expect(hits).toHaveLength(1);
  });

  it("builds inject query and bundle slice with snippets", () => {
    expect(noteQueryFromUserMessage("  prefer dark mode for chrome  ")).toContain(
      "dark mode",
    );
    expect(
      notesInjectEnabled({
        vault: "",
        studioRoot: "~/.glassbox-studio/notes",
        injectOnTurn: true,
      }),
    ).toBe(true);
    expect(notesInjectEnabled({ vault: "", injectOnTurn: false })).toBe(false);
    expect(notesInjectEnabled({ vault: "~/v", injectOnTurn: true })).toBe(true);
    const slice = formatNotesBundleSlice([
      { path: "Daily/x.md", snippet: "prefers Tailwind" },
    ]);
    expect(slice).toContain("Daily/x.md");
    expect(slice).toContain("Tailwind");
  });

  it("resolves vault-relative paths safely", () => {
    const root = "/Users/me/.glassbox-studio/notes";
    expect(resolveNotesVaultRelativePath(root, "Ideas/a.md")).toBe(
      `${root}/Ideas/a.md`,
    );
    expect(resolveNotesVaultRelativePath(root, "../etc/passwd")).toBeNull();
    expect(resolveNotesVaultRelativePath(root, "Ideas/../secret.md")).toBeNull();
    expect(resolveNotesVaultRelativePath(root, ".hidden/a.md")).toBeNull();
    expect(resolveNotesVaultRelativePath(root, "")).toBeNull();
    expect(ensureMarkdownNoteRelPath("Ideas/foo.md")).toBe("Ideas/foo.md");
    expect(ensureMarkdownNoteRelPath("Ideas/foo.txt")).toBeNull();
    expect(sanitizeNotesPathSegment("My Note")).toBe("My Note");
    expect(sanitizeNotesPathSegment("../x")).toBeNull();
  });

  it("sorts tree nodes dirs first", () => {
    const sorted = sortNotesTreeNodes([
      { name: "z.md", path: "z.md", kind: "file" },
      { name: "Ideas", path: "Ideas", kind: "dir" },
      { name: "a.md", path: "a.md", kind: "file" },
    ]);
    expect(sorted.map((n) => n.name)).toEqual(["Ideas", "a.md", "z.md"]);
  });
});
