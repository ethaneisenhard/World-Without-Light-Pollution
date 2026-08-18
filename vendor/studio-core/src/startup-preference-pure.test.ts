import { describe, expect, it } from "vitest";
import {
  defaultDesktopStartupSurface,
  defaultMobileStartupSurface,
  defaultStartupPreference,
  parseStartupPreference,
  patchStartupSurface,
  preferredFocusKindFromParams,
  resolveStartupBoot,
  shouldApplyStartupPreference,
  startupSurfaceFor,
} from "./startup-preference-pure.js";
import { patchStudioConfig, defaultStudioConfig } from "./studio-config-pure.js";

describe("defaultStartupPreference", () => {
  it("desktop opens Agent Home only; mobile opens Home+Chat focus chat", () => {
    const d = defaultStartupPreference();
    expect(d.destination).toBe("agent-home");
    expect(d.desktop).toEqual(defaultDesktopStartupSurface());
    expect(d.mobile).toEqual(defaultMobileStartupSurface());
    expect(d.windows.home).toBe(true);
    expect(d.windows.chat).toBeUndefined();
    expect(d.mobile.windows.chat).toBe(true);
    expect(d.mobile.focusKind).toBe("chat");
    expect(d.layoutMode).toBe("single");
    expect(d.leftTab).toBe("none");
  });
});

describe("shouldApplyStartupPreference", () => {
  it("applies on bare index", () => {
    expect(shouldApplyStartupPreference(new URLSearchParams())).toBe(true);
  });

  it("skips when shareable window flags present (URL owns open set)", () => {
    expect(
      shouldApplyStartupPreference(new URLSearchParams("home=1&chat=1")),
    ).toBe(false);
    expect(
      shouldApplyStartupPreference(new URLSearchParams("messages=1&home=1")),
    ).toBe(false);
    expect(
      shouldApplyStartupPreference(new URLSearchParams("code=0")),
    ).toBe(true);
  });

  it("skips when project deep link present", () => {
    expect(
      shouldApplyStartupPreference(new URLSearchParams("project=demo-blog")),
    ).toBe(false);
    expect(
      shouldApplyStartupPreference(
        new URLSearchParams("project=demo-blog&home=1"),
      ),
    ).toBe(false);
  });
});

describe("preferredFocusKindFromParams", () => {
  it("prefers last non-home open flag", () => {
    expect(
      preferredFocusKindFromParams(new URLSearchParams("messages=1&home=1")),
    ).toBe("messages");
    expect(
      preferredFocusKindFromParams(new URLSearchParams("home=1&chat=1")),
    ).toBe("chat");
    expect(preferredFocusKindFromParams(new URLSearchParams("home=1"))).toBe(
      "home",
    );
    expect(preferredFocusKindFromParams(new URLSearchParams())).toBeNull();
  });
});

describe("resolveStartupBoot", () => {
  it("desktop writes home-only single and clears project", () => {
    const result = resolveStartupBoot({
      params: new URLSearchParams("tab=files"),
      preference: defaultStartupPreference(),
      projectIds: ["demo-blog"],
      lastProjectId: "demo-blog",
      surface: "desktop",
    });
    expect(result.kind).toBe("apply");
    if (result.kind !== "apply") return;
    expect(result.params.get("home")).toBe("1");
    expect(result.params.has("chat")).toBe(false);
    expect(result.params.has("code")).toBe(false);
    expect(result.params.has("live")).toBe(false);
    expect(result.params.has("project")).toBe(false);
    expect(result.params.has("tab")).toBe(false);
    expect(result.params.get("focus")).toBe("home");
    expect(result.layoutMode).toBe("single");
    expect(result.splitPanes).toEqual([]);
    expect(result.focusKind).toBe("home");
    expect(result.surface).toBe("desktop");
  });

  it("mobile writes home+chat focus chat (no flash to home-only)", () => {
    const result = resolveStartupBoot({
      params: new URLSearchParams(),
      preference: defaultStartupPreference(),
      projectIds: [],
      lastProjectId: "",
      surface: "mobile",
    });
    expect(result.kind).toBe("apply");
    if (result.kind !== "apply") return;
    expect(result.params.get("home")).toBe("1");
    expect(result.params.get("chat")).toBe("1");
    expect(result.params.get("tab")).toBe("ai");
    expect(result.params.get("focus")).toBe("chat");
    expect(result.focusKind).toBe("chat");
    expect(result.layoutMode).toBe("single");
    expect(result.surface).toBe("mobile");
  });

  it("skips when shareable window flags present (does not overwrite URL)", () => {
    const pref = parseStartupPreference({
      windows: { home: true, chat: false },
      layoutMode: "single",
      focusKind: "home",
      splitPanes: ["home"],
    });
    const result = resolveStartupBoot({
      params: new URLSearchParams("home=1&chat=1"),
      preference: pref,
      projectIds: [],
      lastProjectId: "",
      surface: "desktop",
    });
    expect(result.kind).toBe("skip");
  });

  it("skips messages+home share URL", () => {
    const result = resolveStartupBoot({
      params: new URLSearchParams("messages=1&home=1"),
      preference: defaultStartupPreference(),
      projectIds: [],
      lastProjectId: "",
      surface: "desktop",
    });
    expect(result.kind).toBe("skip");
  });

  it("skips when project is set", () => {
    const result = resolveStartupBoot({
      params: new URLSearchParams("project=demo-blog&home=1"),
      preference: defaultStartupPreference(),
      projectIds: [],
      lastProjectId: "",
    });
    expect(result.kind).toBe("skip");
  });
});

describe("parseStartupPreference", () => {
  it("fills defaults for partial JSON", () => {
    const p = parseStartupPreference({
      destination: "last-project",
      windows: { code: true, live: true },
      layoutMode: "single",
    });
    expect(p.destination).toBe("last-project");
    expect(p.windows.code).toBe(true);
    expect(p.desktop.windows.code).toBe(true);
    expect(p.leftTab).toBe("none");
    expect(p.mobile.focusKind).toBe("chat");
    expect(p.mobile.windows.chat).toBe(true);
  });

  it("reads nested mobile without clobbering desktop", () => {
    const p = parseStartupPreference({
      windows: { home: true },
      focusKind: "home",
      mobile: {
        windows: { home: true, chat: true, media: true },
        focusKind: "media",
        leftTab: "files",
      },
    });
    expect(p.desktop.focusKind).toBe("home");
    expect(p.mobile.focusKind).toBe("media");
    expect(p.mobile.windows.media).toBe(true);
    expect(p.mobile.leftTab).toBe("files");
  });

  it("startupSurfaceFor tolerates flat wire configs (no desktop/mobile)", () => {
    const flat = {
      destination: "agent-home",
      projectId: "",
      windows: { home: true },
      focusKind: "home",
      layoutMode: "single",
      splitPanes: [],
      leftTab: "none",
    } as ReturnType<typeof defaultStartupPreference>;
    expect(startupSurfaceFor(flat, "mobile").windows.chat).toBe(true);
    expect(startupSurfaceFor(flat, "desktop").windows.home).toBe(true);
    expect(() =>
      resolveStartupBoot({
        params: new URLSearchParams(),
        preference: flat,
        projectIds: [],
        lastProjectId: "",
        surface: "mobile",
      }),
    ).not.toThrow();
  });
});

describe("startupSurfaceFor / patchStartupSurface", () => {
  it("forces single layout on mobile", () => {
    const pref = patchStartupSurface(defaultStartupPreference(), "desktop", {
      layoutMode: "split",
      splitPanes: ["home", "chat"],
      windows: { home: true, chat: true },
    });
    expect(startupSurfaceFor(pref, "mobile").layoutMode).toBe("single");
    expect(startupSurfaceFor(pref, "desktop").layoutMode).toBe("split");
  });
});

describe("patchStudioConfig startup windows", () => {
  it("persists unchecked chat (false) so desktop boot can omit it", () => {
    const base = defaultStudioConfig();
    const next = patchStudioConfig(base, {
      startup: {
        windows: { home: true, chat: false },
        layoutMode: "single",
        splitPanes: ["home"],
      },
    });
    expect(next.startup.windows.home).toBe(true);
    expect(next.startup.windows.chat).toBe(false);
    expect(next.startup.mobile.windows.chat).toBe(true);
    const boot = resolveStartupBoot({
      params: new URLSearchParams(),
      preference: next.startup,
      projectIds: [],
      lastProjectId: "",
      surface: "desktop",
    });
    expect(boot.kind).toBe("apply");
    if (boot.kind !== "apply") return;
    expect(boot.params.has("chat")).toBe(false);
    expect(boot.params.get("home")).toBe("1");
  });

  it("patches mobile surface independently", () => {
    const next = patchStudioConfig(defaultStudioConfig(), {
      startup: {
        mobile: {
          windows: { home: true, chat: true, settings: true },
          focusKind: "settings",
        },
      },
    });
    expect(next.startup.desktop.focusKind).toBe("home");
    expect(next.startup.mobile.focusKind).toBe("settings");
    expect(next.startup.mobile.windows.settings).toBe(true);
  });
});
