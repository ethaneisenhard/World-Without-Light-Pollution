import { describe, expect, it, vi } from "vitest";
import { createDeployment, createTenant } from "./tenant-deployment-pure.js";
import { stampHostLitellmEnvOrchestrator } from "./stamp-host-litellm-env-orchestrator.js";

describe("stampHostLitellmEnvOrchestrator", () => {
  it("dry-run returns env without Fly calls", async () => {
    const tenant = createTenant({
      id: "tenant_stamp_llm1",
      slug: "acme",
      displayName: "acme",
    });
    if ("error" in tenant) throw new Error(tenant.error);
    const deployment = {
      ...createDeployment({
        id: "deploy_stamp_llm",
        tenantId: tenant.id,
        sidecarIds: ["host", "litellm"],
      }),
      resources: [
        {
          sidecarId: "host",
          url: "https://bu-acme-host.fly.dev",
          flyApp: "bu-acme-host",
        },
        {
          sidecarId: "litellm",
          url: "https://gateway.acme.glassboxcomputer.site",
          flyApp: "bu-acme-litellm",
        },
      ],
    };
    const out = await stampHostLitellmEnvOrchestrator(
      {
        fetch: async () => new Response("nope", { status: 500 }),
        apiToken: "dry",
      },
      {
        deployment,
        tenantSlug: "acme",
        gatewayResourceUrl: "https://gateway.acme.glassboxcomputer.site/",
        apiKey: "sk-as-tenant-acme",
        dryRun: true,
      },
    );
    expect(out).toEqual({
      ok: true,
      hostFlyApp: "bu-acme-host",
      machineId: null,
      env: {
        LITELLM_BASE_URL: "http://bu-acme-litellm.internal:4000/v1",
        LITELLM_API_KEY: "sk-as-tenant-acme",
      },
      dryRun: true,
    });
  });

  it("rejects stamping another tenant's gateway onto this Host", async () => {
    const tenant = createTenant({
      id: "tenant_stamp_llm_x",
      slug: "acme",
      displayName: "acme",
    });
    if ("error" in tenant) throw new Error(tenant.error);
    const deployment = {
      ...createDeployment({
        id: "deploy_stamp_llm_x",
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
    const out = await stampHostLitellmEnvOrchestrator(
      {
        fetch: async () => new Response("nope", { status: 500 }),
        apiToken: "dry",
      },
      {
        deployment,
        tenantSlug: "acme",
        gatewayResourceUrl: "https://gateway.auth.glassboxcomputer.site",
        apiKey: "sk-as-auth",
        dryRun: true,
      },
    );
    expect(out).toEqual({ ok: false, error: "cross_tenant_gateway" });
  });

  it("merges LITELLM_* onto host machine", async () => {
    const tenant = createTenant({
      id: "tenant_stamp_llm2",
      slug: "acme",
      displayName: "acme",
    });
    if ("error" in tenant) throw new Error(tenant.error);
    const deployment = {
      ...createDeployment({
        id: "deploy_stamp_llm2",
        tenantId: tenant.id,
        sidecarIds: ["host"],
      }),
      resources: [
        {
          sidecarId: "host",
          url: "https://bu-acme-host.fly.dev",
          flyApp: "bu-acme-host",
        },
        {
          sidecarId: "litellm",
          url: "https://gateway.acme.glassboxcomputer.site",
          flyApp: "bu-acme-litellm",
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
        expect(body.config.env.LITELLM_BASE_URL).toBe(
          "http://bu-acme-litellm.internal:4000/v1",
        );
        expect(body.config.env.LITELLM_API_KEY).toBe("sk-as-tenant-acme");
        expect(body.config.env.PORT).toBe("3847");
        return new Response("{}", { status: 200 });
      }
      return new Response("unexpected", { status: 500 });
    });
    const out = await stampHostLitellmEnvOrchestrator(
      { fetch: fetchFn as unknown as typeof fetch, apiToken: "fm2_tok" },
      {
        deployment,
        tenantSlug: "acme",
        gatewayResourceUrl: "https://gateway.acme.glassboxcomputer.site",
        apiKey: "sk-as-tenant-acme",
      },
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.machineId).toBe("hm1");
  });
});
