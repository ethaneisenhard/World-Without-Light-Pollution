import { describe, expect, it, vi } from "vitest";
import {
  flyAuthHeader,
  flyCreateApp,
  flyCreateVolume,
  flyListMachines,
  normalizeFlyApiError,
} from "./fly-machines-api-orchestrator.js";

describe("fly machines API", () => {
  it("uses FlyV1 for fm2_ tokens", () => {
    expect(flyAuthHeader("fm2_abc")).toBe("FlyV1 fm2_abc");
    expect(flyAuthHeader("FlyV1 fm2_abc")).toBe("FlyV1 fm2_abc");
    expect(flyAuthHeader('"fm2_abc"')).toBe("FlyV1 fm2_abc");
    expect(flyAuthHeader("plain-session")).toBe("Bearer plain-session");
  });

  it("normalizes Fly unauthorized JSON bodies", () => {
    expect(normalizeFlyApiError('{"error":"unauthorized"}\n')).toBe(
      "fly_unauthorized",
    );
    expect(normalizeFlyApiError("Name has already been taken")).toBe(
      "Name has already been taken",
    );
  });

  it("lists machines", async () => {
    const fetchFn = vi.fn(
      async () =>
        new Response(
          JSON.stringify([{ id: "m1", state: "started" }]),
          { status: 200 },
        ),
    );
    const out = await flyListMachines(
      { fetch: fetchFn as unknown as typeof fetch, apiToken: "fm2_tok" },
      { appName: "bu-acme-host" },
    );
    expect(out).toEqual({
      ok: true,
      machines: [{ id: "m1", state: "started" }],
    });
  });

  it("creates app via POST /v1/apps", async () => {
    const fetchFn = vi.fn(async () => new Response("{}", { status: 201 }));
    const out = await flyCreateApp(
      { fetch: fetchFn as unknown as typeof fetch, apiToken: "fm2_tok" },
      { appName: "bu-acme-host", orgSlug: "personal" },
    );
    expect(out).toEqual({ ok: true, appName: "bu-acme-host" });
    expect(fetchFn).toHaveBeenCalledWith(
      "https://api.machines.dev/v1/apps",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "FlyV1 fm2_tok" }),
      }),
    );
  });

  it("treats already-exists as ok", async () => {
    const fetchFn = vi.fn(async (url: string) => {
      if (String(url).includes("/v1/apps/bu-acme-host")) {
        return new Response("{}", { status: 200 });
      }
      return new Response(JSON.stringify({ error: "Conflict" }), { status: 422 });
    });
    const out = await flyCreateApp(
      { fetch: fetchFn as unknown as typeof fetch, apiToken: "t" },
      { appName: "bu-acme-host" },
    );
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.existed).toBe(true);
  });

  it("creates volume", async () => {
    const fetchFn = vi.fn(
      async () =>
        new Response(JSON.stringify({ id: "vol_abc" }), { status: 200 }),
    );
    const out = await flyCreateVolume(
      { fetch: fetchFn as unknown as typeof fetch, apiToken: "t" },
      { appName: "bu-acme-host", name: "studio_host_data", region: "iad", sizeGb: 1 },
    );
    expect(out).toEqual({ ok: true, volumeId: "vol_abc" });
  });
});
