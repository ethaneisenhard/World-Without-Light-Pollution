import { describe, expect, it } from "vitest";
import { CANVAS_INSPECTOR_PROTOCOL } from "./attr-contract-pure.js";
import {
  applyDraftMessage,
  inspectOffMessage,
  inspectOnMessage,
  inspectTargetLabel,
  labelsOnMessage,
  revealAllMessage,
  selectTargetMessage,
  setModeMessage,
} from "./host-bridge-pure.js";

describe("host-bridge-pure", () => {
  it("builds inspect on/off", () => {
    expect(inspectOnMessage()).toEqual({
      protocol: CANVAS_INSPECTOR_PROTOCOL,
      type: "inspect-on",
    });
    expect(inspectOffMessage().type).toBe("inspect-off");
  });

  it("labels targets", () => {
    expect(inspectTargetLabel(null)).toBe("Nothing selected");
    expect(
      inspectTargetLabel({
        kind: "component",
        componentId: "blog-hero",
        instanceId: "a",
      }),
    ).toBe("component · blog-hero · #a");
  });

  it("applyDraftMessage", () => {
    const m = applyDraftMessage({
      componentId: "section",
      props: { padding: "lg" },
    });
    expect(m.type).toBe("apply-draft");
    if (m.type === "apply-draft") {
      expect(m.props?.padding).toBe("lg");
    }
  });

  it("revealAllMessage", () => {
    expect(revealAllMessage(true)).toEqual({
      protocol: CANVAS_INSPECTOR_PROTOCOL,
      type: "reveal-all",
      on: true,
    });
  });

  it("labels / mode / select-target messages", () => {
    expect(labelsOnMessage(true).type).toBe("labels-on");
    expect(setModeMessage("browse")).toEqual({
      protocol: CANVAS_INSPECTOR_PROTOCOL,
      type: "set-mode",
      mode: "browse",
    });
    expect(
      selectTargetMessage({ kind: "component", componentId: "section" }).type,
    ).toBe("select-target");
  });
});
