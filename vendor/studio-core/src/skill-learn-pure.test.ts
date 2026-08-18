import { describe, expect, it } from "vitest";
import {
  emptySkillLearnManifest,
  setSkillLearnStatus,
  stageSkillLearn,
} from "./skill-learn-pure.js";

describe("skill-learn-pure", () => {
  it("stages and updates status", () => {
    const m = emptySkillLearnManifest();
    const next = stageSkillLearn(m, {
      id: "learn_1",
      skillId: "foo",
      origin: "self_learn",
      source: "run_1",
      pendingPath: "/tmp/a.md",
      targetPath: "/tmp/b.md",
      summary: "foo skill",
      createdAt: 1,
      updatedAt: 1,
    });
    expect(next.entries[0]!.status).toBe("staged");
    const approved = setSkillLearnStatus(next, "learn_1", "active");
    expect(approved.entries[0]!.status).toBe("active");
  });
});
