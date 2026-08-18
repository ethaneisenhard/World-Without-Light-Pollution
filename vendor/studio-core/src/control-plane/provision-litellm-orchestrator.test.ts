import { describe, expect, it, vi } from "vitest";
import { createDeployment, createTenant } from "./tenant-deployment-pure.js";
import {
  DEFAULT_LITELLM_IMAGE,
  provisionLitellmOrchestrator,
} from "./provision-litellm-orchestrator.js";

describe("provisionLitellmOrchestrator", () => {
  it("dry-run stamps gateway.{slug}.glassboxcomputer.site + unique key", async () => {
    const tenant = createTenant({
      id: "tenant_userllm01",
      slug: "cosmic-otter-llm0",
      displayName: "litellm test",
    });
    if ("error" in tenant) throw new Error(tenant.error);
    const deployment = createDeployment({
      id: "deploy_llm",
      tenantId: tenant.id,
      sidecarIds: ["host", "worker", "litellm"],
    });
    const out = await provisionLitellmOrchestrator(
      {
        fetch: async () => new Response("nope", { status: 500 }),
        apiToken: "dry",
      },
      {
        jobId: "job_llm",
        tenant,
        deployment,
        dryRun: true,
      },
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.resourceUrl).toBe(
      "https://gateway.cosmic-otter-llm0.glassboxcomputer.site",
    );
    expect(out.flyApp).toContain("-litellm");
    expect(out.apiKey.startsWith("sk-as-")).toBe(true);
    expect(out.job.log.join("\n")).not.toContain(out.apiKey);
    expect(
      out.deployment.resources.some((r) => r.sidecarId === "litellm"),
    ).toBe(true);
    expect(
      out.deployment.resources.find((r) => r.sidecarId === "litellm")?.url,
    ).toBe(out.resourceUrl);
    expect(DEFAULT_LITELLM_IMAGE).toContain("litellm");
  });

  it("dry-run honors publicUrl override", async () => {
    const tenant = createTenant({
      id: "tenant_userllm02",
      slug: "plain-slug",
      displayName: "litellm override",
    });
    if ("error" in tenant) throw new Error(tenant.error);
    const deployment = createDeployment({
      id: "deploy_llm2",
      tenantId: tenant.id,
      sidecarIds: ["litellm"],
    });
    const out = await provisionLitellmOrchestrator(
      {
        fetch: async () => new Response("nope", { status: 500 }),
        apiToken: "dry",
      },
      {
        jobId: "job_llm2",
        tenant,
        deployment,
        dryRun: true,
        publicUrl: "https://bu-custom-litellm.fly.dev/",
      },
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.resourceUrl).toBe("https://bu-custom-litellm.fly.dev");
  });

  it("real path attaches DNS + cert when deps provided", async () => {
    const tenant = createTenant({
      id: "tenant_userllm03",
      slug: "acme",
      displayName: "acme",
    });
    if ("error" in tenant) throw new Error(tenant.error);
    const deployment = createDeployment({
      id: "deploy_llm3",
      tenantId: tenant.id,
      sidecarIds: ["litellm"],
    });
    const createDnsCname = vi.fn().mockResolvedValue({
      ok: true,
      id: "dns1",
      name: "gateway.acme",
    });
    const fetchFn = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const u = String(url);
      const method = (init?.method ?? "GET").toUpperCase();
      if (u.endsWith("/v1/apps") && method === "POST") {
        return new Response("{}", { status: 201 });
      }
      if (u.includes("/machines") && method === "GET") {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (u.includes("/ips") && method === "POST") {
        return new Response("{}", { status: 201 });
      }
      if (u.includes("/volumes") && method === "POST") {
        return new Response(JSON.stringify({ id: "vol1" }), { status: 200 });
      }
      if (u.includes("/machines") && method === "POST") {
        return new Response(JSON.stringify({ id: "mach1" }), { status: 200 });
      }
      if (u.includes("/certificates") && method === "POST") {
        return new Response("{}", { status: 201 });
      }
      return new Response("unexpected", { status: 500 });
    });
    const out = await provisionLitellmOrchestrator(
      {
        fetch: fetchFn as unknown as typeof fetch,
        apiToken: "fm2_tok",
      },
      {
        jobId: "job_llm3",
        tenant,
        deployment,
        dryRun: false,
        dns: {
          createDnsCname,
          dns: {
            fetch: async () => new Response("{}", { status: 200 }),
            apiToken: "cf",
          },
          zoneId: "zone1",
        },
      },
    );
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.resourceUrl).toBe(
      "https://gateway.acme.glassboxcomputer.site",
    );
    expect(createDnsCname).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        name: "gateway.acme",
        content: expect.stringContaining("-litellm.fly.dev"),
        proxied: false,
      }),
    );
  });
});
