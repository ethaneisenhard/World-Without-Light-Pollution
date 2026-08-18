/**
 * Sequential funnel math + ECharts option builder.
 * Ported from BrowserUI `@browserui/analytics` (Mixpanel-style specific order).
 */

export type FunnelStepFilter = {
  key: string;
  value: string | number | boolean;
};

export type FunnelStepDefinition = {
  event: string;
  label?: string;
  where?: FunnelStepFilter[];
};

export type FunnelDefinition = {
  id: string;
  title: string;
  steps: FunnelStepDefinition[];
  windowDays?: number;
  exposureEvent?: string;
};

export type FunnelEventRow = {
  eventName: string;
  visitorId: string;
  timestampMs: number;
  properties?: Record<string, unknown> | null;
};

export type FunnelStepResult = {
  index: number;
  eventName: string;
  label: string;
  count: number;
  pctOfFirst: number | null;
  pctOfPrevious: number | null;
};

export type FunnelQueryResult = {
  funnelId: string;
  title: string;
  windowDays: number;
  exposureEvent?: string | null;
  exposureCount?: number | null;
  steps: FunnelStepResult[];
};

const MS_PER_DAY = 86_400_000;

function humanizeEventName(name: string): string {
  return name
    .replace(/\./g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function eventMatchesStep(
  row: FunnelEventRow,
  step: FunnelStepDefinition,
): boolean {
  if (row.eventName !== step.event) return false;
  if (!step.where?.length) return true;
  const props = row.properties ?? {};
  return step.where.every((f) => props[f.key] === f.value);
}

export function sequentialFunnelDepthForVisitor(
  timeline: readonly FunnelEventRow[],
  steps: readonly FunnelStepDefinition[],
  windowMs: number,
): number {
  if (steps.length === 0) return 0;

  let stepIdx = 0;
  let anchorMs: number | null = null;

  for (const row of timeline) {
    if (stepIdx >= steps.length) break;

    if (stepIdx === 1 && eventMatchesStep(row, steps[0]!)) {
      anchorMs = row.timestampMs;
      continue;
    }

    const step = steps[stepIdx]!;
    if (!eventMatchesStep(row, step)) continue;

    if (stepIdx === 0) {
      anchorMs = row.timestampMs;
      stepIdx = 1;
      continue;
    }

    if (anchorMs === null || row.timestampMs - anchorMs > windowMs) break;
    stepIdx++;
  }

  return stepIdx;
}

export function visitorTimelineAfterExposure(
  timeline: readonly FunnelEventRow[],
  exposureEvent: string | undefined,
): FunnelEventRow[] {
  if (!exposureEvent) return [...timeline];
  const idx = timeline.findIndex((row) => row.eventName === exposureEvent);
  if (idx < 0) return [];
  return timeline.slice(idx);
}

export function countExposedVisitors(
  events: readonly FunnelEventRow[],
  exposureEvent: string,
  rangeStartMs: number,
  rangeEndMs: number,
): number {
  const exposed = new Set<string>();
  for (const e of events) {
    if (e.timestampMs < rangeStartMs || e.timestampMs > rangeEndMs) continue;
    if (e.eventName === exposureEvent) exposed.add(e.visitorId);
  }
  return exposed.size;
}

export function aggregateFunnelStepCounts(
  depths: Iterable<number>,
  stepCount: number,
): number[] {
  const depthList = [...depths];
  return Array.from({ length: stepCount }, (_, i) => {
    let n = 0;
    for (const depth of depthList) {
      if (depth > i) n++;
    }
    return n;
  });
}

export function visitorFunnelDepth(
  events: readonly FunnelEventRow[],
  definition: FunnelDefinition,
  rangeStartMs: number,
  rangeEndMs: number,
): Map<string, number> {
  const windowMs = (definition.windowDays ?? 7) * MS_PER_DAY;
  const byVisitor = new Map<string, FunnelEventRow[]>();
  for (const e of events) {
    if (e.timestampMs < rangeStartMs || e.timestampMs > rangeEndMs) continue;
    const list = byVisitor.get(e.visitorId) ?? [];
    list.push(e);
    byVisitor.set(e.visitorId, list);
  }

  const depths = new Map<string, number>();
  const steps = definition.steps;
  if (steps.length === 0) return depths;

  for (const [visitorId, list] of byVisitor) {
    list.sort((a, b) => a.timestampMs - b.timestampMs);
    const timeline = visitorTimelineAfterExposure(list, definition.exposureEvent);
    if (definition.exposureEvent && timeline.length === 0) continue;
    depths.set(
      visitorId,
      sequentialFunnelDepthForVisitor(timeline, steps, windowMs),
    );
  }

  return depths;
}

export function computeFunnel(
  events: readonly FunnelEventRow[],
  definition: FunnelDefinition,
  opts: { rangeStartMs: number; rangeEndMs: number },
): FunnelQueryResult {
  const steps = definition.steps;
  const depths = visitorFunnelDepth(
    events,
    definition,
    opts.rangeStartMs,
    opts.rangeEndMs,
  );
  const counts = aggregateFunnelStepCounts(depths.values(), steps.length);

  const first = counts[0] ?? 0;
  const results: FunnelStepResult[] = steps.map((step, i) => {
    const count = counts[i] ?? 0;
    const prev = i > 0 ? (counts[i - 1] ?? 0) : 0;
    return {
      index: i,
      eventName: step.event,
      label: step.label ?? humanizeEventName(step.event),
      count,
      pctOfFirst: first > 0 ? count / first : null,
      pctOfPrevious: i === 0 ? null : prev > 0 ? count / prev : null,
    };
  });

  const exposureEvent = definition.exposureEvent;
  const exposureCount = exposureEvent
    ? countExposedVisitors(
        events,
        exposureEvent,
        opts.rangeStartMs,
        opts.rangeEndMs,
      )
    : null;

  return {
    funnelId: definition.id,
    title: definition.title,
    windowDays: definition.windowDays ?? 7,
    exposureCount,
    ...(exposureEvent ? { exposureEvent } : {}),
    steps: results,
  };
}

/** ECharts funnel series — step conversion %, not ECharts default sum %. */
export function funnelToEChartsOption(
  result: FunnelQueryResult,
  theme?: { brand?: string; text?: string; muted?: string },
): Record<string, unknown> {
  const brand = theme?.brand ?? "#3b82f6";
  const text = theme?.text ?? "#e5e7eb";
  const muted = theme?.muted ?? "#9ca3af";

  return {
    color: [brand],
    tooltip: {
      trigger: "item",
      formatter: (params: {
        name: string;
        value: number;
        dataIndex: number;
      }) => {
        const step = result.steps[params.dataIndex];
        if (!step) return params.name;
        const prev =
          step.pctOfPrevious !== null
            ? `${Math.round(step.pctOfPrevious * 100)}% of previous`
            : "top of funnel";
        const first =
          step.pctOfFirst !== null
            ? `${Math.round(step.pctOfFirst * 100)}% of top`
            : "";
        return `${step.label}<br/>${step.count.toLocaleString()} users<br/>${prev}${first ? ` · ${first}` : ""}`;
      },
    },
    series: [
      {
        type: "funnel",
        sort: "descending",
        gap: 2,
        left: "10%",
        top: 28,
        bottom: 20,
        width: "80%",
        minSize: "8%",
        label: {
          color: text,
          formatter: (params: {
            name: string;
            value: number;
            dataIndex: number;
          }) => {
            const step = result.steps[params.dataIndex];
            if (!step) return params.name;
            const rate =
              step.pctOfPrevious !== null
                ? ` · ${Math.round(step.pctOfPrevious * 100)}%`
                : "";
            return `${step.label}\n${step.count.toLocaleString()}${rate}`;
          },
        },
        labelLine: { lineStyle: { color: muted } },
        itemStyle: { borderColor: "transparent" },
        data: result.steps.map((s) => ({ name: s.label, value: s.count })),
      },
    ],
  };
}

export const DEFAULT_MARKETING_FUNNEL: FunnelDefinition = {
  id: "visit-nav-form",
  title: "Visit → Nav → Form",
  windowDays: 7,
  steps: [
    { event: "pageview", label: "Page viewed" },
    { event: "nav_link_clicked", label: "Nav link clicked" },
    { event: "form_submitted", label: "Form submitted" },
  ],
};

/** Map CDP store events → funnel rows (`visitorId` / `visitor_id` in props). */
export function analyticsEventsToFunnelRows(
  events: readonly {
    id: string;
    name: string;
    props: Record<string, unknown>;
    createdAt: number;
  }[],
): FunnelEventRow[] {
  return events.map((ev) => {
    const visitorRaw = ev.props.visitorId ?? ev.props.visitor_id;
    const visitorId =
      typeof visitorRaw === "string" && visitorRaw.trim()
        ? visitorRaw
        : ev.id;
    return {
      eventName: ev.name,
      visitorId,
      timestampMs: ev.createdAt,
      properties: ev.props,
    };
  });
}

export function parseFunnelDefinitions(
  raw: unknown,
): FunnelDefinition[] {
  if (!Array.isArray(raw)) return [];
  const out: FunnelDefinition[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (typeof o.id !== "string" || typeof o.title !== "string") continue;
    if (!Array.isArray(o.steps) || o.steps.length === 0) continue;
    const steps: FunnelStepDefinition[] = [];
    for (const s of o.steps) {
      if (!s || typeof s !== "object") continue;
      const step = s as Record<string, unknown>;
      if (typeof step.event !== "string") continue;
      steps.push({
        event: step.event,
        ...(typeof step.label === "string" ? { label: step.label } : {}),
      });
    }
    if (steps.length === 0) continue;
    out.push({
      id: o.id,
      title: o.title,
      steps,
      ...(typeof o.windowDays === "number" ? { windowDays: o.windowDays } : {}),
      ...(typeof o.exposureEvent === "string"
        ? { exposureEvent: o.exposureEvent }
        : {}),
    });
  }
  return out;
}
