import { describe, expect, it } from "vitest";
import { BOOT_SPLASH_PARAM_DEFAULTS } from "./boot-splash-pure.js";
import {
  BOOT_SPLASH_STILL_GEO_GRAT_STEP,
  BOOT_SPLASH_STILL_GEO_ROT_X,
  BOOT_SPLASH_STILL_GEO_ROT_Y,
} from "./boot-splash-still-geo.generated.js";
import {
  BOOT_SPLASH_STILL_CENTER_X,
  BOOT_SPLASH_STILL_CENTER_Y,
  BOOT_SPLASH_STILL_CUBE_SIZE,
  BOOT_SPLASH_STILL_MARK_VIEW,
  projectBootSplashStillScene,
  renderBootSplashStillSvg,
} from "./boot-splash-still-svg-pure.js";

describe("boot-splash-still-svg-pure", () => {
  it("matches live mount.js mark crop math", () => {
    expect(BOOT_SPLASH_STILL_MARK_VIEW).toBe(
      Math.ceil(BOOT_SPLASH_STILL_CUBE_SIZE * Math.SQRT2) + 96,
    );
    expect(BOOT_SPLASH_STILL_MARK_VIEW).toBe(662);
    const scene = projectBootSplashStillScene();
    const half = BOOT_SPLASH_STILL_MARK_VIEW / 2;
    expect(scene.viewBox).toBe(
      `${BOOT_SPLASH_STILL_CENTER_X - half} ${BOOT_SPLASH_STILL_CENTER_Y - half} ${BOOT_SPLASH_STILL_MARK_VIEW} ${BOOT_SPLASH_STILL_MARK_VIEW}`,
    );
    expect(scene.viewBox).toBe("269 19 662 662");
  });

  it("projects default yaw/pitch into a cube silhouette + globe", () => {
    const scene = projectBootSplashStillScene({
      boxYaw: BOOT_SPLASH_PARAM_DEFAULTS.boxYaw,
      boxPitch: BOOT_SPLASH_PARAM_DEFAULTS.boxPitch,
      tilt: BOOT_SPLASH_PARAM_DEFAULTS.tilt,
    });
    expect(scene.hullPoints.split(" ").length).toBeGreaterThanOrEqual(4);
    expect(scene.hullPath.startsWith("M")).toBe(true);
    expect(scene.hullPath.endsWith("Z")).toBe(true);
    expect(scene.globeR).toBe(148);
    expect(scene.landD.length).toBeGreaterThan(800);
    expect(scene.graticuleD.length).toBeGreaterThan(400);
    expect(scene.landD.startsWith("M")).toBe(true);
    expect(scene.graticuleD.startsWith("M")).toBe(true);
    expect(scene.frontSegs.length + scene.backSegs.length).toBeGreaterThan(0);
    expect(scene.backMaskR).toBe(
      148 + BOOT_SPLASH_PARAM_DEFAULTS.globeStroke * 0.5 + 1,
    );
    expect(scene.frontStroke).toBe(8);
    expect(BOOT_SPLASH_STILL_GEO_ROT_X).toBe(0);
    expect(BOOT_SPLASH_STILL_GEO_ROT_Y).toBe(BOOT_SPLASH_PARAM_DEFAULTS.tilt);
    expect(BOOT_SPLASH_STILL_GEO_GRAT_STEP).toBe(
      BOOT_SPLASH_PARAM_DEFAULTS.gratStep,
    );
  });

  it("still SVG uses theme vars — never the 2D mark doodle", () => {
    const svg = renderBootSplashStillSvg();
    expect(svg).toContain('data-as-boot-splash-still-frame="1"');
    expect(svg).toContain("var(--as-splash-box-front)");
    expect(svg).toContain("var(--as-splash-ocean)");
    expect(svg).toContain("var(--as-splash-land)");
    expect(svg).toContain("var(--as-splash-grat)");
    expect(svg).toContain('data-as-boot-splash-still-land="1"');
    expect(svg).toContain('data-as-boot-splash-still-grat-ocean="1"');
    expect(svg).toContain('data-as-boot-splash-still-grat-land="1"');
    expect(svg).toContain("var(--as-splash-globe)");
    expect(svg).toContain('viewBox="269 19 662 662"');
    expect(svg).toContain('data-as-boot-splash-still-back="1"');
    expect(svg).toContain("as-boot-splash-still-back-mask");
    expect(svg).toContain(`stroke-width="${BOOT_SPLASH_PARAM_DEFAULTS.frontStroke}"`);
    expect(svg).not.toContain('opacity=".45"');
    expect(svg).not.toContain("#111");
    expect(svg).not.toContain("mark.svg");
    expect(svg).not.toContain("globe-img");
    expect(svg).not.toContain("currentColor");
  });
});
