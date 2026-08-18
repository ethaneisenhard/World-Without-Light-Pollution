import { describe, expect, it } from "vitest";
import { projectToolActivity } from "./tool-activity-registry-pure.js";

describe("tool-activity-registry-pure", () => {
  it("projects shell command", () => {
    const p = projectToolActivity({
      name: "shell",
      input: { command: "pnpm test apps/studio" },
    });
    expect(p.title).toBe("Run command");
    expect(p.subtitle).toContain("pnpm test");
  });

  it("projects Cloud ship / verify", () => {
    expect(projectToolActivity({ name: "deploy.ship" }).title).toBe(
      "Ship to Cloud",
    );
    expect(projectToolActivity({ name: "deploy.verify" }).title).toBe(
      "Check Cloud site",
    );
  });
});
