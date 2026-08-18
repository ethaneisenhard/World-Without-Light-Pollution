import { describe, expect, it } from "vitest";
import {
  chatTurnExpired,
  orphanRunningChatTurn,
  parseChatTurnPersistedRecord,
  trimChatTurnEvents,
  type ChatTurnPersistedRecord,
} from "./chat-turn-store-pure.js";

function base(over: Partial<ChatTurnPersistedRecord> = {}): ChatTurnPersistedRecord {
  return {
    turnId: "t1",
    projectId: "p1",
    sessionId: "s1",
    status: "running",
    createdAt: 1000,
    finishedAt: null,
    errorMessage: null,
    nextSeq: 1,
    events: [{ seq: 0, event: "turn", data: { turnId: "t1" } }],
    ...over,
  };
}

describe("chat-turn-store-pure", () => {
  it("parse + roundtrip shape", () => {
    const raw = base({ status: "done", finishedAt: 2000, nextSeq: 2 });
    const parsed = parseChatTurnPersistedRecord(raw);
    expect(parsed?.turnId).toBe("t1");
    expect(parsed?.status).toBe("done");
    expect(parseChatTurnPersistedRecord(null)).toBeNull();
    expect(parseChatTurnPersistedRecord({ turnId: "x" })).toBeNull();
  });

  it("orphanRunningChatTurn appends error+done", () => {
    const next = orphanRunningChatTurn(base(), 5000, "boom");
    expect(next.status).toBe("error");
    expect(next.finishedAt).toBe(5000);
    expect(next.errorMessage).toBe("boom");
    expect(next.events.at(-2)?.event).toBe("error");
    expect(next.events.at(-1)?.event).toBe("done");
    expect(next.nextSeq).toBe(3);
    expect(orphanRunningChatTurn(base({ status: "done" })).status).toBe("done");
  });

  it("chatTurnExpired skips running", () => {
    expect(chatTurnExpired(base(), 999999, 100)).toBe(false);
    expect(
      chatTurnExpired(base({ status: "done", finishedAt: 1000 }), 2000, 500),
    ).toBe(true);
  });

  it("trimChatTurnEvents keeps tail", () => {
    const ev = [0, 1, 2, 3, 4].map((seq) => ({
      seq,
      event: "delta",
      data: seq,
    }));
    expect(trimChatTurnEvents(ev, 3).map((e) => e.seq)).toEqual([2, 3, 4]);
  });
});
