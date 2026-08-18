import { describe, expect, it } from "vitest";
import {
  platformReleasesFromEnv,
  projectHostUpdate,
} from "./platform-release-pure.js";

describe("platform-release-pure", () => {
  it("detects update when current ≠ latest", () => {
    const latest = platformReleasesFromEnv({
      flyHostImage: "registry.fly.io/glassbox-studio-host:v2",
      platformVersion: "v2",
    })[0]!;
    const p = projectHostUpdate({
      currentImage: "registry.fly.io/glassbox-studio-host:v1",
      latest,
    });
    expect(p.updateAvailable).toBe(true);
    expect(p.latest?.platformVersion).toBe("v2");
  });

  it("no update when pinned equal", () => {
    const img = "registry.fly.io/glassbox-studio-host:same";
    const latest = platformReleasesFromEnv({ flyHostImage: img })[0]!;
    expect(
      projectHostUpdate({ currentImage: img, latest }).updateAvailable,
    ).toBe(false);
  });
});
