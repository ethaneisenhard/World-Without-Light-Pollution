import { describe, expect, it } from "vitest";
import { GLASS_BOX_MARK_GRADIENTS } from "./glass-box-mark-geometry-pure.ts";
import { GlassBoxMarkIcon } from "./glass-box-mark.tsx";
import { glassBoxMarkSvgHtml } from "./glass-box-mark-ssr-pure.ts";

describe("GlassBoxMarkIcon ↔ SSR twin parity", () => {
  it("shares soft glass mid + brand stops from geometry SoT", () => {
    const mid = GLASS_BOX_MARK_GRADIENTS.glass.stops.find((s) => s.offset === "50%");
    expect(mid?.color).toBe("#D6EEFF");

    const remix = JSON.stringify(GlassBoxMarkIcon({ class: "size-7" }));
    const ssr = glassBoxMarkSvgHtml({ className: "size-7", idPrefix: "parity" });

    for (const color of ["#FFE566", "#00A651", "#0066CC", "#E60012", "#D6EEFF", "#9AD8FF"]) {
      expect(remix).toContain(color);
      expect(ssr).toContain(color);
    }
    expect(ssr).toContain('data-studio-icon="glass-box-mark"');
    expect(remix).toContain("glass-box-mark");
  });
});
