/**
 * Map ledger events → FullCalendar-shaped EventInput (no FC import — keep core pure).
 * Chats aggregate to one all-day chip per local day; open drawer for that day's list.
 */

export type LedgerEventLike = {
  id: string;
  kind: string;
  projectId: string | null;
  sessionId: string | null;
  title: string;
  startsAt: number;
  endsAt: number | null;
};

export type StudioCalendarEventInput = {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  extendedProps: {
    kind: string;
    projectId: string | null;
    sessionId: string | null;
    /** Local YYYY-MM-DD for chat-day aggregates. */
    dayKey?: string;
    count?: number;
    sessionIds?: string[];
  };
};

/** Ledger event kinds shown on the calendar filter menu. */
export type CalendarEventKind = "chat" | "write" | "workflow" | "ship";

/**
 * Calendar data scope.
 * - `global` — all workspaces + studio events
 * - `studio` — studio-only (`project_id IS NULL`)
 * - `project` — one workspace (see `scopeProjectId` on the panel)
 */
export type CalendarScope = "global" | "studio" | "project";

/** Fixed top options in the calendar view `<select>` (workspaces follow). */
export const CALENDAR_SCOPE_FIXED_OPTIONS: readonly {
  value: "_global" | "_studio";
  label: string;
}[] = [
  { value: "_global", label: "Global" },
  { value: "_studio", label: "Studio" },
] as const;

/** @deprecated use CALENDAR_SCOPE_FIXED_OPTIONS + project list */
export const CALENDAR_SCOPES: readonly {
  id: CalendarScope;
  label: string;
}[] = [
  { id: "global", label: "Global" },
  { id: "studio", label: "Studio" },
  { id: "project", label: "Workspace" },
] as const;

/** Encode machine scope → `<select>` value. */
export function calendarScopeSelectValue(
  scope: CalendarScope,
  scopeProjectId: string | null | undefined,
): string {
  if (scope === "global") return "_global";
  if (scope === "studio") return "_studio";
  return (scopeProjectId ?? "").trim() || "_global";
}

/** Decode `<select>` value → scope + optional workspace id. */
export function parseCalendarScopeSelect(value: string): {
  scope: CalendarScope;
  scopeProjectId: string | null;
} {
  const v = (value ?? "").trim();
  if (!v || v === "_global" || v === "global") {
    return { scope: "global", scopeProjectId: null };
  }
  if (v === "_studio" || v === "studio") {
    return { scope: "studio", scopeProjectId: null };
  }
  return { scope: "project", scopeProjectId: v };
}

export const CALENDAR_EVENT_KINDS: readonly {
  id: CalendarEventKind;
  label: string;
}[] = [
  { id: "chat", label: "Chats" },
  { id: "write", label: "Writes" },
  { id: "workflow", label: "Automations" },
  { id: "ship", label: "Ships" },
] as const;

/** @deprecated use CalendarEventKind + CALENDAR_EVENT_KINDS */
export type CalendarKindFilter = CalendarEventKind | "all";

/** @deprecated use CALENDAR_EVENT_KINDS */
export const CALENDAR_KIND_FILTERS: readonly {
  id: CalendarKindFilter;
  label: string;
}[] = [
  { id: "all", label: "All" },
  ...CALENDAR_EVENT_KINDS,
] as const;

export const ALL_CALENDAR_EVENT_KINDS: readonly CalendarEventKind[] =
  CALENDAR_EVENT_KINDS.map((k) => k.id);

export type CalendarEventMapOptions = {
  /** When true (global merge), prefix title with project id. */
  prefixProject?: boolean;
  /**
   * Collapse chat events into one all-day chip per local day.
   * Default true — avoids flooding the month grid.
   */
  aggregateChats?: boolean;
};

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Local calendar day key (YYYY-MM-DD). */
export function dayKeyLocal(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Midnight local for a day key → ISO (all-day start). */
export function dayKeyToStartIso(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Date(y!, m! - 1, d!, 0, 0, 0, 0).toISOString();
}

/**
 * Multi-select kind filter. Empty selection or all kinds selected → no filter.
 */
export function filterLedgerEventsByKinds(
  events: readonly LedgerEventLike[],
  kinds: readonly CalendarEventKind[],
): LedgerEventLike[] {
  if (
    kinds.length === 0 ||
    kinds.length >= ALL_CALENDAR_EVENT_KINDS.length
  ) {
    return [...events];
  }
  const set = new Set<string>(kinds);
  return events.filter((e) => set.has(e.kind));
}

/** Toggle one kind in a stable CALENDAR_EVENT_KINDS order. */
export function toggleCalendarEventKind(
  selected: readonly CalendarEventKind[],
  kind: CalendarEventKind,
): CalendarEventKind[] {
  const set = new Set(selected);
  if (set.has(kind)) set.delete(kind);
  else set.add(kind);
  return ALL_CALENDAR_EVENT_KINDS.filter((k) => set.has(k));
}

/** Button label for the kinds filter control. */
export function calendarKindsFilterLabel(
  kinds: readonly CalendarEventKind[],
): string {
  if (
    kinds.length === 0 ||
    kinds.length >= ALL_CALENDAR_EVENT_KINDS.length
  ) {
    return "All types";
  }
  if (kinds.length === 1) {
    const one = CALENDAR_EVENT_KINDS.find((k) => k.id === kinds[0]);
    return one?.label ?? "Filter";
  }
  return `${kinds.length} types`;
}

export function filterLedgerEventsByKind(
  events: readonly LedgerEventLike[],
  kind: CalendarKindFilter,
): LedgerEventLike[] {
  if (kind === "all") return filterLedgerEventsByKinds(events, []);
  return filterLedgerEventsByKinds(events, [kind]);
}

/** Build `/api/ledger/events` query for a calendar scope. */
export function calendarLedgerEventsQuery(
  scope: CalendarScope,
  projectId: string,
): URLSearchParams {
  const q = new URLSearchParams();
  if (scope === "project" && projectId) q.set("projectId", projectId);
  else if (scope === "studio") q.set("projectId", "");
  return q;
}

function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

export function ledgerEventToCalendarInput(
  event: LedgerEventLike,
  opts: CalendarEventMapOptions = {},
): StudioCalendarEventInput {
  const title =
    opts.prefixProject && event.projectId
      ? `[${event.projectId}] ${event.title}`
      : event.title;
  const input: StudioCalendarEventInput = {
    id: event.id,
    title,
    start: toIso(event.startsAt),
    allDay: true,
    extendedProps: {
      kind: event.kind,
      projectId: event.projectId,
      sessionId: event.sessionId,
      dayKey: dayKeyLocal(event.startsAt),
    },
  };
  if (event.endsAt != null && event.endsAt > event.startsAt) {
    input.end = toIso(event.endsAt);
    const spanMs = event.endsAt - event.startsAt;
    if (spanMs < 86_400_000) {
      input.allDay = false;
    }
  }
  return input;
}

function chatDayTitle(count: number): string {
  return count === 1 ? "1 chat" : `${count} chats`;
}

/**
 * Group chat events by local day → one chip per day.
 * Non-chat events pass through unchanged.
 */
export function ledgerEventsToCalendarInputs(
  events: readonly LedgerEventLike[],
  opts: CalendarEventMapOptions = {},
): StudioCalendarEventInput[] {
  const aggregate = opts.aggregateChats !== false;
  if (!aggregate) {
    return events.map((e) => ledgerEventToCalendarInput(e, opts));
  }

  const chats: LedgerEventLike[] = [];
  const other: LedgerEventLike[] = [];
  for (const e of events) {
    if (e.kind === "chat") chats.push(e);
    else other.push(e);
  }

  type Bucket = {
    dayKey: string;
    projectId: string | null;
    events: LedgerEventLike[];
  };
  const buckets = new Map<string, Bucket>();
  for (const e of chats) {
    const dayKey = dayKeyLocal(e.startsAt);
    const scope = e.projectId ?? "_studio";
    const key = `${dayKey}::${scope}`;
    let b = buckets.get(key);
    if (!b) {
      b = { dayKey, projectId: e.projectId, events: [] };
      buckets.set(key, b);
    }
    b.events.push(e);
  }

  const chatInputs: StudioCalendarEventInput[] = [...buckets.values()].map(
    (b) => {
      const sessionIds = b.events
        .map((e) => e.sessionId)
        .filter((id): id is string => Boolean(id));
      const titleBase = chatDayTitle(b.events.length);
      const title =
        opts.prefixProject && b.projectId
          ? `[${b.projectId}] ${titleBase}`
          : titleBase;
      return {
        id: `chat-day:${b.dayKey}:${b.projectId ?? "studio"}`,
        title,
        start: dayKeyToStartIso(b.dayKey),
        allDay: true,
        extendedProps: {
          kind: "chat-day",
          projectId: b.projectId,
          sessionId: sessionIds[0] ?? null,
          dayKey: b.dayKey,
          count: b.events.length,
          sessionIds,
        },
      };
    },
  );

  return [
    ...chatInputs,
    ...other.map((e) => ledgerEventToCalendarInput(e, opts)),
  ];
}

/** Events belonging to a local day (and optional project). */
export function ledgerEventsForDay(
  events: readonly LedgerEventLike[],
  dayKey: string,
  opts?: { projectId?: string | null; kind?: string },
): LedgerEventLike[] {
  return events
    .filter((e) => dayKeyLocal(e.startsAt) === dayKey)
    .filter((e) =>
      opts?.projectId === undefined
        ? true
        : e.projectId === opts.projectId,
    )
    .filter((e) => (opts?.kind ? e.kind === opts.kind : true))
    .sort((a, b) => a.startsAt - b.startsAt);
}

export function formatEventTimeLabel(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
