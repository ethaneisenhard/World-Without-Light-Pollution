import { describe, expect, it } from "vitest";
import {
  buildHermesModelOptions,
  formatHermesModelId,
  hermesPluginSuggestsCursor,
  parseHermesConfigYaml,
  parseHermesConfiguredProviders,
  parseHermesModelSelection,
  parseHermesProviderModelsCache,
} from "./hermes-config-pure.js";

describe("parseHermesModelSelection", () => {
  it("splits provider::model", () => {
    expect(parseHermesModelSelection("cursor::composer-2.5")).toEqual({
      provider: "cursor",
      model: "composer-2.5",
    });
  });

  it("keeps bare model", () => {
    expect(parseHermesModelSelection("claude-sonnet-4-5")).toEqual({
      model: "claude-sonnet-4-5",
    });
  });
});

describe("parseHermesConfigYaml", () => {
  it("reads flat provider/model", () => {
    const s = parseHermesConfigYaml(
      `provider: anthropic\nmodel: claude-sonnet-4-5\n`,
    );
    expect(s.provider).toBe("anthropic");
    expect(s.model).toBe("claude-sonnet-4-5");
    expect(s.cursorViaHermes).toBe(false);
  });

  it("prefers nested model.default over nested model.model", () => {
    const s = parseHermesConfigYaml(`model:
  default: claude-sonnet-4-5
  provider: deepseek
  model: deepseek-chat
`);
    expect(s.provider).toBe("deepseek");
    expect(s.model).toBe("claude-sonnet-4-5");
  });

  it("detects cursor provider", () => {
    const s = parseHermesConfigYaml(`provider: cursor\nmodel: composer-2.5\n`);
    expect(s.cursorViaHermes).toBe(true);
    expect(s.cursorViaHermesReasons[0]).toMatch(/cursor/i);
  });

  it("detects cursor bridge base_url", () => {
    const s = parseHermesConfigYaml(
      `base_url: http://127.0.0.1:8765/v1\nmodel: composer-2.5\n`,
    );
    expect(s.cursorViaHermes).toBe(true);
  });
});

describe("parseHermesProviderModelsCache", () => {
  it("reads Hermes disk cache shape", () => {
    const parsed = parseHermesProviderModelsCache({
      anthropic: {
        fp: "x",
        at: 1,
        models: ["claude-sonnet-5", "claude-fable-5", "claude-sonnet-5"],
      },
      deepseek: { models: ["deepseek-v4-flash"] },
    });
    expect(parsed.anthropic).toEqual(["claude-sonnet-5", "claude-fable-5"]);
    expect(parsed.deepseek).toEqual(["deepseek-v4-flash"]);
  });

  it("accepts bare arrays", () => {
    expect(
      parseHermesProviderModelsCache({
        copilot: ["gpt-5.4", "gpt-5.4-mini"],
      }),
    ).toEqual({ copilot: ["gpt-5.4", "gpt-5.4-mini"] });
  });
});

describe("parseHermesConfiguredProviders", () => {
  it("reads credential_pool keys", () => {
    expect(
      parseHermesConfiguredProviders({
        credential_pool: {
          anthropic: [],
          deepseek: [{}],
          cursor: [],
        },
      }),
    ).toEqual(["anthropic", "deepseek", "cursor"]);
  });
});

describe("hermesPluginSuggestsCursor", () => {
  it("matches plugin folder names", () => {
    expect(hermesPluginSuggestsCursor(["native-mcp", "cursor-composer"])).toBe(
      true,
    );
    expect(hermesPluginSuggestsCursor(["filesystem"])).toBe(false);
  });
});

describe("buildHermesModelOptions", () => {
  it("builds from Hermes provider cache + configured providers", () => {
    const opts = buildHermesModelOptions({
      snapshot: {
        provider: "deepseek",
        model: "deepseek-v4-flash",
        baseUrl: null,
        cursorViaHermes: false,
        cursorViaHermesReasons: [],
      },
      cursorViaHermes: false,
      configuredProviders: ["anthropic", "deepseek", "cursor"],
      providerModels: {
        anthropic: ["claude-fable-5", "claude-sonnet-5"],
        deepseek: ["deepseek-v4-pro", "deepseek-v4-flash"],
        cursor: ["composer-2.5", "auto"],
      },
      cursorModels: [{ id: "composer-2.5", label: "Composer 2.5" }],
    });
    expect(opts[0]?.id).toBe(
      formatHermesModelId({
        provider: "deepseek",
        model: "deepseek-v4-flash",
      }),
    );
    expect(opts.some((o) => o.id === "anthropic::claude-fable-5")).toBe(true);
    expect(opts.some((o) => o.id === "deepseek::deepseek-v4-pro")).toBe(true);
    expect(opts.some((o) => o.id === "cursor::composer-2.5")).toBe(true);
    // Stale hardcoded catalog ids must not appear when cache is present.
    expect(opts.some((o) => o.id === "nous::hermes-3")).toBe(false);
    expect(opts.some((o) => o.id === "openrouter::anthropic/claude-sonnet-4")).toBe(
      false,
    );
  });

  it("labels Cursor options as ready when cursorViaHermes", () => {
    const opts = buildHermesModelOptions({
      snapshot: {
        provider: "anthropic",
        model: "claude-haiku-4-5",
        baseUrl: null,
        cursorViaHermes: true,
        cursorViaHermesReasons: ["provider"],
      },
      cursorViaHermes: true,
      configuredProviders: ["cursor"],
      providerModels: {
        cursor: ["composer-2.5"],
      },
      cursorModels: [{ id: "composer-2.5", label: "Composer 2.5" }],
    });
    expect(opts.find((o) => o.id === "cursor::composer-2.5")?.label).toMatch(
      /Cursor via Hermes/,
    );
  });

  it("falls back to static list when cache empty", () => {
    const opts = buildHermesModelOptions({
      snapshot: {
        provider: "anthropic",
        model: "claude-haiku-4-5",
        baseUrl: null,
        cursorViaHermes: false,
        cursorViaHermesReasons: [],
      },
      cursorViaHermes: false,
      providerModels: {},
      configuredProviders: [],
    });
    expect(opts.some((o) => o.id === "cursor::composer-2.5")).toBe(true);
    expect(opts.some((o) => o.id === "anthropic::claude-haiku-4-5")).toBe(
      true,
    );
  });
});
