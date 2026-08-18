import { describe, expect, it } from "vitest";
import {
  buildSkillSummary,
  buildSkillsCatalogPreamble,
  filterSkills,
  parseSkillFrontmatter,
  skillFolderFromId,
  skillIdFromPath,
} from "./skills-catalog-pure.js";

describe("skills-catalog-pure", () => {
  it("parses frontmatter", () => {
    const parsed = parseSkillFrontmatter(
      "---\nname: tdd\ndescription: Test first\n---\n\n# Body\n",
    );
    expect(parsed.name).toBe("tdd");
    expect(parsed.description).toBe("Test first");
    expect(parsed.body).toMatch(/^# Body/);
  });

  it("derives path-relative id from skills root", () => {
    expect(
      skillIdFromPath(
        "/repo/glassbox-studio/skills/vendor/matt-pocock/engineering/tdd/SKILL.md",
        "/repo/glassbox-studio/skills/vendor",
      ),
    ).toBe("matt-pocock/engineering/tdd");
    expect(
      skillIdFromPath(
        "/repo/.cursor/skills/engineering/mvp-drain/SKILL.md",
        "/repo/.cursor/skills",
      ),
    ).toBe("engineering/mvp-drain");
    expect(skillFolderFromId("engineering/mvp-drain")).toBe("engineering");
  });

  it("filters and builds preamble with folder ids", () => {
    const s = buildSkillSummary({
      path: "/repo/.cursor/skills/engineering/mvp-drain/SKILL.md",
      raw: "---\nname: mvp-drain\ndescription: Drain MVP checklist\n---\n",
      source: "studio",
      skillsRoot: "/repo/.cursor/skills",
    });
    expect(s.id).toBe("engineering/mvp-drain");
    expect(s.folder).toBe("engineering");
    expect(filterSkills([s], "mvp")).toHaveLength(1);
    expect(buildSkillsCatalogPreamble([s])).toMatch(/engineering\/mvp-drain/);
  });
});
