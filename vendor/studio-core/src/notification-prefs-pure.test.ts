import { describe, expect, it } from "vitest";
import {
  DEFAULT_NOTIFICATION_SOURCE_ON,
  defaultStudioNotificationsConfig,
  isNotificationSourceEnabled,
  mergeNotificationsConfigPatch,
  parseStudioNotificationsConfig,
  resolveNotificationPrefs,
  workspaceIdForNotificationProject,
} from "./notification-prefs-pure.js";

describe("notification-prefs-pure", () => {
  it("workspaceId maps empty project to home", () => {
    expect(workspaceIdForNotificationProject(null)).toBe("_studio_home");
    expect(workspaceIdForNotificationProject("demo-blog")).toBe("demo-blog");
  });

  it("resolve inherits README defaults then config then workspace override", () => {
    const cfg = defaultStudioNotificationsConfig();
    expect(resolveNotificationPrefs(cfg, "_studio_home").sources.chat).toBe(
      true,
    );
    cfg.defaults.sources.chat = true;
    cfg.byWorkspace["demo-blog"] = { sources: { chat: false, messages: false } };
    const home = resolveNotificationPrefs(cfg, "_studio_home");
    expect(home.sources.chat).toBe(true);
    expect(home.sources.messages).toBe(DEFAULT_NOTIFICATION_SOURCE_ON.messages);
    const demo = resolveNotificationPrefs(cfg, "demo-blog");
    expect(demo.sources.chat).toBe(false);
    expect(demo.sources.messages).toBe(false);
    expect(demo.sources.workflows).toBe(true);
  });

  it("isNotificationSourceEnabled gates emit", () => {
    const cfg = parseStudioNotificationsConfig({
      defaults: { sources: { workflows: false }, toast: true },
      byWorkspace: {},
    });
    expect(isNotificationSourceEnabled(cfg, null, "workflows")).toBe(false);
    expect(isNotificationSourceEnabled(cfg, null, "messages")).toBe(true);
  });

  it("mergeNotificationsConfigPatch deep-merges workspace sources", () => {
    const base = defaultStudioNotificationsConfig();
    const next = mergeNotificationsConfigPatch(base, {
      byWorkspace: {
        "demo-blog": { sources: { messages: false }, toast: false },
      },
    });
    expect(next.byWorkspace["demo-blog"]?.sources?.messages).toBe(false);
    expect(next.byWorkspace["demo-blog"]?.toast).toBe(false);
    const again = mergeNotificationsConfigPatch(next, {
      byWorkspace: {
        "demo-blog": { sources: { forms: false } },
      },
    });
    expect(again.byWorkspace["demo-blog"]?.sources?.messages).toBe(false);
    expect(again.byWorkspace["demo-blog"]?.sources?.forms).toBe(false);
  });
});
