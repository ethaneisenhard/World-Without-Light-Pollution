import { describe, expect, it } from "vitest";
import { paintInspectorPanelBody } from "./paint-panel-body-dom.js";
import {
  defaultDraftFromMeta,
  type PanelComponentMeta,
} from "./registry-panel-pure.js";

describe("paintInspectorPanelBody", () => {
  it("returns empty for no selection", () => {
    const result = paintInspectorPanelBody({
      doc: document,
      selected: null,
      meta: null,
      draft: { props: {}, slotText: {}, children: "" },
      onDraftChange: () => {},
    });
    expect(result.node).toBeNull();
    expect(result.status).toBe("");
  });

  it("paints props and slots for registry meta", () => {
    const meta: PanelComponentMeta = {
      id: "blog-hero",
      title: "Blog hero",
      props: {
        layout: {
          type: "enum",
          values: ["stack", "side"],
          default: "stack",
        },
      },
      slots: { title: { title: "Title" } },
    };
    const drafts: unknown[] = [];
    const result = paintInspectorPanelBody({
      doc: document,
      selected: {
        kind: "component",
        componentId: "blog-hero",
        instanceId: "i1",
      },
      meta,
      draft: defaultDraftFromMeta(meta),
      panelTab: "props",
      onDraftChange: (d) => drafts.push(d),
    });
    expect(result.status).toContain("blog-hero");
    expect(result.node).toBeTruthy();
    const root = result.node as HTMLElement;
    expect(root.querySelector("[data-as-ci-tabs]")).toBeTruthy();
    expect(root.querySelector("[data-as-ci-tab='props']")).toBeTruthy();
    expect(root.querySelector("[data-as-ci-tab='content']")).toBeTruthy();
    expect(root.querySelector("[data-as-ci-prop='layout']")).toBeTruthy();
  });

  it("switches to Content tab for slot fields", () => {
    const meta: PanelComponentMeta = {
      id: "blog-hero",
      title: "Blog hero",
      props: {
        layout: {
          type: "enum",
          values: ["magazine", "side"],
          default: "magazine",
        },
      },
      slots: {
        title: { title: "Title" },
        ctaPrimary: { title: "Primary CTA" },
      },
    };
    const result = paintInspectorPanelBody({
      doc: document,
      selected: {
        kind: "component",
        componentId: "blog-hero",
        instanceId: "i1",
      },
      meta,
      draft: defaultDraftFromMeta(meta),
      panelTab: "content",
      onDraftChange: () => {},
    });
    const root = result.node as HTMLElement;
    expect(root.querySelector("[data-as-ci-slot='title']")).toBeTruthy();
    expect(root.querySelector("[data-as-ci-prop='layout']")).toBeNull();
    expect(root.querySelector("[data-as-ci-tab='actions']")).toBeTruthy();
  });

  it("honors Props tab click even when a slot is selected", () => {
    const meta: PanelComponentMeta = {
      id: "heading",
      title: "Heading",
      props: {
        size: {
          type: "enum",
          values: ["lg", "display"],
          default: "lg",
        },
      },
      slots: { text: { title: "Text" } },
    };
    const result = paintInspectorPanelBody({
      doc: document,
      selected: {
        kind: "slot",
        componentId: "heading",
        slot: "text",
        instanceId: "home-title",
      },
      meta,
      draft: defaultDraftFromMeta(meta),
      panelTab: "props",
      onDraftChange: () => {},
    });
    const root = result.node as HTMLElement;
    expect(
      root.querySelector("[data-as-ci-tab='props']")?.getAttribute("aria-selected"),
    ).toBe("true");
    expect(root.querySelector("[data-as-ci-prop='size']")).toBeTruthy();
    expect(root.querySelector("[data-as-ci-slot='text']")).toBeNull();
  });

  it("paints clickable ancestor trail", () => {
    const meta: PanelComponentMeta = {
      id: "button",
      title: "Button",
      props: {},
      slots: { label: { title: "Label" } },
    };
    const clicks: string[] = [];
    const result = paintInspectorPanelBody({
      doc: document,
      selected: {
        kind: "component",
        componentId: "button",
        instanceId: "b1",
      },
      meta,
      draft: defaultDraftFromMeta(meta),
      ancestors: [
        { kind: "component", componentId: "section", instanceId: "s1" },
        { kind: "component", componentId: "container", instanceId: "c1" },
        { kind: "component", componentId: "button", instanceId: "b1" },
      ],
      onAncestorClick: (t) => clicks.push(t.componentId ?? ""),
      onDraftChange: () => {},
    });
    const root = result.node as HTMLElement;
    const trail = root.querySelector("[data-as-ci-ancestors]");
    expect(trail).toBeTruthy();
    const btns = trail!.querySelectorAll("button[data-as-ci-ancestor]");
    expect(btns.length).toBe(2);
    (btns[0] as HTMLButtonElement).click();
    expect(clicks).toEqual(["section"]);
  });
});
