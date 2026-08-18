import { describe, expect, it } from "vitest";
import {
  CONTEXT_USAGE_RING_CIRCUMFERENCE,
  applyProviderPromptTokens,
  contextUsageRingDash,
  estimateChatContextUsage,
  estimateChatContextUsageFromPrepare,
  estimateTokensFromText,
  estimateToolsCatalogText,
  formatContextTokenCount,
  formatContextUsagePct,
  formatContextUsageSummary,
  isSummarizedContextMessage,
  mergeContextUsageWithDraft,
  parseContextUsageSseData,
  resolveContextWindowTokens,
  resolveProviderPromptTokens,
} from "./chat-context-usage-pure.js";

describe("estimateTokensFromText", () => {
  it("returns 0 for empty", () => {
    expect(estimateTokensFromText("")).toBe(0);
  });

  it("uses chars/4 ceil for ASCII", () => {
    expect(estimateTokensFromText("abcd")).toBe(1);
    expect(estimateTokensFromText("abcde")).toBe(2);
  });

  it("counts CJK denser than English chars/4", () => {
    // 4 Han chars → 4 tokens (not 1)
    expect(estimateTokensFromText("汉字测试")).toBe(4);
  });
});

describe("resolveContextWindowTokens", () => {
  it("maps studio Claude models to 200K", () => {
    expect(resolveContextWindowTokens("claude-sonnet-4-5")).toBe(200_000);
  });

  it("maps cursor grok to 256K", () => {
    expect(resolveContextWindowTokens("cursor-grok-4.5-high-fast")).toBe(
      256_000,
    );
  });
});

describe("estimateChatContextUsage", () => {
  it("sums categories and computes pct", () => {
    const usage = estimateChatContextUsage({
      modelId: "cursor-grok-4.5-high-fast",
      messages: [{ content: "a".repeat(4000) }], // 1000 tokens
      toolsText: "b".repeat(4000), // 1000
      draft: "c".repeat(4000), // +1000 conversation
      imageCount: 1, // 1500
      windowTokens: 10_000,
    });
    expect(usage.estimated).toBe(true);
    expect(usage.windowTokens).toBe(10_000);
    // conversation joins message+draft with `\n` → +1 char → +1 token
    expect(usage.usedTokens).toBe(4501);
    expect(usage.pct).toBe(45);
    expect(usage.categories.map((c) => c.id)).toEqual([
      "tools",
      "conversation",
      "images",
    ]);
  });

  it("omits empty categories", () => {
    const usage = estimateChatContextUsage({
      modelId: "claude-haiku-4-5",
      messages: [],
      draft: "",
    });
    expect(usage.usedTokens).toBe(0);
    expect(usage.pct).toBe(0);
    expect(usage.categories).toEqual([]);
  });
});

describe("format helpers", () => {
  it("formats pct and token counts", () => {
    expect(formatContextUsagePct(25)).toBe("25%");
    expect(formatContextUsagePct(0.4)).toBe("<1%");
    expect(formatContextTokenCount(474)).toBe("474");
    expect(formatContextTokenCount(9100)).toBe("9.1K");
    expect(formatContextTokenCount(256_000)).toBe("256K");
    expect(
      formatContextUsageSummary({
        usedTokens: 64_400,
        windowTokens: 256_000,
        estimated: true,
      }),
    ).toBe("~64.4K / 256K Tokens");
    expect(
      formatContextUsageSummary({
        usedTokens: 64_400,
        windowTokens: 256_000,
        estimated: false,
      }),
    ).toBe("64.4K / 256K Tokens");
  });

  it("builds tools catalog text", () => {
    expect(
      estimateToolsCatalogText([
        { id: "files.read", description: "Read a file" },
      ]),
    ).toBe("files.read: Read a file");
  });
});

describe("estimateChatContextUsageFromPrepare", () => {
  it("attributes real prepare slices and omits empty rows", () => {
    const usage = estimateChatContextUsageFromPrepare({
      modelId: "cursor-grok-4.5-high-fast",
      messages: [
        { content: "hello world" },
        {
          content:
            "## Compressed prior context (p)\n<summary>\nold work\n</summary>",
        },
      ],
      rulesText: "rule ".repeat(100),
      skillsText: "skill ".repeat(50),
      systemText: "system frame",
      studioContextText: "file: src/a.ts",
      mcpText: "Studio MCP connected\nfiles.read: Read",
      subagentsText: "sibling agent live",
      toolsText: "",
      windowTokens: 256_000,
      level: "ok",
    });
    const ids = usage.categories.map((c) => c.id);
    expect(ids).toContain("rules");
    expect(ids).toContain("skills");
    expect(ids).toContain("system");
    expect(ids).toContain("studioContext");
    expect(ids).toContain("mcp");
    expect(ids).toContain("subagents");
    expect(ids).toContain("summarized");
    expect(ids).toContain("conversation");
    expect(ids).not.toContain("tools");
    expect(usage.level).toBe("ok");
  });

  it("detects summarized markers", () => {
    expect(isSummarizedContextMessage("<summary>x</summary>")).toBe(true);
    expect(isSummarizedContextMessage("plain user text")).toBe(false);
  });

  it("parses SSE and merges draft", () => {
    const parsed = parseContextUsageSseData({
      modelId: "claude-sonnet-4-5",
      windowTokens: 200_000,
      usedTokens: 1000,
      pct: 0.5,
      level: "ok",
      estimated: false,
      categories: [
        { id: "conversation", label: "Conversation", tokens: 1000 },
      ],
    });
    expect(parsed?.estimated).toBe(false);
    expect(parsed?.categories[0]?.id).toBe("conversation");
    const merged = mergeContextUsageWithDraft(parsed!, "draft text here");
    expect(merged.usedTokens).toBeGreaterThan(parsed!.usedTokens);
    expect(merged.estimated).toBe(true);
  });
});

describe("applyProviderPromptTokens", () => {
  it("marks estimated false and scales categories", () => {
    const base = estimateChatContextUsage({
      modelId: "claude-sonnet-4-5",
      messages: [{ content: "a".repeat(4000) }],
      toolsText: "b".repeat(4000),
      windowTokens: 10_000,
    });
    expect(base.usedTokens).toBe(2000);
    const applied = applyProviderPromptTokens(base, 5000);
    expect(applied.estimated).toBe(false);
    expect(applied.usedTokens).toBe(5000);
    expect(applied.pct).toBe(50);
    expect(applied.categories.reduce((s, c) => s + c.tokens, 0)).toBe(5000);
  });

  it("resolves prompt tokens from status / usage shapes", () => {
    expect(resolveProviderPromptTokens({ inputTotal: 12_345 })).toBe(12_345);
    expect(resolveProviderPromptTokens({ input_tokens: 99 })).toBe(99);
    expect(resolveProviderPromptTokens({ total_tokens: 99 })).toBeNull();
    expect(resolveProviderPromptTokens({})).toBeNull();
  });
});

describe("contextUsageRingDash", () => {
  it("fills clockwise from empty to full", () => {
    expect(contextUsageRingDash(0).dasharray).toBe(
      `0 ${CONTEXT_USAGE_RING_CIRCUMFERENCE}`,
    );
    const half = contextUsageRingDash(50);
    expect(half.pctClamped).toBe(50);
    expect(half.dasharray.startsWith(`${CONTEXT_USAGE_RING_CIRCUMFERENCE / 2}`)).toBe(
      true,
    );
    expect(contextUsageRingDash(100).dasharray).toBe(
      `${CONTEXT_USAGE_RING_CIRCUMFERENCE} ${CONTEXT_USAGE_RING_CIRCUMFERENCE}`,
    );
  });
});
