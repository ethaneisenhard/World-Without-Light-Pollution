import { describe, expect, it } from "vitest";
import { designSandboxRegistry } from "./registry.js";

describe("canvas inspector registry API shape", () => {
  it("bootstraps blog-hero and renders with instance stamp pattern", () => {
    const boot = designSandboxRegistry.inspectorBootstrap("blog-hero");
    expect(boot?.id).toBe("blog-hero");
    expect(boot?.props).toBeTruthy();
    let html = designSandboxRegistry.renderWithDraft("blog-hero", boot!.draft)!;
    expect(html).toContain('data-as-component="blog-hero"');
    html = html.replace(
      /data-as-component="([^"]+)"/,
      `data-as-inspect="1" data-as-kind="component" data-as-component="$1" data-as-instance="home-hero"`,
    );
    expect(html).toContain('data-as-instance="home-hero"');
  });
});
