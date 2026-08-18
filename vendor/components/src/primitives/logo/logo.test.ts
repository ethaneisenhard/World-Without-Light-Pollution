import { describe, expect, it } from "vitest";
import { renderLogo } from "./logo.js";

describe("renderLogo", () => {
  it("defaults to initials mark + row layout", () => {
    const html = renderLogo({ slots: { wordmark: "Acme Co" } });
    expect(html).toContain("data-as-component");
    expect(html).toContain("AC");
    expect(html).toContain("Acme Co");
    expect(html).toContain("inline-flex items-center");
  });

  it("glass-box-splash mark hosts auth mount target", () => {
    const html = renderLogo({
      props: {
        size: "xl",
        layout: "stack",
        markVariant: "glass-box-splash",
        instanceId: "auth-brand",
      },
      slots: { wordmark: "Glass Box Studio" },
    });
    expect(html).toContain('data-as-glass-box-auth-mark="1"');
    expect(html).toContain("/glass-box-splash/mark.svg");
    expect(html).toContain("size-[100px]");
    expect(html).toContain("aspect-square");
    expect(html).toContain('data-as-glass-box-frame="mark"');
    expect(html).toContain("overflow-hidden");
    expect(html).toContain("shrink-0");
    expect(html).toContain("flex flex-col items-center");
    expect(html).toContain("Glass Box Studio");
  });

  it("image without markSrc falls back to GlassBoxMarkIcon path", () => {
    const html = renderLogo({
      props: { markVariant: "image", size: "sm" },
      slots: { wordmark: "Glass Box Computer" },
    });
    expect(html).toContain('data-studio-icon="glass-box-mark"');
    expect(html).not.toContain("<img");
    expect(html).toContain("Glass Box Computer");
  });

  it("image with markSrc uses img for arbitrary assets", () => {
    const html = renderLogo({
      props: {
        markVariant: "image",
        markSrc: "/icons/partner.svg",
        size: "sm",
      },
      slots: { wordmark: "Partner" },
    });
    expect(html).toContain("/icons/partner.svg");
    expect(html).toContain("<img");
  });

  it("glass-box-mark inlines SVG (GlassBoxMarkIcon SSR twin)", () => {
    const html = renderLogo({
      props: {
        markVariant: "glass-box-mark",
        size: "sm",
        instanceId: "site-logo",
      },
      slots: { wordmark: "Glass Box Computer" },
    });
    expect(html).toContain('data-studio-icon="glass-box-mark"');
    expect(html).toContain("#D6EEFF");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("/icons/glassbox-mark.svg");
    expect(html).toContain("Glass Box Computer");
  });
});
