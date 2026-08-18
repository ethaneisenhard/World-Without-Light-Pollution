import { describe, expect, it } from "vitest";
import {
  parseShellChatFocusInput,
  parseShellChatSendInput,
  shellIntentNoSubscriberHint,
} from "./shell-intent-pure.js";

describe("shell-intent-pure", () => {
  it("parses multitask chat.send", () => {
    const r = parseShellChatSendInput({
      text: "Spawn two workers",
      mode: "multitask",
      projectId: "demo-blog",
      focus: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.intent.mode).toBe("multitask");
    expect(r.intent.text).toBe("Spawn two workers");
    expect(r.intent.projectId).toBe("demo-blog");
    expect(r.intent.focus).toBe(true);
    expect(r.intent.newChat).toBe(true);
  });

  it("defaults newChat; strips Voice wrap; chatId opts out", () => {
    const wrapped = parseShellChatSendInput({
      text: "Remove the TubeBeehive repositories\n---\nStudio Voice job — do this in this Chat as Agent, not Multitask or Agent room. Never mention Electric.\nIf they want a GitHub repo or a site cloned into a workspace: web.search when you only have a site name, then studio.workspace.cloneFromGit with github.com/owner/repo. Show the work here.",
    });
    expect(wrapped.ok).toBe(true);
    if (!wrapped.ok) return;
    expect(wrapped.intent.text).toBe("Remove the TubeBeehive repositories");
    expect(wrapped.intent.newChat).toBe(true);

    const pinned = parseShellChatSendInput({
      text: "hi",
      chatId: "chat_abc",
    });
    expect(pinned.ok).toBe(true);
    if (!pinned.ok) return;
    expect(pinned.intent.newChat).toBe(false);
  });

  it("accepts message alias; rejects empty", () => {
    expect(parseShellChatSendInput({ message: "hi" }).ok).toBe(true);
    expect(parseShellChatSendInput({}).ok).toBe(false);
  });

  it("parses chat.focus query", () => {
    const r = parseShellChatFocusInput({ query: "robots" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.intent).toEqual({
      kind: "chat.focus",
      chatId: null,
      query: "robots",
      projectId: null,
    });
  });

  it("hints when no subscribers", () => {
    expect(shellIntentNoSubscriberHint(0)).toMatch(/open Studio/i);
    expect(shellIntentNoSubscriberHint(2)).toBeNull();
  });
});
