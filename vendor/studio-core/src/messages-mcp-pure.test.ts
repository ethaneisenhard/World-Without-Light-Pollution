import { describe, expect, it } from "vitest";
import {
  formatMessageChatHandoff,
  parseMessagesListInput,
  parseMessagesPatchInput,
  parseMessagesSendInput,
} from "./messages-mcp-pure.js";

describe("messages-mcp-pure", () => {
  it("parses list filters", () => {
    const r = parseMessagesListInput({
      status: "unread",
      channel: "email",
      limit: 10,
      untagged: true,
    });
    expect(r).toEqual({
      ok: true,
      value: {
        status: "unread",
        channel: "email",
        limit: 10,
        projectId: null,
      },
    });
  });

  it("parses list cursor + folder + q", () => {
    const r = parseMessagesListInput({
      cursor: "100:email%3Athread%3Ax",
      folder: "starred",
      q: "invoice",
      limit: 50,
    });
    expect(r).toEqual({
      ok: true,
      value: {
        cursor: "100:email%3Athread%3Ax",
        folder: "starred",
        q: "invoice",
        limit: 50,
      },
    });
  });

  it("rejects bad patch status", () => {
    expect(parseMessagesPatchInput({ messageId: "m1", status: "nope" })).toEqual(
      { ok: false, error: "status must be unread|read|starred|archived" },
    );
  });

  it("parses send body.text", () => {
    const r = parseMessagesSendInput({
      conversationId: "c1",
      channel: "slack",
      body: { text: "hello" },
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.bodyText).toBe("hello");
  });

  it("formats chat handoff", () => {
    const h = formatMessageChatHandoff({
      id: "msg_1",
      conversationId: "c1",
      channel: "email",
      direction: "in",
      from: { name: "Ada", address: "a@x.com" },
      body: { text: "Need a reply on the invoice" },
      createdAt: 1,
      status: "unread",
      meta: { subject: "Invoice" },
    });
    expect(h.composerDraft).toContain("Ada");
    expect(h.contextBlock).toContain("msg_1");
    expect(h.contextBlock).toContain("Invoice");
    expect(h.preview).toContain("invoice");
  });
});
