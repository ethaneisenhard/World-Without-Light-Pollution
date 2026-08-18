import { describe, expect, it } from "vitest";
import {
  nextSkillPromoteVersion,
  parseSkillBodyVersion,
  skillPromoteMeta,
} from "./skill-promote-pure.js";

describe("skill-promote-pure", () => {
  it("parses version from body", () => {
    expect(parseSkillBodyVersion("version: 3\nname: x")).toBe(3);
    expect(parseSkillBodyVersion("nope")).toBe(1);
  });

  it("bumps when target existed", () => {
    expect(
      nextSkillPromoteVersion({
        pendingBody: "version: 2\n",
        targetExisted: true,
      }),
    ).toBe(3);
  });

  it("marks forged from session source", () => {
    const meta = skillPromoteMeta({
      entry: {
        id: "l1",
        skillId: "fix-nav",
        origin: "self_learn",
        status: "staged",
        source: "session:s1:project:p",
        pendingPath: "/tmp/a.md",
        targetPath: "/tmp/b.md",
        summary: "x",
        createdAt: 1,
        updatedAt: 1,
      },
      confidence: 0.6,
    });
    expect(meta.kind).toBe("skill.forged");
    expect(meta.scoreDelta).toBe(0.6);
  });
});
