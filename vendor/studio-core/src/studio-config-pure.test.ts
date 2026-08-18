import { describe, expect, it } from "vitest";
import {
  allowToolsFromStudioConfig,
  defaultStudioConfig,
  mergeStudioConfigHostEcho,
  migrateLocalToolSettingsIntoConfig,
  parseStudioConfig,
  patchStudioConfig,
  resolveMcpServerAuthKind,
} from "./studio-config-pure.js";

describe("studio-config-pure", () => {
  it("defaults version 1 with studio-http + n8n-local", () => {
    const c = defaultStudioConfig();
    expect(c.version).toBe(1);
    expect(c.mcp.servers[0]?.id).toBe("studio-http");
    expect(c.mcp.servers.some((s) => s.id === "n8n-local")).toBe(true);
    expect(c.mcp.tools["files.write"]).toBe(true);
    expect(c.mcp.tools["git.status"]).toBe(true);
    expect(c.mcp.tools["mcp.call"]).toBe(true);
    expect(c.startup.destination).toBe("agent-home");
    expect(c.startup.windows.home).toBe(true);
    expect(c.startup.windows.chat).toBeUndefined();
    expect(c.startup.mobile.windows.chat).toBe(true);
    expect(c.startup.mobile.focusKind).toBe("chat");
    expect(c.ui.pet).toEqual({});
    expect(c.ui.displayName).toBe("");
    expect(c.durable.substrate).toBe("inngest");
    expect(c.durable.fallbacks.swarm).toBe("agent-room");
  });

  it("parses and patches durable substrate config", () => {
    const c = parseStudioConfig({
      durable: { substrate: "fake", fallbacks: { dag: "n8n" } },
    });
    expect(c.durable.substrate).toBe("fake");
    expect(c.durable.fallbacks.swarm).toBe("agent-room");
    const next = patchStudioConfig(c, {
      durable: { substrate: "inngest", fallbacks: { cron: "cf-workflows" } },
    });
    expect(next.durable.substrate).toBe("inngest");
    expect(next.durable.fallbacks.cron).toBe("cf-workflows");
    expect(next.durable.fallbacks.dag).toBe("n8n");
  });

  it("parses and patches ui.pet", () => {
    const c = parseStudioConfig({
      ui: { pet: { id: "battle-beast", name: "Beast" } },
    });
    expect(c.ui.pet).toEqual({ id: "battle-beast", name: "Beast" });
    const next = patchStudioConfig(c, {
      ui: { pet: { id: "airring", enabled: false } },
    });
    expect(next.ui.pet).toEqual({ id: "airring", enabled: false });
  });

  it("parses and patches ui.forceGlobalAppearance", () => {
    expect(defaultStudioConfig().ui.forceGlobalAppearance).toBe(false);
    const c = parseStudioConfig({
      ui: { forceGlobalAppearance: true },
    });
    expect(c.ui.forceGlobalAppearance).toBe(true);
    const next = patchStudioConfig(c, {
      ui: { forceGlobalAppearance: false },
    });
    expect(next.ui.forceGlobalAppearance).toBe(false);
  });

  it("parses and patches ui.selfHealErrors", () => {
    expect(defaultStudioConfig().ui.selfHealErrors).toBe(false);
    const c = parseStudioConfig({
      ui: { selfHealErrors: true },
    });
    expect(c.ui.selfHealErrors).toBe(true);
    const next = patchStudioConfig(c, {
      ui: { selfHealErrors: false },
    });
    expect(next.ui.selfHealErrors).toBe(false);
  });

  it("parses and patches ui.fleet", () => {
    expect(defaultStudioConfig().ui.fleet.showChats).toBe("all");
    const c = parseStudioConfig({
      ui: { fleet: { showChats: "agentic", harnessPets: { studio: "airring" } } },
    });
    expect(c.ui.fleet.showChats).toBe("agentic");
    expect(c.ui.fleet.harnessPets.studio).toBe("airring");
    const next = patchStudioConfig(c, {
      ui: { fleet: { showChats: "spawn_durable", harnessPets: {} } },
    });
    expect(next.ui.fleet.showChats).toBe("spawn_durable");
  });

  it("parses and patches ui.layout.chatSide", () => {
    expect(defaultStudioConfig().ui.layout.chatSide).toBe("left");
    const c = parseStudioConfig({
      ui: { layout: { chatSide: "right" } },
    });
    expect(c.ui.layout.chatSide).toBe("right");
    const next = patchStudioConfig(c, {
      ui: { layout: { chatSide: "left" } },
    });
    expect(next.ui.layout.chatSide).toBe("left");
    expect(
      parseStudioConfig({ ui: { layout: { chatSide: "nope" } } }).ui.layout
        .chatSide,
    ).toBe("left");
  });

  it("parses and patches ui.workspaceSwitchMode", () => {
    expect(defaultStudioConfig().ui.workspaceSwitchMode).toBe("restore-tabs");
    const c = parseStudioConfig({
      ui: { workspaceSwitchMode: "context-only" },
    });
    expect(c.ui.workspaceSwitchMode).toBe("context-only");
    const next = patchStudioConfig(c, {
      ui: { workspaceSwitchMode: "restore-tabs" },
    });
    expect(next.ui.workspaceSwitchMode).toBe("restore-tabs");
    expect(
      parseStudioConfig({ ui: { workspaceSwitchMode: "nope" } }).ui
        .workspaceSwitchMode,
    ).toBe("restore-tabs");
  });

  it("mergeStudioConfigHostEcho keeps force-global when Host omits it", () => {
    const prev = patchStudioConfig(defaultStudioConfig(), {
      ui: { forceGlobalAppearance: true, workspaceSwitchMode: "context-only" },
    });
    const echoed = mergeStudioConfigHostEcho(
      prev,
      { ui: { shell: { accent: "#a16207" } } },
      { ui: { shell: { accent: "#a16207" } } },
    );
    expect(echoed.ui.forceGlobalAppearance).toBe(true);
    expect(echoed.ui.workspaceSwitchMode).toBe("context-only");
    const fromOff = mergeStudioConfigHostEcho(
      defaultStudioConfig(),
      { ui: { colorMode: "dark" } },
      { ui: { forceGlobalAppearance: true } },
    );
    expect(fromOff.ui.forceGlobalAppearance).toBe(true);
    const cleared = mergeStudioConfigHostEcho(
      prev,
      { ui: { forceGlobalAppearance: false } },
      { ui: { forceGlobalAppearance: false } },
    );
    expect(cleared.ui.forceGlobalAppearance).toBe(false);
  });

  it("parses and patches ui.displayName", () => {
    const c = parseStudioConfig({
      ui: { displayName: "  Ethan  " },
    });
    expect(c.ui.displayName).toBe("Ethan");
    const next = patchStudioConfig(c, {
      ui: { displayName: "  Sam  " },
    });
    expect(next.ui.displayName).toBe("Sam");
    const cleared = patchStudioConfig(next, { ui: { displayName: "  " } });
    expect(cleared.ui.displayName).toBe("");
  });

  it("parses and patches ui.mobileDock", () => {
    expect(defaultStudioConfig().ui.mobileDock).toEqual({});
    const c = parseStudioConfig({
      ui: { mobileDock: { tabs: ["settings", "calendar", "messages"] } },
    });
    expect(c.ui.mobileDock.tabs).toEqual([
      "settings",
      "calendar",
      "messages",
    ]);
    const next = patchStudioConfig(c, {
      ui: { mobileDock: { tabs: ["ai", "messages", "workspaces"] } },
    });
    expect(next.ui.mobileDock.tabs).toEqual(["ai", "messages", "workspaces"]);
    const bad = parseStudioConfig({
      ui: { mobileDock: { tabs: ["ai"] } },
    });
    expect(bad.ui.mobileDock).toEqual({});
  });

  it("parses partial JSON with defaults", () => {
    const c = parseStudioConfig({
      ui: { colorMode: "dark" },
      ai: { defaultChatMode: "ask" },
    });
    expect(c.ui.colorMode).toBe("dark");
    expect(c.ai.defaultChatMode).toBe("ask");
    expect(c.ai.accessMode).toBe("guarded");
    expect(c.editor.preferred).toBe("cursor");
    expect(c.startup.windows.home).toBe(true);
    expect(c.startup.windows.chat).toBeUndefined();
    expect(c.security.nope.posture).toBe("balanced");
  });

  it("patches security.nope posture", () => {
    const next = patchStudioConfig(defaultStudioConfig(), {
      security: { nope: { posture: "strict" } },
    });
    expect(next.security.nope.posture).toBe("strict");
  });

  it("defaults cursor harness + Grok 4.5 Fast model", () => {
    const c = defaultStudioConfig();
    expect(c.ai.defaultHarness).toBe("cursor");
    expect(c.ai.defaultChatModel).toBe("cursor-grok-4.5-high-fast");
    expect(c.ai.defaultMcpPlane).toBe("studio+kody");
  });

  it("patches defaultChatModel", () => {
    const next = patchStudioConfig(defaultStudioConfig(), {
      ai: { defaultChatModel: "claude-haiku-4-5" },
    });
    expect(next.ai.defaultChatModel).toBe("claude-haiku-4-5");
  });

  it("patches accessMode", () => {
    const next = patchStudioConfig(defaultStudioConfig(), {
      ai: { accessMode: "all" },
    });
    expect(next.ai.accessMode).toBe("all");
  });

  it("defaults and patches globalFileAccess", () => {
    const base = defaultStudioConfig();
    expect(base.ai.globalFileAccess).toEqual({
      studioMonorepo: true,
      workspaces: "all",
    });
    const next = patchStudioConfig(base, {
      ai: { globalFileAccess: { workspaces: "none" } },
    });
    expect(next.ai.globalFileAccess).toEqual({
      studioMonorepo: true,
      workspaces: "none",
    });
  });

  it("defaults and patches responseStyle", () => {
    const base = defaultStudioConfig();
    expect(base.ai.responseStyle).toEqual({
      verbosity: "balanced",
      structure: "structured",
    });
    const next = patchStudioConfig(base, {
      ai: { responseStyle: { verbosity: "concise", structure: "freeform" } },
    });
    expect(next.ai.responseStyle).toEqual({
      verbosity: "concise",
      structure: "freeform",
    });
    const partial = patchStudioConfig(next, {
      ai: { responseStyle: { verbosity: "detailed" } },
    });
    expect(partial.ai.responseStyle).toEqual({
      verbosity: "detailed",
      structure: "freeform",
    });
  });

  it("patches tools and providers", () => {
    const base = defaultStudioConfig();
    const next = patchStudioConfig(base, {
      mcp: { tools: { "files.write": false } },
      providers: { email: { plugin: "@glassbox-studio/email-cloudflare" } },
    });
    expect(next.mcp.tools["files.write"]).toBe(false);
    expect(next.providers.email?.plugin).toBe("@glassbox-studio/email-cloudflare");
    expect(allowToolsFromStudioConfig(next)).toContain("files.read");
    expect(allowToolsFromStudioConfig(next)).not.toContain("files.write");
  });

  it("patches startup preference", () => {
    const base = defaultStudioConfig();
    const next = patchStudioConfig(base, {
      startup: {
        destination: "last-project",
        windows: { code: true, live: true },
        layoutMode: "single",
      },
    });
    expect(next.startup.destination).toBe("last-project");
    expect(next.startup.windows.code).toBe(true);
    expect(next.startup.layoutMode).toBe("single");
  });

  it("migrates localStorage overrides once", () => {
    const base = defaultStudioConfig();
    const migrated = migrateLocalToolSettingsIntoConfig(base, {
      "files.write": false,
    });
    expect(migrated.mcp.tools["files.write"]).toBe(false);
    const again = migrateLocalToolSettingsIntoConfig(migrated, {
      "files.list": false,
    });
    expect(again.mcp.tools["files.list"]).toBe(true);
  });

  it("patchStudioConfig persists Global ui.shell", () => {
    const next = patchStudioConfig(defaultStudioConfig(), {
      ui: {
        shell: {
          color: {
            bg: { canvas: "#fefce8" },
            fg: { accent: "#a16207" },
          },
        },
      },
    });
    expect(next.ui.shell?.color?.bg?.canvas).toBe("#fefce8");
    expect(next.ui.shell?.color?.fg?.accent).toBe("#a16207");
    const cleared = patchStudioConfig(next, { ui: { shell: null } });
    expect(cleared.ui.shell).toBeUndefined();
  });

  it("parses mcp.servers auth + tools (Hermes shape)", () => {
    const c = parseStudioConfig({
      mcp: {
        servers: [
          {
            id: "linear",
            kind: "http",
            url: "https://mcp.linear.app/mcp",
            auth: "oauth",
            tools: {
              include: ["list_issues", "create_issue"],
              exclude: ["delete_workspace"],
              resources: true,
              prompts: false,
            },
          },
          {
            id: "n8n-local",
            kind: "http",
            url: "https://example.com/mcp",
            authHeaderEnv: "N8N_MCP_TOKEN",
          },
        ],
      },
    });
    const linear = c.mcp.servers.find((s) => s.id === "linear");
    expect(linear?.auth).toBe("oauth");
    expect(linear?.tools?.include).toEqual(["list_issues", "create_issue"]);
    expect(linear?.tools?.exclude).toEqual(["delete_workspace"]);
    expect(linear?.tools?.resources).toBe(true);
    expect(linear?.tools?.prompts).toBe(false);
    const n8n = c.mcp.servers.find((s) => s.id === "n8n-local");
    expect(n8n?.authHeaderEnv).toBe("N8N_MCP_TOKEN");
    expect(resolveMcpServerAuthKind(n8n!)).toBe("bearer-env");
    expect(resolveMcpServerAuthKind({ auth: "oauth" })).toBe("oauth");
    expect(resolveMcpServerAuthKind({})).toBe("none");
  });
});
