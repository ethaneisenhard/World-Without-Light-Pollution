import { describe, expect, it } from "vitest";
import { homePathsFromDoc } from "./home-paths-pure.js";

describe("homePathsFromDoc", () => {
  it("uses fallback stories when home.md has no path headings", () => {
    const paths = homePathsFromDoc("Hero subtitle only.\n");
    expect(paths.map((p) => p.id)).toEqual(["learn", "town", "self"]);
    expect(paths[0]?.title).toBe("After lights-out");
    expect(paths[0]?.eyebrow).toBe("In your room");
    expect(paths[0]?.background).toBe("muted");
    expect(paths[0]?.embedId).toBe("iphone");
    expect(paths[0]?.story).toContain("pillow");
    expect(paths[0]?.cta.label).toBe("Learn more about lumens");
    expect(paths[0]?.cta.href).toBe("/lumens");
    expect(paths[0]?.ctaPlace).toBe("copy");
    expect(paths[1]?.embedId).toBe("town");
    expect(paths[1]?.background).toBe("surface");
    expect(paths[1]?.story).toContain("without a shade");
    expect(paths[1]?.story).not.toContain("cobra");
    expect(paths[1]?.cta.href).toBe("/petition");
    expect(paths[1]?.more?.map((l) => l.label)).toContain("Email your county");
    expect(paths[2]?.eyebrow).toBe("Tonight");
    expect(paths[2]?.background).toBe("transparent");
    expect(paths[2]?.more?.length).toBe(2);
  });

  it("overrides story copy from ## sections in home.md", () => {
    const paths = homePathsFromDoc(
      "Hero line.\n\n## After lights-out\n\nThe pillow glows.\n\n## For your town\n\nThe dome over the roofs.\n\n## For yourself\n\nA warmer porch.\n",
    );
    expect(paths[0]?.story).toBe("The pillow glows.");
    expect(paths[1]?.story).toBe("The dome over the roofs.");
    expect(paths[2]?.story).toBe("A warmer porch.");
    expect(paths[0]?.embedId).toBe("iphone");
    expect(paths[1]?.embedId).toBe("town");
    expect(paths[0]?.eyebrow).toBe("In your room");
  });
});
