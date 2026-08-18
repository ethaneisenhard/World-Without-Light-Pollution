import { describe, expect, it } from "vitest";
import { renderFooter } from "./footer.js";
import { slotsFromPlainText } from "./component.js";

describe("renderFooter", () => {
  it("lays out brand, columns, and bottom bar", () => {
    const html = renderFooter({
      props: { instanceId: "site-footer", variant: "transparent", borderTop: "on" },
      slots: {
        brand: "<span>Brand</span>",
        columns: "<div>Col</div>",
        bottom: "© 2026 Acme",
      },
    });
    expect(html).toContain('data-as-component="footer"');
    expect(html).toContain('data-as-slot="brand"');
    expect(html).toContain('data-as-slot="columns"');
    expect(html).toContain('data-as-slot="bottom"');
    expect(html).toContain("md:grid-cols-12");
    expect(html).toContain("© 2026 Acme");
    expect(html).toContain("border-t border-line");
  });

  it("composes defaults from plain text", () => {
    const slots = slotsFromPlainText({
      brand: "Northline|Ship the work that matters.",
      columns: "Product|Home|/|About|/about||Company|Contact|/contact",
      bottom: "Studio Starter · Cloudflare Workers",
    });
    const html = renderFooter({
      props: { variant: "muted" },
      slots,
    });
    expect(html).toContain("Northline");
    expect(html).toContain("Ship the work that matters.");
    expect(html).toContain("Product");
    expect(html).toContain("Studio Starter");
    expect(html).toContain("bg-sand");
  });
});
