import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** Narrator leftovers — the page should be the lesson, not a tour of itself. */
const FORBIDDEN = [
  /playground/i,
  /this demo/i,
  /this playground/i,
  /card below/i,
  /belongs to that heading/i,
  /drag the scene/i,
  /hover the markers/i,
  /slide \*\*cover/i,
  /interactive demo loads/i,
  /terrible idea/i,
  /bad lighting/i,
  /the problem/i,
  /full stop/i,
  /biological cost/i,
  /the enemy/i,
  /wrecking/i,
  /advocacy toolkit/i,
  /that's all this is/i,
  /that's the whole invitation/i,
  /the hope is simple/i,
  /cobra-head/i,
  /full cut-off/i,
  /full cutoff/i,
];

describe("brand tagline", () => {
  it("stays Reclaim the night sky", () => {
    const site = readFileSync(join(process.cwd(), "src/site-pure.ts"), "utf8");
    expect(site).toContain('tagline: "Reclaim the night sky."');
  });
});

describe("visitor copy", () => {
  it("does not narrate the site or talk like a war", () => {
    const dir = join(process.cwd(), "content/pages");
    const files = [
      ...readdirSync(dir)
        .filter((file) => file.endsWith(".md"))
        .map((file) => join(dir, file)),
      join(process.cwd(), "src/site-pure.ts"),
      join(process.cwd(), "src/home-paths-pure.ts"),
    ];
    for (const path of files) {
      const text = readFileSync(path, "utf8");
      for (const re of FORBIDDEN) {
        expect(text, `${path} matched ${re}`).not.toMatch(re);
      }
    }
  });

  it("lab labels use street lamp and shade, not fixture jargon", () => {
    const lab = readFileSync(join(process.cwd(), "public/lumen-lab.js"), "utf8");
    expect(lab).not.toMatch(/cobra-head/i);
    expect(lab).not.toMatch(/full cut-off/i);
    expect(lab).not.toMatch(/full cutoff/i);
    expect(lab).toContain("Street lamp, no shade");
    expect(lab).toContain("Street lamp with a shade");
  });
});
