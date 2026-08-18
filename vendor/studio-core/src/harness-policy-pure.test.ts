import { describe, expect, it } from "vitest";
import {
  BUILTIN_HARNESS_IDS,
  COMPOSER_HARNESS_IDS,
  coerceComposerHarnessId,
  normalizeHarnessIdAlias,
  parseProjectHarnessPolicy,
  resolveComposerHarnessForPicker,
  resolveHarnessId,
  serializeProjectHarnessPolicy,
} from "./harness-policy-pure.js";

describe("normalizeHarnessIdAlias", () => {
  it("maps studio → anthropic", () => {
    expect(normalizeHarnessIdAlias("studio")).toBe("anthropic");
    expect(normalizeHarnessIdAlias(" anthropic ")).toBe("anthropic");
    expect(normalizeHarnessIdAlias("cursor")).toBe("cursor");
  });
});

describe("parseProjectHarnessPolicy", () => {
  it("reads flat allowTools and migrates studio → anthropic", () => {
    expect(
      parseProjectHarnessPolicy({
        defaultHarness: "studio",
        allowTools: ["files.read", "files.list"],
      }),
    ).toEqual({
      version: 1,
      defaultHarness: "anthropic",
      allowTools: ["files.read", "files.list"],
      allowedHarnesses: null,
      accessMode: "inherit",
    });
  });

  it("migrates nested tools.allow into allowTools", () => {
    expect(
      parseProjectHarnessPolicy({
        defaultHarness: "studio",
        tools: { allow: ["files.list", "files.read", "files.write"] },
      }),
    ).toEqual({
      version: 1,
      defaultHarness: "anthropic",
      allowTools: ["files.list", "files.read", "files.write"],
      allowedHarnesses: null,
      accessMode: "inherit",
    });
  });

  it("prefers allowTools over tools.allow when both present", () => {
    expect(
      parseProjectHarnessPolicy({
        allowTools: ["files.read"],
        tools: { allow: ["files.write"] },
      }).allowTools,
    ).toEqual(["files.read"]);
  });

  it("migrates allowedHarnesses studio → anthropic and dedupes", () => {
    expect(
      parseProjectHarnessPolicy({
        version: 2,
        defaultHarness: "studio",
        allowedHarnesses: ["studio", "anthropic", "openclaw"],
      }),
    ).toEqual({
      version: 2,
      defaultHarness: "anthropic",
      allowTools: undefined,
      // anthropic present → deepseek auto-opted in
      allowedHarnesses: ["anthropic", "openclaw", "deepseek"],
      accessMode: "inherit",
    });
  });

  it("auto-allows deepseek when anthropic is in the allowlist", () => {
    expect(
      parseProjectHarnessPolicy({
        allowedHarnesses: ["cursor", "anthropic", "hermes", "grok"],
      }).allowedHarnesses,
    ).toEqual(["cursor", "anthropic", "hermes", "grok", "deepseek"]);
  });

  it("reads accessMode override", () => {
    expect(
      parseProjectHarnessPolicy({
        accessMode: "all",
      }).accessMode,
    ).toBe("all");
  });

  it("returns empty policy for junk", () => {
    expect(parseProjectHarnessPolicy(null)).toEqual({
      version: 1,
      defaultHarness: undefined,
      allowTools: undefined,
      allowedHarnesses: null,
      accessMode: "inherit",
    });
  });

  it("serialize writes anthropic not studio", () => {
    expect(
      serializeProjectHarnessPolicy({
        version: 2,
        defaultHarness: "studio",
        allowedHarnesses: ["studio", "cursor"],
        accessMode: "inherit",
      }),
    ).toEqual({
      version: 2,
      defaultHarness: "anthropic",
      allowedHarnesses: ["anthropic", "cursor", "deepseek"],
    });
  });
});

describe("resolveHarnessId", () => {
  it("uses request override when allowed", () => {
    expect(
      resolveHarnessId({
        requested: "openclaw",
        projectDefault: "studio",
        globalDefault: "studio",
        allowedHarnesses: ["studio", "openclaw"],
      }),
    ).toEqual({ ok: true, harnessId: "openclaw" });
  });

  it("normalizes studio request → anthropic", () => {
    expect(
      resolveHarnessId({
        requested: "studio",
        allowedHarnesses: ["anthropic", "cursor"],
      }),
    ).toEqual({ ok: true, harnessId: "anthropic" });
  });

  it("falls back project → global → cursor", () => {
    expect(
      resolveHarnessId({
        projectDefault: "omni",
        globalDefault: "studio",
      }),
    ).toEqual({ ok: true, harnessId: "omni" });
    expect(
      resolveHarnessId({
        globalDefault: "studio",
      }),
    ).toEqual({ ok: true, harnessId: "anthropic" });
    expect(resolveHarnessId({})).toEqual({
      ok: true,
      harnessId: BUILTIN_HARNESS_IDS.cursor,
    });
  });

  it("rejects harness not in allowedHarnesses", () => {
    expect(
      resolveHarnessId({
        requested: "omni",
        allowedHarnesses: ["studio"],
      }),
    ).toEqual({
      ok: false,
      error: 'Harness "omni" is not allowed for this project',
    });
  });
});

describe("coerceComposerHarnessId", () => {
  it("maps agent-room / empty → cursor; studio → anthropic", () => {
    expect(coerceComposerHarnessId("agent-room")).toBe("cursor");
    expect(coerceComposerHarnessId("")).toBe("cursor");
    expect(coerceComposerHarnessId("studio")).toBe("anthropic");
    expect(coerceComposerHarnessId("cursor")).toBe("cursor");
  });
});

describe("resolveComposerHarnessForPicker", () => {
  it("LAW: studio does not paint as cursor while sending anthropic", () => {
    const choices = ["cursor", "anthropic", "hermes"] as const;
    // Must be anthropic (coerced), not choices[0] cursor.
    expect(resolveComposerHarnessForPicker("studio", choices)).toBe("anthropic");
    expect(resolveComposerHarnessForPicker("cursor", choices)).toBe("cursor");
  });
});

describe("COMPOSER_HARNESS_IDS", () => {
  it("excludes studio + agent-room + kody; includes anthropic + peers", () => {
    expect(COMPOSER_HARNESS_IDS).not.toContain("agent-room");
    expect(COMPOSER_HARNESS_IDS).not.toContain("studio");
    expect(COMPOSER_HARNESS_IDS).not.toContain("kody");
    expect(COMPOSER_HARNESS_IDS).toContain("anthropic");
    expect(COMPOSER_HARNESS_IDS).toContain("deepseek");
    expect(COMPOSER_HARNESS_IDS).toContain("litellm");
    expect(COMPOSER_HARNESS_IDS).toContain("grok");
    expect(COMPOSER_HARNESS_IDS).toContain("cursor");
  });
});
