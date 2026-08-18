import { describe, expect, it } from "vitest";
import {
  allowToolsForChatMode,
  appendChatModeContext,
  effectiveChatMode,
  harnessOverrideForChatMode,
  parseChatComposerMode,
  resolveChatSendMode,
  systemHintForChatMode,
  useToolsForChatMode,
} from "./chat-mode-pure.js";

describe("parseChatComposerMode", () => {
  it("defaults unknown to agent", () => {
    expect(parseChatComposerMode(undefined)).toBe("agent");
    expect(parseChatComposerMode("nope")).toBe("agent");
  });
  it("accepts known modes", () => {
    expect(parseChatComposerMode("Plan")).toBe("plan");
    expect(parseChatComposerMode("ask")).toBe("ask");
    expect(parseChatComposerMode("workflow")).toBe("workflow");
  });
});

describe("allowToolsForChatMode", () => {
  it("ask → no tools", () => {
    expect(allowToolsForChatMode("ask")).toEqual([]);
    expect(useToolsForChatMode("ask")).toBe(false);
  });
  it("plan → explore + Notes land (+ git/mcp/skills/studio inspect + tools search/describe)", () => {
    expect(allowToolsForChatMode("plan")).toEqual([
      "tools.search",
      "tools.describe",
      "files.list",
      "files.read",
      "git.status",
      "git.diff",
      "git.github.status",
      "mcp.list_tools",
      "skills.list",
      "skills.read",
      "agents.room.list",
      "memory.search",
      "memory.get",
      "studio.config.get",
      "studio.theme.get",
      "studio.windowColors.get",
      "studio.windows.list",
      "studio.nav",
      "studio.ask_user",
      "notes.list",
      "notes.search",
      "notes.read",
      "notes.write",
      "notes.create",
      "secrets.list",
      "web.search",
    ]);
    expect(useToolsForChatMode("plan")).toBe(true);
  });
  it("agent/debug/multitask/workflow → full catalog", () => {
    expect(allowToolsForChatMode("agent")).toBeNull();
    expect(allowToolsForChatMode("debug")).toBeNull();
    expect(effectiveChatMode("multitask")).toBe("agent");
    expect(effectiveChatMode("workflow")).toBe("agent");
    expect(useToolsForChatMode("agent")).toBe(true);
  });
});

describe("resolveChatSendMode", () => {
  it("forces Agent for clone / GitHub jobs stuck on Multitask", () => {
    expect(
      resolveChatSendMode("multitask", "download the GitHub."),
    ).toBe("agent");
    expect(
      resolveChatSendMode("multitask", "clone the bee vibe repo"),
    ).toBe("agent");
    expect(resolveChatSendMode("multitask", "Please clone.")).toBe("agent");
    expect(resolveChatSendMode("agent", "download the GitHub.")).toBe("agent");
    expect(resolveChatSendMode("multitask", "Spawn workers")).toBe("multitask");
  });
});

describe("harnessOverrideForChatMode", () => {
  it("never overrides harness — Multitask is rooms, not a brain", () => {
    expect(
      harnessOverrideForChatMode({ mode: "multitask", multiAgent: "agent-room" }),
    ).toBeNull();
    expect(harnessOverrideForChatMode({ mode: "multitask" })).toBeNull();
    expect(
      harnessOverrideForChatMode({ mode: "multitask", multiAgent: "off" }),
    ).toBeNull();
    expect(harnessOverrideForChatMode({ mode: "agent" })).toBeNull();
    expect(harnessOverrideForChatMode({ mode: "ask" })).toBeNull();
  });
});

describe("systemHintForChatMode", () => {
  it("mentions plan deliverable + ask_user + Notes", () => {
    const hint = systemHintForChatMode("plan");
    expect(hint).toMatch(/Plan/);
    expect(hint).toMatch(/studio\.ask_user/);
    expect(hint).toMatch(/markdown plan/i);
    expect(hint).toMatch(/notes\.(create|write)/i);
    expect(hint).toMatch(/files\.write/);
    expect(hint).toMatch(/Forbidden/);
  });

  it("multitask mentions Agent room", () => {
    expect(systemHintForChatMode("multitask")).toMatch(/Agent room/i);
    expect(systemHintForChatMode("multitask")).toMatch(/agents\.spawn/i);
  });

  it("workflow mentions n8n durable deploy", () => {
    const hint = systemHintForChatMode("workflow");
    expect(hint).toMatch(/Workflow/);
    expect(hint).toMatch(/n8n/i);
  });

  it("debug prefers evidence before fix", () => {
    const hint = systemHintForChatMode("debug");
    expect(hint).toMatch(/Debug/);
    expect(hint).toMatch(/evidence/i);
    expect(hint).toMatch(/hypothesis/i);
  });

  it("agent uses progressive tools — no MUST theme.set over-steer", () => {
    const hint = systemHintForChatMode("agent");
    expect(hint).not.toMatch(/MUST call studio\.theme\.set/);
    expect(hint).toMatch(/tools\.search/);
    expect(hint).toMatch(/tools\.call/);
    expect(hint).toMatch(/skills\.read id="chrome"/);
    expect(hint).toMatch(/agents\.spawn/);
    expect(hint).toMatch(/git\.github\.(status|connect)/);
  });
});

describe("appendChatModeContext", () => {
  it("prefixes Ask hint for peers", () => {
    const out = appendChatModeContext("Open file: a.ts", "ask");
    expect(out).toMatch(/^Mode: Ask/);
    expect(out).toMatch(/Open file: a\.ts/);
  });

  it("is idempotent when hint already present", () => {
    const once = appendChatModeContext("ctx", "debug");
    const twice = appendChatModeContext(once, "debug");
    expect(twice).toBe(once);
  });
});
