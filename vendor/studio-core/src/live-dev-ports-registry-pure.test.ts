import { describe, expect, it } from "vitest";
import {
  HOST_DEV_PORT_DENYLIST,
  LIVE_DEV_PORT_BAND,
  collectTakenLivePortsFromConfigs,
  hashProjectIdToBandOffset,
  isAssignableLiveDevPort,
  isDeniedLiveDevPort,
  resolveAssignedLiveDevPort,
  seedLinkedProjectConfig,
  suggestLiveDevPort,
} from "./live-dev-ports-registry-pure.js";

describe("live-dev-ports-registry-pure", () => {
  it("denies host and studio reserved ports", () => {
    expect(isDeniedLiveDevPort(8080)).toBe(true);
    expect(isDeniedLiveDevPort(3000)).toBe(true);
    expect(isDeniedLiveDevPort(4400)).toBe(true);
    expect(isDeniedLiveDevPort(9888)).toBe(false);
    expect(isAssignableLiveDevPort(9888)).toBe(true);
    expect(isAssignableLiveDevPort(8080)).toBe(false);
  });

  it("suggestLiveDevPort stays in band and is stable per projectId", () => {
    const a = suggestLiveDevPort({ projectId: "www-beehiiv" });
    const b = suggestLiveDevPort({ projectId: "www-beehiiv" });
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(LIVE_DEV_PORT_BAND.min);
    expect(a).toBeLessThanOrEqual(LIVE_DEV_PORT_BAND.max);
    expect(HOST_DEV_PORT_DENYLIST.has(a)).toBe(false);
  });

  it("suggestLiveDevPort walks past taken ports", () => {
    const base = suggestLiveDevPort({ projectId: "demo-blog" });
    const next = suggestLiveDevPort({
      projectId: "demo-blog",
      takenPorts: [base],
    });
    expect(next).not.toBe(base);
    expect(next).toBeGreaterThanOrEqual(LIVE_DEV_PORT_BAND.min);
    expect(next).toBeLessThanOrEqual(LIVE_DEV_PORT_BAND.max);
  });

  it("resolveAssignedLiveDevPort keeps allowed explicit ports", () => {
    expect(
      resolveAssignedLiveDevPort({
        projectId: "demo-blog",
        requested: 9888,
      }),
    ).toBe(9888);
    expect(
      resolveAssignedLiveDevPort({
        projectId: "demo-blog",
        requested: 8788,
      }),
    ).toBe(8788);
  });

  it("resolveAssignedLiveDevPort remaps denied host ports", () => {
    const port = resolveAssignedLiveDevPort({
      projectId: "www-beehiiv",
      requested: 8080,
    });
    expect(port).not.toBe(8080);
    expect(isAssignableLiveDevPort(port)).toBe(true);
  });

  it("resolveAssignedLiveDevPort remaps when requested is taken", () => {
    const port = resolveAssignedLiveDevPort({
      projectId: "other",
      requested: 9888,
      takenPorts: [9888],
    });
    expect(port).not.toBe(9888);
  });

  it("hash offset is in range", () => {
    const size = LIVE_DEV_PORT_BAND.max - LIVE_DEV_PORT_BAND.min + 1;
    expect(hashProjectIdToBandOffset("x", size)).toBeGreaterThanOrEqual(0);
    expect(hashProjectIdToBandOffset("x", size)).toBeLessThan(size);
  });

  it("collectTakenLivePortsFromConfigs skips except id", () => {
    const ports = collectTakenLivePortsFromConfigs(
      [
        { id: "a", dev: { port: 9888 } },
        { id: "b", dev: { port: 9889, servers: [{ id: "w", port: 8789, runtime: "node", command: "x", args: [], profiles: [] }] } },
      ],
      "a",
    );
    expect(ports).toContain(9889);
    expect(ports).toContain(8789);
    expect(ports).not.toContain(9888);
  });

  it("seedLinkedProjectConfig assigns band port", () => {
    const cfg = seedLinkedProjectConfig({ projectId: "new-app", name: "New" });
    expect(cfg.id).toBe("new-app");
    expect(isAssignableLiveDevPort(cfg.dev?.port)).toBe(true);
    expect(cfg.dev?.port).toBeGreaterThanOrEqual(LIVE_DEV_PORT_BAND.min);
    expect(cfg.dev?.servers?.[0]?.port).toBe(cfg.dev?.port);
  });
});
