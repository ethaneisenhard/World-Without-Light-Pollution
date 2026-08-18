import { describe, expect, it } from "vitest";
import { CANVAS_INSPECTOR_PROTOCOL } from "./attr-contract-pure.js";
import {
  initialCanvasInspectorHostState,
  reduceCanvasInspectorHostMessage,
  toggleInspectOn,
} from "./host-state-pure.js";

describe("host-state-pure", () => {
  it("toggles inspect and clears selection on off", () => {
    let s = {
      ...initialCanvasInspectorHostState(),
      selected: { kind: "component" as const, componentId: "x" },
      inspectOn: true,
    };
    const off = toggleInspectOn(s);
    expect(off.state.inspectOn).toBe(false);
    expect(off.state.selected).toBeNull();
    expect(off.message.type).toBe("inspect-off");
  });

  it("reduces select messages with meta and ancestors", () => {
    const s = reduceCanvasInspectorHostMessage(
      initialCanvasInspectorHostState(),
      {
        protocol: CANVAS_INSPECTOR_PROTOCOL,
        type: "select",
        target: { kind: "slot", componentId: "blog-hero", slot: "title" },
        ancestors: [
          { kind: "component", componentId: "section" },
          { kind: "component", componentId: "blog-hero" },
        ],
        meta: {
          id: "blog-hero",
          title: "Blog hero",
          props: {},
          slots: { title: { title: "Title" } },
          draft: {
            props: {},
            slotText: { title: "Live title" },
            children: "",
          },
        },
      },
    );
    expect(s.selected?.slot).toBe("title");
    expect(s.meta?.draft?.slotText.title).toBe("Live title");
    expect(s.ancestors.map((a) => a.componentId)).toEqual([
      "section",
      "blog-hero",
    ]);
  });

  it("reduces text-change into meta.draft.slotText (canvas → panel)", () => {
    const base = reduceCanvasInspectorHostMessage(
      initialCanvasInspectorHostState(),
      {
        protocol: CANVAS_INSPECTOR_PROTOCOL,
        type: "select",
        target: { kind: "slot", componentId: "heading", slot: "text" },
        meta: {
          id: "heading",
          title: "Heading",
          props: {},
          slots: { text: { title: "Text" } },
          draft: {
            props: {},
            slotText: { text: "About North" },
            children: "",
          },
        },
      },
    );
    const next = reduceCanvasInspectorHostMessage(base, {
      protocol: CANVAS_INSPECTOR_PROTOCOL,
      type: "text-change",
      target: { kind: "slot", componentId: "heading", slot: "text" },
      text: "About Nort",
    });
    expect(next.meta?.draft?.slotText.text).toBe("About Nort");
    expect(next.selected?.slot).toBe("text");
  });
});
