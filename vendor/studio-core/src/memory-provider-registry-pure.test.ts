import { describe, expect, it, afterEach } from "vitest";
import {
  clearMemoryImportProjectorOverrides,
  getMemoryImportProjector,
  importMemoryViaProviderRegistry,
  listMemoryImportProviderIds,
  registerMemoryImportProjector,
} from "./memory-provider-registry-pure.js";

describe("memory-provider-registry-pure", () => {
  afterEach(() => {
    clearMemoryImportProjectorOverrides();
  });

  it("lists built-in projectors — no host if-branches", () => {
    expect(listMemoryImportProviderIds()).toEqual(["hermes", "letta"]);
    expect(getMemoryImportProjector("hermes")?.id).toBe("hermes");
    expect(getMemoryImportProjector("studio")).toBeNull();
  });

  it("imports via registry lookup", () => {
    const r = importMemoryViaProviderRegistry({
      providerId: "hermes",
      dump: { memories: [{ id: "1", content: "Prefers Tailwind" }] },
      now: 1,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.rows[0]!.status).toBe("staged");
      expect(r.rows[0]!.source).toContain("hermes:");
    }
  });

  it("rejects unknown provider with registered list", () => {
    const r = importMemoryViaProviderRegistry({
      providerId: "unknown-vendor",
      dump: {},
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("hermes");
  });

  it("allows plugin register without forking hosts", () => {
    registerMemoryImportProjector({
      id: "hermes",
      origin: "harness_synced",
      dumpToDrafts: () => [{ content: "override", source: "x" }],
    });
    const r = importMemoryViaProviderRegistry({
      providerId: "hermes",
      dump: { memories: [] },
      now: 2,
    });
    expect(r.ok && r.rows[0]?.content).toBe("override");
  });
});
