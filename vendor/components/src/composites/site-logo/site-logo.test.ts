import { describe, expect, it } from "vitest";
import { renderSiteLogo } from "./site-logo.js";

describe("renderSiteLogo", () => {
  it("defaults mark to GlassBoxMarkIcon SSR twin (design-system)", () => {
    const html = renderSiteLogo({
      props: { instanceId: "site-logo", size: "sm" },
      slots: { wordmark: "Glass Box Computer" },
    });
    expect(html).toContain('data-as-component="site-logo"');
    expect(html).toContain('data-studio-icon="glass-box-mark"');
    expect(html).toContain("#D6EEFF");
    expect(html).not.toContain("<img");
    expect(html).toContain("Glass Box Computer");
  });

  it("allows initials override for non–Glass Box demos", () => {
    const html = renderSiteLogo({
      props: { markVariant: "initials" },
      slots: { mark: "N", wordmark: "Northline" },
    });
    expect(html).toContain("Northline");
    expect(html).toContain("rounded-full bg-accent");
    expect(html).not.toContain('data-studio-icon="glass-box-mark"');
  });
});
