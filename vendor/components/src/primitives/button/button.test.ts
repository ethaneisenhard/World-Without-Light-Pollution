import { describe, expect, it } from "vitest";
import { renderButton } from "./button.js";

describe("renderButton", () => {
  it("renders headless button with inspect attrs and label slot", () => {
    const html = renderButton({
      props: { variant: "primary", instanceId: "cta-1" },
      slots: { label: "Go" },
    });
    expect(html).toContain("<button type=\"button\"");
    expect(html).toContain('data-as-component="button"');
    expect(html).toContain('data-as-instance="cta-1"');
    expect(html).toContain('data-as-slot="label"');
    expect(html).toContain('data-variant="primary"');
    expect(html).toContain(">Go</span>");
    expect(html).not.toContain("nl-cta");
    expect(html).not.toContain("rounded-full");
  });

  it("renders anchor when href set; applies className from project", () => {
    const html = renderButton({
      props: {
        variant: "secondary",
        href: "/about",
        className: "nl-cta nl-cta-secondary",
        instanceId: "cta-2",
      },
      slots: { label: "How it works" },
    });
    expect(html).toContain('<a href="/about"');
    expect(html).toContain('class="nl-cta nl-cta-secondary"');
    expect(html).toContain("How it works");
    expect(html).not.toContain("<button");
  });
});
