import { describe, expect, it } from "vitest";
import {
  foldWorkspaceAttachmentsIntoMessages,
  stripChatMessageImages,
  unsupportedVisionError,
  visionModeForHarness,
  visionModeOffersMcpDescribe,
  visionModeUsesWorkspaceFiles,
} from "./harness-vision-pure.js";

describe("visionModeForHarness", () => {
  it("maps registered harnesses to connectors", () => {
    expect(visionModeForHarness("studio")).toBe("native");
    expect(visionModeForHarness("anthropic")).toBe("native");
    expect(visionModeForHarness("deepseek")).toBe("mcp-vision");
    expect(visionModeForHarness("litellm")).toBe("mcp-vision");
    expect(visionModeForHarness("cursor")).toBe("mcp-vision");
    expect(visionModeForHarness("hermes")).toBe("mcp-vision");
    expect(visionModeForHarness("kody")).toBe("unsupported");
    expect(visionModeForHarness("grok")).toBe("mcp-vision");
    expect(visionModeForHarness("agent-room")).toBe("unsupported");
  });

  it("defaults unknown harness to unsupported", () => {
    expect(visionModeForHarness("openclaw")).toBe("unsupported");
  });
});

describe("visionModeUsesWorkspaceFiles / mcp", () => {
  it("files and mcp-vision materialize paths", () => {
    expect(visionModeUsesWorkspaceFiles("files")).toBe(true);
    expect(visionModeUsesWorkspaceFiles("mcp-vision")).toBe(true);
    expect(visionModeUsesWorkspaceFiles("native")).toBe(false);
    expect(visionModeUsesWorkspaceFiles("unsupported")).toBe(false);
  });

  it("only mcp-vision offers describe tool", () => {
    expect(visionModeOffersMcpDescribe("mcp-vision")).toBe(true);
    expect(visionModeOffersMcpDescribe("files")).toBe(false);
  });
});

describe("unsupportedVisionError", () => {
  it("names the harness and points at vision peers", () => {
    const msg = unsupportedVisionError("kody");
    expect(msg).toMatch(/kody/);
    expect(msg).toMatch(/studio\.vision\.describe/);
  });
});

describe("stripChatMessageImages", () => {
  it("removes image fields and counts them", () => {
    const { messages, strippedCount } = stripChatMessageImages([
      {
        role: "user",
        content: "hi",
        images: [{ mediaType: "image/png", data: "a" }],
      },
      { role: "assistant", content: "ok" },
    ]);
    expect(strippedCount).toBe(1);
    expect(messages[0]).toEqual({ role: "user", content: "hi" });
  });
});

describe("foldWorkspaceAttachmentsIntoMessages", () => {
  it("folds paths into last user text and clears images", () => {
    const next = foldWorkspaceAttachmentsIntoMessages(
      [
        {
          role: "user",
          content: "see this",
          images: [{ mediaType: "image/png", data: "a", name: "x.png" }],
        },
      ],
      [".scratch/chat-attachments/t1/x.png"],
    );
    expect(next).toHaveLength(1);
    expect(next[0]?.images).toBeUndefined();
    expect(next[0]?.content).toMatch(/\.scratch\/chat-attachments\/t1\/x\.png/);
    expect(next[0]?.content).toMatch(/see this/);
  });
});
