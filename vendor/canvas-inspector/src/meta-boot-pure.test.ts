import { describe, expect, it } from "vitest";
import {
  collectSlotTextFromElement,
  enrichMetaBootFromDom,
  resolveComponentRootForApply,
} from "./meta-boot-pure.js";

describe("meta-boot-pure", () => {
  it("collects slot text from DOM", () => {
    const root = document.createElement("div");
    root.setAttribute("data-as-component", "blog-hero");
    root.innerHTML = `<h1 data-as-slot="title">This is the home page!!</h1>`;
    expect(collectSlotTextFromElement(root).title).toBe(
      "This is the home page!!",
    );
  });

  it("enriches boot draft from live DOM", () => {
    const root = document.createElement("div");
    root.innerHTML = `<span data-as-slot="title">Live</span>`;
    const boot = enrichMetaBootFromDom(
      {
        id: "blog-hero",
        title: "Blog hero",
        props: {},
        slots: { title: { title: "Title" } },
        draft: {
          props: {},
          slotText: { title: "An untitled essay" },
          children: "",
        },
      },
      root,
      );
    expect(boot.draft?.slotText.title).toBe("Live");
  });

  it("resolveComponentRootForApply prefers component root over slot", () => {
    const doc = document;
    doc.body.innerHTML = `
      <h1 data-as-component="heading" data-as-instance="home-title">
        <span data-as-component="heading" data-as-slot="text" data-as-instance="home-title">Hi</span>
      </h1>
    `;
    const root = resolveComponentRootForApply(doc, {
      componentId: "heading",
      instanceId: "home-title",
    });
    expect(root?.tagName).toBe("H1");
    expect(root?.hasAttribute("data-as-slot")).toBe(false);
  });
});
