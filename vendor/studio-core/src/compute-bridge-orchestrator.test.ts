import { describe, expect, it } from "vitest";
import { resolveHostApiDelegateOrchestrator } from "./compute-bridge-orchestrator.js";

describe("compute-bridge-orchestrator", () => {
  it("keeps vault routes on vault Host even when placement=local", async () => {
    const r = await resolveHostApiDelegateOrchestrator(
      {
        getLocalBridgeUrl: () => "http://127.0.0.1:3847",
      },
      { pathOrUrl: "/api/notes/tree", placement: "local" },
    );
    expect(r.stayOnVaultHost).toBe(true);
    expect(r.target.kind).toBe("vault-host");
  });

  it("delegates compute to bridge when local + reachable", async () => {
    const r = await resolveHostApiDelegateOrchestrator(
      {
        getLocalBridgeUrl: async () => "http://127.0.0.1:3847",
      },
      { pathOrUrl: "/api/files/list", placement: "local" },
    );
    expect(r.stayOnVaultHost).toBe(false);
    expect(r.target).toMatchObject({
      kind: "bridge",
      bridgeUrl: "http://127.0.0.1:3847",
    });
  });

  it("fails closed when local bridge missing", async () => {
    const r = await resolveHostApiDelegateOrchestrator(
      {},
      {
        pathOrUrl: "/api/runtimes",
        projectConfig: { compute: { placement: "local" } },
      },
    );
    expect(r.target.kind).toBe("unreachable");
  });
});
