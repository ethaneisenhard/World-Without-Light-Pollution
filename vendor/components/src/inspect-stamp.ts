/**
 * Shared Canvas Inspector stamps for design-registry SSR renders.
 * Prefer these over hand-rolled data-as-* strings (tokens-and-markup.mdc).
 */

import {
  stampComponentAttrs,
  stampSlotAttrs,
  wrapInspectableHtml,
} from "@glassbox-studio/canvas-inspector";

export { stampComponentAttrs, stampSlotAttrs, wrapInspectableHtml };

/** Open-tag attribute string for a registry component root. */
export function componentStamp(input: {
  componentId: string;
  instanceId?: string;
  source?: string;
}): string {
  return stampComponentAttrs(input);
}

/**
 * If `html` is exactly one element tree, return its parts; else null.
 * Uses tag-depth walk so sibling roots (two `<a>`s) are not mistaken for one.
 */
export function parseSingleRootElement(
  html: string,
): { tag: string; attrs: string; inner: string } | null {
  const trimmed = html.trim();
  const open = trimmed.match(/^<([a-zA-Z][a-zA-Z0-9]*)(\s[^>]*)?>/);
  if (!open) return null;

  const tag = open[1];
  const attrs = open[2] ?? "";
  const openRe = new RegExp(`<${tag}(\\s[^>]*)?>`, "gi");
  const closeRe = new RegExp(`</${tag}>`, "gi");
  const voidRe = new RegExp(`^<${tag}(\\s[^>]*)?/>$`, "i");
  if (voidRe.test(trimmed)) {
    return { tag, attrs, inner: "" };
  }

  let depth = 0;
  let i = 0;
  while (i < trimmed.length) {
    openRe.lastIndex = i;
    closeRe.lastIndex = i;
    const nextOpen = openRe.exec(trimmed);
    const nextClose = closeRe.exec(trimmed);
    if (!nextClose) return null;

    const openIdx = nextOpen?.index ?? Infinity;
    const closeIdx = nextClose.index;

    if (openIdx < closeIdx && nextOpen) {
      depth += 1;
      i = openIdx + nextOpen[0].length;
      continue;
    }

    depth -= 1;
    i = closeIdx + nextClose[0].length;
    if (depth === 0) {
      if (i !== trimmed.length) return null; // sibling content after root
      const innerStart = open[0].length;
      const innerEnd = closeIdx;
      return {
        tag,
        attrs,
        inner: trimmed.slice(innerStart, innerEnd),
      };
    }
  }
  return null;
}

/**
 * Stamp a slot onto HTML. Prefer merging onto a single semantic root
 * (`<h1>`, `<p>`, `<figure>`, …); wrap in `<div>` only when needed.
 */
export function stampSlotOntoHtml(input: {
  componentId: string;
  slot: string;
  html: string;
  instanceId?: string;
}): string {
  const html = input.html.trim();
  if (!html) return "";

  const stamp = stampSlotAttrs({
    componentId: input.componentId,
    slot: input.slot,
    instanceId: input.instanceId,
  });

  const root = parseSingleRootElement(html);
  if (root) {
    // Never overwrite a nested registry component (e.g. Button in a CTA slot).
    const childIsComponent = /\sdata-as-component=/.test(root.attrs);
    if (!childIsComponent && !/\sdata-as-slot=/.test(root.attrs)) {
      return `<${root.tag}${root.attrs} ${stamp}>${root.inner}</${root.tag}>`;
    }
  }

  return wrapInspectableHtml({
    tag: "div",
    kind: "slot",
    componentId: input.componentId,
    slot: input.slot,
    instanceId: input.instanceId,
    className: root && /\sdata-as-component=/.test(root.attrs) ? "contents" : undefined,
    children: html,
  });
}
