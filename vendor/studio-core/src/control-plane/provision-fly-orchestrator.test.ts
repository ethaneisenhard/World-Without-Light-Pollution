import { describe, expect, it, vi } from "vitest";
import { createDeployment, createTenant } from "./tenant-deployment-pure.js";
import { provisionFlySidecarOrchestrator } from "./provision-fly-orchestrator.js";

describe("provisionFlySidecarOrchestrator", () => {
  it("dry-runs probe without calling Fly", async () => {
    const tenant = createTenant({
      id: "tenant_abc12345",
      slug: "acme",
      displayName: "Acme",
    });
    if ("error" in tenant) throw new Error(tenant.error);
    const deployment = createDeployment({
      id: "d1",
      tenantId: tenant.id,
      sidecarIds: ["probe"],
    });
    const createApp = vi.fn();
    const out = await provisionFlySidecarOrchestrator(
      { createApp },
      {
        tenantShortId: tenant.shortId,
        sidecarId: "probe",
        deployment,
        dryRun: true,
      },
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.dryRun).toBe(true);
    expect(out.flyApp).toBe(`bu-${tenant.shortId}-probe`);
    expect(createApp).not.toHaveBeenCalled();
    expect(out.deployment.status).toBe("ready");
  });

  it("creates real app via deps", async () => {
    const tenant = createTenant({
      id: "tenant_xyz99999",
      slug: "beta",
      displayName: "Beta",
    });
    if ("error" in tenant) throw new Error(tenant.error);
    const deployment = createDeployment({
      id: "d2",
      tenantId: tenant.id,
      sidecarIds: ["probe"],
    });
    const out = await provisionFlySidecarOrchestrator(
      {
        createApp: async ({ appName }) => ({
          appName,
          created: true,
          hostname: `${appName}.fly.dev`,
        }),
      },
      {
        tenantShortId: tenant.shortId,
        sidecarId: "probe",
        deployment,
        dryRun: false,
      },
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.dryRun).toBe(false);
    expect(out.resource.url).toContain(".fly.dev");
  });

  it("rejects non-fly sidecar", async () => {
    const tenant = createTenant({
      id: "tenant_abc12345",
      slug: "acme",
      displayName: "Acme",
    });
    if ("error" in tenant) throw new Error(tenant.error);
    const deployment = createDeployment({
      id: "d3",
      tenantId: tenant.id,
      sidecarIds: ["worker"],
    });
    const out = await provisionFlySidecarOrchestrator(
      { createApp: async () => ({ appName: "x", created: true }) },
      {
        tenantShortId: tenant.shortId,
        sidecarId: "worker",
        deployment,
      },
    );
    expect(out).toEqual({ ok: false, error: "not_fly_sidecar" });
  });
});
