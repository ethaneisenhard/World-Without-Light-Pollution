import { describe, expect, it } from "vitest";
import {
  SHARED_STUDIO_EDGE_WORKER_NAME,
  controlPlaneStudioWorkerUrl,
  studioWorkerHealthMatchesHost,
} from "./provision-worker-pure.js";

describe("provision-worker-pure", () => {
  it("public URL is {slug}.browserui.site", () => {
    expect(controlPlaneStudioWorkerUrl("eeisen11")).toBe(
      "https://eeisen11.browserui.site",
    );
    expect(SHARED_STUDIO_EDGE_WORKER_NAME).toBe("glassbox-studio");
  });

  it("matches health when proxy equals host", () => {
    expect(
      studioWorkerHealthMatchesHost(
        {
          ok: true,
          host: true,
          proxy: "https://bu-user6cde-host.fly.dev",
        },
        "https://bu-user6cde-host.fly.dev",
      ),
    ).toBe(true);
  });
});
