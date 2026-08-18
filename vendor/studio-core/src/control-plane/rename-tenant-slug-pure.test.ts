import { describe, expect, it } from "vitest";
import { createTenant, createDeployment } from "./tenant-deployment-pure.js";
import { proposeTenantSlugRename } from "./rename-tenant-slug-pure.js";

describe("proposeTenantSlugRename", () => {
  const tenant = createTenant({
    id: "tenant_userc8a63f75",
    slug: "cosmic-otter-c8a6",
    displayName: "cosmic-otter-c8a6",
  });
  if ("error" in tenant) throw new Error(tenant.error);

  it("renames stem and keeps uid; rewrites worker URL", () => {
    const deployment = createDeployment({
      id: "deploy_1",
      tenantId: tenant.id,
      sidecarIds: ["host", "worker"],
    });
    const withWorker = {
      ...deployment,
      resources: [
        {
          sidecarId: "worker",
          url: "https://cosmic-otter-c8a6.browserui.site",
          flyApp: "glassbox-studio",
        },
      ],
    };
    const out = proposeTenantSlugRename({
      tenant,
      desiredStem: "plucky-fox",
      slugTaken: false,
      deployment: withWorker,
    });
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.tenant.slug).toBe("plucky-fox-c8a6");
    expect(out.studioUrl).toBe("https://plucky-fox-c8a6.browserui.site");
    expect(out.deployment?.resources[0]?.url).toBe(
      "https://plucky-fox-c8a6.browserui.site",
    );
  });

  it("rejects reserved and taken", () => {
    expect(
      proposeTenantSlugRename({
        tenant,
        desiredStem: "dogfood",
        slugTaken: false,
      }).ok,
    ).toBe(false);
    expect(
      proposeTenantSlugRename({
        tenant,
        desiredStem: "plucky-fox",
        slugTaken: true,
      }).ok,
    ).toBe(false);
  });
});
