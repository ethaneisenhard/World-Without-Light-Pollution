import { describe, expect, it } from "vitest";
import {
  buildStudioRootChatHint,
  formatStudioChatContext,
  studioChatContextChips,
} from "./chat-context-pure.js";
import {
  allowToolsFromSettings,
  defaultAgentToolSettings,
  mergeToolAllowlists,
  setToolEnabled,
} from "./agent-settings-pure.js";

describe("formatStudioChatContext", () => {
  it("includes selected path and live page", () => {
    const text = formatStudioChatContext({
      projectId: "demo-marketing",
      selectedPath: "content/pages/home.md",
      liveSitePath: "/",
      liveOpen: true,
      codeOpen: true,
    });
    expect(text).toContain("content/pages/home.md");
    expect(text).toContain("Website Preview page: /");
    expect(text).toContain("demo-marketing");
    expect(text).toMatch(/ACTIVE WORKSPACE/);
    expect(text).toMatch(/Do NOT ask which workspace/i);
    expect(text).toMatch(/only editable tree/i);
    expect(text).toMatch(/not a different filesystem/i);
  });

  it("stamps Cloud when cloud Host is attached", () => {
    const text = formatStudioChatContext({
      projectId: "_studio",
      hostAttach: {
        role: "desk",
        label: "Cloud",
        summary: "Always-on",
        proxy: "https://api.desk.browserui.site",
        hostname: "api.desk.browserui.site",
      },
    });
    expect(text).toMatch(/Studio place: Cloud/);
    expect(text).toMatch(/Do NOT say "local"/i);
  });

  it("project scope forbids inventing a separate harness repo", () => {
    const text = formatStudioChatContext({ projectId: "glassbox-studio" });
    expect(text).toMatch(/Do NOT ask for a separate/i);
    expect(text).toMatch(/harness: …/i);
  });

  it("global lists registered projects without claiming file access", () => {
    const text = formatStudioChatContext({
      projectId: "_studio",
      registeredProjects: [
        { id: "glassbox-studio", name: "Glass Box Studio" },
        { id: "demo-blog" },
      ],
    });
    expect(text).toMatch(/GLOBAL/i);
    expect(text).toContain("glassbox-studio");
    expect(text).toContain("demo-blog");
    expect(text).toMatch(/@ws\/<projectId>/i);
    expect(text).toMatch(/answer first/i);
    expect(text).toMatch(/@studio\//i);
    expect(text).not.toMatch(/cannot files\.read\/write monorepo/i);
  });

  it("global default allows monorepo + workspace files without All-access", () => {
    const text = formatStudioChatContext({
      projectId: "_studio",
      accessMode: "guarded",
    });
    expect(text).toMatch(/@studio\//i);
    expect(text).toMatch(/@ws\/<projectId>/i);
    expect(text).not.toMatch(/Suggest All-access for Studio product edits/i);
  });

  it("buildStudioRootChatHint is answer-first", () => {
    const guarded = buildStudioRootChatHint("guarded");
    expect(guarded).toMatch(/Answer the user's question first/i);
    expect(guarded).toMatch(/never claim topics are outside/i);
    expect(guarded).toMatch(/@studio\//i);
    expect(guarded).toMatch(/stay on Global/i);
    expect(guarded).toMatch(/glassbox-studio/);
    expect(guarded).not.toMatch(/You cannot edit project files until/i);
    const all = buildStudioRootChatHint("all");
    expect(all).toMatch(/All-access/i);
    expect(all).toMatch(/monorepo/i);
  });
  it("includes focused Forms window and form id", () => {
    const text = formatStudioChatContext({
      projectId: "glassbox-studio",
      focusedKind: "forms",
      openKinds: ["code", "live", "forms"],
      formsFormId: "contact",
    });
    expect(text).toContain("focused window: Forms (forms)");
    expect(text).toContain("open windows: Code, Website Preview, Forms");
    expect(text).toContain('Forms destination / form id: contact');
    expect(text).toMatch(/do not ask which pane is open/i);
    expect(text).toMatch(/kind=messages/i);
    expect(text).toMatch(/Never say you cannot open a window/i);
  });

  it("injects read-only peer chat logs for cross-tab awareness", () => {
    const text = formatStudioChatContext({
      projectId: "glassbox-studio",
      peerChats: [
        {
          sessionId: "peer-a",
          streaming: true,
          turns: [
            { role: "user", content: "Count to 40. End STREAM-A-DONE." },
            { role: "assistant", content: "1\n2\n3\n4\n5" },
          ],
        },
      ],
    });
    expect(text).toMatch(/Other open Studio chats/i);
    expect(text).toContain("peer session peer-a (streaming)");
    expect(text).toContain("STREAM-A-DONE");
    expect(text).toContain("[assistant] 1\n2\n3\n4\n5");
    expect(text).toMatch(/do not invent/i);
    expect(text).not.toMatch(/other open Studio chats: \(none/i);
  });

  it("says none when no peer chats (NO-PEER-LOGS path)", () => {
    const text = formatStudioChatContext({ projectId: "glassbox-studio" });
    expect(text).toMatch(/other open Studio chats: \(none/i);
    expect(text).toContain("NO-PEER-LOGS");
  });
});

describe("studioChatContextChips", () => {
  it("builds chips", () => {
    const chips = studioChatContextChips({
      projectId: "demo-marketing",
      selectedPath: "content/pages/home.md",
      liveSitePath: "/contact",
      liveOpen: true,
    });
    expect(chips.map((c) => c.id)).toEqual(["project", "file", "live"]);
  });

  it("adds focus + forms chips", () => {
    const chips = studioChatContextChips({
      projectId: "glassbox-studio",
      focusedKind: "forms",
      formsFormId: "contact",
    });
    expect(chips.map((c) => c.id)).toEqual(["project", "focus", "forms"]);
    expect(chips.find((c) => c.id === "focus")?.label).toBe("Forms");
    expect(chips.find((c) => c.id === "forms")?.label).toBe("form contact");
  });

  it("global chip says Global not Glass Box Studio", () => {
    const chips = studioChatContextChips({ projectId: "_studio" });
    expect(chips[0]?.label).toBe("Global");
  });

  it("does not paint a peer-count chip (inject stays in prompt only)", () => {
    const chips = studioChatContextChips({
      projectId: "glassbox-studio",
      peerChats: [
        { sessionId: "a", streaming: true, turns: [] },
        { sessionId: "b", streaming: false, turns: [] },
      ],
    });
    expect(chips.find((c) => c.id === "peers")).toBeUndefined();
  });
});

describe("agent settings tools", () => {
  it("defaults all tools on including write", () => {
    const s = defaultAgentToolSettings();
    expect(s.tools["files.write"]).toBe(true);
    expect(allowToolsFromSettings(s)).toBeNull();
  });

  it("merges plan mode with settings", () => {
    let s = defaultAgentToolSettings();
    s = setToolEnabled(s, "files.write", false);
    const merged = mergeToolAllowlists(
      ["files.list", "files.read"],
      allowToolsFromSettings(s),
    );
    expect(merged).toEqual(["files.list", "files.read"]);
  });
});
