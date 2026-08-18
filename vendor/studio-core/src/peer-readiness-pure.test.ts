import { describe, expect, it } from "vitest";
import {
  listPeerReadinessRows,
  peerReadinessProbeFromCapabilityStates,
  peerReadinessProbeFromEnv,
  projectPeerReadinessRow,
} from "./peer-readiness-pure.js";

describe("peer-readiness-pure", () => {
  it("kody needs-setup without URL; ready with URL; hint points at MCP plane", () => {
    const need = projectPeerReadinessRow("kody", {
      kodyChatUrlConfigured: false,
    });
    expect(need.status).toBe("needs-setup");
    expect(need.hint).toMatch(/KODY_BASE_URL/);
    expect(need.hint).toMatch(/MCP tools/);

    const ready = projectPeerReadinessRow("kody", {
      kodyChatUrlConfigured: true,
    });
    expect(ready.status).toBe("ready");
    expect(ready.hint).toMatch(/Studio \+ Kody/);
    expect(ready.hint).toMatch(/default plane|\/mcp/);
  });

  it("anthropic / cursor / hermes / grok project from probes", () => {
    expect(
      projectPeerReadinessRow("anthropic", {
        anthropicApiKeyConfigured: true,
      }).status,
    ).toBe("ready");
    expect(
      projectPeerReadinessRow("cursor", { cursorCliPresent: false }).status,
    ).toBe("needs-setup");
    expect(
      projectPeerReadinessRow("hermes", { hermesCliPresent: true }).status,
    ).toBe("ready");
    expect(
      projectPeerReadinessRow("grok", { grokCliPresent: false }).status,
    ).toBe("needs-setup");
  });

  it("listPeerReadinessRows covers composer peers (no kody — MCP plane)", () => {
    const rows = listPeerReadinessRows({
      kodyChatUrlConfigured: false,
      anthropicApiKeyConfigured: true,
      cursorCliPresent: true,
      hermesCliPresent: false,
      grokCliPresent: false,
    });
    expect(rows.map((r) => r.harnessId)).toEqual([
      "cursor",
      "anthropic",
      "deepseek",
      "litellm",
      "hermes",
      "grok",
    ]);
    expect(rows.find((r) => r.harnessId === "kody")).toBeUndefined();
  });

  it("peerReadinessProbeFromEnv reads Kody + Anthropic + DeepSeek + LiteLLM flags", () => {
    expect(
      peerReadinessProbeFromEnv({
        KODY_BASE_URL: "https://kody.example",
        ANTHROPIC_API_KEY: "sk-test",
        DEEPSEEK_API_KEY: "sk-ds",
        LITELLM_API_KEY: "sk-as-litellm-dev",
      }),
    ).toEqual({
      kodyChatUrlConfigured: true,
      anthropicApiKeyConfigured: true,
      deepseekApiKeyConfigured: true,
      litellmApiKeyConfigured: true,
    });
    expect(peerReadinessProbeFromEnv({})).toEqual({
      kodyChatUrlConfigured: false,
      anthropicApiKeyConfigured: false,
      deepseekApiKeyConfigured: false,
      litellmApiKeyConfigured: false,
    });
  });

  it("unknown harness without projector → unknown", () => {
    const row = projectPeerReadinessRow("openclaw", {});
    expect(row.status).toBe("unknown");
  });

  it("peerReadinessProbeFromCapabilityStates maps mcp:kody authOk", () => {
    const probe = peerReadinessProbeFromCapabilityStates([
      { id: "mcp:kody", installed: true, authOk: false },
      { id: "harness:cursor", installed: true, authOk: true },
    ]);
    expect(probe.kodyChatUrlConfigured).toBe(false);
    expect(probe.cursorCliPresent).toBe(true);
  });

  it("peerReadinessProbeFromCapabilityStates accepts legacy harness:kody", () => {
    const probe = peerReadinessProbeFromCapabilityStates([
      { id: "harness:kody", installed: true, authOk: true },
    ]);
    expect(probe.kodyChatUrlConfigured).toBe(true);
  });
});
