import { describe, expect, it } from "vitest";
import { renderProse } from "./prose.js";

describe("renderProse", () => {
  it("uses semantic article + ink token classes (not zinc)", () => {
    const html = renderProse({
      props: { instanceId: "post-body", size: "lg" },
      slots: { content: "<p>Hello</p>" },
    });
    expect(html).toMatch(/^<article\b/);
    expect(html).toContain('data-as-component="prose"');
    expect(html).toContain('data-as-instance="post-body"');
    expect(html).toContain('data-as-slot="content"');
    expect(html).toContain("text-ink-soft");
    // class attrs HTML-escape `&` in arbitrary variants (`[&_p]` → `[&amp;_p]`)
    expect(html).toContain("[&amp;_p]:my-6");
    expect(html).toContain("[&amp;_h1]:text-ink");
    expect(html).toContain("[&amp;_.as-md-gap]:h-8");
    expect(html).not.toContain("prose-neutral");
    expect(html).not.toContain("prose-p:");
    expect(html).toContain("<p>Hello</p>");
  });
});
