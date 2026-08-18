import { describe, expect, it } from "vitest";
import { defaultHomeLayout } from "./home-widgets-pure.js";
import {
  gridStackNodesToHomeWidgets,
  homeGridStackSyncKey,
  homeWidgetSizeLimits,
  homeWidgetsToGridStackNodes,
} from "./home-widgets-gridstack-pure.js";
import { summarizeHomeLayoutForChat } from "./home-widgets-layout-api-pure.js";

describe("home-widgets-gridstack-pure", () => {
  it("round-trips positions through GridStack nodes", () => {
    const widgets = defaultHomeLayout().widgets;
    const nodes = homeWidgetsToGridStackNodes(widgets);
    expect(nodes[0]).toMatchObject({
      id: "w-greeting",
      x: 0,
      y: 0,
      w: 2,
      h: 1,
    });
    const limits = homeWidgetSizeLimits("greeting");
    expect(limits.minW).toBe(2);
    expect(limits.maxW).toBe(4);

    const back = gridStackNodesToHomeWidgets(
      nodes.map((n) => ({ ...n, x: n.x, y: n.y + 1 })),
      widgets,
    );
    expect(back.find((w) => w.instanceId === "w-greeting")?.row).toBe(1);
    expect(back.find((w) => w.instanceId === "w-greeting")?.widgetId).toBe(
      "greeting",
    );
  });

  it("marks peek nodes sizeToContent; launchers stay manual", () => {
    const widgets = defaultHomeLayout().widgets;
    const nodes = homeWidgetsToGridStackNodes(widgets);
    const greeting = nodes.find((n) => n.id === "w-greeting");
    const launcher = nodes.find((n) =>
      widgets.some(
        (w) => w.instanceId === n.id && w.widgetId === "app-launcher",
      ),
    );
    expect(greeting?.sizeToContent).toBe(homeWidgetSizeLimits("greeting").maxH);
    expect(launcher?.sizeToContent).toBe(false);
  });

  it("sync key changes with geometry", () => {
    const widgets = defaultHomeLayout().widgets;
    const moved = widgets.map((w, i) =>
      i === 0 ? { ...w, col: 1, row: 2 } : w,
    );
    expect(homeGridStackSyncKey(widgets)).not.toBe(homeGridStackSyncKey(moved));
  });

  it("keeps free-resize sizes inside registry bounds", () => {
    const widgets = defaultHomeLayout().widgets;
    const activity = widgets.find((w) => w.widgetId === "activity");
    expect(activity).toBeTruthy();
    const limits = homeWidgetSizeLimits("activity");
    const next = gridStackNodesToHomeWidgets(
      [
        {
          id: activity!.instanceId,
          x: activity!.col,
          y: activity!.row,
          w: limits.maxW + 5,
          h: limits.maxH + 5,
        },
      ],
      [activity!],
    );
    expect(next[0]?.w).toBe(limits.maxW);
    expect(next[0]?.h).toBe(limits.maxH);
  });

  it("builds chat summary", () => {
    const summary = summarizeHomeLayoutForChat(defaultHomeLayout().widgets);
    expect(summary).toContain("greeting");
  });
});
