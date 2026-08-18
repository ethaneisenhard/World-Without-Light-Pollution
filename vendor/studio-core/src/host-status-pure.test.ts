import { describe, expect, it } from "vitest";
import {
  formatHostBytes,
  formatHostLoad,
  formatHostPercent,
  formatHostSlotsLine,
  hostDiskHealthLevel,
  hostMemoryHealthLevel,
  hostOverallHealthLevel,
  hostSlotsHealthLevel,
} from "./host-status-pure.js";

describe("host-status-pure", () => {
  it("formats bytes and percent", () => {
    expect(formatHostBytes(0)).toBe("0 B");
    expect(formatHostBytes(1536)).toBe("1.5 KB");
    expect(formatHostBytes(2 * 1024 * 1024 * 1024)).toBe("2 GB");
    expect(formatHostPercent(0.623)).toBe("62%");
  });

  it("formats load and slots", () => {
    expect(formatHostLoad([0.8, 1.1, 0.9])).toBe("0.80 · 1.10 · 0.90");
    expect(
      formatHostSlotsLine([
        { runtime: "wrangler", running: 1, limit: 2 },
        { runtime: "node", running: 3, limit: 10 },
      ]),
    ).toBe("wrangler 1/2 · node 3/10");
  });

  it("memory health levels", () => {
    expect(
      hostMemoryHealthLevel({
        totalBytes: 100,
        freeBytes: 40,
        usedBytes: 60,
      }),
    ).toBe("ok");
    expect(
      hostMemoryHealthLevel({
        totalBytes: 100,
        freeBytes: 15,
        usedBytes: 85,
      }),
    ).toBe("warn");
    expect(
      hostMemoryHealthLevel({
        totalBytes: 100,
        freeBytes: 5,
        usedBytes: 95,
      }),
    ).toBe("critical");
  });

  it("disk + slots + overall", () => {
    expect(
      hostDiskHealthLevel({
        path: "/",
        totalBytes: 100,
        freeBytes: 20,
        usedBytes: 80,
      }),
    ).toBe("ok");
    expect(
      hostDiskHealthLevel({
        path: "/",
        totalBytes: 100,
        freeBytes: 10,
        usedBytes: 90,
      }),
    ).toBe("warn");
    expect(
      hostSlotsHealthLevel([{ runtime: "wrangler", running: 2, limit: 2 }]),
    ).toBe("critical");
    expect(
      hostOverallHealthLevel({
        memory: { totalBytes: 100, freeBytes: 50, usedBytes: 50 },
        disk: null,
        slots: [{ runtime: "node", running: 8, limit: 10 }],
      }),
    ).toBe("warn");
  });
});
