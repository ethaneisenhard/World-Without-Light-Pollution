import { describe, expect, it } from "vitest";
import {
  connectHintForCapability,
  projectHarnessSettingsCards,
  projectKodyMcpSettingsCard,
  resolveHarnessSettingsCardFace,
} from "./capability-settings-pure.js";

describe("capability-settings-pure", () => {
  it("projects install when cursor bin missing", () => {
    const cards = projectHarnessSettingsCards({
      defaultHarness: "anthropic",
      states: [
        {
          id: "harness:cursor",
          kind: "harness",
          label: "Cursor Agent",
          desired: false,
          installed: false,
          authOk: false,
          healthy: false,
          authKind: "cli-login",
          detail: "bin missing",
        },
        {
          id: "harness:anthropic",
          kind: "harness",
          label: "Anthropic",
          desired: true,
          installed: true,
          authOk: true,
          healthy: true,
          authKind: "env",
        },
      ],
    });
    const cursor = cards.find((c) => c.harnessId === "cursor");
    const anth = cards.find((c) => c.harnessId === "anthropic");
    expect(cursor?.action).toBe("install");
    expect(anth?.action).toBe("ready");
    expect(anth?.actionLabel).toBe("Default");
  });

  it("set-default when desired+auth but not default", () => {
    const cards = projectHarnessSettingsCards({
      defaultHarness: "cursor",
      states: [
        {
          id: "harness:anthropic",
          kind: "harness",
          label: "Anthropic",
          desired: true,
          installed: true,
          authOk: true,
          healthy: true,
          authKind: "env",
        },
      ],
    });
    expect(cards.find((c) => c.harnessId === "anthropic")?.action).toBe(
      "set-default",
    );
  });

  it("Enable when Host has bin but not desired", () => {
    const cards = projectHarnessSettingsCards({
      defaultHarness: "anthropic",
      states: [
        {
          id: "harness:cursor",
          kind: "harness",
          label: "Cursor",
          desired: false,
          installed: true,
          authOk: true,
          healthy: false,
          authKind: "cli-login",
        },
      ],
    });
    expect(cards.find((c) => c.harnessId === "cursor")?.actionLabel).toBe(
      "Enable",
    );
  });

  it("connectHint mentions env for anthropic", () => {
    expect(connectHintForCapability("harness:anthropic")).toMatch(
      /ANTHROPIC_API_KEY/,
    );
  });

  it("does not list Kody as a harness card (MCP tools owns it)", () => {
    const cards = projectHarnessSettingsCards({
      defaultHarness: "cursor",
      states: [
        {
          id: "mcp:kody",
          kind: "mcp",
          label: "Kody",
          desired: true,
          installed: true,
          authOk: false,
          healthy: false,
          authKind: "url-env",
          detail: "KODY_BASE_URL missing",
        },
        {
          id: "harness:kody",
          kind: "harness",
          label: "Kody (legacy)",
          desired: true,
          installed: true,
          authOk: false,
          healthy: false,
          authKind: "url-env",
        },
      ],
    });
    expect(cards.find((c) => c.harnessId === "kody")).toBeUndefined();
    expect(cards.every((c) => c.capabilityId.startsWith("harness:"))).toBe(true);
  });

  it("projectKodyMcpSettingsCard needs-setup without URL", () => {
    const card = projectKodyMcpSettingsCard({
      states: [
        {
          id: "mcp:kody",
          kind: "mcp",
          label: "Kody",
          desired: false,
          installed: true,
          authOk: false,
          healthy: false,
          authKind: "url-env",
        },
      ],
      kodyBaseUrl: null,
      defaultMcpPlane: "studio+kody",
    });
    expect(card.capabilityId).toBe("mcp:kody");
    expect(card.readinessStatus).toBe("needs-setup");
    expect(card.readinessHint).toMatch(/KODY_BASE_URL/);
    expect(card.readinessHint).toMatch(/\/mcp/);
    expect(card.action).toBe("connect");
  });

  it("projectKodyMcpSettingsCard ready when URL set", () => {
    const card = projectKodyMcpSettingsCard({
      states: [
        {
          id: "mcp:kody",
          kind: "mcp",
          label: "Kody",
          desired: true,
          installed: true,
          authOk: true,
          healthy: true,
          authKind: "url-env",
        },
      ],
      kodyBaseUrl: "https://kody.example",
      defaultMcpPlane: "studio+kody",
    });
    expect(card.readinessStatus).toBe("ready");
    expect(card.mcpUrl).toBe("https://kody.example/mcp");
    expect(card.action).toBe("ready");
    expect(connectHintForCapability("mcp:kody")).toMatch(/KODY_BASE_URL/);
  });

  it("oauth authKind paints Connect (OAuth)", () => {
    const cards = projectHarnessSettingsCards({
      defaultHarness: "anthropic",
      states: [
        {
          id: "harness:cursor",
          kind: "harness",
          label: "Cursor",
          desired: true,
          installed: true,
          authOk: false,
          healthy: false,
          authKind: "oauth",
        },
        {
          id: "harness:anthropic",
          kind: "harness",
          label: "Anthropic",
          desired: true,
          installed: true,
          authOk: true,
          healthy: true,
          authKind: "env",
        },
      ],
    });
    const cursor = cards.find((c) => c.capabilityId === "harness:cursor");
    expect(cursor?.action).toBe("connect");
    expect(cursor?.actionLabel).toBe("Connect (OAuth)");
  });

  it("empty probe paints loading, not needs-setup", () => {
    const cards = projectHarnessSettingsCards({
      defaultHarness: "cursor",
      states: [],
    });
    expect(cards.every((c) => c.readinessStatus === "unknown")).toBe(true);
    expect(
      resolveHarnessSettingsCardFace({
        loadStatus: "loading",
        hasStates: false,
        readinessStatus: "unknown",
        healthy: false,
        installed: false,
        authOk: false,
      }),
    ).toBe("loading");
  });

  it("unknown readiness stays loading after GET (no Needs setup lie)", () => {
    expect(
      resolveHarnessSettingsCardFace({
        loadStatus: "ready",
        hasStates: true,
        readinessStatus: "unknown",
        healthy: false,
        installed: false,
        authOk: false,
      }),
    ).toBe("loading");
  });

  it("SSR-seeded needs-setup stays while confirm refresh runs", () => {
    expect(
      resolveHarnessSettingsCardFace({
        loadStatus: "loading",
        hasStates: true,
        readinessStatus: "needs-setup",
        healthy: false,
        installed: false,
        authOk: false,
      }),
    ).toBe("needs-setup");
  });

  it("confirmed missing bin is needs-setup, not loading", () => {
    expect(
      resolveHarnessSettingsCardFace({
        loadStatus: "ready",
        hasStates: true,
        readinessStatus: "needs-setup",
        healthy: false,
        installed: false,
        authOk: false,
      }),
    ).toBe("needs-setup");
  });
});
