import { describe, expect, it } from "vitest";
import {
  classifyChatFocusUtterance,
  matchChatFocusSession,
  parseChatFocusInput,
  type ChatFocusSessionRow,
} from "./chat-focus-pure.js";

const rows: ChatFocusSessionRow[] = [
  {
    id: "tesla",
    title: "Tesla robots",
    updatedAt: 30,
    tabOpen: true,
    projectId: "glassbox-studio",
  },
  {
    id: "boston",
    title: "Boston sports",
    updatedAt: 20,
    tabOpen: true,
  },
  {
    id: "closed",
    title: "Old robots notes",
    updatedAt: 90,
    tabOpen: false,
  },
];

describe("parseChatFocusInput", () => {
  it("accepts chatId, query alias, projectId", () => {
    const r = parseChatFocusInput({
      sessionId: " tesla ",
      q: " robots ",
      projectId: "glassbox-studio",
    });
    expect(r).toEqual({
      ok: true,
      target: {
        chatId: "tesla",
        query: "robots",
        projectId: "glassbox-studio",
      },
    });
  });

  it("allows empty target (other-tab)", () => {
    const r = parseChatFocusInput({});
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.target).toEqual({
      chatId: null,
      query: null,
      projectId: null,
    });
  });
});

describe("matchChatFocusSession", () => {
  it("matches id, then open-tab query, then other tab", () => {
    expect(
      matchChatFocusSession(rows, { chatId: "boston", query: null, projectId: null }, "tesla")
        ?.id,
    ).toBe("boston");

    const q = matchChatFocusSession(
      rows,
      { chatId: null, query: "robots", projectId: null },
      "boston",
    );
    expect(q?.id).toBe("tesla");
    expect(q?.reason).toBe("query");

    const other = matchChatFocusSession(
      rows,
      { chatId: null, query: null, projectId: null },
      "tesla",
    );
    expect(other?.id).toBe("boston");
    expect(other?.reason).toBe("other");
  });

  it("falls back to closed history when no open tab matches", () => {
    const onlyClosed: ChatFocusSessionRow[] = [
      { id: "live", title: "Boston sports", updatedAt: 1, tabOpen: true },
      { id: "closed", title: "Old robots notes", updatedAt: 9, tabOpen: false },
    ];
    expect(
      matchChatFocusSession(
        onlyClosed,
        { chatId: null, query: "robots", projectId: null },
        "live",
      )?.id,
    ).toBe("closed");
  });
});

describe("classifyChatFocusUtterance", () => {
  it("focuses named / about / that-tab", () => {
    expect(classifyChatFocusUtterance("bring that chat up")).toEqual({
      query: "",
    });
    expect(
      classifyChatFocusUtterance("I need that tab open about the robots"),
    ).toEqual({ query: "robots" });
    expect(classifyChatFocusUtterance("open the tesla robots chat")).toEqual({
      query: "tesla robots",
    });
    expect(classifyChatFocusUtterance("switch to the Boston chat")).toEqual({
      query: "Boston",
    });
    expect(classifyChatFocusUtterance("show the robots tab")).toEqual({
      query: "robots",
    });
  });

  it("leaves bare open-chat and jobs alone", () => {
    expect(classifyChatFocusUtterance("open chat")).toBeNull();
    expect(classifyChatFocusUtterance("show me chat")).toBeNull();
    expect(classifyChatFocusUtterance("focus the chat")).toBeNull();
    expect(classifyChatFocusUtterance("open chat and clone beehiiv")).toBeNull();
    expect(classifyChatFocusUtterance("clone this github repo")).toBeNull();
    expect(classifyChatFocusUtterance("focus the blocker")).toBeNull();
  });
});
