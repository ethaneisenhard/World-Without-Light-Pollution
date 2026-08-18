import { describe, expect, it } from "vitest";
import {
  isActiveNav,
  matchSitePage,
  pageTitle,
  SITE_NAV,
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
    expect(matchSitePage("/missing")).toBeNull();
  });
});

describe("pageTitle", () => {
  it("uses brand on home", () => {
    expect(pageTitle("home")).toBe(
      "World Against Light Pollution — Reclaim the night sky.",
    );
    expect(pageTitle("about")).toBe("About · World Against Light Pollution");
  });
});

describe("isActiveNav", () => {
  it("marks current page", () => {
    expect(isActiveNav(SITE_NAV[0]!, "home")).toBe(true);
    expect(isActiveNav(SITE_NAV[1]!, "home")).toBe(false);
  });
});
