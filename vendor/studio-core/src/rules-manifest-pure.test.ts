import { describe, expect, it } from "vitest";
import {
  buildRulesSystemPreamble,
  mergeRulesManifests,
  parseRulesManifest,
  setRuleEnabled,
} from "./rules-manifest-pure.js";

describe("rules-manifest-pure", () => {
  it("merges with project overlay on id", () => {
    const studio = parseRulesManifest({
      rules: [
        { id: "tone", path: "tone.md", enabled: true },
        { id: "ship", path: "ship.md", enabled: true },
      ],
    });
    const project = parseRulesManifest({
      rules: [{ id: "tone", path: "tone-brand.md", enabled: false, title: "Brand" }],
    });
    const merged = mergeRulesManifests(studio, project);
    expect(merged.find((r) => r.id === "tone")).toMatchObject({
      path: "tone-brand.md",
      enabled: false,
      scope: "project",
    });
    expect(merged.find((r) => r.id === "ship")?.scope).toBe("studio");
  });

  it("builds preamble from enabled bodies", () => {
    const merged = mergeRulesManifests(
      parseRulesManifest({
        rules: [
          { id: "a", path: "a.md", enabled: true, title: "A" },
          { id: "b", path: "b.md", enabled: false },
        ],
      }),
      null,
    );
    const text = buildRulesSystemPreamble(merged, { a: "Be concise.", b: "Skip" });
    expect(text).toContain("Be concise.");
    expect(text).not.toContain("Skip");
    expect(setRuleEnabled(parseRulesManifest({ rules: [{ id: "a", path: "a.md" }] }), "a", false).rules[0]?.enabled).toBe(false);
  });
});
