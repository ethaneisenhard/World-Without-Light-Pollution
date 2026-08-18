import { describe, expect, it } from "vitest";
import {
  applySlotTextInDom,
  findSlotHost,
  resolveCopyHost,
} from "./apply-slot-text-pure.js";

describe("applySlotTextInDom", () => {
  it("updates heading text span without replacing the h1", () => {
    const root = document.createElement("div");
    root.innerHTML = `
      <h1 class="font-display text-5xl text-center" data-as-component="heading" data-as-instance="home-title">
        <span data-as-component="heading" data-as-slot="text" data-as-instance="home-title">Old</span>
      </h1>
    `;
    const h1 = root.querySelector("h1")!;
    expect(applySlotTextInDom(h1, { text: "Ship the work" })).toBe(true);
    expect(h1.className).toContain("font-display");
    expect(h1.className).toContain("text-5xl");
    expect(h1.querySelector("[data-as-slot='text']")?.textContent).toBe(
      "Ship the work",
    );
    expect(root.querySelectorAll("h1").length).toBe(1);
  });

  it("patches nested heading inside blog-hero title slot", () => {
    const root = document.createElement("section");
    root.setAttribute("data-as-component", "blog-hero");
    root.innerHTML = `
      <div data-as-component="blog-hero" data-as-slot="title">
        <h1 class="font-display" data-as-component="heading" data-as-instance="home-title">
          <span data-as-slot="text" data-as-component="heading">Old title</span>
        </h1>
      </div>
    `;
    expect(applySlotTextInDom(root, { title: "New title" })).toBe(true);
    expect(root.querySelector("h1")?.className).toContain("font-display");
    expect(root.querySelector("[data-as-slot='text']")?.textContent).toBe(
      "New title",
    );
  });

  it("findSlotHost / resolveCopyHost", () => {
    const root = document.createElement("h1");
    root.setAttribute("data-as-component", "heading");
    root.innerHTML = `<span data-as-slot="text">Hi</span>`;
    expect(findSlotHost(root, "text")?.tagName).toBe("SPAN");
    expect(resolveCopyHost(root).getAttribute("data-as-slot")).toBe("text");
  });
});
