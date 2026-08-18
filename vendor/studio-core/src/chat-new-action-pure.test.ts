import { describe, expect, it } from "vitest";
import {
  isSpawnedWorkerSessionId,
  resolveChatNewAction,
} from "./chat-new-action-pure.js";

describe("resolveChatNewAction", () => {
  it("compact-forks spawned workers", () => {
    expect(isSpawnedWorkerSessionId("spawn_abc_1")).toBe(true);
    expect(resolveChatNewAction({ id: "spawn_abc_1", title: "Review" })).toBe(
      "compact-fork",
    );
  });

  it("news a normal chat", () => {
    expect(resolveChatNewAction({ id: "chat_abc", title: "Hello" })).toBe("new");
    expect(resolveChatNewAction(null)).toBe("new");
  });
});
