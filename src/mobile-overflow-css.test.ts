import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("lab tooltips do not expand the page when idle", () => {
  const css = readFileSync(join(process.cwd(), "src/styles/site.css"), "utf8");

  it("keeps idle tips out of layout and clips lab overflow on x", () => {
    const tip = css.match(/\.nl-lab__tip\s*\{[^}]+\}/)?.[0];
    const info = css.match(/\.nl-lab__info-tip\s*\{[^}]+\}/)?.[0];
    const lab = css.match(/(?:^|\n)[ \t]*\.nl-lab\s*\{[^}]+\}/)?.[0];
    const scene = css.match(/\.nl-lab__scene\s*\{[^}]+\}/)?.[0];
    const host = css.match(/\[data-as-lumen-lab\]\s*\{[^}]+\}/)?.[0];
    expect(host).toContain("overflow-x: clip");
    expect(lab).toContain("overflow-x: clip");
    expect(scene).toContain("overflow-x: clip");
    expect(tip).toContain("display: none");
    expect(info).toContain("display: none");
    expect(tip).not.toContain("visibility");
    expect(info).not.toContain("visibility");
  });
});
