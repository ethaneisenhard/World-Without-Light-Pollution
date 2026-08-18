import { describe, expect, it } from "vitest";
import {
  chatCompletionsUrlFromBase,
  getChatCompletionsProvider,
  resolveChatCompletionsModel,
  resolveChatCompletionsUrl,
} from "./chat-completions-provider-pure.js";

describe("chat-completions-provider-pure", () => {
  it("registers deepseek + litellm", () => {
    expect(getChatCompletionsProvider("deepseek")?.apiKeyEnv).toBe(
      "DEEPSEEK_API_KEY",
    );
    expect(getChatCompletionsProvider("litellm")?.baseUrlEnv).toBe(
      "LITELLM_BASE_URL",
    );
    expect(getChatCompletionsProvider("cursor")).toBeNull();
  });

  it("builds chat completions URL from OpenAI base", () => {
    expect(chatCompletionsUrlFromBase("http://127.0.0.1:4000/v1")).toBe(
      "http://127.0.0.1:4000/v1/chat/completions",
    );
    expect(
      chatCompletionsUrlFromBase(
        "http://127.0.0.1:4000/v1/chat/completions",
      ),
    ).toBe("http://127.0.0.1:4000/v1/chat/completions");
  });

  it("resolves litellm URL from base override; deepseek ignores base", () => {
    expect(
      resolveChatCompletionsUrl({
        harnessId: "litellm",
        baseUrl: "http://gateway:4000/v1",
      }),
    ).toBe("http://gateway:4000/v1/chat/completions");
    expect(
      resolveChatCompletionsUrl({
        harnessId: "deepseek",
        baseUrl: "http://gateway:4000/v1",
      }),
    ).toBe("https://api.deepseek.com/chat/completions");
  });

  it("resolves models from static allowlist; litellm keeps unknown requested", () => {
    expect(
      resolveChatCompletionsModel({
        harnessId: "litellm",
        requested: "claude-sonnet",
      }),
    ).toBe("claude-sonnet");
    expect(
      resolveChatCompletionsModel({
        harnessId: "litellm",
        requested: "my-custom-alias",
      }),
    ).toBe("my-custom-alias");
    expect(
      resolveChatCompletionsModel({
        harnessId: "deepseek",
        requested: "nope",
      }),
    ).toBe("deepseek-v4-flash");
  });
});
