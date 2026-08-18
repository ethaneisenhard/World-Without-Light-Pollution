import { describe, expect, it } from "vitest";
import {
  matchesStudioSelfEditIntent,
  resolveChatExecutionPlane,
} from "./chat-turn-route-pure.js";

describe("chat-turn-route-pure", () => {
  it("user Background wins", () => {
    const r = resolveChatExecutionPlane({
      intent: "hello",
      userArmedBackground: true,
    });
    expect(r.plane).toBe("durable-background");
    expect(r.classifierId).toBe("user-background");
  });

  it("fix-build source → durable", () => {
    const r = resolveChatExecutionPlane({
      intent: "anything",
      source: "fix-build",
    });
    expect(r.plane).toBe("durable-background");
    expect(r.classifierId).toBe("fix-build");
  });

  it("studio self-edit paths match helper but stay harness-turn on composer", () => {
    expect(matchesStudioSelfEditIntent("patch apps/studio/client/app.tsx")).toBe(
      true,
    );
    expect(
      matchesStudioSelfEditIntent("edit studio-ui-classes.ts tokens"),
    ).toBe(true);
    expect(matchesStudioSelfEditIntent("Fix the Studio client build")).toBe(
      true,
    );
    expect(matchesStudioSelfEditIntent("say hello")).toBe(false);
    const r = resolveChatExecutionPlane({
      intent: "Please update apps/studio/client/chat/foo.ts",
      source: "composer",
    });
    expect(r.plane).toBe("harness-turn");
    expect(r.classifierId).toBe("studio-self-edit-interactive");
  });

  it("default → harness-turn", () => {
    const r = resolveChatExecutionPlane({ intent: "what is 2+2?" });
    expect(r.plane).toBe("harness-turn");
    expect(r.classifierId).toBe("default");
  });
});
