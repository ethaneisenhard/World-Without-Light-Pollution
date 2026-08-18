import { describe, expect, it } from "vitest";
import {
  calendarKindsFilterLabel,
  calendarLedgerEventsQuery,
  calendarScopeSelectValue,
  dayKeyLocal,
  filterLedgerEventsByKind,
  filterLedgerEventsByKinds,
  ledgerEventToCalendarInput,
  ledgerEventsForDay,
  ledgerEventsToCalendarInputs,
  parseCalendarScopeSelect,
  toggleCalendarEventKind,
} from "./calendar-events-pure.js";

const noon = Date.UTC(2026, 6, 11, 16, 0, 0); // Jul 11 2026 UTC afternoon

describe("filterLedgerEventsByKinds", () => {
  const events = [
    {
      id: "1",
      kind: "chat",
      projectId: "p",
      sessionId: "s1",
      title: "a",
      startsAt: noon,
      endsAt: null,
    },
    {
      id: "2",
      kind: "write",
      projectId: "p",
      sessionId: null,
      title: "b",
      startsAt: noon,
      endsAt: null,
    },
  ];

  it("filters chats", () => {
    expect(filterLedgerEventsByKinds(events, ["chat"])).toHaveLength(1);
    expect(filterLedgerEventsByKinds(events, [])).toHaveLength(2);
    expect(filterLedgerEventsByKind(events, "all")).toHaveLength(2);
  });

  it("toggles kinds and summarizes label", () => {
    expect(toggleCalendarEventKind(["chat", "write"], "write")).toEqual([
      "chat",
    ]);
    expect(toggleCalendarEventKind(["chat"], "write")).toEqual([
      "chat",
      "write",
    ]);
    expect(calendarKindsFilterLabel([])).toBe("All types");
    expect(calendarKindsFilterLabel(["chat"])).toBe("Chats");
    expect(calendarKindsFilterLabel(["chat", "write"])).toBe("2 types");
  });
});

describe("calendarLedgerEventsQuery", () => {
  it("maps scope to projectId query", () => {
    expect(calendarLedgerEventsQuery("global", "demo").toString()).toBe("");
    expect(calendarLedgerEventsQuery("studio", "demo").get("projectId")).toBe(
      "",
    );
    expect(calendarLedgerEventsQuery("project", "demo").get("projectId")).toBe(
      "demo",
    );
  });
});

describe("calendarScopeSelectValue / parseCalendarScopeSelect", () => {
  it("round-trips fixed + workspace values", () => {
    expect(calendarScopeSelectValue("global", null)).toBe("_global");
    expect(calendarScopeSelectValue("studio", null)).toBe("_studio");
    expect(calendarScopeSelectValue("project", "demo-blog")).toBe("demo-blog");
    expect(parseCalendarScopeSelect("_global")).toEqual({
      scope: "global",
      scopeProjectId: null,
    });
    expect(parseCalendarScopeSelect("_studio")).toEqual({
      scope: "studio",
      scopeProjectId: null,
    });
    expect(parseCalendarScopeSelect("demo-blog")).toEqual({
      scope: "project",
      scopeProjectId: "demo-blog",
    });
  });
});

describe("ledgerEventsToCalendarInputs aggregate", () => {
  it("collapses multiple chats on same local day into one chip", () => {
    const t1 = new Date(2026, 6, 11, 10, 0, 0).getTime();
    const t2 = new Date(2026, 6, 11, 15, 30, 0).getTime();
    const inputs = ledgerEventsToCalendarInputs([
      {
        id: "c1",
        kind: "chat",
        projectId: "demo-marketing",
        sessionId: "s1",
        title: "Hero",
        startsAt: t1,
        endsAt: t1 + 1000,
      },
      {
        id: "c2",
        kind: "chat",
        projectId: "demo-marketing",
        sessionId: "s2",
        title: "CTA",
        startsAt: t2,
        endsAt: t2 + 1000,
      },
    ]);
    expect(inputs).toHaveLength(1);
    expect(inputs[0]!.extendedProps.kind).toBe("chat-day");
    expect(inputs[0]!.title).toBe("2 chats");
    expect(inputs[0]!.extendedProps.count).toBe(2);
    expect(inputs[0]!.extendedProps.sessionIds).toEqual(["s1", "s2"]);
    expect(inputs[0]!.allDay).toBe(true);
  });

  it("keeps writes as individual events", () => {
    const t = new Date(2026, 6, 11, 12, 0, 0).getTime();
    const inputs = ledgerEventsToCalendarInputs([
      {
        id: "w1",
        kind: "write",
        projectId: "p",
        sessionId: null,
        title: "home.md",
        startsAt: t,
        endsAt: null,
      },
    ]);
    expect(inputs).toHaveLength(1);
    expect(inputs[0]!.extendedProps.kind).toBe("write");
  });

  it("can disable aggregation", () => {
    const t = new Date(2026, 6, 11, 12, 0, 0).getTime();
    const inputs = ledgerEventsToCalendarInputs(
      [
        {
          id: "c1",
          kind: "chat",
          projectId: "p",
          sessionId: "s1",
          title: "A",
          startsAt: t,
          endsAt: null,
        },
        {
          id: "c2",
          kind: "chat",
          projectId: "p",
          sessionId: "s2",
          title: "B",
          startsAt: t + 1,
          endsAt: null,
        },
      ],
      { aggregateChats: false },
    );
    expect(inputs).toHaveLength(2);
  });
});

describe("ledgerEventsForDay", () => {
  it("returns chats for a day key sorted", () => {
    const t1 = new Date(2026, 6, 11, 9, 0, 0).getTime();
    const t2 = new Date(2026, 6, 11, 18, 0, 0).getTime();
    const other = new Date(2026, 6, 12, 9, 0, 0).getTime();
    const key = dayKeyLocal(t1);
    const list = ledgerEventsForDay(
      [
        {
          id: "b",
          kind: "chat",
          projectId: "p",
          sessionId: "s2",
          title: "Later",
          startsAt: t2,
          endsAt: null,
        },
        {
          id: "a",
          kind: "chat",
          projectId: "p",
          sessionId: "s1",
          title: "Earlier",
          startsAt: t1,
          endsAt: null,
        },
        {
          id: "x",
          kind: "chat",
          projectId: "p",
          sessionId: "s3",
          title: "Next",
          startsAt: other,
          endsAt: null,
        },
      ],
      key,
      { kind: "chat" },
    );
    expect(list.map((e) => e.id)).toEqual(["a", "b"]);
  });
});

describe("ledgerEventToCalendarInput", () => {
  it("maps single event", () => {
    const input = ledgerEventToCalendarInput({
      id: "chat_c1",
      kind: "chat",
      projectId: "demo-marketing",
      sessionId: "c1",
      title: "Hero copy",
      startsAt: Date.UTC(2026, 6, 11, 12, 0, 0),
      endsAt: Date.UTC(2026, 6, 11, 13, 0, 0),
    });
    expect(input.extendedProps.kind).toBe("chat");
    expect(input.allDay).toBe(false);
  });
});
