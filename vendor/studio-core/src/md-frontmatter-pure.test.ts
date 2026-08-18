import { describe, expect, it } from "vitest";
import {
  applyDetailsFields,
  applyFrontmatterFields,
  extractBodyHeading,
  frontmatterFormValues,
  parseMarkdownFrontmatter,
  rejoinMarkdownDocument,
  replaceBodyHeading,
  serializeMarkdownFrontmatter,
} from "./md-frontmatter-pure.js";

describe("parseMarkdownFrontmatter", () => {
  it("parses yaml block and body", () => {
    const doc = parseMarkdownFrontmatter(
      `---\ntitle: Hello\ndescription: A post\nvisibility: public\n---\n\n# Hello\n\nBody.`,
    );
    expect(doc.hasFrontmatter).toBe(true);
    expect(doc.fields.title).toBe("Hello");
    expect(doc.fields.description).toBe("A post");
    expect(doc.body).toContain("# Hello");
  });

  it("parses list categories as comma string", () => {
    const doc = parseMarkdownFrontmatter(
      `---\ntitle: X\ncategories:\n  - review\n  - launch\n---\n\nHi`,
    );
    expect(doc.fields.categories).toBe("review, launch");
  });

  it("no frontmatter → empty fields + full body", () => {
    const doc = parseMarkdownFrontmatter("# About\n\nPara");
    expect(doc.hasFrontmatter).toBe(false);
    expect(doc.fields).toEqual({});
    expect(doc.body).toContain("# About");
  });
});

describe("serializeMarkdownFrontmatter", () => {
  it("writes labeled fields back to yaml", () => {
    const md = serializeMarkdownFrontmatter(
      {
        title: "Hello",
        description: "Blurb",
        date: "2026-07-12",
        categories: "a, b",
        visibility: "public",
        draft: "false",
        unlisted: "false",
      },
      "# Hello\n\nBody",
    );
    expect(md).toContain("---\n");
    expect(md).toContain("title: Hello");
    expect(md).toContain("categories:");
    expect(md).toContain("  - a");
    expect(md).toContain("  - b");
    expect(md).not.toContain("draft:");
    expect(md).toContain("# Hello");
  });

  it("omits empty frontmatter entirely", () => {
    expect(serializeMarkdownFrontmatter({}, "# Only body")).toBe("# Only body");
  });
});

describe("applyFrontmatterFields", () => {
  it("preserves body while updating meta", () => {
    const next = applyFrontmatterFields(
      `---\ntitle: Old\n---\n\nKeep me`,
      { title: "New", description: "D", date: "", categories: "", visibility: "public", draft: "false", unlisted: "false" },
    );
    expect(next).toContain("title: New");
    expect(next).toContain("description: D");
    expect(next).toContain("Keep me");
  });
});

describe("frontmatterFormValues", () => {
  it("fills known keys", () => {
    const v = frontmatterFormValues(`---\ntitle: T\ndraft: true\n---\n\nx`);
    expect(v.title).toBe("T");
    expect(v.draft).toBe("true");
    expect(v.description).toBe("");
  });

  it("falls back to body H1 when title missing", () => {
    const v = frontmatterFormValues("# About North\n\nPara");
    expect(v.title).toBe("About North");
  });

  it("prefers body H1 over mismatched frontmatter title", () => {
    const v = frontmatterFormValues(
      `---\ntitle: Yaml Title\n---\n\n# Live Title\n\nPara`,
    );
    expect(v.title).toBe("Live Title");
  });
});

describe("extractBodyHeading / replaceBodyHeading", () => {
  it("reads and replaces H1", () => {
    expect(extractBodyHeading("# About\n\nBody")).toBe("About");
    expect(replaceBodyHeading("# About\n\nBody", "Next")).toBe("# Next\n\nBody");
  });

  it("inserts H1 when missing", () => {
    expect(replaceBodyHeading("Just body", "Title")).toBe("# Title\n\nJust body");
  });
});

describe("applyDetailsFields", () => {
  it("mirrors title into body H1 for Live preview", () => {
    const next = applyDetailsFields(
      `---\nvisibility: public\n---\n\n# About North\n\nKeep me`,
      {
        title: "About West",
        description: "",
        date: "",
        categories: "",
        visibility: "public",
        draft: "false",
        unlisted: "false",
      },
    );
    expect(next).toContain("title: About West");
    expect(next).toContain("# About West");
    expect(next).toContain("Keep me");
    expect(next).not.toContain("# About North");
  });
});

describe("rejoinMarkdownDocument", () => {
  it("keeps YAML and mirrors H1 into title", () => {
    const md = rejoinMarkdownDocument(
      { title: "Old", visibility: "public" },
      "# New Title\n\nBody",
    );
    expect(md).toContain("title: New Title");
    expect(md).toContain("visibility: public");
    expect(md).toContain("# New Title");
  });
});
