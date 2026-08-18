import { describe, expect, it } from "vitest";
import {
  AS_HMR_PROTOCOL,
  VITE_FULL_RELOAD_PROTOCOL,
  hmrInvalidateMessage,
  hmrNeedsNotify,
  hmrUpdateMessage,
  isAsHmrV1,
  isHmrUpdatedMessage,
  isProjectLiveHmr,
  isViteFullReloadHmr,
} from "./hmr-protocol-pure.js";

describe("hmr-protocol-pure", () => {
  it("builds update + invalidate (trigger only — no seq)", () => {
    expect(hmrUpdateMessage("pages/home.md", "# hi")).toEqual({
      type: "as:hmr-update",
      path: "pages/home.md",
      content: "# hi",
    });
    expect(hmrInvalidateMessage()).toEqual({ type: "as:hmr-invalidate" });
    expect(hmrInvalidateMessage("pages/home.md")).toEqual({
      type: "as:hmr-invalidate",
      path: "pages/home.md",
    });
  });

  it("guards optional ack", () => {
    expect(isHmrUpdatedMessage({ type: "as:hmr-updated", ok: true })).toBe(
      true,
    );
    expect(isHmrUpdatedMessage({ type: "as:hmr-update" })).toBe(false);
  });

  it("hmrNeedsNotify until notified content matches", () => {
    expect(hmrNeedsNotify("a", null)).toBe(true);
    expect(hmrNeedsNotify("a", "a")).toBe(false);
    expect(hmrNeedsNotify("ab", "a")).toBe(true);
  });

  it("validates hosting.hmr as-hmr/1", () => {
    expect(
      isAsHmrV1({ bridge: "/as-hmr-bridge.js", protocol: AS_HMR_PROTOCOL }),
    ).toBe(true);
    expect(isAsHmrV1({ bridge: "/x.js", protocol: "other" })).toBe(false);
    expect(isAsHmrV1(null)).toBe(false);
    expect(isAsHmrV1({ protocol: AS_HMR_PROTOCOL })).toBe(false);
  });

  it("validates vite-full-reload/1", () => {
    expect(
      isViteFullReloadHmr({
        bridge: "/as-hmr-bridge.js",
        protocol: VITE_FULL_RELOAD_PROTOCOL,
        viteClient: "http://127.0.0.1:5193/@vite/client",
      }),
    ).toBe(true);
    expect(
      isViteFullReloadHmr({ bridge: "/x.js", protocol: AS_HMR_PROTOCOL }),
    ).toBe(false);
    expect(
      isProjectLiveHmr({
        bridge: "/x.js",
        protocol: VITE_FULL_RELOAD_PROTOCOL,
      }),
    ).toBe(true);
  });
});
