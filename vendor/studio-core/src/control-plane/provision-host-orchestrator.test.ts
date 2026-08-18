import { describe, expect, it, vi } from "vitest";
import { createDeployment, createTenant } from "./tenant-deployment-pure.js";
import { provisionHostOrchestrator } from "./provision-host-orchestrator.js";

describe("provisionHostOrchestrator", () => {
  it("dry-run attaches host URL without Fly calls", async () => {
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
    const out = await provisionHostOrchestrator(
      { fetch: fetchFn as unknown as typeof fetch, apiToken: "t" },
      {
        jobId: "job1",
        tenant,
        deployment,
        image: "registry.fly.io/glassbox-studio-host:latest",
        appOrigin: "https://example.workers.dev",
        dryRun: true,
        now: 1,
      },
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.job.status).toBe("dry_run");
    expect(out.flyApp).toBe(`bu-${tenant.shortId}-host`);
    expect(out.resourceUrl).toBe("https://api.acme.glassboxcomputer.site");
    expect(
      out.deployment.resources.find((r) => r.sidecarId === "host")?.image,
    ).toBe("registry.fly.io/glassbox-studio-host:latest");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("reuses an existing Fly machine instead of creating another", async () => {
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
    const flyApp = `bu-${tenant.shortId}-host`;
    const fetchFn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      if (url.endsWith("/v1/apps") && method === "POST") {
        return new Response("{}", { status: 201 });
      }
      if (url.includes(`/v1/apps/${flyApp}/machines`) && method === "GET") {
        return new Response(
          JSON.stringify([{ id: "m_existing", state: "started" }]),
          { status: 200 },
        );
      }
      return new Response("unexpected", { status: 500 });
    });
    const out = await provisionHostOrchestrator(
      { fetch: fetchFn as unknown as typeof fetch, apiToken: "fm2_tok" },
      {
        jobId: "job2",
        tenant,
        deployment,
        image: "registry.fly.io/glassbox-studio-host:latest",
        appOrigin: "https://example.workers.dev",
        now: 2,
      },
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.job.status).toBe("ready");
    expect(out.flyApp).toBe(flyApp);
    // create app + list only — no volume/machine POSTs
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
