import { describe, expect, it } from "vitest";
import { renderHeader } from "./header.js";
import { slotsFromPlainText } from "./component.js";

describe("renderHeader", () => {
  it("shows desktop nav/actions and mobile hamburger details", () => {
    const html = renderHeader({
      props: { instanceId: "site-header", borderBottom: "on" },
      slots: {
        brand: '<a href="/">Brand</a>',
        nav: '<a href="/about">About</a>',
        actions: '<button type="button">Theme</button>',
      },
    });

    expect(html).toContain("<details");
    expect(html).toContain('aria-label="Toggle navigation menu"');
    expect(html).toContain("group/menu");
    expect(html).toContain("md:hidden");
    expect(html).toContain("hidden items-center gap-1 md:flex");
    expect(html).toContain("hidden items-center gap-2 md:flex");
    expect(html).toContain('data-as-component="header"');
    expect(html).toContain('data-as-slot="brand"');
    expect(html).toContain('data-as-slot="nav"');
    expect(html).toContain('data-as-slot="actions"');
    expect(html).toContain('href="/about"');
    expect(html).toContain("border-b border-line");
    expect(html).not.toContain(">Menu</summary>");
  });

  it("honors sticky / transparent knobs", () => {
    const sticky = renderHeader({
      props: { sticky: "on", transparent: "off" },
      slots: { nav: '<a href="/">Home</a>' },
    });
    expect(sticky).toContain("sticky top-0 z-40");

    const clear = renderHeader({
      props: { sticky: "off", transparent: "on", borderBottom: "on" },
      slots: { nav: '<a href="/">Home</a>' },
    });
    expect(clear).toContain("bg-transparent");
    expect(clear).not.toContain("border-b border-line");
    expect(clear).not.toContain("sticky top-0");
  });

  it("composes Northline-shaped defaults from plain text", () => {
    const slots = slotsFromPlainText({
      brand: "Northline",
      nav: "Home|/|,About|/about|,Contact|/contact",
      actions: "theme",
    });
    const html = renderHeader({ props: {}, slots });
    expect(html).toContain("Northline");
    expect(html).toContain('href="/about"');
    expect(html).toContain("data-as-theme-toggle");
    expect(html).toContain('data-slot="icon"');
    expect(html).toContain("M21.7519");
  });

  it("uses Heroicons SSR glyphs for hamburger", () => {
    const html = renderHeader({
      props: {},
      slots: { nav: '<a href="/">Home</a>' },
    });
    expect(html).toContain('data-slot="icon"');
    expect(html).toContain("M3.75 6.75");
    expect(html).toContain("M6 18");
  });
});
