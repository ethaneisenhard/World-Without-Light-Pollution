import { describe, expect, it, vi } from "vitest";
import { createDeployment, createTenant } from "./tenant-deployment-pure.js";
import { redeployHostOrchestrator } from "./redeploy-host-orchestrator.js";

describe("redeployHostOrchestrator", () => {
  it("dry-run updates deployment image without Fly calls", async () => {
    const tenant = createTenant({
      id: "tenant_abc12345",
      slug: "acme",
      displayName: "Acme",
    });
    if ("error" in tenant) throw new Error(tenant.error);
    let deployment = createDeployment({
      id: "d1",
      tenantId: tenant.id,
      sidecarIds: ["host"],
    });
    deployment = {
      ...deployment,
      resources: [
        {
          sidecarId: "host",
          url: "https://bu-x-host.fly.dev",
          flyApp: "bu-x-host",
          image: "registry.fly.io/glassbox-studio-host:old",
        },
      ],
      status: "ready",
    };
    const fetchFn = vi.fn();
    const out = await redeployHostOrchestrator(
      { fetch: fetchFn as unknown as typeof fetch, apiToken: "t" },
      {
        jobId: "job_r1",
        tenant,
        deployment,
        image: "registry.fly.io/glassbox-studio-host:v2",
        dryRun: true,
        now: 1,
      },
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.job.status).toBe("dry_run");
    expect(
      out.deployment.resources.find((r) => r.sidecarId === "host")?.image,
    ).toBe("registry.fly.io/glassbox-studio-host:v2");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("fails when host not provisioned", async () => {
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
    const out = await redeployHostOrchestrator(
      { fetch: vi.fn() as unknown as typeof fetch, apiToken: "t" },
      {
        jobId: "job_r2",
        tenant,
        deployment,
        image: "registry.fly.io/glassbox-studio-host:v2",
        dryRun: true,
        now: 2,
      },
    );
    expect(out.ok).toBe(false);
  });

  it("rolls image via get + update machine", async () => {
    const tenant = createTenant({
      id: "tenant_abc12345",
      slug: "acme",
      displayName: "Acme",
    });
    if ("error" in tenant) throw new Error(tenant.error);
    const flyApp = "bu-x-host";
    const deployment = {
      ...createDeployment({
        id: "d1",
        tenantId: tenant.id,
        sidecarIds: ["host"],
      }),
      status: "ready" as const,
      resources: [
        {
          sidecarId: "host",
          url: `https://${flyApp}.fly.dev`,
          flyApp,
          image: "registry.fly.io/glassbox-studio-host:old",
        },
      ],
    };
    const fetchFn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      if (url.includes(`/v1/apps/${flyApp}/machines`) && method === "GET" && !url.includes("/m_1")) {
        return new Response(
          JSON.stringify([{ id: "m_1", state: "started" }]),
          { status: 200 },
        );
      }
      if (url.endsWith(`/machines/m_1`) && method === "GET") {
        return new Response(
          JSON.stringify({
            id: "m_1",
            state: "started",
            config: { image: "old", env: { PORT: "3847" } },
          }),
          { status: 200 },
        );
      }
      if (url.endsWith(`/machines/m_1`) && method === "POST") {
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          config?: { image?: string };
        };
        expect(body.config?.image).toBe(
          "registry.fly.io/glassbox-studio-host:v2",
        );
        return new Response("{}", { status: 200 });
      }
      return new Response("unexpected", { status: 500 });
    });
    const out = await redeployHostOrchestrator(
      { fetch: fetchFn as unknown as typeof fetch, apiToken: "fm2_tok" },
      {
        jobId: "job_r3",
        tenant,
        deployment,
        image: "registry.fly.io/glassbox-studio-host:v2",
        now: 3,
      },
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.machineId).toBe("m_1");
    expect(
      out.deployment.resources.find((r) => r.sidecarId === "host")?.image,
    ).toBe("registry.fly.io/glassbox-studio-host:v2");
  });
});
