import { describe, expect, it } from "vitest";
import {
  STUDIO_HOST_IMAGE_ENV_KEY,
  defaultStudioHostImageRef,
  isPinnedHostImageRef,
  resolveStudioHostImageRef,
} from "./host-image-contract-pure.js";

describe("host-image-contract-pure", () => {
  it("resolves env over default latest", () => {
    const fromEnv = resolveStudioHostImageRef({
      envImage: "registry.fly.io/glassbox-studio-host:v1.2.3",
    });
    expect(fromEnv.fromEnv).toBe(true);
    expect(fromEnv.image).toBe("registry.fly.io/glassbox-studio-host:v1.2.3");
    expect(STUDIO_HOST_IMAGE_ENV_KEY).toBe("FLY_HOST_IMAGE");

    const fallback = resolveStudioHostImageRef({ envImage: "" });
    expect(fallback.fromEnv).toBe(false);
    expect(fallback.image).toBe(defaultStudioHostImageRef("latest"));
  });

  it("detects pinned refs", () => {
    expect(isPinnedHostImageRef("registry.fly.io/x@sha256:abc")).toBe(true);
    expect(isPinnedHostImageRef("registry.fly.io/x:v1")).toBe(true);
    expect(isPinnedHostImageRef("registry.fly.io/x:latest")).toBe(false);
  });
});
