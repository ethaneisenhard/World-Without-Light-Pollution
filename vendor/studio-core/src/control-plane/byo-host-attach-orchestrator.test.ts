import { describe, expect, it, vi } from "vitest";
import { createDeployment, createTenant } from "./tenant-deployment-pure.js";
import { attachByoHostOrchestrator } from "./byo-host-attach-orchestrator.js";

describe("attachByoHostOrchestrator", () => {
  it("dry-run attaches without fetch", async () => {
    const tenant = createTenant({
      id: "tenant_abc12345",
      slug: "acme",
      displayName: "Acme",
    });
    if ("error" in tenant) throw new Error(tenant.error);
    const deployment = createDeployment({
      id: "d1",
      tenantId: tenant.id,
      sidecarIds: ["host", "worker"],
    });
    const fetchFn = vi.fn();
    const out = await attachByoHostOrchestrator(
      { fetch: fetchFn as unknown as typeof fetch },
      {
        jobId: "j1",
        tenant,
        deployment,
        hostUrl: "https://my-vps.example.com",
        dryRun: true,
        now: 1,
      },
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.hostUrl).toBe("https://my-vps.example.com");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("requires healthy /health", async () => {
    const tenant = createTenant({
      id: "tenant_abc12345",
      slug: "acme",
      displayName: "Acme",
    });
    if ("error" in tenant) throw new Error(tenant.error);
    const deployment = createDeployment({
      id: "d1",
      tenantId: tenant.id,
      sidecarIds: ["host"],
    });
    const fetchFn = vi.fn(async () =>
      new Response(JSON.stringify({ host: true }), { status: 200 }),
    );
    const out = await attachByoHostOrchestrator(
      { fetch: fetchFn as unknown as typeof fetch },
      {
        jobId: "j2",
        tenant,
        deployment,
        hostUrl: "https://my-vps.example.com",
        now: 2,
      },
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.deployment.resources[0]?.url).toBe(
      "https://my-vps.example.com",
    );
    expect(String(fetchFn.mock.calls[0]?.[0])).toContain("/health");
  });
});
