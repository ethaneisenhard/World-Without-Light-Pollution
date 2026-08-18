import { describe, expect, it } from "vitest";
import {
  getSidecarCatalogRow,
  listDefaultDogfoodSidecars,
  listRequiredSidecars,
  orderSidecarsForProvision,
  SIDECAR_CATALOG,
} from "./sidecar-catalog-registry-pure.js";

describe("sidecar-catalog-registry-pure", () => {
  it("has worker + host required", () => {
    expect(listRequiredSidecars().map((r) => r.id).sort()).toEqual([
      "host",
      "worker",
    ]);
  });

  it("looks up by id", () => {
    expect(getSidecarCatalogRow("n8n")?.label).toBe("n8n");
    expect(getSidecarCatalogRow("nope")).toBeUndefined();
  });

  it("orders zulip after zulip-db", () => {
    expect(orderSidecarsForProvision(["zulip", "zulip-db"])).toEqual([
      "zulip-db",
      "zulip",
    ]);
  });

  it("dogfood pack includes n8n + host", () => {
    const ids = listDefaultDogfoodSidecars().map((r) => r.id);
    expect(ids).toContain("n8n");
    expect(ids).toContain("litellm");
    expect(ids).toContain("host");
    expect(ids).toContain("worker");
  });

  it("catalog is extensible by row count > 0", () => {
    expect(SIDECAR_CATALOG.length).toBeGreaterThanOrEqual(8);
  });
});
