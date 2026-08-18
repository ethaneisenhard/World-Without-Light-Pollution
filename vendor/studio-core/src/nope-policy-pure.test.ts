import { describe, expect, it } from "vitest";
import {
  defaultStudioNopePolicy,
  effectiveNopeGroupDefault,
  mergeStudioSecurityPatch,
  parseStudioNopePolicy,
  parseStudioSecurityConfig,
  planNopeBuild,
} from "./nope-policy-pure.js";

describe("nope-policy-pure", () => {
  it("defaults to balanced posture", () => {
    expect(defaultStudioNopePolicy().posture).toBe("balanced");
    expect(parseStudioSecurityConfig(null).nope.posture).toBe("balanced");
  });

  it("parses posture + groups + disabledRules", () => {
    const p = parseStudioNopePolicy({
      posture: "custom",
      groups: { git: "audit", filesystem: "allow", bogus: "block" },
      disabledRules: ["fs-rm-rf", "", "  pkg-global-install  "],
    });
    expect(p.posture).toBe("custom");
    expect(p.groups.git).toBe("audit");
    expect(p.groups.filesystem).toBe("allow");
    expect(p.groups).not.toHaveProperty("bogus");
    expect(p.disabledRules).toEqual(["fs-rm-rf", "pkg-global-install"]);
  });

  it("maps postures to build plans", () => {
    expect(planNopeBuild({ ...defaultStudioNopePolicy(), posture: "off" })).toEqual({
      kind: "off",
    });
    expect(
      planNopeBuild({ ...defaultStudioNopePolicy(), posture: "observe" }),
    ).toMatchObject({ kind: "preset", preset: "audit" });
    expect(
      planNopeBuild({ ...defaultStudioNopePolicy(), posture: "balanced" }),
    ).toMatchObject({ kind: "preset", preset: "standard" });
    expect(
      planNopeBuild({ ...defaultStudioNopePolicy(), posture: "strict" }),
    ).toMatchObject({ kind: "preset", preset: "paranoid" });
  });

  it("custom allow categories become removeCategories; audit-only → warn", () => {
    const plan = planNopeBuild({
      posture: "custom",
      groups: {
        git: "allow",
        filesystem: "audit",
        credentials: "audit",
      },
      disabledRules: ["cred-api-key-leak"],
    });
    expect(plan.kind).toBe("custom");
    if (plan.kind !== "custom") return;
    expect(plan.removeCategories).toContain("git");
    expect(plan.removeCategories).not.toContain("filesystem");
    // unspecified cats default block → anyBlock true → strict
    expect(plan.mode).toBe("strict");
    expect(plan.disabledRules).toEqual(["cred-api-key-leak"]);

    const auditOnly = planNopeBuild({
      posture: "custom",
      groups: Object.fromEntries(
        [
          "containers",
          "credentials",
          "database",
          "exfiltration",
          "filesystem",
          "git",
          "injection",
          "network",
          "packages",
          "system",
        ].map((c) => [c, "audit"]),
      ) as Record<string, "audit">,
      disabledRules: [],
    });
    expect(auditOnly.kind).toBe("custom");
    if (auditOnly.kind === "custom") {
      expect(auditOnly.mode).toBe("warn");
      expect(auditOnly.removeCategories).toEqual([]);
    }
  });

  it("effective group defaults follow posture", () => {
    expect(
      effectiveNopeGroupDefault(
        { posture: "off", groups: {}, disabledRules: [] },
        "git",
      ),
    ).toBe("allow");
    expect(
      effectiveNopeGroupDefault(
        { posture: "observe", groups: {}, disabledRules: [] },
        "git",
      ),
    ).toBe("audit");
    expect(
      effectiveNopeGroupDefault(
        { posture: "balanced", groups: {}, disabledRules: [] },
        "git",
      ),
    ).toBe("block");
    expect(
      effectiveNopeGroupDefault(
        {
          posture: "custom",
          groups: { git: "audit" },
          disabledRules: [],
        },
        "git",
      ),
    ).toBe("audit");
    expect(
      effectiveNopeGroupDefault(
        { posture: "custom", groups: {}, disabledRules: [] },
        "git",
      ),
    ).toBe("block");
  });

  it("mergeStudioSecurityPatch merges nope fields", () => {
    const cur = parseStudioSecurityConfig({
      nope: { posture: "balanced", groups: { git: "block" } },
    });
    const next = mergeStudioSecurityPatch(cur, {
      nope: { posture: "custom", groups: { git: "allow", filesystem: "audit" } },
    });
    expect(next.nope.posture).toBe("custom");
    expect(next.nope.groups.git).toBe("allow");
    expect(next.nope.groups.filesystem).toBe("audit");
  });
});
