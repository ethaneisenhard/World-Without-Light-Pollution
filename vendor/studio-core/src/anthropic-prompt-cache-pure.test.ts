import { describe, expect, it } from "vitest";
import {
  ANTHROPIC_MAX_CACHE_BREAKPOINTS,
  ANTHROPIC_PROMPT_CACHE_BETA,
  applyAnthropicCacheMarker,
  applyRollingAnthropicCacheBreakpoints,
  anthropicMessageCacheBudget,
  buildAnthropicCachedSystem,
  countAnthropicCacheBreakpoints,
  markLastAnthropicToolCache,
  stripAnthropicCacheMarkers,
} from "./anthropic-prompt-cache-pure.js";

describe("anthropic-prompt-cache-pure", () => {
  it("exports beta header with prompt-caching + extended-cache-ttl", () => {
    expect(ANTHROPIC_PROMPT_CACHE_BETA).toContain("prompt-caching-2024-07-31");
    expect(ANTHROPIC_PROMPT_CACHE_BETA).toContain(
      "extended-cache-ttl-2025-04-11",
    );
  });

  it("strip clears message-level and block-level markers", () => {
    const msgs = stripAnthropicCacheMarkers([
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "hi",
            cache_control: { type: "ephemeral", ttl: "1h" },
          },
        ],
      },
      {
        role: "assistant",
        content: "ok",
        cache_control: { type: "ephemeral", ttl: "1h" },
      },
    ]);
    expect(msgs[0]!.cache_control).toBeUndefined();
    expect(
      (msgs[0]!.content as { cache_control?: unknown }[])[0]!.cache_control,
    ).toBeUndefined();
    expect(msgs[1]!.cache_control).toBeUndefined();
  });

  it("apply marker converts string content to text block with 1h", () => {
    const marked = applyAnthropicCacheMarker({
      role: "user",
      content: "hello",
    });
    expect(marked.content).toEqual([
      {
        type: "text",
        text: "hello",
        cache_control: { type: "ephemeral", ttl: "1h" },
      },
    ]);
  });

  it("apply marker skips empty content", () => {
    const marked = applyAnthropicCacheMarker({ role: "user", content: "" });
    expect(marked.content).toBe("");
    expect(marked.cache_control).toBeUndefined();
  });

  it("rolling marks at most penultimate + last (≤2 message markers)", () => {
    const msgs = applyRollingAnthropicCacheBreakpoints(
      [
        { role: "user", content: "a" },
        { role: "assistant", content: "b" },
        { role: "user", content: "c" },
      ],
      2,
    );
    const n = countAnthropicCacheBreakpoints({ messages: msgs });
    expect(n).toBe(2);
    const blocks = (m: (typeof msgs)[0]) =>
      Array.isArray(m.content) ? m.content : [];
    expect(blocks(msgs[0]!)[0]?.cache_control).toBeUndefined();
    expect(blocks(msgs[1]!)[0]?.cache_control?.ttl).toBe("1h");
    expect(blocks(msgs[2]!)[0]?.cache_control?.ttl).toBe("1h");
  });

  it("rolling with budget 1 marks only latest", () => {
    const msgs = applyRollingAnthropicCacheBreakpoints(
      [
        { role: "user", content: "a" },
        { role: "user", content: "b" },
      ],
      1,
    );
    expect(countAnthropicCacheBreakpoints({ messages: msgs })).toBe(1);
  });

  it("markLastAnthropicToolCache marks only final tool", () => {
    const tools = markLastAnthropicToolCache([
      { name: "tools_search", input_schema: {} },
      { name: "tools_call", input_schema: {} },
    ]);
    expect(tools[0]!.cache_control).toBeUndefined();
    expect(tools[1]!.cache_control).toEqual({
      type: "ephemeral",
      ttl: "1h",
    });
  });

  it("buildAnthropicCachedSystem skips empty; marks non-empty", () => {
    expect(buildAnthropicCachedSystem("")).toBeUndefined();
    expect(buildAnthropicCachedSystem("   ")).toBeUndefined();
    const sys = buildAnthropicCachedSystem("You are Studio.");
    expect(sys).toHaveLength(1);
    expect(sys![0]!.cache_control?.ttl).toBe("1h");
  });

  it("message budget leaves room under max 4", () => {
    expect(
      anthropicMessageCacheBudget({ systemUsed: true, toolsUsed: true }),
    ).toBe(2);
    expect(
      anthropicMessageCacheBudget({ systemUsed: true, toolsUsed: false }),
    ).toBe(3);
    const full = {
      system: buildAnthropicCachedSystem("sys")!,
      tools: markLastAnthropicToolCache([{ name: "t", input_schema: {} }]),
      messages: applyRollingAnthropicCacheBreakpoints(
        [
          { role: "user", content: "a" },
          { role: "assistant", content: "b" },
        ],
        2,
      ),
    };
    expect(countAnthropicCacheBreakpoints(full)).toBeLessThanOrEqual(
      ANTHROPIC_MAX_CACHE_BREAKPOINTS,
    );
    expect(countAnthropicCacheBreakpoints(full)).toBe(4);
  });
});
