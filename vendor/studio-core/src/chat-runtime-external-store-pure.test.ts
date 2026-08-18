import { describe, expect, it } from "vitest";
import { projectChatRuntimeExternalStore } from "./chat-runtime-external-store-pure.js";

describe("projectChatRuntimeExternalStore", () => {
  it("projects runtime fields for UI without Host details", () => {
    const snap = projectChatRuntimeExternalStore({
      sessionId: " s1 ",
      chatLog: [
        { role: "user", content: "hi" },
        { role: "assistant", content: "yo" },
        { role: "system", content: "drop" },
        null,
      ],
      streaming: true,
      streamStatus: " thinking ",
      composerInput: "draft",
      queuedMessages: [{}, {}],
    });
    expect(snap).toEqual({
      sessionId: "s1",
      messages: [
        { role: "user", content: "hi" },
        { role: "assistant", content: "yo" },
      ],
      streaming: true,
      streamStatus: "thinking",
      composerInput: "draft",
      queuedCount: 2,
    });
  });
});
