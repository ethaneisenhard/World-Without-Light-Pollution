import { describe, expect, it } from "vitest";
import { resolveDeployCommand } from "./deploy-pure.js";

describe("resolveDeployCommand", () => {
  it("defaults wrangler when no deploy block", () => {
    const r = resolveDeployCommand({ provider: "cloudflare" });
    expect("error" in r).toBe(false);
    if (!("error" in r)) {
      expect(r.command).toBe("pnpm");
      expect(r.args).toContain("wrangler");
    }
  });

  it("resolves named target", () => {
    const r = resolveDeployCommand(
      {
        deploy: {
          targets: [
            { id: "web", cwd: "apps/web", command: "pnpm run deploy" },
          ],
        },
      },
      "web",
    );
    expect("error" in r).toBe(false);
    if (!("error" in r)) {
      expect(r.cwdRel).toBe("apps/web");
      expect(r.command).toBe("pnpm");
    }
  });
});
