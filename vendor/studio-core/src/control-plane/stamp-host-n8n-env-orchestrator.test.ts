import { describe, expect, it, vi } from "vitest";
import { createDeployment, createTenant } from "./tenant-deployment-pure.js";
import { stampHostN8nBaseUrlOrchestrator } from "./stamp-host-n8n-env-orchestrator.js";

describe("stampHostN8nBaseUrlOrchestrator", () => {
  it("dry-run returns env without Fly calls", async () => {
    const tenant = createTenant({
      id: "tenant_stamp1",
      slug: "acme",
      displayName: "acme",
    });
    if ("error" in tenant) throw new Error(tenant.error);
    let deployment = createDeployment({
      id: "deploy_stamp",
      tenantId: tenant.id,
      sidecarIds: ["host", "n8n"],
    });
    deployment = {
      ...deployment,
      resources: [
        {
          sidecarId: "host",
          url: "https://bu-acme-host.fly.dev",
          flyApp: "bu-acme-host",
        },
      ],
    };
    const out = await stampHostN8nBaseUrlOrchestrator(
      {
        fetch: async () => new Response("nope", { status: 500 }),
        apiToken: "dry",
      },
      {
        deployment,
        n8nResourceUrl: "https://workflows.acme.glassboxcomputer.site/",
        dryRun: true,
      },
    );
    expect(out).toEqual({
      ok: true,
      hostFlyApp: "bu-acme-host",
      machineId: null,
      env: { N8N_BASE_URL: "https://workflows.acme.glassboxcomputer.site" },
      dryRun: true,
    });
  });

  it("merges N8N_BASE_URL onto host machine", async () => {
    const tenant = createTenant({
      id: "tenant_stamp2",
      slug: "acme",
      displayName: "acme",
    });
    if ("error" in tenant) throw new Error(tenant.error);
    const deployment = {
      ...createDeployment({
        id: "deploy_stamp2",
        tenantId: tenant.id,
        sidecarIds: ["host"],
      }),
      resources: [
        {
          sidecarId: "host",
          url: "https://bu-acme-host.fly.dev",
          flyApp: "bu-acme-host",
        },
      ],
    };
    const fetchFn = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const u = String(url);
      const method = (init?.method ?? "GET").toUpperCase();
      if (u.includes("/machines") && !u.includes("/machines/") && method === "GET") {
        return new Response(
          JSON.stringify([{ id: "hm1", state: "started" }]),
          { status: 200 },
        );
      }
      if (u.includes("/machines/hm1") && method === "GET") {
        return new Response(
          JSON.stringify({
            id: "hm1",
            state: "started",
            config: { image: "x", env: { PORT: "3847" } },
          }),
          { status: 200 },
        );
      }
      if (u.includes("/machines/hm1") && method === "POST") {
        const body = JSON.parse(String(init?.body));
        expect(body.config.env.N8N_BASE_URL).toBe(
          "https://workflows.acme.glassboxcomputer.site",
        );
        expect(body.config.env.PORT).toBe("3847");
        return new Response("{}", { status: 200 });
      }
      return new Response("unexpected", { status: 500 });
    });
    const out = await stampHostN8nBaseUrlOrchestrator(
      { fetch: fetchFn as unknown as typeof fetch, apiToken: "fm2_tok" },
      {
        deployment,
        n8nResourceUrl: "https://workflows.acme.glassboxcomputer.site",
      },
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.machineId).toBe("hm1");
  });
});
