import { describe, expect, it, vi } from "vitest";
import { createCloudflareDnsCname } from "./cloudflare-dns-cname-orchestrator.js";

describe("createCloudflareDnsCname", () => {
  it("creates DNS-only CNAME", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ result: [] }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ result: { id: "rec1" } }), {
          status: 200,
        }),
      );
    const out = await createCloudflareDnsCname(
      { fetch: fetchFn as unknown as typeof fetch, apiToken: "tok" },
      {
        zoneId: "zone1",
        name: "workflows.acme",
        content: "bu-acme-n8n.fly.dev",
      },
    );
    expect(out).toEqual({
      ok: true,
      id: "rec1",
      name: "workflows.acme",
    });
    const post = fetchFn.mock.calls[1]?.[1] as RequestInit;
    const body = JSON.parse(String(post.body));
    expect(body.proxied).toBe(false);
    expect(body.type).toBe("CNAME");
  });

  it("treats matching existing record as success", async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          result: [
            {
              id: "existing",
              name: "workflows.acme.glassboxcomputer.site",
              content: "bu-acme-n8n.fly.dev",
            },
          ],
        }),
        { status: 200 },
      ),
    );
    const out = await createCloudflareDnsCname(
      { fetch: fetchFn as unknown as typeof fetch, apiToken: "tok" },
      {
        zoneId: "zone1",
        name: "workflows.acme",
        content: "bu-acme-n8n.fly.dev",
      },
    );
    expect(out).toEqual({
      ok: true,
      id: "existing",
      name: "workflows.acme",
      existed: true,
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
