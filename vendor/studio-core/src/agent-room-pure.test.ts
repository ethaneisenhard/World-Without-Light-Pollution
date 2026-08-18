import { describe, expect, it } from "vitest";
import {
  claimAgentRoomPaths,
  emptyAgentRoom,
  findAgentRoomOverlaps,
  formatAgentRoomBundleSlice,
  heartbeatAgentRoom,
  joinAgentRoom,
  leaveAgentRoom,
  listAgentRoomSiblings,
  pruneAgentRoom,
  spawnAgentRoomAgent,
} from "./agent-room-pure.js";

describe("agent-room-pure", () => {
  it("joins and lists siblings", () => {
    let room = emptyAgentRoom("demo-blog");
    room = joinAgentRoom(room, {
      chatId: "chat-a",
      projectId: "demo-blog",
      harnessId: "cursor",
      label: "A",
      intent: "fix nav",
      lastSeenAt: 1000,
    });
    room = joinAgentRoom(room, {
      chatId: "chat-b",
      projectId: "demo-blog",
      harnessId: "anthropic",
      label: "B",
      intent: null,
      lastSeenAt: 2000,
    });
    expect(listAgentRoomSiblings(room, "chat-a").map((m) => m.chatId)).toEqual([
      "chat-b",
    ]);
  });

  it("detects overlapping path claims", () => {
    let room = emptyAgentRoom("p");
    room = joinAgentRoom(room, {
      chatId: "a",
      projectId: "p",
      harnessId: "cursor",
      label: null,
      intent: null,
      lastSeenAt: 1,
    });
    room = joinAgentRoom(room, {
      chatId: "b",
      projectId: "p",
      harnessId: "cursor",
      label: null,
      intent: null,
      lastSeenAt: 1,
    });
    room = claimAgentRoomPaths(room, {
      chatId: "a",
      paths: ["src/app.tsx", "src/other.ts"],
      now: 1000,
      ttlMs: 60_000,
    });
    room = claimAgentRoomPaths(room, {
      chatId: "b",
      paths: ["./src/app.tsx"],
      now: 1000,
      ttlMs: 60_000,
    });
    const overlaps = findAgentRoomOverlaps(room, 1500);
    expect(overlaps).toEqual([
      { path: "src/app.tsx", chatIds: ["a", "b"] },
    ]);
  });

  it("prunes stale members and formats slice", () => {
    let room = emptyAgentRoom("p");
    room = joinAgentRoom(room, {
      chatId: "old",
      projectId: "p",
      harnessId: "cursor",
      label: "Old",
      intent: null,
      lastSeenAt: 0,
    });
    room = joinAgentRoom(room, {
      chatId: "live",
      projectId: "p",
      harnessId: "hermes",
      label: "Live",
      intent: "ship feature",
      lastSeenAt: 10_000,
    });
    room = pruneAgentRoom(room, 10_000, 5_000);
    expect(room.members.map((m) => m.chatId)).toEqual(["live"]);

    room = heartbeatAgentRoom(room, "self", 10_000, {
      harnessId: "cursor",
      label: "Self",
    });
    const slice = formatAgentRoomBundleSlice({
      room,
      selfChatId: "self",
      now: 10_000,
    });
    expect(slice).toContain("Live agents");
    expect(slice).toContain("Live");
    expect(slice).toContain("hermes");
  });

  it("leave removes member and claims", () => {
    let room = emptyAgentRoom("p");
    room = joinAgentRoom(room, {
      chatId: "a",
      projectId: "p",
      harnessId: "cursor",
      label: null,
      intent: null,
    });
    room = claimAgentRoomPaths(room, { chatId: "a", paths: ["x.ts"] });
    room = leaveAgentRoom(room, "a");
    expect(room.members).toHaveLength(0);
    expect(room.claims).toHaveLength(0);
  });

  it("spawns child onto room with parent link", () => {
    let room = emptyAgentRoom("p");
    room = joinAgentRoom(room, {
      chatId: "parent",
      projectId: "p",
      harnessId: "cursor",
      label: "Parent",
      intent: null,
    });
    const { room: next, child } = spawnAgentRoomAgent(room, {
      parentChatId: "parent",
      childChatId: "worker-a",
      label: "Worker A",
      intent: "explore",
      harnessId: "agent-room",
      now: 5000,
    });
    expect(child.role).toBe("spawned");
    expect(child.parentChatId).toBe("parent");
    expect(listAgentRoomSiblings(next, "parent").map((m) => m.chatId)).toEqual([
      "worker-a",
    ]);
    const slice = formatAgentRoomBundleSlice({
      room: next,
      selfChatId: "parent",
      now: 5000,
    });
    expect(slice).toContain("spawned");
    expect(slice).toContain("Worker A");
  });
});

