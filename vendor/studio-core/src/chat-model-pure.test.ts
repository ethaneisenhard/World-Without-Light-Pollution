import { describe, expect, it } from "vitest";
import {
  applyKodyModelPickerChoice,
  chatModelFaceLabel,
  chatModelPickerShows,
  defaultChatModelForHarness,
  DEFAULT_CURSOR_CHAT_MODEL,
  KODY_CHAT_MODELS,
  parseCursorModelsList,
  resolveChatModel,
  studioChatModelIds,
} from "./chat-model-pure.js";
import { DEFAULT_CHAT_MODEL } from "./chat-pure.js";

describe("defaultChatModelForHarness", () => {
  it("returns cursor default for cursor (Grok 4.5 Fast)", () => {
    expect(defaultChatModelForHarness("cursor")).toBe(
      "cursor-grok-4.5-high-fast",
    );
    expect(DEFAULT_CURSOR_CHAT_MODEL).toBe("cursor-grok-4.5-high-fast");
  });

  it("returns hermes default for hermes", () => {
    expect(defaultChatModelForHarness("hermes")).toBe("claude-haiku-4-5");
  });

  it("returns kody default for kody", () => {
    expect(defaultChatModelForHarness("kody")).toBe("claude-haiku-4-5");
  });

  it("returns grok default for grok", () => {
    expect(defaultChatModelForHarness("grok")).toBe("grok-4.5");
  });

  it("returns studio default for studio", () => {
    expect(defaultChatModelForHarness("studio")).toBe(DEFAULT_CHAT_MODEL);
  });

  it("returns deepseek-v4-flash for deepseek", () => {
    expect(defaultChatModelForHarness("deepseek")).toBe("deepseek-v4-flash");
  });

  it("returns claude-sonnet for litellm seed", () => {
    expect(defaultChatModelForHarness("litellm")).toBe("claude-sonnet");
  });
});

describe("chatModelPickerShows", () => {
  it("shows for studio, cursor, hermes, kody, grok, deepseek, and litellm", () => {
    expect(chatModelPickerShows("studio")).toBe(true);
    expect(chatModelPickerShows("cursor")).toBe(true);
    expect(chatModelPickerShows("hermes")).toBe(true);
    expect(chatModelPickerShows("kody")).toBe(true);
    expect(chatModelPickerShows("grok")).toBe(true);
    expect(chatModelPickerShows("deepseek")).toBe(true);
    expect(chatModelPickerShows("litellm")).toBe(true);
  });
});

describe("applyKodyModelPickerChoice", () => {
  it("keeps Claude picks on kody", () => {
    expect(applyKodyModelPickerChoice("claude-sonnet-4-5")).toEqual({
      harness: "kody",
      model: "claude-sonnet-4-5",
    });
  });

  it("bridges cursor:: rows to harness cursor", () => {
    expect(applyKodyModelPickerChoice("cursor::composer-2.5")).toEqual({
      harness: "cursor",
      model: "composer-2.5",
    });
    expect(
      applyKodyModelPickerChoice("cursor::cursor-grok-4.5-high-fast"),
    ).toEqual({
      harness: "cursor",
      model: "cursor-grok-4.5-high-fast",
    });
  });

  it("lists Cursor bridge options in KODY_CHAT_MODELS", () => {
    const ids = KODY_CHAT_MODELS.map((m) => m.id);
    expect(ids).toContain("cursor::composer-2.5");
    expect(ids).toContain("cursor::cursor-grok-4.5-high-fast");
    expect(ids).not.toContain("gpt-4.1");
    expect(ids).not.toContain("composer-2.5");
  });
});

describe("parseCursorModelsList", () => {
  it("parses agent models stdout", () => {
    const raw = [
      "Available models",
      "",
      "auto - Auto (default)",
      "cursor-grok-4.5-high-fast - Cursor Grok 4.5 Fast",
      "composer-2.5 - Composer 2.5 (current)",
    ].join("\n");
    expect(parseCursorModelsList(raw)).toEqual([
      { id: "auto", label: "Auto (default)" },
      { id: "cursor-grok-4.5-high-fast", label: "Cursor Grok 4.5 Fast" },
      { id: "composer-2.5", label: "Composer 2.5 (current)" },
    ]);
  });
});

describe("resolveChatModel", () => {
  it("falls back when requested not in available", () => {
    expect(
      resolveChatModel({
        harness: "studio",
        requested: "nope",
        available: studioChatModelIds(),
      }),
    ).toBe(DEFAULT_CHAT_MODEL);
  });

  it("keeps requested when in available", () => {
    expect(
      resolveChatModel({
        harness: "studio",
        requested: "claude-sonnet-4-5",
        available: studioChatModelIds(),
      }),
    ).toBe("claude-sonnet-4-5");
  });

  it("keeps requested when available empty (loading)", () => {
    expect(
      resolveChatModel({
        harness: "cursor",
        requested: "cursor-grok-4.5-high-fast",
        available: [],
      }),
    ).toBe("cursor-grok-4.5-high-fast");
  });
});

describe("chatModelFaceLabel", () => {
  it("maps known ids to short faces", () => {
    expect(chatModelFaceLabel("claude-haiku-4-5")).toBe("Haiku 4.5");
    expect(chatModelFaceLabel("cursor-grok-4.5-high-fast")).toBe("Grok 4.5 Fast");
    expect(chatModelFaceLabel("composer-2.5")).toBe("Composer 2.5");
    expect(chatModelFaceLabel("composer-2.5-fast")).toBe("Composer 2.5 Fast");
  });
});
