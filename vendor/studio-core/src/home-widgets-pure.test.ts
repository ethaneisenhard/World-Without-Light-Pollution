import { describe, expect, it } from "vitest";
import {
  HOME_WIDGET_REGISTRY,
  homeGreetingSubtitle,
  homeGreetingTitle,
  homeWidgetSizeToContent,
  isKnownHomeWidgetId,
  listHomeWidgetDefs,
  nextHomeWidgetSize,
} from "./home-widget-registry-pure.js";
import {
  applyHomeLayoutPatch,
  defaultHomeLayout,
  findFreeCell,
  layoutHasCollision,
  parseStudioHomeConfig,
  projectLayoutToCols,
  resolveHomeLayout,
  widgetsOverlap,
} from "./home-widgets-pure.js";

describe("home-widget-registry", () => {
  it("lists builtin widgets", () => {
    expect(listHomeWidgetDefs().length).toBe(HOME_WIDGET_REGISTRY.length);
    expect(isKnownHomeWidgetId("greeting")).toBe(true);
    expect(isKnownHomeWidgetId("nope")).toBe(false);
  });

  it("cycles sizes and greets by profile name", () => {
    expect(nextHomeWidgetSize("greeting", 2, 1)).toEqual({ w: 3, h: 1 });
    expect(nextHomeWidgetSize("app-launcher", 1, 1)).toEqual({ w: 2, h: 1 });
    expect(homeGreetingTitle("Ethan")).toBe("Welcome in, Ethan");
    expect(homeGreetingTitle("")).toBe("Welcome in");
    expect(homeGreetingSubtitle("").needsProfileName).toBe(true);
    expect(homeGreetingSubtitle("Ethan").needsProfileName).toBe(false);
  });

  it("sizeToContent for peeks only", () => {
    expect(homeWidgetSizeToContent("greeting")).toBe(true);
    expect(homeWidgetSizeToContent("activity")).toBe(true);
    expect(homeWidgetSizeToContent("app-launcher")).toBe(false);
    expect(homeWidgetSizeToContent("apps-folder")).toBe(false);
  });
});

describe("home-widgets-pure", () => {
  it("default layout has no collisions", () => {
    const layout = defaultHomeLayout();
    expect(layoutHasCollision(layout.widgets)).toBe(false);
    expect(layout.widgets.some((w) => w.widgetId === "greeting")).toBe(true);
    const launchers = layout.widgets.filter((w) => w.widgetId === "app-launcher");
    expect(launchers.length).toBe(4);
    expect(launchers.every((w) => w.h === 2)).toBe(true);
  });

  it("parse empty → default layout id", () => {
    const cfg = parseStudioHomeConfig(undefined);
    expect(resolveHomeLayout(cfg).widgets.length).toBe(
      defaultHomeLayout().widgets.length,
    );
  });

  it("detects overlap", () => {
    expect(
      widgetsOverlap(
        { col: 0, row: 0, w: 2, h: 1 },
        { col: 1, row: 0, w: 2, h: 1 },
      ),
    ).toBe(true);
    expect(
      widgetsOverlap(
        { col: 0, row: 0, w: 2, h: 1 },
        { col: 2, row: 0, w: 2, h: 1 },
      ),
    ).toBe(false);
  });

  it("patch add / move / remove", () => {
    let layout = { widgets: [] as ReturnType<typeof defaultHomeLayout>["widgets"] };
    const added = applyHomeLayoutPatch(layout, [
      { op: "add", widgetId: "greeting", col: 0, row: 0 },
    ]);
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    layout = added.layout;
    expect(layout.widgets).toHaveLength(1);

    const moved = applyHomeLayoutPatch(layout, [
      { op: "move", instanceId: layout.widgets[0]!.instanceId, col: 2, row: 0 },
    ]);
    expect(moved.ok).toBe(true);
    if (!moved.ok) return;
    expect(moved.layout.widgets[0]!.col).toBe(2);

    const removed = applyHomeLayoutPatch(moved.layout, [
      { op: "remove", instanceId: moved.layout.widgets[0]!.instanceId },
    ]);
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(removed.layout.widgets).toHaveLength(0);
  });

  it("findFreeCell skips occupied", () => {
    const layout = defaultHomeLayout();
    const free = findFreeCell(layout.widgets, 1, 1);
    expect(free).not.toBeNull();
    if (!free) return;
    expect(
      layout.widgets.every(
        (w) =>
          !widgetsOverlap(
            { col: free.col, row: free.row, w: 1, h: 1 },
            w,
          ),
      ),
    ).toBe(true);
  });

  it("projectLayoutToCols packs into 2 columns", () => {
    const projected = projectLayoutToCols(defaultHomeLayout(), 2);
    expect(layoutHasCollision(projected.widgets, 2)).toBe(false);
    expect(projected.widgets.every((w) => w.col + w.w <= 2)).toBe(true);
  });
});
