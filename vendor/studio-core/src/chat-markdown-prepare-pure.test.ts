import { describe, expect, it } from "vitest";
import {
  chatMarkdownSourceIsStructured,
  demoteLayoutPipeBlocks,
  healBrokenInlineMarkers,
  healChatMarkdownTables,
  healChatFileMarkdownLinks,
  healMissingSpaceAfterPunctuation,
  healSoftWrappedPathBreaks,
  healSoftWrappedLines,
  prepareChatMarkdownSource,
  sealUnclosedMarkdownFences,
  wrapBareFilePathsAsCodespans,
} from "./chat-markdown-prepare-pure.js";
import { chatMarkdownToHtml } from "./chat-markdown-pure.js";

describe("prepareChatMarkdownSource", () => {
  it("soft-breaks flat run-on status narration", () => {
    const flat =
      "Moving 'Preview as product' from Backlog -> Ready. Hmm, cards are in separate files. Let me check the roadmap directory structure: The cards directory wasn't created. Let me check what's actually in the roadmap system: Let me check if there's a cards subdirectory.";
    const prepared = prepareChatMarkdownSource(flat);
    expect(prepared).toContain("Ready.\n\nHmm,");
    expect(prepared).toContain("files.\n\nLet me check the roadmap");
    expect(prepared).toContain("created.\n\nLet me check what's");
    expect(prepared).toContain("system:\n\nLet me check if");
  });

  it("no-ops discourse soft-break when blank lines already present", () => {
    const src = "First thought.\n\nLet me check next.";
    expect(prepareChatMarkdownSource(src)).toBe(src);
    expect(chatMarkdownSourceIsStructured(src)).toBe(true);
  });

  it("still heals wraps inside structured markdown", () => {
    const list = "- tools: reply drafts, calendar\n, file/ops, recurring.";
    expect(prepareChatMarkdownSource(list)).toContain(
      "calendar, file/ops, recurring.",
    );
  });
});

describe("healBrokenInlineMarkers", () => {
  it("joins bold split across a newline", () => {
    expect(healBrokenInlineMarkers("3. **\nReachable everywhere** — desk.")).toBe(
      "3. **Reachable everywhere** — desk.",
    );
  });

  it("LAW: joins smashed Handoff labels across blank lines", () => {
    expect(healBrokenInlineMarkers("**You\n\n:**")).toBe("**You:**");
    expect(healBrokenInlineMarkers("**Done\n:**")).toBe("**Done:**");
    expect(
      healBrokenInlineMarkers("**I'll do next (no ask)\n\n:** nothing"),
    ).toBe("**I'll do next (no ask):** nothing");
  });
});

describe("prepareChatMarkdownSource handoff / wrap LAWs", () => {
  it("LAW: joins comma continuation across blank line", () => {
    const prepared = prepareChatMarkdownSource(
      "You're in Global scope\n\n, Home focused.",
    );
    expect(prepared).toContain("You're in Global scope, Home focused.");
    expect(prepared).not.toMatch(/scope\n\n,/);
  });

  it("LAW: bare Handoff + Done becomes canonical markers", () => {
    const prepared = prepareChatMarkdownSource(
      "One clean reply.\n\nHandoff\nDone: Confirmed single-shot.\nYou: You're good.",
    );
    expect(prepared).toContain("## Handoff");
    expect(prepared).toContain("**Done:**");
    expect(prepared).toContain("**You:**");
  });

  it("LAW (AGNT): missing space after punctuation", () => {
    expect(healMissingSpaceAfterPunctuation("Checking once.Then reply.")).toBe(
      "Checking once. Then reply.",
    );
    expect(
      healMissingSpaceAfterPunctuation("scope:Home focused."),
    ).toBe("scope: Home focused.");
    // Fenced code untouched
    expect(
      healMissingSpaceAfterPunctuation("Prose.\n```\nfoo.Bar\n```\nEnd."),
    ).toBe("Prose.\n```\nfoo.Bar\n```\nEnd.");
  });

  it("LAW (AGNT): seal unclosed fences before GFM", () => {
    const sealed = sealUnclosedMarkdownFences("Intro\n\n```ts\nconst x = 1;");
    expect(sealed.endsWith("\n```")).toBe(true);
    expect(sealUnclosedMarkdownFences("```js\nok\n```")).toBe("```js\nok\n```");
  });

  it("prepare applies AGNT punct + fence seals", () => {
    const prepared = prepareChatMarkdownSource(
      "Done.Next steps:\n\n```ts\nconst x = 1",
    );
    expect(prepared).toContain("Done. Next steps:");
    expect(prepared.trimEnd().endsWith("```")).toBe(true);
  });

  it("LAW: soft-wrapped path mid-hyphen joins (agent- / studio)", () => {
    expect(
      healSoftWrappedPathBreaks(
        "[`projects/agent-\n\nstudio-template/client/design/components/button.tsx`](projects/glassbox-studio-template/client/design/components/button.tsx)",
      ),
    ).toContain(
      "[`projects/glassbox-studio-template/client/design/components/button.tsx`]",
    );
  });

  it("LAW: smashed file markdown link becomes clean codespan link", () => {
    const smashed = [
      "[`projects/agent-",
      "",
      "studio-template/client/design/components/button.tsx`](projects/glassbox-studio-template/client/design/components/button.tsx)",
    ].join("\n");
    const healed = healChatFileMarkdownLinks(
      healSoftWrappedPathBreaks(smashed),
    );
    expect(healed).toBe(
      "[`projects/glassbox-studio-template/client/design/components/button.tsx`](projects/glassbox-studio-template/client/design/components/button.tsx)",
    );
  });

  it("LAW: bare monorepo path wraps as codespan", () => {
    expect(
      wrapBareFilePathsAsCodespans(
        "Or codespan: projects/glassbox-studio-template/client/design/components/button.tsx",
      ),
    ).toContain(
      "`projects/glassbox-studio-template/client/design/components/button.tsx`",
    );
  });

  it("prepare → HTML stamps open-file for smashed Studio Starter link", () => {
    const smashed = [
      "Click:",
      "",
      "[`projects/agent-",
      "",
      "studio-template/client/design/components/button.tsx`](projects/glassbox-studio-template/client/design/components/button.tsx)",
      "",
      "Or bare: projects/glassbox-studio-template/client/design/components/button.tsx",
    ].join("\n");
    const html = chatMarkdownToHtml(smashed);
    expect(html).toContain(
      'data-studio-open-file="projects/glassbox-studio-template/client/design/components/button.tsx"',
    );
    expect(html).toContain("as-chat-file-link");
    expect(html).not.toContain("[`projects/agent-");
  });
});

describe("healSoftWrappedLines", () => {
  it("joins leading comma / semicolon / orphan period", () => {
    expect(
      healSoftWrappedLines(
        "tools: reply drafts, calendar\n, file/ops, recurring life workflows.",
      ),
    ).toBe("tools: reply drafts, calendar, file/ops, recurring life workflows.");
    expect(
      healSoftWrappedLines("1. **Desk that feels like Jarvis**\n; polish mornings."),
    ).toBe("1. **Desk that feels like Jarvis**; polish mornings.");
    expect(healSoftWrappedLines("Planning workspace\n.\n\nOr stay here")).toBe(
      "Planning workspace.\n\nOr stay here",
    );
  });

  it("joins glue-word wraps inside bullets", () => {
    expect(
      healSoftWrappedLines("Messages (inbox → Chat handoff),\nor\nChat chrome"),
    ).toBe("Messages (inbox → Chat handoff), or Chat chrome");
  });

  it("rejoins soft-wrapped http(s) URLs", () => {
    expect(
      healSoftWrappedLines(
        "Open https://studio.tail0a3a18.ts\n.net/?asDcpPreview=1",
      ),
    ).toBe("Open https://studio.tail0a3a18.ts.net/?asDcpPreview=1");
    expect(
      healSoftWrappedLines(
        "See https://example.com/path\n?query=1&x=2 for preview.",
      ),
    ).toBe("See https://example.com/path?query=1&x=2 for preview.");
  });

  it("paints rejoined URLs as one new-tab link", () => {
    const html = chatMarkdownToHtml(
      "Open https://studio.tail0a3a18.ts\n.net/?asDcpPreview=1",
    );
    expect(html).toContain(
      'href="https://studio.tail0a3a18.ts.net/?asDcpPreview=1"',
    );
    expect(html).toContain('target="_blank"');
    expect(html).not.toContain("<br>");
  });
});

describe("healChatMarkdownTables", () => {
  it("merges hard-wrapped fragment rows into the prior cell", () => {
    const src = [
      "| Layer | Job | Why |",
      "| --- | --- | --- |",
      "| **Messages** | Global inbox + n8n/Gmail ingest | One place for email |",
      "/Slack/etc. |",
      "| Gateway path | OpenClaw docs | trial |",
      "/ | Phone / Telegram → same ledger |",
      "| Harnesses | studio / cursor / peers | Swap brains |",
    ].join("\n");
    const healed = healChatMarkdownTables(src);
    expect(healed).toContain("email/Slack/etc.");
    expect(healed).not.toMatch(/^\| \/ /m);
    expect(healed).toContain("Gateway path");
    expect(healed).toContain("Harnesses");
    // Phone fragment should merge into Gateway row, not stay as "/" cell
    expect(healed).toContain("Phone / Telegram");
    expect(healed.split("\n").some((l) => /^\| \/ \|/.test(l))).toBe(false);
  });
});

describe("demoteLayoutPipeBlocks", () => {
  it("demotes monetization Path/Reality smash to bold sections", () => {
    const smashed = [
      "| ** | Path | Reality |",
      "| --- | --- | --- |",
      "| Sell **Studio as SaaS** | Too early. Billing is P2. |",
      "| Sell **outcomes built in Studio** | Ready enough. Sites, content. |",
      "| Sell **setup / hosting seats |  |",
      "",
      "** | Possible soon if Cloud Host is the product.",
      "",
      ". |",
    ].join("\n");
    const prepared = prepareChatMarkdownSource(smashed);
    expect(prepared).not.toMatch(/^\|/m);
    expect(prepared).not.toContain("| ---");
    expect(prepared).toMatch(/\*\*/);
    const html = chatMarkdownToHtml(smashed);
    expect(html).not.toContain("<table>");
    expect(html).not.toContain("<td>");
  });

  it("demotes Option A | cost | effort layout pipes", () => {
    const src = "Option A | cost | effort";
    const prepared = prepareChatMarkdownSource(src);
    expect(prepared).toContain("**Option A**");
    expect(prepared).toContain("cost");
    expect(prepared).toContain("effort");
    expect(prepared).not.toMatch(/^\|/m);
    expect(chatMarkdownToHtml(src)).not.toContain("<table>");
  });

  it("demotes mid-stream half tables (header+sep, one junk body)", () => {
    const src = [
      "| Path | Reality |",
      "| --- | --- |",
      "| ** | too early |",
    ].join("\n");
    const prepared = prepareChatMarkdownSource(src);
    expect(prepared).not.toContain("| ---");
    expect(chatMarkdownToHtml(src)).not.toContain("<table>");
  });

  it("keeps a strict real comparison table", () => {
    const src = [
      "| Path | Reality |",
      "| --- | --- |",
      "| Sell Studio as SaaS | Too early for strangers. |",
      "| Sell outcomes in Studio | Ready enough this month. |",
    ].join("\n");
    const prepared = prepareChatMarkdownSource(src);
    expect(prepared).toContain("| Path | Reality |");
    expect(prepared).toContain("| ---");
    expect(prepared).toContain("Sell Studio as SaaS");
    const html = chatMarkdownToHtml(src);
    expect(html).toContain("<table>");
    expect(html).toContain("<td>");
  });

  it("does not demote pipes inside fenced code", () => {
    const src = ["```", "| a | b |", "| --- | --- |", "| 1 | 2 |", "```"].join(
      "\n",
    );
    expect(demoteLayoutPipeBlocks(src)).toBe(src);
  });
});

describe("chatMarkdownToHtml heals (integration)", () => {
  it("LAW: split bold + fragment table rows paint clean", () => {
    // Two body rows after fragment merge so strict real-table gate can keep it.
    const html = chatMarkdownToHtml(
      [
        "| Layer | Job | Why |",
        "| --- | --- | --- |",
        "| **Messages** | Inbox | One place for email |",
        "/Slack/etc. |",
        "| **Gateway** | OpenClaw docs | trial path |",
        "",
        "**UI-first ladder**",
        "",
        "1. **Desk**; polish mornings.",
        "",
        "3. **",
        "Reachable everywhere** — desk + phone.",
      ].join("\n"),
    );
    expect(html).toContain("<table>");
    expect(html).toContain("email/Slack/etc.");
    expect(html).not.toContain("<td>/</td>");
    expect(html).toContain("<strong>Reachable everywhere</strong>");
    expect(html).not.toContain("**<br>");
    expect(html).not.toContain("<br>,");
  });

  it("LAW: leading comma wrap does not paint as br-comma", () => {
    const html = chatMarkdownToHtml(
      "tools: reply drafts, calendar\n, file/ops, recurring life workflows.",
    );
    expect(html).not.toContain("<br>,");
    expect(html).toContain("calendar, file/ops");
  });
});
