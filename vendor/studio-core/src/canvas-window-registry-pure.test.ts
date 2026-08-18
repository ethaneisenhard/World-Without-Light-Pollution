import { afterEach, describe, expect, it } from "vitest";
import {
  applyCanvasWindowPluginContrib,
  assertCanvasWindowRegistryInvariants,
  CANVAS_WINDOW_REGISTRY,
  canvasUrlFlagKeys,
  canvasWindowIds,
  deriveViewMenuGroups,
  isCanvasWindowVisible,
  kindFromCanvasWindowId,
  listCanvasWindows,
  mergeCanvasWindowRegistry,
  resetActiveCanvasWindowRegistry,
  resolveCanvasWindowPresentation,
  visibleCanvasWindows,
  visibleViewMenuGroups,
  studioWindowKindsRecord,
  type CanvasWindowDef,
} from "./canvas-window-registry-pure.js";
import { VIEW_MENU_GROUPS, viewMenuItemIds } from "./view-menu-pure.js";

const EXAMPLE_CONTRIB: CanvasWindowDef = {
  id: "example-contrib",
  title: "Example Contrib",
  label: "Example Contrib",
  hint: "Plugin canvas.windows fixture",
  viewGroup: "panels",
  order: 999,
  urlFlag: "example-contrib",
  windowId: "studio-example-contrib",
  icon: "puzzle-piece",
  accentClass: "studio-win--example-contrib",
  visibility: { mode: "always" },
};

describe("canvas-window-registry-pure", () => {
  it("passes unique id / urlFlag / windowId invariants", () => {
    expect(() => assertCanvasWindowRegistryInvariants()).not.toThrow();
    expect(canvasWindowIds().length).toBe(CANVAS_WINDOW_REGISTRY.length);
  });

  it("derives STUDIO_WINDOW_KINDS-shaped record for every id", () => {
    const kinds = studioWindowKindsRecord();
    for (const id of canvasWindowIds()) {
      expect(kinds[id].id).toBe(id);
      expect(kinds[id].windowId).toMatch(/^studio-/);
      expect(kinds[id].icon.length).toBeGreaterThan(0);
    }
  });

  it("View menu groups match registry viewGroup bands (messages omitted)", () => {
    const derived = deriveViewMenuGroups();
    expect(derived.map((g) => g.id)).toEqual([
      "studio",
      "canvas",
      "runtime",
      "panels",
    ]);
    expect(viewMenuItemIds()).not.toContain("messages");
    expect(canvasWindowIds()).toContain("messages");
    expect(VIEW_MENU_GROUPS).toEqual(derived);
    const labels = Object.fromEntries(
      viewMenuItemIds().map((id) => {
        const item = VIEW_MENU_GROUPS.flatMap((g) => [...g.items]).find(
          (i) => i.id === id,
        );
        return [id, item?.label];
      }),
    );
    expect(labels.code).toBe("Code");
    expect(labels.live).toBe("Website Preview");
    expect(labels.workspace).toBe("Workspace Home");
    expect(labels.converter).toBe("File Converter");
  });

  it("resolves globalShell face for workspace without host one-offs", () => {
    const workspace = CANVAS_WINDOW_REGISTRY.find((d) => d.id === "workspace")!;
    expect(resolveCanvasWindowPresentation(workspace, {}).label).toBe(
      "Workspace Home",
    );
    expect(
      resolveCanvasWindowPresentation(workspace, { globalShell: true }).label,
    ).toBe("Workspaces");
    expect(
      resolveCanvasWindowPresentation(workspace, { globalShell: true }).title,
    ).toBe("Workspaces");
    const globalMenu = deriveViewMenuGroups(CANVAS_WINDOW_REGISTRY, {
      globalShell: true,
    });
    const item = globalMenu
      .flatMap((g) => [...g.items])
      .find((i) => i.id === "workspace");
    expect(item?.label).toBe("Workspaces");
    expect(item?.hint).toBe("All linked workspaces");
  });

  it("maps windowId → kind including legacy sandbox", () => {
    expect(kindFromCanvasWindowId("studio-code")).toBe("code");
    expect(kindFromCanvasWindowId("studio-sandbox")).toBe("design");
    expect(kindFromCanvasWindowId("nope")).toBeNull();
  });

  it("url flags cover every registry id", () => {
    const flags = canvasUrlFlagKeys();
    expect(new Set(flags).size).toBe(flags.length);
    for (const id of canvasWindowIds()) {
      expect(flags).toContain(id);
    }
  });

  it("filters app-only windows from planning views", () => {
    const code = CANVAS_WINDOW_REGISTRY.find((def) => def.id === "code")!;
    expect(isCanvasWindowVisible(code, {})).toBe(true);
    expect(isCanvasWindowVisible(code, { kind: "planning" })).toBe(false);

    const planning = visibleCanvasWindows(CANVAS_WINDOW_REGISTRY, {
      kind: "planning",
    }).map((def) => def.id);
    expect(planning).toContain("home");
    expect(planning).toContain("workspace");
    expect(planning).toContain("settings");
    expect(planning).toContain("chat");
    expect(planning).toContain("calendar");
    expect(planning).toContain("media");
    expect(planning).toContain("memory");
    expect(planning).toContain("roadmap");
    expect(planning).toContain("notes");
    expect(planning).not.toContain("code");
    expect(planning).not.toContain("live");
    expect(planning).not.toContain("design");
    expect(planning).not.toContain("runtimes");
    expect(planning).not.toContain("terminal");
    expect(planning).not.toContain("converter");
    expect(planning).not.toContain("data");
    expect(planning).not.toContain("forms");
    expect(planning).not.toContain("integrations");
    expect(planning).not.toContain("workflows");
    expect(planning).not.toContain("email");
    expect(planning).not.toContain("analytics");

    const planningMenuIds = visibleViewMenuGroups({ kind: "planning" }).flatMap(
      (group) => group.items.map((item) => item.id),
    );
    expect(planningMenuIds).toContain("home");
    expect(planningMenuIds).toContain("workspace");
    expect(planningMenuIds).toContain("settings");
    expect(planningMenuIds).toContain("chat");
    expect(planningMenuIds).toContain("calendar");
    expect(planningMenuIds).toContain("media");
    expect(planningMenuIds).toContain("memory");
    expect(planningMenuIds).toContain("roadmap");
    expect(planningMenuIds).toContain("notes");
    expect(planningMenuIds).not.toContain("code");
    expect(planningMenuIds).not.toContain("live");
    expect(planningMenuIds).not.toContain("design");
    expect(planningMenuIds).not.toContain("runtimes");
    expect(planningMenuIds).not.toContain("terminal");
    expect(planningMenuIds).not.toContain("converter");
    expect(planningMenuIds).not.toContain("data");
    expect(planningMenuIds).not.toContain("forms");
    expect(planningMenuIds).not.toContain("integrations");
    expect(planningMenuIds).not.toContain("workflows");
    expect(planningMenuIds).not.toContain("email");
    expect(planningMenuIds).not.toContain("analytics");

    const appMenuIds = visibleViewMenuGroups({ kind: "app" }).flatMap((group) =>
      group.items.map((item) => item.id),
    );
    expect(appMenuIds).toContain("code");
    expect(appMenuIds).toContain("live");
    expect(appMenuIds).toContain("analytics");
  });

  it("listCanvasWindows filters planning vs app", () => {
    const planning = listCanvasWindows({ projectKind: "planning" });
    expect(planning.some((w) => w.id === "notes")).toBe(true);
    expect(planning.some((w) => w.id === "code")).toBe(false);
    const app = listCanvasWindows({ projectKind: "app" });
    expect(app.some((w) => w.id === "code")).toBe(true);
    expect(app.some((w) => w.id === "notes")).toBe(true);
  });

  describe("plugin canvas.windows merge", () => {
    afterEach(() => {
      resetActiveCanvasWindowRegistry();
    });

    it("merges contrib; skips id collision unless allowOverride", () => {
      const ok = mergeCanvasWindowRegistry(CANVAS_WINDOW_REGISTRY, [
        EXAMPLE_CONTRIB,
      ]);
      expect(ok.skipped).toEqual([]);
      expect(ok.registry.some((d) => d.id === "example-contrib")).toBe(true);

      const collide = mergeCanvasWindowRegistry(CANVAS_WINDOW_REGISTRY, [
        { ...EXAMPLE_CONTRIB, id: "notes", urlFlag: "notes-plugin", windowId: "studio-notes-plugin" },
      ]);
      expect(collide.skipped).toEqual([
        {
          id: "notes",
          reason: "id conflicts with builtin (allowOverride=false)",
        },
      ]);
      expect(
        collide.registry.find((d) => d.id === "notes")?.windowId,
      ).toBe("studio-notes");

      const overridden = mergeCanvasWindowRegistry(
        CANVAS_WINDOW_REGISTRY,
        [
          {
            ...EXAMPLE_CONTRIB,
            id: "notes",
            urlFlag: "notes",
            windowId: "studio-notes",
            label: "Notes (plugin)",
          },
        ],
        { allowOverride: true },
      );
      expect(overridden.skipped).toEqual([]);
      expect(overridden.registry.find((d) => d.id === "notes")?.label).toBe(
        "Notes (plugin)",
      );
    });

    it("applyCanvasWindowPluginContrib updates active View menu", () => {
      applyCanvasWindowPluginContrib([]);
      expect(
        visibleViewMenuGroups({}).flatMap((g) => g.items.map((i) => i.id)),
      ).not.toContain("example-contrib");

      applyCanvasWindowPluginContrib([EXAMPLE_CONTRIB]);
      const ids = visibleViewMenuGroups({}).flatMap((g) =>
        g.items.map((i) => i.id),
      );
      expect(ids).toContain("example-contrib");
    });
  });
});
