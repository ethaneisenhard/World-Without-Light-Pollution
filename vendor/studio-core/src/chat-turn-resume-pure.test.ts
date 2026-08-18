import { describe, expect, it } from "vitest";
import {
  chatTurnStorageKey,
  chatTurnSubscribeFromSeq,
  parseActiveTurnResponse,
  parseStoredChatTurnCursor,
  parseTurnAnnounceEvent,
  resolveReattachTurnCursor,
  serializeStoredChatTurnCursor,
  shouldCatchUpChatTurn,
} from "./chat-turn-resume-pure.js";

describe("chat-turn-resume-pure", () => {
  it("storage key", () => {
    expect(chatTurnStorageKey(" abc ")).toBe("as-chat-turn:abc");
  });

  it("parseStoredChatTurnCursor — legacy + JSON", () => {
    expect(parseStoredChatTurnCursor("t-legacy")).toEqual({
      turnId: "t-legacy",
      lastSeq: -1,
    });
    expect(
      parseStoredChatTurnCursor(
        serializeStoredChatTurnCursor({ turnId: "t1", lastSeq: 4 }),
      ),
    ).toEqual({ turnId: "t1", lastSeq: 4 });
    expect(
      parseStoredChatTurnCursor(
        serializeStoredChatTurnCursor({
          turnId: "t1",
          lastSeq: 4,
          assistant: "partial prose",
        }),
      ),
    ).toEqual({ turnId: "t1", lastSeq: 4, assistant: "partial prose" });
    expect(chatTurnSubscribeFromSeq(-1)).toBe(0);
    expect(chatTurnSubscribeFromSeq(4)).toBe(5);
  });

  it("parseActiveTurnResponse", () => {
    expect(parseActiveTurnResponse({ turnId: "t1", status: "running" })).toEqual({
      turnId: "t1",
      status: "running",
      tools: [],
      shipRebuild: false,
    });
    expect(parseActiveTurnResponse({})).toEqual({
      turnId: null,
      status: null,
      tools: [],
      shipRebuild: false,
    });
    expect(
      parseActiveTurnResponse({
        turnId: "t2",
        status: "done",
        tools: ["shell.run"],
        shipRebuild: true,
      }),
    ).toEqual({
      turnId: "t2",
      status: "done",
      tools: ["shell.run"],
      shipRebuild: true,
    });
  });

  it("resolveReattachTurnCursor — Host null wins over stale storage", () => {
    expect(
      resolveReattachTurnCursor({
        activeOk: true,
        activeTurnId: null,
        activeStatus: null,
        storedTurnId: "stale-t",
      }),
    ).toEqual({ turnId: null, turnStatus: null, clearStored: true });
    expect(
      resolveReattachTurnCursor({
        activeOk: false,
        activeTurnId: null,
        activeStatus: null,
        storedTurnId: "mid-flight",
      }),
    ).toEqual({
      turnId: "mid-flight",
      turnStatus: "running",
      clearStored: false,
    });
    expect(
      resolveReattachTurnCursor({
        activeOk: true,
        activeTurnId: "t-live",
        activeStatus: "done",
        storedTurnId: "other",
      }),
    ).toEqual({
      turnId: "t-live",
      turnStatus: "done",
      clearStored: false,
    });
  });

  it("parseTurnAnnounceEvent", () => {
    expect(parseTurnAnnounceEvent({ turnId: "x" })).toBe("x");
    expect(parseTurnAnnounceEvent(null)).toBeNull();
  });

  it("shouldCatchUpChatTurn — running / empty / sealed vs has prose", () => {
    expect(
      shouldCatchUpChatTurn({
        lastAssistantContent: "already replied",
        turnStatus: "running",
      }),
    ).toBe(true);
    expect(
      shouldCatchUpChatTurn({
        lastAssistantContent: "",
        turnStatus: "done",
      }),
    ).toBe(true);
    expect(
      shouldCatchUpChatTurn({
        lastAssistantContent: "No response — sealed",
        turnStatus: "done",
        emptyMarkers: ["No response — sealed"],
      }),
    ).toBe(true);
    expect(
      shouldCatchUpChatTurn({
        lastAssistantContent: "real answer from before",
        turnStatus: "done",
      }),
    ).toBe(false);
    expect(
      shouldCatchUpChatTurn({
        lastAssistantContent:
          "Rebuilding client JS without the locked styles step, then forcing deploy.",
        turnStatus: "done",
      }),
    ).toBe(true);
    expect(
      shouldCatchUpChatTurn({
        lastAssistantContent: "partial mid-flight",
        turnStatus: "done",
        storedCursorMatchesTurn: true,
      }),
    ).toBe(true);
  });
});
