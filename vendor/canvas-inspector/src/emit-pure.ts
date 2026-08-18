/**
 * Ideal-stack HTML emit helpers — stamp Canvas Inspector attrs onto markup.
 */

import {
  AS_ATTR,
  serializeInspectAttrs,
  type InspectKind,
  type InspectTarget,
} from "./attr-contract-pure.js";

function escapeAttr(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
}

/** Build `key="value"` string from an InspectTarget. */
export function inspectAttrString(target: InspectTarget): string {
  const attrs = serializeInspectAttrs(target);
  return Object.entries(attrs)
    .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
    .join(" ");
}

export function stampComponentAttrs(input: {
  componentId: string;
  instanceId?: string;
  source?: string;
}): string {
  return inspectAttrString({
    kind: "component",
    componentId: input.componentId,
    instanceId: input.instanceId,
    source: input.source,
  });
}

export function stampSlotAttrs(input: {
  componentId: string;
  slot: string;
  instanceId?: string;
}): string {
  return inspectAttrString({
    kind: "slot",
    componentId: input.componentId,
    slot: input.slot,
    instanceId: input.instanceId,
  });
}

/** Wrap inner HTML in a tag with inspect attrs (dev authoring). */
export function wrapInspectableHtml(input: {
  tag?: string;
  kind: InspectKind;
  componentId?: string;
  slot?: string;
  instanceId?: string;
  source?: string;
  className?: string;
  children: string;
}): string {
  const tag = input.tag ?? "div";
  const attr = inspectAttrString({
    kind: input.kind,
    componentId: input.componentId,
    slot: input.slot,
    instanceId: input.instanceId,
    source: input.source,
  });
  const cls = input.className
    ? ` class="${escapeAttr(input.className)}"`
    : "";
  return `<${tag}${cls} ${attr}>${input.children}</${tag}>`;
}

/** Ensure existing open tag string gets component attrs if missing. */
export function mergeComponentAttrOntoOpenTag(
  openTagHtml: string,
  componentId: string,
  instanceId?: string,
): string {
  if (openTagHtml.includes(AS_ATTR.component)) {
    // already stamped
    if (!openTagHtml.includes(AS_ATTR.inspect)) {
      return openTagHtml.replace(/>$/, ` ${AS_ATTR.inspect}="1" ${AS_ATTR.kind}="component">`);
    }
    return openTagHtml;
  }
  const extra = stampComponentAttrs({ componentId, instanceId });
  return openTagHtml.replace(/>$/, ` ${extra}>`);
}
