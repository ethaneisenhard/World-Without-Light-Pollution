import { describe, expect, it } from "vitest";
import {
  buildPanelModel,
  defaultDraftFromMeta,
  patchPanelProp,
  type PanelComponentMeta,
} from "./registry-panel-pure.js";

const meta: PanelComponentMeta = {
  id: "blog-hero",
  title: "Blog hero",
  props: {
    layout: {
      type: "enum",
      values: ["stack", "side", "magazine"],
      default: "stack",
      title: "Layout",
    },
  },
  slots: {
    title: { title: "Title" },
  },
};

describe("registry-panel-pure", () => {
  it("builds fields from meta + draft", () => {
    const draft = defaultDraftFromMeta(meta);
    const model = buildPanelModel(meta, draft);
    expect(model.componentId).toBe("blog-hero");
    expect(model.props[0]?.value).toBe("stack");
    expect(model.slots[0]?.key).toBe("title");
  });

  it("patches prop", () => {
    const draft = patchPanelProp(defaultDraftFromMeta(meta), "layout", "side");
    expect(draft.props.layout).toBe("side");
  });
});
