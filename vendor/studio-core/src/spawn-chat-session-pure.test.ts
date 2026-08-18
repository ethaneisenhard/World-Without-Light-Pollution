import { describe, expect, it } from "vitest";
import {
  createEmptyChatSession,
  type ChatSessionState,
} from "./chat-session-pure.js";
import {
  importSpawnedChatSession,
  ledgerProjectIdForChat,
  spawnChatSessionTitle,
} from "./spawn-chat-session-pure.js";

function emptyState(): ChatSessionState {
  const s = createEmptyChatSession({ id: "parent", title: "Parent" });
  return { activeId: s.id, sessions: [s] };
}

describe("ledgerProjectIdForChat", () => {
  it("maps Studio root and blank to null", () => {
    expect(ledgerProjectIdForChat("_studio")).toBeNull();
    expect(ledgerProjectIdForChat("")).toBeNull();
    expect(ledgerProjectIdForChat(null)).toBeNull();
  });
  it("keeps workspace ids", () => {
    expect(ledgerProjectIdForChat("demo-blog")).toBe("demo-blog");
  });
});

describe("spawnChatSessionTitle", () => {
  it("prefers label then intent", () => {
    expect(spawnChatSessionTitle({ label: "Worker A", intent: "x" })).toBe(
      "Worker A",
    );
    expect(spawnChatSessionTitle({ intent: "explore files" })).toBe(
      "explore files",
    );
    expect(spawnChatSessionTitle({})).toBe("Agent room");
    expect(spawnChatSessionTitle({ label: "  " })).toBe("Agent room");
  });
});

describe("importSpawnedChatSession", () => {
  it("adds a tabOpen child without stealing activeId", () => {
    const next = importSpawnedChatSession(emptyState(), {
      childChatId: "spawn_1",
      title: "Worker A",
      now: 1000,
    });
    expect(next.activeId).toBe("parent");
    const child = next.sessions.find((s) => s.id === "spawn_1");
    expect(child?.tabOpen).toBe(true);
    expect(child?.mode).toBe("multitask");
    expect(child?.title).toBe("Worker A");
  });

  it("opens an existing closed tab without wiping messages", () => {
    const child = createEmptyChatSession({
      id: "spawn_1",
      title: "Old",
      now: 1,
    });
    child.tabOpen = false;
    child.messages = [{ role: "user", content: "keep me" }];
    const state: ChatSessionState = {
      activeId: "parent",
      sessions: [createEmptyChatSession({ id: "parent" }), child],
    };
    const next = importSpawnedChatSession(state, { childChatId: "spawn_1" });
    const got = next.sessions.find((s) => s.id === "spawn_1");
    expect(got?.tabOpen).toBe(true);
    expect(got?.messages).toEqual([{ role: "user", content: "keep me" }]);
  });

  it("no-ops when already tabOpen", () => {
    const first = importSpawnedChatSession(emptyState(), {
      childChatId: "spawn_1",
      now: 1,
    });
    const second = importSpawnedChatSession(first, {
      childChatId: "spawn_1",
      now: 2,
    });
    expect(second).toBe(first);
  });

  it("ignores blank ids", () => {
    const state = emptyState();
    expect(importSpawnedChatSession(state, { childChatId: "  " })).toBe(state);
  });
});
