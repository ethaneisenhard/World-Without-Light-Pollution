/**
 * Guest hit-target + outline helpers — pure / DOM-light for tests.
 * Full activate/teardown lives in `createGuestInspector`.
 */

import {
  AS_ATTR,
  parseInspectTarget,
  serializeSelectPayload,
  type InspectTarget,
} from "./attr-contract-pure.js";

export const INSPECTABLE_SELECTOR = `[${AS_ATTR.inspect}], [${AS_ATTR.component}], [${AS_ATTR.slot}]`;

/**
 * Soft-reveal outlines — component roots + bare text/markdown only.
 * Nested `data-as-slot` spans (inline text) must not get outlines: multi-line
 * inline outlines fragment into per-line boxes (Inspect soup regression).
 * `display:contents` slot wrappers are also skipped via the slot attr.
 */
export const REVEAL_SELECTOR = [
  `[${AS_ATTR.component}]:not([${AS_ATTR.slot}])`,
  `[${AS_ATTR.inspect}][${AS_ATTR.kind}="text"]`,
  `[${AS_ATTR.inspect}][${AS_ATTR.kind}="markdown"]`,
].join(", ");

/** Standalone / host chrome — never treat as canvas targets. */
export const CHROME_SELECTOR = "[data-as-ci-standalone], [data-as-ci-chrome]";

export const OUTLINE_HOVER_CLASS = "as-ci-hover";
export const OUTLINE_SELECT_CLASS = "as-ci-selected";
export const EDITING_CLASS = "as-ci-editing";
/** Soft outline on component roots while Inspect reveal is on. */
export const REVEAL_CLASS = "as-ci-reveal";

const STYLE_ID = "as-canvas-inspector-style";

const SKIP_TAGS = new Set([
  "HTML",
  "HEAD",
  "BODY",
  "SCRIPT",
  "STYLE",
  "LINK",
  "META",
  "NOSCRIPT",
  "SVG",
  "PATH",
  "BR",
  "HR",
]);

const TEXTISH_TAGS = new Set([
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "P",
  "SPAN",
  "A",
  "LI",
  "LABEL",
  "BUTTON",
  "FIGCAPTION",
  "BLOCKQUOTE",
  "TD",
  "TH",
  "DT",
  "DD",
]);

export function attrsFromElement(el: Element): Record<string, string> {
  const out: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    out[attr.name] = attr.value;
  }
  return out;
}

export function parseTargetFromElement(el: Element): InspectTarget | null {
  return parseInspectTarget(attrsFromElement(el));
}

export function isInspectorChrome(start: EventTarget | null): boolean {
  if (start == null || !(start instanceof Element)) return false;
  return Boolean(start.closest(CHROME_SELECTOR));
}

export function isMeaningfulTarget(el: Element): boolean {
  if (SKIP_TAGS.has(el.tagName)) return false;
  if (el.matches?.(CHROME_SELECTOR)) return false;
  if (el.closest?.(CHROME_SELECTOR)) return false;
  if (el.matches?.(INSPECTABLE_SELECTOR)) return true;
  if (TEXTISH_TAGS.has(el.tagName)) return true;
  if (el.tagName === "IMG" || el.tagName === "PICTURE" || el.tagName === "VIDEO") {
    return true;
  }
  if (el.tagName === "SECTION" || el.tagName === "ARTICLE" || el.tagName === "HEADER") {
    return true;
  }
  if (el.tagName === "DIV" || el.tagName === "MAIN") {
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === 3 && (child.textContent ?? "").trim().length > 0) {
        return true;
      }
    }
  }
  return false;
}

/** Infer InspectTarget for unmarked nodes (canvas typing / generic select). */
export function targetFromElement(el: Element): InspectTarget {
  const stamped = parseTargetFromElement(el);
  if (stamped) return stamped;
  const tag = el.tagName.toLowerCase();
  return {
    kind: "text",
    instanceId: el.id || undefined,
    source: tag,
  };
}

/**
 * Walk from event target up to nearest inspectable ancestor.
 */
export function findInspectableAncestor(
  start: EventTarget | null,
  root: ParentNode = typeof document !== "undefined" ? document : (null as unknown as ParentNode),
): Element | null {
  if (start == null || !(start instanceof Element)) return null;
  if (isInspectorChrome(start)) return null;
  let node: Element | null = start;
  while (node && node !== root) {
    if (node.matches?.(INSPECTABLE_SELECTOR)) return node;
    node = node.parentElement;
  }
  if (node instanceof Element && node.matches?.(INSPECTABLE_SELECTOR)) return node;
  return null;
}

/**
 * Prefer nested *component* when it sits inside the click path before any slot
 * (CTA: `div[data-as-slot]` wrapping `a[data-as-component=button]` → button, one click).
 * If a slot is closer than any component, prefer the slot (title/text edit).
 * Then: textish → stamped → meaningful.
 */
export function findHoverTarget(
  start: EventTarget | null,
  root: ParentNode = typeof document !== "undefined" ? document : (null as unknown as ParentNode),
): Element | null {
  if (start == null || !(start instanceof Element)) return null;
  if (isInspectorChrome(start)) return null;

  let node: Element | null = start;
  let deepMeaningful: Element | null = null;
  let stamped: Element | null = null;
  let slot: Element | null = null;
  let deepestComponent: Element | null = null;
  let slotBeforeComponent = false;

  while (node && node !== root) {
    if (!deepMeaningful && isMeaningfulTarget(node)) {
      deepMeaningful = node;
    }
    if (
      !deepestComponent &&
      node.hasAttribute?.(AS_ATTR.component) &&
      !node.hasAttribute?.(AS_ATTR.slot)
    ) {
      deepestComponent = node;
    }
    if (!slot && node.hasAttribute?.(AS_ATTR.slot)) {
      slot = node;
      if (!deepestComponent) slotBeforeComponent = true;
    }
    if (!stamped && node.matches?.(INSPECTABLE_SELECTOR)) {
      stamped = node;
    }
    node = node.parentElement;
  }

  if (deepestComponent && !slotBeforeComponent) return deepestComponent;
  if (slot) return slot;
  if (deepMeaningful && TEXTISH_TAGS.has(deepMeaningful.tagName)) {
    return deepMeaningful;
  }
  if (stamped) return stamped;
  return deepMeaningful;
}

/**
 * Walk up from `el` collecting stamped component roots (outer → inner).
 * Skips slot hosts so section → container → blog-hero → button is clean.
 */
export function collectComponentAncestorChain(
  el: Element | null,
  root: ParentNode = typeof document !== "undefined" ? document : (null as unknown as ParentNode),
): InspectTarget[] {
  const stack: InspectTarget[] = [];
  let node: Element | null = el;
  while (node && node !== root) {
    if (
      node.hasAttribute?.(AS_ATTR.component) &&
      !node.hasAttribute?.(AS_ATTR.slot)
    ) {
      const t = parseTargetFromElement(node);
      if (t) stack.push(t);
    }
    node = node.parentElement;
  }
  return stack.reverse();
}

/** Resolve a target back to a DOM node (instance id preferred). */
export function findElementForTarget(
  doc: Document,
  target: InspectTarget,
): Element | null {
  if (target.instanceId) {
    const byInstance = doc.querySelector(
      `[${AS_ATTR.instance}="${CSS.escape(target.instanceId)}"]`,
    );
    if (byInstance) {
      if (target.slot) {
        const slot = byInstance.querySelector(
          `[${AS_ATTR.slot}="${CSS.escape(target.slot)}"]`,
        );
        if (slot) return slot;
      }
      if (
        !target.slot &&
        byInstance.hasAttribute(AS_ATTR.component) &&
        !byInstance.hasAttribute(AS_ATTR.slot)
      ) {
        return byInstance;
      }
      if (!target.slot) return byInstance;
    }
  }
  if (target.componentId && !target.slot) {
    const nodes = doc.querySelectorAll(
      `[${AS_ATTR.component}="${CSS.escape(target.componentId)}"]`,
    );
    for (const n of Array.from(nodes)) {
      if (!n.hasAttribute(AS_ATTR.slot)) return n;
    }
  }
  if (target.componentId && target.slot) {
    return doc.querySelector(
      `[${AS_ATTR.component}="${CSS.escape(target.componentId)}"][${AS_ATTR.slot}="${CSS.escape(target.slot)}"]`,
    );
  }
  return null;
}

export function ensureGuestStyles(doc: Document): void {
  let style = doc.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = doc.createElement("style");
    style.id = STYLE_ID;
    doc.head.appendChild(style);
  }
  style.textContent = `
.${OUTLINE_HOVER_CLASS} {
  outline: 2px dashed color-mix(in oklab, var(--color-accent, #0f766e) 85%, transparent) !important;
  outline-offset: 2px;
  cursor: pointer;
  position: relative;
  z-index: 1;
}
.${OUTLINE_SELECT_CLASS} {
  outline: 2px solid var(--color-accent, #0f766e) !important;
  outline-offset: 2px;
  position: relative;
  z-index: 2;
}
.${REVEAL_CLASS} {
  outline: 1px solid color-mix(in oklab, #38bdf8 70%, transparent) !important;
  outline-offset: 2px;
  box-shadow: inset 0 0 0 9999px color-mix(in oklab, #38bdf8 10%, transparent);
}
.${OUTLINE_HOVER_CLASS}.${REVEAL_CLASS},
.${OUTLINE_SELECT_CLASS}.${REVEAL_CLASS} {
  box-shadow: none;
}
.${EDITING_CLASS} {
  outline: 2px solid var(--color-glow, #2dd4bf) !important;
  outline-offset: 2px;
  min-width: 1ch;
}
/* Component name tabs — inside box so overflow:hidden parents don't clip */
html.as-ci-labels-on [${AS_ATTR.component}]:not([${AS_ATTR.slot}]) {
  position: relative;
}
html.as-ci-labels-on [${AS_ATTR.component}]:not([${AS_ATTR.slot}])::before {
  content: attr(${AS_ATTR.component});
  position: absolute;
  z-index: 20;
  top: 0;
  left: 0;
  max-width: min(12rem, 80vw);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
  font: 600 10px/1.2 var(--font-sans, system-ui, sans-serif);
  letter-spacing: 0.02em;
  padding: 2px 6px;
  border-radius: 0 0 4px 0;
  background: var(--color-accent, #0f766e);
  color: #fff;
  box-shadow: 0 1px 2px rgb(0 0 0 / 20%);
}
html.as-ci-labels-on .${OUTLINE_SELECT_CLASS}[${AS_ATTR.component}]:not([${AS_ATTR.slot}])::before {
  background: color-mix(in oklab, var(--color-accent, #0f766e) 75%, #000);
}
[data-as-ci-standalone] {
  font-family: var(--font-sans, system-ui, sans-serif);
}
`;
}

export function applyRevealAll(doc: Document, on: boolean): void {
  for (const el of Array.from(doc.querySelectorAll(`.${REVEAL_CLASS}`))) {
    el.classList.remove(REVEAL_CLASS);
  }
  if (!on) return;
  for (const el of Array.from(doc.querySelectorAll(REVEAL_SELECTOR))) {
    if (el.closest(CHROME_SELECTOR)) continue;
    el.classList.add(REVEAL_CLASS);
  }
}

export function clearGuestStyles(doc: Document): void {
  doc.getElementById(STYLE_ID)?.remove();
  for (const el of Array.from(
    doc.querySelectorAll(
      `.${OUTLINE_HOVER_CLASS}, .${OUTLINE_SELECT_CLASS}, .${EDITING_CLASS}, .${REVEAL_CLASS}`,
    ),
  )) {
    el.classList.remove(
      OUTLINE_HOVER_CLASS,
      OUTLINE_SELECT_CLASS,
      EDITING_CLASS,
      REVEAL_CLASS,
    );
    if (el instanceof HTMLElement && el.isContentEditable) {
      el.contentEditable = "false";
    }
  }
}

export type GuestInspectorHandlers = {
  postToHost: (data: unknown) => void;
};

export type GuestInspector = {
  activate: () => void;
  deactivate: () => void;
  isActive: () => boolean;
  getSelected: () => InspectTarget | null;
  getSelectedElement: () => Element | null;
  setRevealAll: (on: boolean) => void;
  isRevealAll: () => boolean;
  /** select = click picks components; browse = links/pass-through work */
  setInteractionMode: (mode: "select" | "browse") => void;
  getInteractionMode: () => "select" | "browse";
  setLabelsOn: (on: boolean) => void;
  isLabelsOn: () => boolean;
  /** Select by InspectTarget (panel ancestor clicks / All-view echo). */
  selectTarget: (
    target: InspectTarget | null,
    opts?: { silent?: boolean },
  ) => void;
  getAncestorChain: () => InspectTarget[];
};

export type GuestInspectorOptions = {
  /** Soft-outline component roots while active (default true). */
  revealAllOnActivate?: boolean;
};

function canInlineEdit(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
    return false;
  }
  if (el.tagName === "IMG" || el.tagName === "VIDEO" || el.tagName === "SVG") {
    return false;
  }
  const stamped = parseTargetFromElement(el);
  if (stamped?.kind === "component" && !TEXTISH_TAGS.has(el.tagName)) {
    return false;
  }
  return (
    TEXTISH_TAGS.has(el.tagName) ||
    stamped?.kind === "text" ||
    stamped?.kind === "markdown" ||
    stamped?.kind === "slot"
  );
}

/**
 * Attach hover/select listeners on `win` document.
 */
export function createGuestInspector(
  win: Window,
  handlers: GuestInspectorHandlers,
  options: GuestInspectorOptions = {},
): GuestInspector {
  const doc = win.document;
  let active = false;
  let revealAll = false;
  let labelsOn = false;
  let interactionMode: "select" | "browse" = "select";
  let hoverEl: Element | null = null;
  let selectedEl: Element | null = null;
  let selected: InspectTarget | null = null;
  let editingEl: HTMLElement | null = null;
  const revealOnActivate = options.revealAllOnActivate !== false;

  function stopInlineEdit(commit: boolean) {
    if (!editingEl) return;
    const el = editingEl;
    editingEl = null;
    el.removeEventListener("input", onInlineInput);
    el.classList.remove(EDITING_CLASS);
    el.contentEditable = "false";
    if (commit) {
      postTextChange(el);
    }
  }

  function postTextChange(el: HTMLElement) {
    handlers.postToHost({
      protocol: "as-canvas-inspector/1",
      type: "text-change",
      target: targetFromElement(el),
      text: el.innerText,
    });
  }

  function onInlineInput() {
    if (!editingEl) return;
    postTextChange(editingEl);
  }

  function startInlineEdit(el: Element) {
    if (!canInlineEdit(el) || !(el instanceof HTMLElement)) return;
    if (editingEl && editingEl !== el) stopInlineEdit(true);
    editingEl = el;
    el.contentEditable = "true";
    el.classList.add(EDITING_CLASS);
    el.addEventListener("input", onInlineInput);
    el.focus();
    try {
      const range = doc.createRange();
      range.selectNodeContents(el);
      const sel = win.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    } catch {
      /* ignore */
    }
  }

  function setHover(el: Element | null) {
    if (hoverEl && hoverEl !== selectedEl && hoverEl !== editingEl) {
      hoverEl.classList.remove(OUTLINE_HOVER_CLASS);
    }
    hoverEl = el;
    if (hoverEl && hoverEl !== selectedEl && hoverEl !== editingEl) {
      hoverEl.classList.add(OUTLINE_HOVER_CLASS);
    }
    const target = hoverEl ? targetFromElement(hoverEl) : null;
    handlers.postToHost({
      protocol: "as-canvas-inspector/1",
      type: "hover",
      target,
    });
  }

  function setSelected(el: Element | null, opts?: { silent?: boolean }) {
    if (editingEl && editingEl !== el) stopInlineEdit(true);
    if (selectedEl) {
      selectedEl.classList.remove(OUTLINE_SELECT_CLASS, OUTLINE_HOVER_CLASS);
    }
    selectedEl = el;
    selected = el ? targetFromElement(el) : null;
    if (selectedEl) {
      selectedEl.classList.add(OUTLINE_SELECT_CLASS);
    }
    if (opts?.silent) return;
    const ancestors = collectComponentAncestorChain(
      selectedEl,
      doc.documentElement,
    );
    handlers.postToHost(serializeSelectPayload(selected, ancestors));
  }

  function setRevealAll(on: boolean) {
    revealAll = on;
    if (active) applyRevealAll(doc, on);
  }

  function setLabelsOn(on: boolean) {
    labelsOn = on;
    doc.documentElement.classList.toggle("as-ci-labels-on", on && active);
  }

  function setInteractionMode(mode: "select" | "browse") {
    interactionMode = mode;
    if (mode === "browse") {
      stopInlineEdit(true);
      setSelected(null);
    }
  }

  function selectTarget(
    target: InspectTarget | null,
    opts?: { silent?: boolean },
  ) {
    if (!target) {
      setSelected(null, opts);
      return;
    }
    const el = findElementForTarget(doc, target);
    setSelected(el, opts);
  }

  function onPointerMove(ev: Event) {
    if (!active) return;
    const pe = ev as PointerEvent;
    if (isInspectorChrome(pe.target)) {
      if (hoverEl) setHover(null);
      return;
    }
    const hit = findHoverTarget(pe.target, doc.documentElement);
    if (hit !== hoverEl) setHover(hit);
  }

  function onClick(ev: Event) {
    if (!active) return;
    const me = ev as MouseEvent;
    if (isInspectorChrome(me.target)) return;
    if (interactionMode === "browse") {
      // Pass through — links and controls work like a normal site.
      return;
    }
    if (editingEl && editingEl.contains(me.target as Node)) return;
    const hit = findHoverTarget(me.target, doc.documentElement);
    if (!hit) {
      stopInlineEdit(true);
      setSelected(null);
      return;
    }
    me.preventDefault();
    me.stopPropagation();
    setSelected(hit);
  }

  function onDblClick(ev: Event) {
    if (!active || interactionMode === "browse") return;
    const me = ev as MouseEvent;
    if (isInspectorChrome(me.target)) return;
    const hit = findHoverTarget(me.target, doc.documentElement);
    if (!hit) return;
    me.preventDefault();
    me.stopPropagation();
    setSelected(hit);
    startInlineEdit(hit);
  }

  function onKeyDown(ev: Event) {
    if (!active) return;
    const ke = ev as KeyboardEvent;
    if (ke.key === "Escape") {
      if (editingEl) {
        stopInlineEdit(false);
        return;
      }
      setSelected(null);
      setHover(null);
      return;
    }
    if (
      ke.key === "Enter" &&
      selectedEl &&
      !editingEl &&
      !(ke.target instanceof HTMLInputElement) &&
      !(ke.target instanceof HTMLTextAreaElement) &&
      !(ke.target instanceof HTMLSelectElement)
    ) {
      ke.preventDefault();
      startInlineEdit(selectedEl);
    }
  }

  function onBlurCapture(ev: Event) {
    if (!editingEl) return;
    if (ev.target === editingEl) stopInlineEdit(true);
  }

  function activate() {
    if (active) return;
    active = true;
    ensureGuestStyles(doc);
    doc.addEventListener("pointermove", onPointerMove, true);
    doc.addEventListener("click", onClick, true);
    doc.addEventListener("dblclick", onDblClick, true);
    doc.addEventListener("keydown", onKeyDown, true);
    doc.addEventListener("focusout", onBlurCapture, true);
    if (revealOnActivate) setRevealAll(true);
    if (labelsOn) doc.documentElement.classList.add("as-ci-labels-on");
    handlers.postToHost({ protocol: "as-canvas-inspector/1", type: "ready" });
  }

  function deactivate() {
    if (!active) return;
    active = false;
    stopInlineEdit(true);
    doc.removeEventListener("pointermove", onPointerMove, true);
    doc.removeEventListener("click", onClick, true);
    doc.removeEventListener("dblclick", onDblClick, true);
    doc.removeEventListener("keydown", onKeyDown, true);
    doc.removeEventListener("focusout", onBlurCapture, true);
    setHover(null);
    setSelected(null);
    revealAll = false;
    doc.documentElement.classList.remove("as-ci-labels-on");
    clearGuestStyles(doc);
  }

  return {
    activate,
    deactivate,
    isActive: () => active,
    getSelected: () => selected,
    getSelectedElement: () => selectedEl,
    setRevealAll,
    isRevealAll: () => revealAll,
    setInteractionMode,
    getInteractionMode: () => interactionMode,
    setLabelsOn,
    isLabelsOn: () => labelsOn,
    selectTarget,
    getAncestorChain: () =>
      collectComponentAncestorChain(selectedEl, doc.documentElement),
  };
}
