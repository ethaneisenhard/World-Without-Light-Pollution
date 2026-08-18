import { describe, expect, it } from "vitest";
import {
  approvalsRequiredForAccessMode,
  parseAccessMode,
  parseAccessModeChatIntent,
  parseAccessModeOverride,
  parseStudioMonorepoFilePath,
  resolveAccessMode,
  resolveEffectiveAllowTools,
  studioConfigPatchForAccessMode,
  STUDIO_MONOREPO_PATH_PREFIX,
} from "./access-mode-pure.js";
import { defaultStudioConfig, patchStudioConfig } from "./studio-config-pure.js";

describe("access-mode-pure", () => {
  it("parses access modes", () => {
    expect(parseAccessMode("all")).toBe("all");
    expect(parseAccessMode("guarded")).toBe("guarded");
    expect(parseAccessMode("nope")).toBe("guarded");
    expect(parseAccessModeOverride("inherit")).toBe("inherit");
    expect(parseAccessModeOverride(undefined)).toBe("inherit");
  });

  it("resolves most-specific access mode", () => {
    expect(
      resolveAccessMode({
        studio: "guarded",
        project: "all",
        user: "inherit",
      }),
    ).toBe("all");
    expect(
      resolveAccessMode({
        studio: "all",
        project: "guarded",
        user: "inherit",
      }),
    ).toBe("guarded");
    expect(
      resolveAccessMode({
        studio: "guarded",
        project: "inherit",
        user: "all",
      }),
    ).toBe("all");
    expect(resolveAccessMode({ studio: "all" })).toBe("all");
    expect(resolveAccessMode({})).toBe("guarded");
  });

  it("all-access skips config/project allowlists but keeps Ask empty", () => {
    const config = patchStudioConfig(defaultStudioConfig(), {
      mcp: { tools: { "files.write": false } },
      ai: { accessMode: "all" },
    });
    expect(
      resolveEffectiveAllowTools({
        accessMode: "all",
        studioConfig: config,
        projectAllowTools: ["files.read"],
        chatMode: "agent",
      }),
    ).toBeNull();
    expect(
      resolveEffectiveAllowTools({
        accessMode: "all",
        studioConfig: config,
        chatMode: "ask",
      }),
    ).toEqual([]);
  });

  it("guarded intersects config × project × mode", () => {
    const config = patchStudioConfig(defaultStudioConfig(), {
      mcp: { tools: { "files.write": false, "git.push": false } },
    });
    const allow = resolveEffectiveAllowTools({
      accessMode: "guarded",
      studioConfig: config,
      projectAllowTools: ["files.read", "files.write", "files.list"],
      chatMode: "agent",
    });
    expect(allow).toContain("files.read");
    expect(allow).toContain("files.list");
    expect(allow).not.toContain("files.write");
    expect(allow).toContain("tools.search");
    expect(allow).toContain("tools.call");
  });

  it("approvalsRequired only for guarded", () => {
    expect(approvalsRequiredForAccessMode("guarded")).toBe(true);
    expect(approvalsRequiredForAccessMode("all")).toBe(false);
  });

  it("parses @studio/ monorepo paths", () => {
    expect(parseStudioMonorepoFilePath("@studio/apps/studio/client/app.tsx")).toEqual({
      kind: "studio",
      rel: "apps/studio/client/app.tsx",
    });
    expect(parseStudioMonorepoFilePath("@studio")).toEqual({
      kind: "studio",
      rel: "",
    });
    expect(parseStudioMonorepoFilePath("@studio/")).toEqual({
      kind: "studio",
      rel: "",
    });
    expect(parseStudioMonorepoFilePath("src/index.ts")).toEqual({
      kind: "project",
      path: "src/index.ts",
    });
    expect(STUDIO_MONOREPO_PATH_PREFIX).toBe("@studio/");
  });

  it("parses chat intent for full / guarded access", () => {
    expect(parseAccessModeChatIntent("turn on full access mode")).toEqual({
      mode: "all",
      label: "full computer access",
    });
    expect(studioConfigPatchForAccessMode("all")).toEqual({
      ai: { accessMode: "all" },
      security: { nope: { posture: "off" } },
    });
    expect(studioConfigPatchForAccessMode("guarded")).toEqual({
      ai: { accessMode: "guarded" },
      security: { nope: { posture: "balanced" } },
    });
    expect(parseAccessModeChatIntent("full access")).toEqual({
      mode: "all",
      label: "full computer access",
    });
    expect(parseAccessModeChatIntent("full computer access")).toEqual({
      mode: "all",
      label: "full computer access",
    });
    expect(parseAccessModeChatIntent("give me complete computer access")).toEqual({
      mode: "all",
      label: "full computer access",
    });
    expect(parseAccessModeChatIntent("computer override")).toEqual({
      mode: "all",
      label: "full computer access",
    });
    expect(parseAccessModeChatIntent("enable all-access")).toEqual({
      mode: "all",
      label: "full computer access",
    });
    expect(parseAccessModeChatIntent("switch to guarded")).toEqual({
      mode: "guarded",
      label: "guarded",
    });
    expect(parseAccessModeChatIntent("what is access mode?")).toBeNull();
    expect(parseAccessModeChatIntent("turn on the lights")).toBeNull();
  });
});
