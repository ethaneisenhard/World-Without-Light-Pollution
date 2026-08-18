import { describe, expect, it } from "vitest";
import {
  resolveChatActiveTurnUrl,
  resolveChatPostUrl,
  resolveChatTurnCancelUrl,
  resolveChatTurnEventsUrl,
  resolveStudioDevApiBase,
} from "./chat-api-url-pure.js";

const loc4400 = {
  protocol: "http:",
  hostname: "127.0.0.1",
  port: "4400",
} as const;

describe("chat-api-url-pure", () => {
  it("always same-origin — never bypass to :3847 (Host token + session)", () => {
    expect(resolveStudioDevApiBase(loc4400)).toBeNull();
    expect(resolveStudioDevApiBase(loc4400, null)).toBeNull();
    expect(
      resolveStudioDevApiBase(loc4400, "http://127.0.0.1:3847"),
    ).toBeNull();
    expect(
      resolveStudioDevApiBase(loc4400, "https://api.desk.browserui.site"),
    ).toBeNull();
    expect(resolveChatPostUrl("www-beehiiv", loc4400)).toBe(
      "/api/projects/www-beehiiv/chat",
    );
    expect(
      resolveChatPostUrl("www-beehiiv", loc4400, "http://127.0.0.1:3847"),
    ).toBe("/api/projects/www-beehiiv/chat");
    expect(
      resolveChatPostUrl("p1", {
        location: loc4400,
        apiProxyOrigin: "https://api.desk.browserui.site",
      }),
    ).toBe("/api/projects/p1/chat");
  });

  it("resolves turn subscribe / cancel / active same-origin", () => {
    expect(resolveChatTurnEventsUrl("p1", "t9", loc4400, 2)).toBe(
      "/api/projects/p1/chat/turns/t9/events?fromSeq=2",
    );
    expect(resolveChatTurnCancelUrl("p1", "t9", loc4400)).toBe(
      "/api/projects/p1/chat/turns/t9/cancel",
    );
    expect(resolveChatActiveTurnUrl("p1", "s1", loc4400)).toBe(
      "/api/projects/p1/chat/turns/active?sessionId=s1",
    );
    const local = "http://127.0.0.1:3847";
    expect(resolveChatTurnEventsUrl("p1", "t9", loc4400, 2, local)).toBe(
      "/api/projects/p1/chat/turns/t9/events?fromSeq=2",
    );
    expect(resolveChatTurnCancelUrl("p1", "t9", loc4400, local)).toBe(
      "/api/projects/p1/chat/turns/t9/cancel",
    );
    expect(resolveChatActiveTurnUrl("p1", "s1", loc4400, local)).toBe(
      "/api/projects/p1/chat/turns/active?sessionId=s1",
    );
  });
});
