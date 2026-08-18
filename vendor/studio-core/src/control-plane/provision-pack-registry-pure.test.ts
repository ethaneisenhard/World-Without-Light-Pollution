import { describe, expect, it } from "vitest";
import {
  HOST_ATTACH_PROVISION_STEPS,
  listAvailableProvisionPacks,
  provisionPackCreateDefaults,
  sidecarIdsForPack,
} from "./provision-pack-registry-pure.js";

describe("provision-pack-registry-pure", () => {
  it("studio-cloud is host+worker ordered", () => {
    expect(sidecarIdsForPack("studio-cloud")).toEqual(["host", "worker"]);
  });

  it("studio-automate includes n8n + litellm", () => {
    expect(sidecarIdsForPack("studio-automate")).toContain("n8n");
    expect(sidecarIdsForPack("studio-automate")).toContain("litellm");
    expect(sidecarIdsForPack("studio-automate")).toContain("host");
  });

  it("available packs exclude all-inclusive preview", () => {
    const ids = listAvailableProvisionPacks().map((p) => p.id);
    expect(ids).toContain("studio-cloud");
    expect(ids).not.toContain("all-inclusive");
  });

  it("attach steps are four ADR beats", () => {
    expect(HOST_ATTACH_PROVISION_STEPS).toHaveLength(4);
    expect(HOST_ATTACH_PROVISION_STEPS[0]?.title).toMatch(/source of truth/i);
    expect(HOST_ATTACH_PROVISION_STEPS[2]?.title).toMatch(/Compute/i);
  });

  it("hosted packs stamp compute.hosted + media-r2", () => {
    const d = provisionPackCreateDefaults("studio-cloud");
    expect(d?.computePlacement).toBe("hosted");
    expect(d?.providers.media?.plugin).toBe("media-r2");
    expect(
      provisionPackCreateDefaults("studio-automate")?.providers.media?.plugin,
    ).toBe("media-r2");
  });
});
