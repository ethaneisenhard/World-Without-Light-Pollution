import { describe, expect, it } from "vitest";
import {
  closeChatTab,
  createEmptyChatSession,
  emptyChatSessionState,
  formatWorkspaceChatWhen,
  formatWorkspaceChatWhenFull,
  groupChatSessionsByDay,
  newChatSession,
  nextWorkspaceChatRailLimit,
  patchActiveChatSession,
  selectChatSession,
  titleFromFirstUserMessage,
  WORKSPACE_CHAT_RAIL_PAGE,
  workspaceChatRail,
  buildOpenGlobalChatTabs,
  buildStudioChatRailRows,
  filterStudioChatRailRowsByQuery,
  groupStudioChatRailRowsByDay,
} from "./chat-session-pure.js";

describe("titleFromFirstUserMessage", () => {
  it("uses first user message", () => {
    expect(
      titleFromFirstUserMessage([
        { role: "user", content: "  Add bang to hero  " },
      ]),
    ).toBe("Add bang to hero");
  });
  it("truncates long titles", () => {
    const t = titleFromFirstUserMessage([
      { role: "user", content: "x".repeat(60) },
    ]);
    expect(t.endsWith("…")).toBe(true);
    expect(t.length).toBeLessThanOrEqual(43);
  });
});

describe("groupChatSessionsByDay", () => {
  it("buckets today / yesterday / older", () => {
    const now = Date.parse("2026-07-11T15:00:00");
    const today = createEmptyChatSession({ now });
    const y = createEmptyChatSession({
      now: now - 86_400_000,
      id: "y",
    });
    const old = createEmptyChatSession({
      now: now - 5 * 86_400_000,
      id: "old",
    });
    const groups = groupChatSessionsByDay([today, y, old], now);
    expect(groups.map((g) => g.label)).toEqual(["Today", "Yesterday", "Older"]);
  });
});

describe("workspaceChatRail", () => {
  it("returns newest five and hasMore", () => {
    const sessions = Array.from({ length: 7 }, (_, i) => ({
      ...createEmptyChatSession({ now: 1000 + i, id: `c${i}` }),
      title: `Chat ${i}`,
      messages: [{ role: "user" as const, content: `msg ${i}` }],
      updatedAt: 1000 + i,
    }));
    const rail = workspaceChatRail(sessions, WORKSPACE_CHAT_RAIL_PAGE);
    expect(rail.total).toBe(7);
    expect(rail.hasMore).toBe(true);
    expect(rail.sessions.map((s) => s.id)).toEqual([
      "c6",
      "c5",
      "c4",
      "c3",
      "c2",
    ]);
  });

  it("skips empty New chat stubs", () => {
    const empty = createEmptyChatSession({ now: 2000, id: "empty" });
    const real = {
      ...createEmptyChatSession({ now: 1000, id: "real" }),
      title: "Ship chevrons",
      messages: [{ role: "user" as const, content: "Ship chevrons" }],
    };
    const rail = workspaceChatRail([empty, real]);
    expect(rail.sessions.map((s) => s.id)).toEqual(["real"]);
    expect(rail.hasMore).toBe(false);
  });

  it("grows load-more limit by page", () => {
    expect(nextWorkspaceChatRailLimit()).toBe(10);
    expect(nextWorkspaceChatRailLimit(10)).toBe(15);
  });
});

describe("buildStudioChatRailRows", () => {
  it("merges studio + projects, sorts newest first, tags + accent", () => {
    const studio = {
      ...createEmptyChatSession({ now: 3000, id: "s1" }),
      title: "Studio thread",
      messages: [{ role: "user" as const, content: "hi" }],
      updatedAt: 3000,
    };
    const blog = {
      ...createEmptyChatSession({ now: 4000, id: "b1" }),
      title: "Blog thread",
      messages: [{ role: "user" as const, content: "post" }],
      updatedAt: 4000,
    };
    const older = {
      ...createEmptyChatSession({ now: 1000, id: "b0" }),
      title: "Older",
      messages: [{ role: "user" as const, content: "old" }],
      updatedAt: 1000,
    };
    const rail = buildStudioChatRailRows({
      studioSessions: [studio],
      projects: [
        {
          projectId: "demo-blog",
          tagLabel: "Demo Blog",
          accent: "#2563eb",
          sessions: [blog, older],
        },
      ],
      limit: 10,
    });
    expect(rail.total).toBe(3);
    expect(rail.rows.map((r) => r.sessionId)).toEqual(["b1", "s1", "b0"]);
    expect(rail.rows[0]).toMatchObject({
      projectId: "demo-blog",
      tagLabel: "Demo Blog",
      accent: "#2563eb",
    });
    expect(rail.rows[1]).toMatchObject({
      projectId: null,
      tagLabel: "Studio",
    });
    expect(rail.rows[1]!.accent).toBeUndefined();
  });

  it("skips empty stubs and respects limit", () => {
    const empty = createEmptyChatSession({ now: 9000, id: "empty" });
    const real = {
      ...createEmptyChatSession({ now: 5000, id: "real" }),
      title: "Real",
      messages: [{ role: "user" as const, content: "x" }],
      updatedAt: 5000,
    };
    const rail = buildStudioChatRailRows({
      studioSessions: [empty, real],
      projects: [],
      limit: 1,
    });
    expect(rail.total).toBe(1);
    expect(rail.hasMore).toBe(false);
    expect(rail.rows.map((r) => r.sessionId)).toEqual(["real"]);
  });

  it("skips empty spawn_ standing desks (MCP Scout class) from Recents", () => {
    const scout = {
      ...createEmptyChatSession({
        now: 8000,
        id: "spawn_scout_1",
        title: "MCP Scout",
      }),
      messages: [] as const,
      updatedAt: 8000,
    };
    const scoutWithTurn = {
      ...createEmptyChatSession({
        now: 7000,
        id: "spawn_scout_2",
        title: "MCP Scout",
      }),
      messages: [{ role: "user" as const, content: "go" }],
      updatedAt: 7000,
    };
    const normal = {
      ...createEmptyChatSession({ now: 6000, id: "chat_normal" }),
      title: "huh",
      messages: [{ role: "user" as const, content: "huh" }],
      updatedAt: 6000,
    };
    const rail = buildStudioChatRailRows({
      studioSessions: [scout, scoutWithTurn, normal],
      projects: [],
      limit: 10,
    });
    expect(rail.rows.map((r) => r.sessionId)).toEqual([
      "spawn_scout_2",
      "chat_normal",
    ]);
  });

  it("dedupes same opener across Studio + workspace; prefers workspace tag", () => {
    const opener = "As you can see here our navigation is squashing";
    const studioCopy = {
      ...createEmptyChatSession({ now: 3000, id: "studio-dup" }),
      title: "As you can see…",
      messages: [
        { role: "user" as const, content: opener },
        { role: "assistant" as const, content: "short" },
      ],
      updatedAt: 3000,
    };
    const workspace = {
      ...createEmptyChatSession({ now: 4000, id: "ws-keep" }),
      title: "As you can see…",
      messages: [
        { role: "user" as const, content: opener },
        { role: "assistant" as const, content: "short" },
        { role: "user" as const, content: "follow up" },
      ],
      updatedAt: 4000,
    };
    const rail = buildStudioChatRailRows({
      studioSessions: [studioCopy],
      projects: [
        {
          projectId: "beehiiv-com",
          tagLabel: "beehiiv.com",
          accent: "#7c3aed",
          sessions: [workspace],
        },
      ],
      limit: 10,
    });
    expect(rail.total).toBe(1);
    expect(rail.rows[0]).toMatchObject({
      sessionId: "ws-keep",
      projectId: "beehiiv-com",
      tagLabel: "beehiiv.com",
      accent: "#7c3aed",
    });
  });

  it("tags Studio-ledger rows from contextProjectId", () => {
    const s = {
      ...createEmptyChatSession({
        now: 1000,
        id: "ctx",
        contextProjectId: "beehiiv-com",
      }),
      title: "Nav",
      messages: [{ role: "user" as const, content: "hi" }],
      updatedAt: 1000,
    };
    const rail = buildStudioChatRailRows({
      studioSessions: [s],
      projects: [
        {
          projectId: "beehiiv-com",
          tagLabel: "beehiiv.com",
          accent: "#7c3aed",
          sessions: [],
        },
      ],
      limit: 10,
    });
    expect(rail.rows[0]).toMatchObject({
      sessionId: "ctx",
      projectId: "beehiiv-com",
      tagLabel: "beehiiv.com",
      accent: "#7c3aed",
    });
  });
});

describe("buildOpenGlobalChatTabs", () => {
  it("keeps tabOpen stubs + accents; pins active first", () => {
    const studioOpen = {
      ...createEmptyChatSession({ now: 1000, id: "s-open" }),
      title: "Studio open",
      updatedAt: 1000,
      tabOpen: true,
    };
    const studioClosed = {
      ...createEmptyChatSession({ now: 9000, id: "s-closed" }),
      title: "Closed",
      updatedAt: 9000,
      tabOpen: false,
    };
    const blogOpen = {
      ...createEmptyChatSession({ now: 2000, id: "b-open" }),
      title: "Blog open",
      updatedAt: 2000,
      tabOpen: true,
    };
    const tabs = buildOpenGlobalChatTabs({
      studioSessions: [studioOpen, studioClosed],
      projects: [
        {
          projectId: "demo-blog",
          tagLabel: "Demo Blog",
          accent: "#2563eb",
          sessions: [blogOpen],
        },
      ],
      active: { projectId: "demo-blog", sessionId: "b-open" },
    });
    expect(tabs.map((t) => t.sessionId)).toEqual(["b-open", "s-open"]);
    expect(tabs[0]).toMatchObject({
      projectId: "demo-blog",
      accent: "#2563eb",
      tagLabel: "Demo Blog",
    });
    expect(tabs[1]).toMatchObject({ projectId: null, tagLabel: "Studio" });
  });
});

describe("groupStudioChatRailRowsByDay + filter", () => {
  it("groups by day and filters title/tag", () => {
    const now = Date.parse("2026-07-14T18:00:00");
    const rows = [
      {
        sessionId: "a",
        projectId: "demo-blog",
        title: "Blog colors",
        updatedAt: Date.parse("2026-07-14T12:00:00"),
        tagLabel: "Demo Blog",
        accent: "#2563eb",
      },
      {
        sessionId: "b",
        projectId: null,
        title: "Studio theme",
        updatedAt: Date.parse("2026-07-13T12:00:00"),
        tagLabel: "Studio",
      },
      {
        sessionId: "c",
        projectId: "glassbox-studio-template",
        title: "keep me",
        updatedAt: Date.parse("2026-07-01T12:00:00"),
        tagLabel: "Studio Starter",
        accent: "#059669",
      },
    ];
    const groups = groupStudioChatRailRowsByDay(rows, now);
    expect(groups.map((g) => g.label)).toEqual([
      "Today",
      "Yesterday",
      "Older",
    ]);
    expect(filterStudioChatRailRowsByQuery(rows, "studio").map((r) => r.sessionId)).toEqual([
      "b",
      "c",
    ]);
    expect(filterStudioChatRailRowsByQuery(rows, "colors").map((r) => r.sessionId)).toEqual([
      "a",
    ]);
  });
});

describe("formatWorkspaceChatWhen", () => {
  it("shows time for today, weekday+time within week, month+day+time older", () => {
    const now = Date.parse("2026-07-11T18:00:00");
    expect(formatWorkspaceChatWhen(Date.parse("2026-07-11T15:42:00"), now)).toMatch(
      /3:42/,
    );
    expect(
      formatWorkspaceChatWhen(Date.parse("2026-07-10T15:42:00"), now),
    ).toMatch(/Yesterday/);
    expect(
      formatWorkspaceChatWhen(Date.parse("2026-07-08T15:42:00"), now),
    ).toMatch(/3:42/);
    expect(
      formatWorkspaceChatWhen(Date.parse("2026-06-01T15:42:00"), now),
    ).toMatch(/Jun/);
  });

  it("formats full tooltip", () => {
    const full = formatWorkspaceChatWhenFull(Date.parse("2026-07-11T15:42:00"));
    expect(full).toMatch(/Jul/);
    expect(full).toMatch(/2026/);
  });
});

describe("session state ops", () => {
  it("new / select / close tab", () => {
    let state = emptyChatSessionState(1000);
    const first = state.activeId!;
    state = newChatSession(state, "ask", 2000);
    expect(state.sessions).toHaveLength(2);
    expect(state.activeId).not.toBe(first);
    state = selectChatSession(state, first);
    expect(state.activeId).toBe(first);
    state = closeChatTab(state, first, 3000);
    expect(state.sessions.find((s) => s.id === first)?.tabOpen).toBe(false);
    expect(state.activeId).not.toBe(first);
  });

  it("patchActive updates title from messages", () => {
    let state = emptyChatSessionState(1000);
    state = patchActiveChatSession(
      state,
      {
        messages: [{ role: "user", content: "Fix the hero" }],
      },
      2000,
    );
    expect(state.sessions[0]!.title).toBe("Fix the hero");
  });
});
