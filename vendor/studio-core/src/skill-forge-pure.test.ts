import { describe, expect, it } from "vitest";
import { forgeSkillCandidateFromTrace } from "./skill-forge-pure.js";

describe("skill-forge-pure", () => {
  it("forges candidate from tool trail", () => {
    const c = forgeSkillCandidateFromTrace({
      projectId: "demo-blog",
      sessionId: "s1",
      toolTrail: ["files.read", "files.write", "git.status"],
      userIntent: "Fix the nav layout",
    });
    expect(c).not.toBeNull();
    expect(c!.body).toContain("files.read");
    expect(c!.confidence).toBeGreaterThan(0.3);
  });

  it("skips thin turns", () => {
    expect(
      forgeSkillCandidateFromTrace({
        projectId: "p",
        sessionId: null,
        toolTrail: ["files.read"],
        userIntent: "hi",
      }),
    ).toBeNull();
  });
});
