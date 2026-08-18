import { describe, expect, it } from "vitest";
import { ComputerDesktopIcon } from "./24/outline/computer-desktop.ts";
import { ComputerDesktopIcon as ComputerDesktopSolid } from "./24/solid/computer-desktop.ts";
import { viewportIcon } from "./viewport.ts";
import { HEROICONS_OUTLINE_COUNT } from "./generated/heroicons/manifest.ts";

describe("@glassbox-studio/ui-icons", () => {
  it("vendors the BrowserUI outline catalog", () => {
    expect(HEROICONS_OUTLINE_COUNT).toBe(324);
  });

  it("builds remix SVG vnodes from outline + solid factories", () => {
    const outline = ComputerDesktopIcon({ class: "size-5" }) as {
      $rmx: true;
      type: string;
      props: { class?: string };
    };
    expect(outline.$rmx).toBe(true);
    expect(outline.type).toBe("svg");
    expect(outline.props.class).toBe("size-5");

    const solid = ComputerDesktopSolid({ class: "size-5" }) as {
      type: string;
      props: { fill?: string };
    };
    expect(solid.type).toBe("svg");
    expect(solid.props.fill).toBe("currentColor");
  });

  it("viewport helper returns svg", () => {
    const vp = viewportIcon("mobile", true) as { type: string };
    expect(vp.type).toBe("svg");
  });
});
