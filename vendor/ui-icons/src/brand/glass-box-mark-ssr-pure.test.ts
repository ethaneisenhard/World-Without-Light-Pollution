import { describe, expect, it } from "vitest";
import { glassBoxMarkSvgHtml } from "./glass-box-mark-ssr-pure.ts";

describe("glassBoxMarkSvgHtml", () => {
  it("emits inline SVG with soft glass mid + unique gradient ids", () => {
    const html = glassBoxMarkSvgHtml({
      className: "size-8",
      idPrefix: "site-logo",
    });
    expect(html).toContain('data-studio-icon="glass-box-mark"');
    expect(html).toContain("size-8");
    expect(html).toContain('id="site-logo-glass"');
    expect(html).toContain("#D6EEFF");
    expect(html).not.toContain('stop-color="#FFFFFF"');
    expect(html).toContain('shape-rendering="geometricPrecision"');
  });
});
