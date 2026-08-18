import { describe, expect, it } from "vitest";
import {
  analyticsEventsToFunnelRows,
  computeFunnel,
  DEFAULT_MARKETING_FUNNEL,
  funnelToEChartsOption,
  parseFunnelDefinitions,
} from "./funnel-pure.js";

describe("funnel-pure", () => {
  it("computes sequential conversion counts", () => {
    const events = analyticsEventsToFunnelRows([
      {
        id: "1",
        name: "pageview",
        props: { visitorId: "v1" },
        createdAt: 1000,
      },
      {
        id: "2",
        name: "nav_link_clicked",
        props: { visitorId: "v1" },
        createdAt: 2000,
      },
      {
        id: "3",
        name: "form_submitted",
        props: { visitorId: "v1" },
        createdAt: 3000,
      },
      {
        id: "4",
        name: "pageview",
        props: { visitorId: "v2" },
        createdAt: 1500,
      },
    ]);
    const result = computeFunnel(events, DEFAULT_MARKETING_FUNNEL, {
      rangeStartMs: 0,
      rangeEndMs: 10_000,
    });
    expect(result.steps.map((s) => s.count)).toEqual([2, 1, 1]);
  });

  it("builds echarts funnel option from result", () => {
    const result = computeFunnel([], DEFAULT_MARKETING_FUNNEL, {
      rangeStartMs: 0,
      rangeEndMs: 1,
    });
    const opt = funnelToEChartsOption(result);
    expect((opt.series as Array<{ type: string }>)[0]?.type).toBe("funnel");
  });

  it("parses funnel defs from plan json", () => {
    const defs = parseFunnelDefinitions([
      {
        id: "a",
        title: "A",
        windowDays: 14,
        steps: [{ event: "pageview", label: "View" }],
      },
    ]);
    expect(defs).toHaveLength(1);
    expect(defs[0]?.windowDays).toBe(14);
  });
});
