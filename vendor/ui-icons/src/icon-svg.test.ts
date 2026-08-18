import { describe, expect, it } from "vitest";
import { outlineIconSvg } from "./icon-svg.ts";
import { bars3OutlineSvg, moonOutlineSvg, xMarkOutlineSvg } from "./ssr.ts";

describe("outlineIconSvg", () => {
  it("renders outline svg from glyphs", () => {
    const html = outlineIconSvg(
      [{ tag: "path", attrs: { d: "M1 1H2" } }],
      { class: "size-4" },
    );
    expect(html).toContain('data-slot="icon"');
    expect(html).toContain('class="size-4"');
    expect(html).toContain('d="M1 1H2"');
    expect(html).toContain('stroke="currentColor"');
    expect(html).toContain('aria-hidden="true"');
  });
});

describe("ssr chrome icons", () => {
  it("exports Heroicons moon / bars / x-mark", () => {
    expect(moonOutlineSvg()).toContain("M21.7519");
    expect(bars3OutlineSvg("size-6 group-open/menu:hidden")).toContain(
      "group-open/menu:hidden",
    );
    expect(xMarkOutlineSvg("hidden size-6 group-open/menu:block")).toContain(
      "M6 18",
    );
  });
});
