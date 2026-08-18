import { describe, expect, it } from "vitest";
import type { MergedRule } from "./rules-manifest-pure.js";
import {
  classifyRulePack,
  pathMatchesRuleGlob,
  selectRulesForTurn,
  selectedPathFromChatContext,
} from "./rules-retrieve-pure.js";

function rule(
  partial: Partial<MergedRule> & { id: string; path: string },
): MergedRule {
  return {
    scope: "studio",
    enabled: true,
    title: partial.id,
    ...partial,
  };
}

describe("rules-retrieve-pure", () => {
  it("classifies Always-on / Auto / Manual", () => {
    expect(classifyRulePack(rule({ id: "a", path: "tone.md" }))).toBe(
      "always-on",
    );
    expect(
      classifyRulePack(rule({ id: "b", path: "content/**/*.md" })),
    ).toBe("auto");
    expect(
      classifyRulePack(rule({ id: "c", path: "tone.md", enabled: false })),
    ).toBe("manual");
  });

  it("matches Auto globs", () => {
    expect(pathMatchesRuleGlob("content/pages/home.md", "content/**/*.md")).toBe(
      true,
    );
    expect(pathMatchesRuleGlob("src/app.tsx", "content/**/*.md")).toBe(false);
  });

  it("selects Always-on always; Auto only on path hit", () => {
    const merged = [
      rule({ id: "tone", path: "tone.md" }),
      rule({ id: "md", path: "content/**/*.md" }),
      rule({ id: "off", path: "off.md", enabled: false }),
    ];
    const noPath = selectRulesForTurn({ merged, path: null });
    expect(noPath.selected.map((r) => r.id)).toEqual(["tone"]);
    const hit = selectRulesForTurn({
      merged,
      path: "content/pages/home.md",
    });
    expect(hit.selected.map((r) => r.id)).toEqual(["tone", "md"]);
  });

  it("reads selected path from chat context", () => {
    expect(
      selectedPathFromChatContext(
        "Studio context\n- selected file/path: content/a.md\n- focused window: Code",
      ),
    ).toBe("content/a.md");
    expect(
      selectedPathFromChatContext("- selected file/path: (none)"),
    ).toBeNull();
  });
});
