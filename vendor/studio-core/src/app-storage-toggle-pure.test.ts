import { describe, expect, it } from "vitest";
import {
  appStoragePatchBody,
  appStorageSectionCopy,
  applyAppStorageToggleOptimistic,
  buildAppStorageToggleRows,
  cloudStorageOnToPlacement,
  placementToCloudStorageOn,
} from "./app-storage-toggle-pure.js";

describe("app-storage-toggle-pure", () => {
  it("maps placement ↔ cloud switch", () => {
    expect(placementToCloudStorageOn("hosted")).toBe(true);
    expect(placementToCloudStorageOn("byo")).toBe(true);
    expect(placementToCloudStorageOn("local")).toBe(false);
    expect(cloudStorageOnToPlacement(true)).toBe("hosted");
    expect(cloudStorageOnToPlacement(false)).toBe("local");
  });

  it("builds iCloud-style rows", () => {
    const rows = buildAppStorageToggleRows([
      { id: "blog", name: "Blog", computePlacement: "hosted" },
      { id: "local-app", name: "Local", compute: { placement: "local" } },
    ]);
    expect(rows[0]?.cloudOn).toBe(true);
    expect(rows[0]?.detail).toMatch(/In Cloud/i);
    expect(rows[1]?.cloudOn).toBe(false);
    expect(rows[1]?.detail).toMatch(/this computer/i);
  });

  it("optimistic toggle + patch body", () => {
    const rows = buildAppStorageToggleRows([
      { id: "a", name: "A", computePlacement: "hosted" },
    ]);
    const next = applyAppStorageToggleOptimistic(rows, "a", false);
    expect(next[0]?.placement).toBe("local");
    expect(appStoragePatchBody("a", false)).toEqual({
      projectId: "a",
      placement: "local",
    });
    expect(appStorageSectionCopy().title).toBe("App storage");
  });
});
