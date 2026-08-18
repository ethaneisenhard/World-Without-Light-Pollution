import { describe, expect, it } from "vitest";
import {
  anthropicSseDataToTextDelta,
  buildAnthropicMessagesRequest,
  buildStudioStubReply,
  canSendChatTurn,
  chatSendBlockedReason,
  intersectStudioRootAllowTools,
  STUDIO_ROOT_CHAT_TOOLS_ALL,
  parseChatImageDataUrl,
  coerceChatImageDataUrl,
  parseSseBlocks,
  replaceChatImageByLocalId,
  resolveChatSendProjectId,
  splitChatMessagesForAnthropic,
  sseEventsToAssistantText,
  stripChatImagesForSend,
  STUDIO_ROOT_CHAT_TOOLS,
  toAnthropicMessageContent,
} from "./chat-pure.js";

describe("parseSseBlocks / sseEventsToAssistantText", () => {
  it("accumulates deltas then prefers final message", () => {
    const text = [
      `event: delta\ndata: {"text":"Hi "}\n`,
      `event: delta\ndata: {"text":"there"}\n`,
      `event: message\ndata: {"role":"assistant","content":"Hi there"}\n`,
    ].join("\n");
    const events = parseSseBlocks(text);
    expect(sseEventsToAssistantText(events)).toBe("Hi there");
  });
});

describe("splitChatMessagesForAnthropic", () => {
  it("lifts system messages", () => {
    const split = splitChatMessagesForAnthropic([
      { role: "system", content: "Be brief" },
      { role: "user", content: "Hi" },
      { role: "assistant", content: "Hello" },
    ]);
    expect(split.system).toBe("Be brief");
    expect(split.messages).toEqual([
      { role: "user", content: "Hi" },
      { role: "assistant", content: "Hello" },
    ]);
  });

  it("maps user images to Anthropic content blocks", () => {
    const split = splitChatMessagesForAnthropic([
      {
        role: "user",
        content: "what is this?",
        images: [
          {
            mediaType: "image/png",
            data: "abc",
            name: "shot.png",
          },
        ],
      },
    ]);
    expect(split.messages[0]).toEqual({
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/png",
            data: "abc",
          },
        },
        { type: "text", text: "what is this?" },
      ],
    });
  });
});

describe("toAnthropicMessageContent / parseChatImageDataUrl", () => {
  it("keeps plain string when no images", () => {
    expect(toAnthropicMessageContent("hi")).toBe("hi");
  });

  it("parses data URL and rejects bad mime", () => {
    const ok = parseChatImageDataUrl("data:image/png;base64,iVBORw0KGgo=");
    expect(ok).toEqual({
      ok: true,
      image: { mediaType: "image/png", data: "iVBORw0KGgo=" },
    });
    expect(parseChatImageDataUrl("data:text/plain;base64,YQ==")).toEqual({
      ok: false,
      error: "unsupported image type",
    });
  });

  it("coerceChatImageDataUrl rewrites empty / octet-stream MIME", () => {
    expect(
      coerceChatImageDataUrl("data:;base64,abc", "image/png"),
    ).toBe("data:image/png;base64,abc");
    expect(
      coerceChatImageDataUrl(
        "data:application/octet-stream;base64,abc",
        "image/jpeg",
      ),
    ).toBe("data:image/jpeg;base64,abc");
    expect(
      coerceChatImageDataUrl("data:image/png;base64,abc", "image/jpeg"),
    ).toBe("data:image/png;base64,abc");
  });
});

describe("stripChatImagesForSend / replaceChatImageByLocalId", () => {
  it("strips client-only fields and drops preparing rows", () => {
    expect(
      stripChatImagesForSend([
        {
          mediaType: "image/png",
          data: "abc",
          name: "a.png",
          status: "ready",
          localId: "1",
          previewUrl: "blob:x",
        },
        {
          mediaType: "image/jpeg",
          data: "",
          status: "preparing",
          localId: "2",
          previewUrl: "blob:y",
        },
      ]),
    ).toEqual([{ mediaType: "image/png", data: "abc", name: "a.png" }]);
  });

  it("replaces or removes by localId", () => {
    const start = [
      {
        mediaType: "image/png" as const,
        data: "",
        status: "preparing" as const,
        localId: "a",
      },
      {
        mediaType: "image/jpeg" as const,
        data: "x",
        status: "ready" as const,
        localId: "b",
      },
    ];
    expect(
      replaceChatImageByLocalId(start, "a", {
        mediaType: "image/png",
        data: "zz",
        status: "ready",
        localId: "a",
      }),
    ).toEqual([
      {
        mediaType: "image/png",
        data: "zz",
        status: "ready",
        localId: "a",
      },
      start[1],
    ]);
    expect(replaceChatImageByLocalId(start, "a", null)).toEqual([start[1]]);
  });
});

describe("canSendChatTurn", () => {
  it("allows image-only turns; blocks while preparing", () => {
    expect(canSendChatTurn("", [{ mediaType: "image/jpeg", data: "x" }])).toBe(
      true,
    );
    expect(canSendChatTurn("   ")).toBe(false);
    expect(canSendChatTurn("hi")).toBe(true);
    expect(
      canSendChatTurn("", [
        {
          mediaType: "image/png",
          data: "",
          status: "preparing",
          localId: "a",
          previewUrl: "blob:x",
        },
      ]),
    ).toBe(false);
    expect(
      canSendChatTurn("hi", [
        {
          mediaType: "image/png",
          data: "",
          status: "preparing",
          localId: "a",
        },
      ]),
    ).toBe(false);
  });
});

describe("resolveChatSendProjectId", () => {
  it("prefers bound over URL, then sole project, else studio root", () => {
    expect(
      resolveChatSendProjectId({
        urlProjectId: "a",
        boundProjectId: "b",
        projectIds: ["c"],
      }),
    ).toBe("b");
    expect(
      resolveChatSendProjectId({
        urlProjectId: "a",
        boundProjectId: "",
        projectIds: ["c"],
      }),
    ).toBe("a");
    expect(
      resolveChatSendProjectId({
        urlProjectId: "",
        boundProjectId: "b",
        projectIds: ["c"],
      }),
    ).toBe("b");
    expect(
      resolveChatSendProjectId({
        urlProjectId: "",
        boundProjectId: "",
        projectIds: ["solo"],
      }),
    ).toBe("solo");
    expect(
      resolveChatSendProjectId({
        urlProjectId: "",
        boundProjectId: "",
        projectIds: ["a", "b"],
      }),
    ).toBe("_studio");
  });

  it("explicit Global bound (_studio) beats URL workspace project", () => {
    expect(
      resolveChatSendProjectId({
        urlProjectId: "www-beehiiv",
        boundProjectId: "_studio",
        projectIds: ["www-beehiiv", "demo-blog"],
      }),
    ).toBe("_studio");
  });
});

describe("intersectStudioRootAllowTools", () => {
  it("default globalFileAccess includes files/git even when guarded", () => {
    expect(intersectStudioRootAllowTools(null)).toEqual([
      ...STUDIO_ROOT_CHAT_TOOLS_ALL,
    ]);
    expect(intersectStudioRootAllowTools(null, "guarded")).toEqual([
      ...STUDIO_ROOT_CHAT_TOOLS_ALL,
    ]);
    expect(
      intersectStudioRootAllowTools(["studio.theme.set", "files.write"]),
    ).toEqual(["studio.theme.set", "files.write"]);
  });

  it("strips files/git when globalFileAccess disables all disk roots", () => {
    const off = { studioMonorepo: false, workspaces: "none" as const };
    expect(intersectStudioRootAllowTools(null, "guarded", off)).toEqual([
      ...STUDIO_ROOT_CHAT_TOOLS,
    ]);
    expect(
      intersectStudioRootAllowTools(
        ["studio.theme.set", "files.write"],
        "guarded",
        off,
      ),
    ).toEqual(["studio.theme.set"]);
  });

  it("All-access expands Global root tools to include files/git and shell.run", () => {
    expect(intersectStudioRootAllowTools(null, "all")).toEqual([
      ...STUDIO_ROOT_CHAT_TOOLS_ALL,
    ]);
    expect(STUDIO_ROOT_CHAT_TOOLS).not.toContain("shell.run");
    expect(STUDIO_ROOT_CHAT_TOOLS_ALL).toContain("shell.run");
    expect(
      intersectStudioRootAllowTools(
        ["studio.theme.set", "files.write", "shell.run"],
        "all",
      ),
    ).toEqual(["studio.theme.set", "files.write", "shell.run"]);
  });

  it("Guarded with disk off never exposes shell.run", () => {
    const off = { studioMonorepo: false, workspaces: "none" as const };
    expect(intersectStudioRootAllowTools(null, "guarded", off)).not.toContain(
      "shell.run",
    );
  });
});

describe("chatSendBlockedReason", () => {
  it("allows studio root chat without a workspace", () => {
    expect(
      chatSendBlockedReason({
        content: "hello",
        projectId: "",
      }),
    ).toMatch(/project/i);
    expect(
      chatSendBlockedReason({
        content: "hello",
        projectId: "_studio",
      }),
    ).toBe("");
    expect(
      chatSendBlockedReason({
        content: "hi",
        projectId: "glassbox-studio-template",
      }),
    ).toBe("");
  });

  it("blocks while images are preparing", () => {
    expect(
      chatSendBlockedReason({
        content: "hi",
        projectId: "_studio",
        images: [
          {
            mediaType: "image/png",
            data: "",
            status: "preparing",
            localId: "x",
          },
        ],
      }),
    ).toMatch(/loading/i);
  });
});

describe("buildAnthropicMessagesRequest", () => {
  it("includes project system hint + stream flag", () => {
    const req = buildAnthropicMessagesRequest({
      messages: [{ role: "user", content: "ping" }],
      projectId: "demo-blog",
      model: "claude-haiku-4-5",
    });
    expect(req.stream).toBe(true);
    expect(req.model).toBe("claude-haiku-4-5");
    expect(req.max_tokens).toBeGreaterThanOrEqual(8192);
    expect(req.system).toContain("demo-blog");
    expect(req.messages[0]).toEqual({ role: "user", content: "ping" });
  });
});

describe("anthropicSseDataToTextDelta", () => {
  it("reads text_delta", () => {
    expect(
      anthropicSseDataToTextDelta(
        JSON.stringify({
          type: "content_block_delta",
          delta: { type: "text_delta", text: "Hello" },
        }),
      ),
    ).toBe("Hello");
  });

  it("ignores non-text events", () => {
    expect(
      anthropicSseDataToTextDelta(
        JSON.stringify({ type: "message_start", message: {} }),
      ),
    ).toBeNull();
  });
});

describe("buildStudioStubReply", () => {
  it("echoes truncated user text", () => {
    expect(buildStudioStubReply("demo", "hello")).toContain("hello");
    expect(buildStudioStubReply("demo", "hello")).toContain("demo");
  });
});
