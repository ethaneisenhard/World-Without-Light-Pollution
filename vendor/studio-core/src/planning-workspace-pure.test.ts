import { describe, expect, it } from "vitest";
import {
  buildPlanningWorkspaceFiles,
  parsePlanningWorkspaceCreateInput,
  resolvePlanningWorkspaceSlug,
  slugifyPlanningWorkspaceName,
} from "./planning-workspace-pure.js";

describe("planning-workspace-pure", () => {
  it("slugifies names", () => {
    expect(slugifyPlanningWorkspaceName("Van Build Sauna")).toBe(
      "van-build-sauna",
    );
    expect(resolvePlanningWorkspaceSlug({ name: "Trip!", slug: "EU 2026" })).toBe(
      "eu-2026",
    );
  });

  it("builds scaffold files with planning kind", () => {
    const files = buildPlanningWorkspaceFiles({
      id: "van-build",
      name: "Van Build",
      brief: "Stainless wet bath + sauna",
    });
    const project = files.find((f) =>
      f.relativePath.endsWith("project.json"),
    );
    expect(project?.content).toContain('"kind": "planning"');
    expect(project?.content).toContain('"id": "van-build"');
    expect(project?.content).toContain('"placement": "hosted"');
    expect(files.some((f) => f.relativePath.includes("roadmap"))).toBe(true);
    expect(files.some((f) => f.relativePath.includes("decisions"))).toBe(true);
    const design = files.find((f) =>
      f.relativePath.endsWith("design.json"),
    );
    expect(design?.content).toContain('"shell"');
    expect(design?.content).toContain("accent");
  });

  it("parses create input", () => {
    expect(parsePlanningWorkspaceCreateInput({}).ok).toBe(false);
    const ok = parsePlanningWorkspaceCreateInput({
      name: "Van",
      brief: "x",
    });
    expect(ok).toEqual({
      ok: true,
      value: {
        name: "Van",
        brief: "x",
        slug: undefined,
        placement: undefined,
      },
    });
    const withPlacement = parsePlanningWorkspaceCreateInput({
      name: "Van",
      placement: "local",
    });
    expect(withPlacement.ok && withPlacement.value.placement).toBe("local");
  });
});
