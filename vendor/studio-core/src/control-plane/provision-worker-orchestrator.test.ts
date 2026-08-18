import { describe, expect, it, vi } from "vitest";
import { createDeployment, createTenant } from "./tenant-deployment-pure.js";
import { provisionWorkerOrchestrator } from "./provision-worker-orchestrator.js";

describe("provisionWorkerOrchestrator", () => {
  it("attaches https://{slug}.browserui.site when health proves host proxy", async () => {
    const tenant = createTenant({
      id: "tenant_user6cde8b2421a2",
      slug: "eeisen11",
      displayName: "Ethan",
    });
    if ("error" in tenant) throw new Error(tenant.error);
    const deployment = createDeployment({
      id: "d1",
      tenantId: tenant.id,
      sidecarIds: ["worker", "host"],
    });
    const hostUrl = "https://bu-user6cde-host.fly.dev";
    const fetchFn = vi.fn(async () =>
      Response.json({
        ok: true,
        host: true,
        proxy: hostUrl,
        service: "glassbox-studio",
        tenantSlug: "eeisen11",
      }),
    );
    const out = await provisionWorkerOrchestrator(
      {
        fetch: fetchFn as unknown as typeof fetch,
        studioSiteBaseDomain: "browserui.site",
      },
      {
        jobId: "job1",
        tenant,
        deployment,
        hostUrl,
        now: 1,
      },
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.resourceUrl).toBe("https://eeisen11.browserui.site");
    expect(out.workerName).toBe("glassbox-studio");
    expect(fetchFn).toHaveBeenCalledWith(
      "https://eeisen11.browserui.site/health",
      expect.anything(),
    );
  });
});
