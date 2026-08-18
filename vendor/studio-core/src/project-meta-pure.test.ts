import { describe, expect, it } from "vitest";
import {
  PROJECT_META_DIRNAME_LEGACY,
  PROJECT_META_DIRNAME_PREFERRED,
  isProjectMetaPathSegment,
  projectMetaCandidates,
  projectMetaRel,
} from "./project-meta-pure.js";

describe("project-meta-pure", () => {
  it("writes prefer .glassbox-studio", () => {
    expect(PROJECT_META_DIRNAME_PREFERRED).toBe(".glassbox-studio");
    expect(projectMetaRel("project.json")).toBe(
      ".glassbox-studio/project.json",
    );
  });

  it("dual-reads preferred then legacy", () => {
    expect(projectMetaCandidates("design.json")).toEqual([
      ".glassbox-studio/design.json",
      ".agent-studio/design.json",
    ]);
    expect(PROJECT_META_DIRNAME_LEGACY).toBe(".agent-studio");
  });

  it("recognizes either meta dirname segment", () => {
    expect(isProjectMetaPathSegment(".glassbox-studio")).toBe(true);
    expect(isProjectMetaPathSegment(".agent-studio")).toBe(true);
    expect(isProjectMetaPathSegment("src")).toBe(false);
  });
});
