import { describe, expect, it } from "vitest";
import {
  articleHasNightLabs,
  getNightLabEmbed,
  groupLabArticleBlocks,
  nightLabMountAttrString,
  peelTrailingHeadingSection,
  splitMarkdownLabBlocks,
} from "./night-lab-pure.js";

describe("getNightLabEmbed", () => {
  it("returns a registry row by id", () => {
    const row = getNightLabEmbed("skyglow");
    expect(row?.scene).toBe("street");
    expect(row?.controls).toContain("lumens");
    expect(row?.caption).toContain("Skyglow");
  });

  it("registers household phone and tv scenes", () => {
    expect(getNightLabEmbed("phone")?.scene).toBe("phone");
    expect(getNightLabEmbed("iphone")?.red).toBe(true);
    expect(getNightLabEmbed("tv")?.scene).toBe("tv");
    expect(getNightLabEmbed("clutter")?.scene).toBe("clutter");
    expect(getNightLabEmbed("kitchen")?.caption).toContain("Kitchen");
    expect(getNightLabEmbed("town")?.scene).toBe("street");
    expect(getNightLabEmbed("town")?.caption).toContain("Your street");
  });

  it("returns null for unknown ids", () => {
    expect(getNightLabEmbed("nope")).toBeNull();
  });
});

describe("splitMarkdownLabBlocks", () => {
  it("keeps plain markdown as one block", () => {
    expect(splitMarkdownLabBlocks("Hello.\n\nWorld.")).toEqual([
      { kind: "md", text: "Hello.\n\nWorld." },
    ]);
  });

  it("splits authored lab tokens into lab blocks", () => {
    const blocks = splitMarkdownLabBlocks(
      "Skyglow is waste.\n\n[[lab:skyglow]]\n\nGlare blinds you.\n\n[[lab:glare]]\n",
    );
    expect(blocks).toEqual([
      { kind: "md", text: "Skyglow is waste." },
      { kind: "lab", embedId: "skyglow" },
      { kind: "md", text: "Glare blinds you." },
      { kind: "lab", embedId: "glare" },
    ]);
  });
});

describe("peelTrailingHeadingSection", () => {
  it("keeps the intro and peels the last heading for the lab", () => {
    const peeled = peelTrailingHeadingSection(
      "## The four kinds\n\nPick a kind.\n\n### Skyglow\n\nThe dome.",
    );
    expect(peeled).toEqual({
      before: "## The four kinds\n\nPick a kind.",
      headingMd: "### Skyglow\n\nThe dome.",
    });
  });
});

describe("groupLabArticleBlocks", () => {
  it("wraps heading + following lab as one kind card", () => {
    const grouped = groupLabArticleBlocks(
      splitMarkdownLabBlocks(
        "## The four kinds\n\nOverview.\n\n### Skyglow\n\nThe dome.\n\n[[lab:skyglow]]\n\n### Glare\n\nBlinds you.\n\n[[lab:glare]]\n",
      ),
    );
    expect(grouped).toEqual([
      { kind: "md", text: "## The four kinds\n\nOverview." },
      { kind: "kind", text: "### Skyglow\n\nThe dome.", embedId: "skyglow" },
      { kind: "kind", text: "### Glare\n\nBlinds you.", embedId: "glare" },
    ]);
  });
});

describe("articleHasNightLabs", () => {
  it("detects tokens", () => {
    expect(articleHasNightLabs("no labs")).toBe(false);
    expect(articleHasNightLabs("See [[lab:red]]")).toBe(true);
  });
});

describe("nightLabMountAttrString", () => {
  it("stamps compact scene + controls from the row", () => {
    const html = nightLabMountAttrString(getNightLabEmbed("red")!);
    expect(html).toContain("data-as-lumen-lab");
    expect(html).toContain('data-nl-compact="1"');
    expect(html).toContain('data-nl-scene="room"');
    expect(html).toContain('data-nl-red="1"');
    expect(html).toContain("red,lumens,kelvin");
  });

  it("stamps a bare-to-cover diffusion embed", () => {
    const row = getNightLabEmbed("diffuse");
    expect(row?.controls).toContain("diffuse");
    const html = nightLabMountAttrString(row!);
    expect(html).toContain('data-nl-embed="diffuse"');
    expect(html).toContain('data-nl-diffuse="0"');
  });
});
