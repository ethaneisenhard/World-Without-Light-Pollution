import { describe, expect, it } from "vitest";
import {
  chatGlobalScopeOptionLabel,
  chatProjectScopeFaceLabel,
  chatProjectScopeOptionLabel,
  chatScopeFooterProjectLabel,
  isChatGlobalScope,
  resolveChatScopeSelectValue,
} from "./chat-scope-label-pure.js";

describe("chat scope labels", () => {
  it("treats empty and _studio as global", () => {
    expect(isChatGlobalScope(null)).toBe(true);
    expect(isChatGlobalScope("")).toBe(true);
    expect(isChatGlobalScope("_studio")).toBe(true);
    expect(isChatGlobalScope("glassbox-studio")).toBe(false);
  });

  it("global option is not Glass Box Studio", () => {
    expect(chatGlobalScopeOptionLabel()).toMatch(/Global/);
    expect(chatGlobalScopeOptionLabel()).not.toMatch(/^Glass Box Studio$/);
  });

  it("project option keeps project display name", () => {
    expect(
      chatProjectScopeOptionLabel({
        id: "glassbox-studio",
        name: "Glass Box Studio",
      }),
    ).toBe("Glass Box Studio");
  });

  it("face is Global vs project name", () => {
    expect(
      chatProjectScopeFaceLabel({ sendProjectId: "_studio" }),
    ).toBe("Global");
    expect(
      chatProjectScopeFaceLabel({
        sendProjectId: "glassbox-studio",
        displayName: "Glass Box Studio",
      }),
    ).toBe("Glass Box Studio");
  });

  it("footer shows global not no project", () => {
    expect(chatScopeFooterProjectLabel(null)).toBe("global");
    expect(chatScopeFooterProjectLabel("_studio")).toBe("global");
    expect(chatScopeFooterProjectLabel("demo-blog")).toBe("demo-blog");
  });

  it("select value prefers URL over machine _studio", () => {
    expect(
      resolveChatScopeSelectValue({
        stickyGlobal: false,
        scopeSendId: "_studio",
        urlProjectId: "glassbox-studio",
      }),
    ).toBe("glassbox-studio");
    expect(
      resolveChatScopeSelectValue({
        stickyGlobal: true,
        scopeSendId: "_studio",
        urlProjectId: "glassbox-studio",
      }),
    ).toBe("_studio");
    expect(
      resolveChatScopeSelectValue({
        stickyGlobal: false,
        scopeSendId: "_studio",
        urlProjectId: "",
      }),
    ).toBe("_studio");
  });

  it("select value prefers explicit project pick over URL", () => {
    expect(
      resolveChatScopeSelectValue({
        stickyGlobal: false,
        scopeSendId: "swarm",
        urlProjectId: "glassbox-studio",
      }),
    ).toBe("swarm");
  });
});

