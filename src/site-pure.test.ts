import { describe, expect, it } from "vitest";
import {
  isActiveNav,
  matchSitePage,
  pageTitle,
  SITE_NAV,
  SITE_RESOURCES_NAV,
} from "./site-pure.js";

describe("matchSitePage", () => {
  it("maps routes", () => {
    expect(matchSitePage("/")).toBe("home");
    expect(matchSitePage("/about")).toBe("about");
    expect(matchSitePage("/contact/")).toBe("contact");
    expect(matchSitePage("/lumens")).toBe("lumens");
    expect(matchSitePage("/what-is-light-pollution")).toBe("what-is-light-pollution");
    expect(matchSitePage("/impacts")).toBe("impacts");
    expect(matchSitePage("/petition")).toBe("petition");
    expect(matchSitePage("/resources")).toBe("resources");
    expect(matchSitePage("/email-your-county")).toBe("email-your-county");
    expect(matchSitePage("/maps")).toBe("maps");
    expect(matchSitePage("/missing")).toBeNull();
  });
});

describe("pageTitle", () => {
  it("uses brand on home", () => {
    expect(pageTitle("home")).toBe(
      "World Without Light Pollution — Reclaim the night sky.",
    );
    expect(pageTitle("about")).toBe("About · World Without Light Pollution");
  });
});

describe("SITE_RESOURCES_NAV", () => {
  it("lists lumen education once — no separate playground page", () => {
    const lumens = SITE_RESOURCES_NAV.filter((item) => item.id === "lumens");
    expect(lumens).toHaveLength(1);
    expect(lumens[0]?.path).toBe("/lumens");
    expect(lumens[0]?.label).toBe("Lumen education");
  });
});

describe("isActiveNav", () => {
  it("marks current page", () => {
    expect(isActiveNav(SITE_NAV[0]!, "home")).toBe(true);
    expect(isActiveNav(SITE_NAV[1]!, "home")).toBe(false);
  });
});
