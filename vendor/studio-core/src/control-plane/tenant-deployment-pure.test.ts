import { describe, expect, it } from "vitest";
import { seedDogfoodControlPlane } from "./dogfood-seed-pure.js";
import { legacyResourcesForSidecars } from "./legacy-fly-attach-pure.js";
import {
  controlPlaneFlyAppName,
  controlPlaneResourceName,
  createTenant,
  normalizeTenantSlug,
  studioDeploymentId,
  tenantShortId,
} from "./tenant-deployment-pure.js";

describe("tenant-deployment-pure", () => {
  it("normalizes slugs", () => {
    expect(normalizeTenantSlug("DogFood")).toBe("dogfood");
    expect(normalizeTenantSlug("-bad")).toBeNull();
  });

  it("shortIds stay unique for tenant_user* commercial ids", () => {
    const a = tenantShortId("tenant_user3f930d7f51");
    const b = tenantShortId("tenant_user21d5377509");
    expect(a).toBe("user3f93");
    expect(b).toBe("user21d5");
    expect(a).not.toBe(b);
    expect(a).not.toBe("tenantus");
  });

  it("deployment ids follow tenant id, not shared shortId", () => {
    expect(studioDeploymentId("tenant_user3f930d7f51")).toBe(
      "deploy_tenantuser3f930d7f51_studio",
    );
    expect(studioDeploymentId("tenant_user21d5377509")).not.toBe(
      studioDeploymentId("tenant_user3f930d7f51"),
    );
  });

  it("names resources bu_<short>_<sidecar>", () => {
    const t = createTenant({
      id: "tenant_abc12345",
      slug: "acme",
      displayName: "Acme",
    });
    if ("error" in t) throw new Error(t.error);
    expect(t.shortId).toBe("abc12345");
    expect(controlPlaneResourceName(t.shortId, "n8n")).toBe(
      `bu_${t.shortId}_n8n`,
    );
    expect(controlPlaneFlyAppName(t.shortId, "n8n")).toBe(
      `bu-${t.shortId}-n8n`,
    );
  });

  it("seeds dogfood with legacy Fly attach", () => {
    const { tenant, deployment } = seedDogfoodControlPlane(1);
    expect(tenant.slug).toBe("auth");
    expect(deployment.sku).toBe("glassbox-studio");
    expect(deployment.status).toBe("ready");
    expect(deployment.resources.some((r) => r.sidecarId === "n8n")).toBe(
      true,
    );
    expect(
      deployment.resources.find((r) => r.sidecarId === "host")?.url,
    ).toContain("glassbox-studio-host");
  });

  it("legacy attach skips unknown ids", () => {
    expect(legacyResourcesForSidecars(["n8n", "ghost"])).toHaveLength(1);
  });
});
