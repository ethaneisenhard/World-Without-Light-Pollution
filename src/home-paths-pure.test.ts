import { describe, expect, it } from "vitest";
import { homePathsFromDoc } from "./home-paths-pure.js";

describe("homePathsFromDoc", () => {
  it("uses fallback stories when home.md has no path headings", () => {
    const paths = homePathsFromDoc("Hero subtitle only.\n");
    expect(paths.map((p) => p.id)).toEqual(["learn", "town", "self"]);
    expect(paths[0]?.title).toBe("The phone on your pillow");
    expect(paths[0]?.eyebrow).toBe("In your room");
    expect(paths[0]?.background).toBe("muted");
    expect(paths[0]?.embedId).toBe("iphone");
    expect(paths[0]?.story).toContain("pillow");
    expect(paths[0]?.cta.label).toBe("Turn the iPhone red");
    expect(paths[0]?.cta.href).toBe("/myths#iphone-red-screen-on-a-triple-click");
    expect(paths[0]?.ctaPlace).toBe("copy");
    expect(paths[1]?.embedId).toBe("town");
    expect(paths[1]?.background).toBe("surface");
    expect(paths[1]?.story).toContain("without a shade");
    expect(paths[1]?.story).not.toContain("cobra");
    expect(paths[1]?.cta.href).toBe("/petition");
    expect(paths[1]?.more?.map((l) => l.label)).toContain("Email your county");
    expect(paths[1]?.more?.map((l) => l.label)).toContain("Maps of your sky");
    expect(paths[2]?.eyebrow).toBe("Tonight");
    expect(paths[2]?.background).toBe("transparent");
    expect(paths[2]?.cta.label).toBe("Headlamps and fixtures");
    expect(paths[2]?.cta.href).toBe(
      "/resources#7-headlamps-fixtures-and-what-to-buy",
    );
    expect(paths[2]?.more?.map((l) => l.label)).toEqual(["Full toolkit"]);
  });

  it("overrides story copy from ## sections in home.md", () => {
    const paths = homePathsFromDoc(
      "Hero line.\n\n## The phone on your pillow\n\nThe pillow glows.\n\n## The lamp with no shade\n\nThe dome over the roofs.\n\n## Three things before bed\n\nA warmer porch.\n",
    );
    expect(paths[0]?.story).toBe("The pillow glows.");
    expect(paths[1]?.story).toBe("The dome over the roofs.");
    expect(paths[2]?.story).toBe("A warmer porch.");
    expect(paths[0]?.embedId).toBe("iphone");
    expect(paths[1]?.embedId).toBe("town");
    expect(paths[0]?.eyebrow).toBe("In your room");
  });
});
