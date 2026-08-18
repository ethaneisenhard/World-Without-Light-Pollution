import { describe, expect, it } from "vitest";
import {
  AS_ATTR,
  AUTHORING_ATTRS,
  CANVAS_INSPECTOR_PROTOCOL,
  inferInspectKind,
  isCanvasInspectorMessage,
  parseInspectTarget,
  resolveStripAttrsFlag,
  serializeInspectAttrs,
  serializeSelectPayload,
  stripAuthoringAttrs,
  stripAuthoringAttrsFromHtml,
} from "./attr-contract-pure.js";

describe("parseInspectTarget", () => {
  it("parses component root", () => {
    expect(
      parseInspectTarget({
        [AS_ATTR.inspect]: "1",
        [AS_ATTR.kind]: "component",
        [AS_ATTR.component]: "blog-hero",
        [AS_ATTR.instance]: "hero-1",
      }),
    ).toEqual({
      kind: "component",
      componentId: "blog-hero",
      instanceId: "hero-1",
    });
  });

  it("infers component from data-as-component alone", () => {
    expect(
      parseInspectTarget({ [AS_ATTR.component]: "section" }),
    ).toEqual({ kind: "component", componentId: "section" });
  });

  it("infers slot", () => {
    expect(
      parseInspectTarget({
        [AS_ATTR.component]: "blog-hero",
        [AS_ATTR.slot]: "title",
      }),
    ).toEqual({
      kind: "slot",
      componentId: "blog-hero",
      slot: "title",
    });
  });

  it("returns null for empty attrs", () => {
    expect(parseInspectTarget({})).toBeNull();
  });

  it("rejects unknown kind without other signals", () => {
    expect(inferInspectKind({ [AS_ATTR.kind]: "widget" })).toBeNull();
    expect(parseInspectTarget({ [AS_ATTR.kind]: "widget" })).toBeNull();
  });
});

describe("serializeInspectAttrs + roundtrip", () => {
  it("roundtrips component+source", () => {
    const target = {
      kind: "component" as const,
      componentId: "grid",
      instanceId: "g1",
      source: "content/pages/home.md#hero",
    };
    const attrs = serializeInspectAttrs(target);
    expect(attrs[AS_ATTR.inspect]).toBe("1");
    expect(parseInspectTarget(attrs)).toEqual(target);
  });

  it("serializeSelectPayload uses protocol", () => {
    const msg = serializeSelectPayload({ kind: "text", source: "a.md" });
    expect(msg.protocol).toBe(CANVAS_INSPECTOR_PROTOCOL);
    expect(msg.type).toBe("select");
    expect(isCanvasInspectorMessage(msg)).toBe(true);
    expect(isCanvasInspectorMessage({ type: "select" })).toBe(false);
  });
});

describe("stripAuthoringAttrs", () => {
  it("strips authoring set by default", () => {
    const kept = stripAuthoringAttrs({
      [AS_ATTR.inspect]: "1",
      [AS_ATTR.kind]: "component",
      [AS_ATTR.component]: "section",
      [AS_ATTR.instance]: "x",
      class: "px-4",
    });
    expect(kept).toEqual({
      [AS_ATTR.component]: "section",
      class: "px-4",
    });
    expect(AUTHORING_ATTRS).toContain(AS_ATTR.inspect);
  });

  it("opt-out keeps attrs", () => {
    const attrs = {
      [AS_ATTR.inspect]: "1",
      [AS_ATTR.component]: "section",
    };
    expect(stripAuthoringAttrs(attrs, { strip: false })).toEqual(attrs);
  });

  it("alsoStripComponentSlot removes component/slot", () => {
    expect(
      stripAuthoringAttrs(
        {
          [AS_ATTR.component]: "section",
          [AS_ATTR.slot]: "title",
          id: "a",
        },
        { strip: true, alsoStripComponentSlot: true },
      ),
    ).toEqual({ id: "a" });
  });

  it("stripAuthoringAttrsFromHtml removes tokens", () => {
    const html =
      '<section data-as-inspect="1" data-as-kind="component" data-as-component="section" class="x">';
    const out = stripAuthoringAttrsFromHtml(html);
    expect(out).not.toContain("data-as-inspect");
    expect(out).not.toContain("data-as-kind");
    expect(out).toContain('data-as-component="section"');
    expect(out).toContain('class="x"');
  });
});

describe("resolveStripAttrsFlag", () => {
  it("defaults to strip", () => {
    expect(resolveStripAttrsFlag(undefined)).toBe(true);
    expect(resolveStripAttrsFlag({})).toBe(true);
    expect(resolveStripAttrsFlag({ stripAttrs: false })).toBe(false);
  });
});
