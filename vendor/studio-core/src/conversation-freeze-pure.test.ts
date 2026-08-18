import { describe, expect, it } from "vitest";
import {
  conversationFreezeKey,
  createConversationFreezeStore,
  resolveFrozenStableParts,
} from "./conversation-freeze-pure.js";

describe("conversation-freeze-pure", () => {
  it("key null when session missing", () => {
    expect(conversationFreezeKey(null)).toBeNull();
    expect(conversationFreezeKey("  ")).toBeNull();
    expect(conversationFreezeKey("s1")).toBe("s1");
  });

  it("first resolve stores; second uses freeze without fresh parts", () => {
    const store = createConversationFreezeStore();
    const first = resolveFrozenStableParts({
      sessionId: "chat-a",
      store,
      freshStableParts: ["rules", "skills", "mem-v1"],
      now: 1,
    });
    expect(first.fromFreeze).toBe(false);
    expect(first.stableParts).toEqual(["rules", "skills", "mem-v1"]);

    const second = resolveFrozenStableParts({
      sessionId: "chat-a",
      store,
      freshStableParts: ["rules", "skills", "mem-VARYING"],
      now: 2,
    });
    expect(second.fromFreeze).toBe(true);
    expect(second.stableParts).toEqual(["rules", "skills", "mem-v1"]);
    expect(second.stableParts).not.toContain("mem-VARYING");
  });

  it("invalidate clears session so next resolve stores fresh", () => {
    const store = createConversationFreezeStore();
    resolveFrozenStableParts({
      sessionId: "chat-a",
      store,
      freshStableParts: ["old"],
    });
    store.invalidate("chat-a");
    const next = resolveFrozenStableParts({
      sessionId: "chat-a",
      store,
      freshStableParts: ["new"],
    });
    expect(next.fromFreeze).toBe(false);
    expect(next.stableParts).toEqual(["new"]);
  });

  it("invalidate() with no args clears all", () => {
    const store = createConversationFreezeStore();
    resolveFrozenStableParts({
      sessionId: "a",
      store,
      freshStableParts: ["x"],
    });
    resolveFrozenStableParts({
      sessionId: "b",
      store,
      freshStableParts: ["y"],
    });
    expect(store.size()).toBe(2);
    store.invalidate();
    expect(store.size()).toBe(0);
  });
});
