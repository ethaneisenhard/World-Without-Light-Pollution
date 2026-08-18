import { describe, expect, it } from "vitest";
import {
  filterPrefsForInject,
  parsePrefsInjectPolicy,
} from "./memory-prefs-policy-pure.js";
import type { MemoryRow } from "./memory-pure.js";

function pref(
  id: string,
  scope: "studio" | "project",
  projectId: string | null,
): MemoryRow {
  return {
    id,
    scope,
    projectId,
    content: "pref: dark mode",
    origin: "hand_authored",
    status: "active",
    source: null,
    why: "pref:theme",
    score: 1,
    createdAt: 1,
    updatedAt: 1,
    lastUsedAt: null,
  };
}

describe("filterPrefsForInject", () => {
  const rows = [
    pref("s1", "studio", null),
    pref("p1", "project", "demo-blog"),
    pref("p2", "project", "other"),
  ];

  it("studio_and_project in project includes studio + that project", () => {
    const out = filterPrefsForInject({
      rows,
      projectId: "demo-blog",
      policy: "studio_and_project",
    });
    expect(out.map((r) => r.id).sort()).toEqual(["p1", "s1"]);
  });

  it("studio_only drops project prefs", () => {
    expect(
      filterPrefsForInject({
        rows,
        projectId: "demo-blog",
        policy: "studio_only",
      }).map((r) => r.id),
    ).toEqual(["s1"]);
  });

  it("off returns empty", () => {
    expect(
      filterPrefsForInject({ rows, projectId: "demo-blog", policy: "off" }),
    ).toEqual([]);
  });

  it("parsePrefsInjectPolicy defaults", () => {
    expect(parsePrefsInjectPolicy("nope")).toBe("studio_and_project");
  });
});
