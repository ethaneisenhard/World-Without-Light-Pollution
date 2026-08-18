import { describe, expect, it } from "vitest";
import { GlassBoxMarkIcon } from "./glass-box-mark.tsx";

describe("GlassBoxMarkIcon (ui-icons brand)", () => {
  it("renders static Glass Box Computers mark (not boot-splash wireframe)", () => {
    const node = GlassBoxMarkIcon({ class: "size-full" });
    expect(node).toBeTruthy();
    const props = (node as { props?: Record<string, unknown> }).props ?? {};
    expect(props["data-studio-icon"]).toBe("glass-box-mark");
    expect(props.viewBox).toBe("0 0 460 460");
    expect(props.class).toBe("size-full");
    expect(String(props.class ?? "")).not.toMatch(/animate|spin/);
  });

  it("keeps brand face colors (yellow / green / blue / red / glass)", () => {
    const dumped = JSON.stringify(GlassBoxMarkIcon({ class: "size-7" }));
    expect(dumped).toMatch(/#FFE566/);
    expect(dumped).toMatch(/#00A651/);
    expect(dumped).toMatch(/#0066CC/);
    expect(dumped).toMatch(/#E60012/);
    expect(dumped).toMatch(/#9AD8FF/);
    expect(dumped).toMatch(/#D6EEFF/);
    // soft glass mid — pure white mid-stop seams at small sizes
    expect(dumped).not.toMatch(/stop-color":"#FFFFFF"/);
    // boot-splash wireframe path must not appear
    expect(dumped).not.toMatch(/M22 21\.5/);
  });
});
