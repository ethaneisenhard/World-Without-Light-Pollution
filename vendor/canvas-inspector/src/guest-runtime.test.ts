import { describe, expect, it } from "vitest";
import { AS_ATTR, parseInspectTarget } from "./attr-contract-pure.js";
import {
  INSPECTABLE_SELECTOR,
  REVEAL_CLASS,
  applyRevealAll,
  attrsFromElement,
  collectComponentAncestorChain,
  findHoverTarget,
  findInspectableAncestor,
  isInspectorChrome,
  parseTargetFromElement,
  targetFromElement,
} from "./guest-runtime.js";

function el(html: string): Element {
  const wrap = document.createElement("div");
  wrap.innerHTML = html.trim();
  const child = wrap.firstElementChild;
  if (!child) throw new Error("no element");
  return child;
}

describe("findInspectableAncestor", () => {
  it("finds component root from child", () => {
    const root = el(
      `<div data-as-component="section"><p id="inner">hi</p></div>`,
    );
    document.body.appendChild(root);
    const inner = root.querySelector("#inner");
    const hit = findInspectableAncestor(inner, document.documentElement);
    expect(hit).toBe(root);
    expect(parseTargetFromElement(hit!)).toEqual({
      kind: "component",
      componentId: "section",
    });
    root.remove();
  });

  it("returns null when unmarked", () => {
    const root = el(`<div><span id="x">x</span></div>`);
    document.body.appendChild(root);
    expect(
      findInspectableAncestor(root.querySelector("#x"), document.documentElement),
    ).toBeNull();
    root.remove();
  });

  it("matches INSPECTABLE_SELECTOR", () => {
    expect(INSPECTABLE_SELECTOR).toContain(AS_ATTR.component);
    const node = el(`<section data-as-inspect="1"></section>`);
    expect(node.matches(INSPECTABLE_SELECTOR)).toBe(true);
    expect(parseInspectTarget(attrsFromElement(node))?.kind).toBe("text");
  });
});

describe("findHoverTarget", () => {
  it("selects component root when clicking heading without slot", () => {
    const root = el(
      `<section data-as-component="blog-hero"><h1 id="t">Hello</h1></section>`,
    );
    document.body.appendChild(root);
    const h1 = root.querySelector("#t");
    expect(findHoverTarget(h1, document.documentElement)).toBe(root);
    root.remove();
  });

  it("skips inspector chrome", () => {
    const chrome = el(
      `<div data-as-ci-standalone><button id="b">Inspect</button></div>`,
    );
    document.body.appendChild(chrome);
    expect(isInspectorChrome(chrome.querySelector("#b"))).toBe(true);
    expect(
      findHoverTarget(chrome.querySelector("#b"), document.documentElement),
    ).toBeNull();
    chrome.remove();
  });

  it("prefers slot wrapper over text child", () => {
    const root = el(
      `<div data-as-component="blog-hero"><div data-as-slot="title"><h1 id="t">Hi</h1></div></div>`,
    );
    document.body.appendChild(root);
    const h1 = root.querySelector("#t");
    const hit = findHoverTarget(h1, document.documentElement);
    expect(hit?.getAttribute("data-as-slot")).toBe("title");
    root.remove();
  });

  it("one-click selects nested button over parent CTA slot", () => {
    const root = el(
      `<section data-as-component="blog-hero"><div data-as-slot="ctaPrimary" class="contents"><a id="cta" data-as-component="button" href="#">Go</a></div></section>`,
    );
    document.body.appendChild(root);
    const cta = root.querySelector("#cta");
    const hit = findHoverTarget(cta, document.documentElement);
    expect(hit).toBe(cta);
    expect(hit?.getAttribute("data-as-component")).toBe("button");
    root.remove();
  });
});

describe("collectComponentAncestorChain", () => {
  it("returns outer → inner component roots", () => {
    const tree = el(
      `<section data-as-component="section" data-as-instance="s1"><div data-as-component="container" data-as-instance="c1"><div data-as-component="blog-hero" data-as-instance="h1"><a id="b" data-as-component="button">Go</a></div></div></section>`,
    );
    document.body.appendChild(tree);
    const chain = collectComponentAncestorChain(
      tree.querySelector("#b"),
      document.documentElement,
    );
    expect(chain.map((t) => t.componentId)).toEqual([
      "section",
      "container",
      "blog-hero",
      "button",
    ]);
    tree.remove();
  });
});

describe("applyRevealAll", () => {
  it("outlines component roots, not nested text slots or contents wrappers", () => {
    const tree = el(
      `<section data-as-component="blog-hero">
        <div class="contents" data-as-inspect="1" data-as-kind="slot" data-as-component="blog-hero" data-as-slot="title">
          <h1 data-as-component="heading" data-as-instance="home-title">
            <span data-as-inspect="1" data-as-kind="slot" data-as-component="heading" data-as-slot="text">Ship the work that matters.</span>
          </h1>
        </div>
        <div data-as-inspect="1" data-as-kind="text" id="bare-text">form</div>
      </section>`,
    );
    document.body.appendChild(tree);

    applyRevealAll(document, true);

    const hero = tree;
    const titleSlot = tree.querySelector("[data-as-slot='title']");
    const heading = tree.querySelector("[data-as-component='heading']");
    const textSlot = tree.querySelector("[data-as-slot='text']");
    const bare = tree.querySelector("#bare-text");

    expect(hero.classList.contains(REVEAL_CLASS)).toBe(true);
    expect(heading?.classList.contains(REVEAL_CLASS)).toBe(true);
    expect(bare?.classList.contains(REVEAL_CLASS)).toBe(true);
    expect(titleSlot?.classList.contains(REVEAL_CLASS)).toBe(false);
    expect(textSlot?.classList.contains(REVEAL_CLASS)).toBe(false);

    applyRevealAll(document, false);
    expect(hero.classList.contains(REVEAL_CLASS)).toBe(false);
    expect(document.querySelectorAll(`.${REVEAL_CLASS}`).length).toBe(0);

    tree.remove();
  });
});
