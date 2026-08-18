"use strict";
(() => {
  // src/attr-contract-pure.ts
  var AS_ATTR = {
    inspect: "data-as-inspect",
    kind: "data-as-kind",
    component: "data-as-component",
    slot: "data-as-slot",
    prop: "data-as-prop",
    instance: "data-as-instance",
    source: "data-as-source"
  };
  var AUTHORING_ATTRS = [
    AS_ATTR.inspect,
    AS_ATTR.kind,
    AS_ATTR.instance,
    AS_ATTR.source,
    AS_ATTR.prop
  ];
  var INSPECT_KINDS = [
    "component",
    "slot",
    "prop",
    "markdown",
    "text"
  ];
  var CANVAS_INSPECTOR_PROTOCOL = "as-canvas-inspector/1";
  function isInspectKind(value) {
    return value != null && INSPECT_KINDS.includes(value);
  }
  function nonempty(value) {
    if (value == null) return void 0;
    const t = value.trim();
    return t.length > 0 ? t : void 0;
  }
  function inferInspectKind(attrs) {
    const explicit = nonempty(attrs[AS_ATTR.kind]);
    if (isInspectKind(explicit)) return explicit;
    if (nonempty(attrs[AS_ATTR.prop])) return "prop";
    if (nonempty(attrs[AS_ATTR.slot])) return "slot";
    if (nonempty(attrs[AS_ATTR.component])) return "component";
    if (nonempty(attrs[AS_ATTR.source])) return "text";
    if (nonempty(attrs[AS_ATTR.inspect]) === "1" || nonempty(attrs[AS_ATTR.inspect]) === "true") {
      return "text";
    }
    return null;
  }
  function parseInspectTarget(attrs) {
    const kind = inferInspectKind(attrs);
    if (!kind) return null;
    const inspectFlag = nonempty(attrs[AS_ATTR.inspect]);
    const componentId = nonempty(attrs[AS_ATTR.component]);
    const slot = nonempty(attrs[AS_ATTR.slot]);
    const prop = nonempty(attrs[AS_ATTR.prop]);
    const instanceId = nonempty(attrs[AS_ATTR.instance]);
    const source = nonempty(attrs[AS_ATTR.source]);
    const optedIn = inspectFlag === "1" || inspectFlag === "true" || componentId != null || slot != null || prop != null || source != null;
    if (!optedIn) return null;
    const target = { kind };
    if (componentId) target.componentId = componentId;
    if (slot) target.slot = slot;
    if (prop) target.prop = prop;
    if (instanceId) target.instanceId = instanceId;
    if (source) target.source = source;
    return target;
  }
  function serializeSelectPayload(target, ancestors) {
    const msg = {
      protocol: CANVAS_INSPECTOR_PROTOCOL,
      type: "select",
      target
    };
    if (ancestors && ancestors.length > 0) msg.ancestors = ancestors;
    return msg;
  }
  function isCanvasInspectorMessage(data) {
    if (data == null || typeof data !== "object") return false;
    const d = data;
    return d.protocol === CANVAS_INSPECTOR_PROTOCOL && typeof d.type === "string";
  }

  // src/guest-runtime.ts
  var INSPECTABLE_SELECTOR = `[${AS_ATTR.inspect}], [${AS_ATTR.component}], [${AS_ATTR.slot}]`;
  var REVEAL_SELECTOR = [
    `[${AS_ATTR.component}]:not([${AS_ATTR.slot}])`,
    `[${AS_ATTR.inspect}][${AS_ATTR.kind}="text"]`,
    `[${AS_ATTR.inspect}][${AS_ATTR.kind}="markdown"]`
  ].join(", ");
  var CHROME_SELECTOR = "[data-as-ci-standalone], [data-as-ci-chrome]";
  var OUTLINE_HOVER_CLASS = "as-ci-hover";
  var OUTLINE_SELECT_CLASS = "as-ci-selected";
  var EDITING_CLASS = "as-ci-editing";
  var REVEAL_CLASS = "as-ci-reveal";
  var STYLE_ID = "as-canvas-inspector-style";
  var SKIP_TAGS = /* @__PURE__ */ new Set([
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
    "HR"
  ]);
  var TEXTISH_TAGS = /* @__PURE__ */ new Set([
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
    "DD"
  ]);
  function attrsFromElement(el) {
    const out = {};
    for (const attr of Array.from(el.attributes)) {
      out[attr.name] = attr.value;
    }
    return out;
  }
  function parseTargetFromElement(el) {
    return parseInspectTarget(attrsFromElement(el));
  }
  function isInspectorChrome(start) {
    if (start == null || !(start instanceof Element)) return false;
    return Boolean(start.closest(CHROME_SELECTOR));
  }
  function isMeaningfulTarget(el) {
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
  function targetFromElement(el) {
    const stamped = parseTargetFromElement(el);
    if (stamped) return stamped;
    const tag = el.tagName.toLowerCase();
    return {
      kind: "text",
      instanceId: el.id || void 0,
      source: tag
    };
  }
  function findHoverTarget(start, root = typeof document !== "undefined" ? document : null) {
    if (start == null || !(start instanceof Element)) return null;
    if (isInspectorChrome(start)) return null;
    let node = start;
    let deepMeaningful = null;
    let stamped = null;
    let slot = null;
    let deepestComponent = null;
    let slotBeforeComponent = false;
    while (node && node !== root) {
      if (!deepMeaningful && isMeaningfulTarget(node)) {
        deepMeaningful = node;
      }
      if (!deepestComponent && node.hasAttribute?.(AS_ATTR.component) && !node.hasAttribute?.(AS_ATTR.slot)) {
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
  function collectComponentAncestorChain(el, root = typeof document !== "undefined" ? document : null) {
    const stack = [];
    let node = el;
    while (node && node !== root) {
      if (node.hasAttribute?.(AS_ATTR.component) && !node.hasAttribute?.(AS_ATTR.slot)) {
        const t = parseTargetFromElement(node);
        if (t) stack.push(t);
      }
      node = node.parentElement;
    }
    return stack.reverse();
  }
  function findElementForTarget(doc, target) {
    if (target.instanceId) {
      const byInstance = doc.querySelector(
        `[${AS_ATTR.instance}="${CSS.escape(target.instanceId)}"]`
      );
      if (byInstance) {
        if (target.slot) {
          const slot = byInstance.querySelector(
            `[${AS_ATTR.slot}="${CSS.escape(target.slot)}"]`
          );
          if (slot) return slot;
        }
        if (!target.slot && byInstance.hasAttribute(AS_ATTR.component) && !byInstance.hasAttribute(AS_ATTR.slot)) {
          return byInstance;
        }
        if (!target.slot) return byInstance;
      }
    }
    if (target.componentId && !target.slot) {
      const nodes = doc.querySelectorAll(
        `[${AS_ATTR.component}="${CSS.escape(target.componentId)}"]`
      );
      for (const n of Array.from(nodes)) {
        if (!n.hasAttribute(AS_ATTR.slot)) return n;
      }
    }
    if (target.componentId && target.slot) {
      return doc.querySelector(
        `[${AS_ATTR.component}="${CSS.escape(target.componentId)}"][${AS_ATTR.slot}="${CSS.escape(target.slot)}"]`
      );
    }
    return null;
  }
  function ensureGuestStyles(doc) {
    let style = doc.getElementById(STYLE_ID);
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
/* Component name tabs \u2014 inside box so overflow:hidden parents don't clip */
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
  function applyRevealAll(doc, on) {
    for (const el of Array.from(doc.querySelectorAll(`.${REVEAL_CLASS}`))) {
      el.classList.remove(REVEAL_CLASS);
    }
    if (!on) return;
    for (const el of Array.from(doc.querySelectorAll(REVEAL_SELECTOR))) {
      if (el.closest(CHROME_SELECTOR)) continue;
      el.classList.add(REVEAL_CLASS);
    }
  }
  function clearGuestStyles(doc) {
    doc.getElementById(STYLE_ID)?.remove();
    for (const el of Array.from(
      doc.querySelectorAll(
        `.${OUTLINE_HOVER_CLASS}, .${OUTLINE_SELECT_CLASS}, .${EDITING_CLASS}, .${REVEAL_CLASS}`
      )
    )) {
      el.classList.remove(
        OUTLINE_HOVER_CLASS,
        OUTLINE_SELECT_CLASS,
        EDITING_CLASS,
        REVEAL_CLASS
      );
      if (el instanceof HTMLElement && el.isContentEditable) {
        el.contentEditable = "false";
      }
    }
  }
  function canInlineEdit(el) {
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
    return TEXTISH_TAGS.has(el.tagName) || stamped?.kind === "text" || stamped?.kind === "markdown" || stamped?.kind === "slot";
  }
  function createGuestInspector(win, handlers, options = {}) {
    const doc = win.document;
    let active = false;
    let revealAll = false;
    let labelsOn = false;
    let interactionMode = "select";
    let hoverEl = null;
    let selectedEl = null;
    let selected = null;
    let editingEl = null;
    const revealOnActivate = options.revealAllOnActivate !== false;
    function stopInlineEdit(commit) {
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
    function postTextChange(el) {
      handlers.postToHost({
        protocol: "as-canvas-inspector/1",
        type: "text-change",
        target: targetFromElement(el),
        text: el.innerText
      });
    }
    function onInlineInput() {
      if (!editingEl) return;
      postTextChange(editingEl);
    }
    function startInlineEdit(el) {
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
      }
    }
    function setHover(el) {
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
        target
      });
    }
    function setSelected(el, opts) {
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
        doc.documentElement
      );
      handlers.postToHost(serializeSelectPayload(selected, ancestors));
    }
    function setRevealAll(on) {
      revealAll = on;
      if (active) applyRevealAll(doc, on);
    }
    function setLabelsOn(on) {
      labelsOn = on;
      doc.documentElement.classList.toggle("as-ci-labels-on", on && active);
    }
    function setInteractionMode(mode) {
      interactionMode = mode;
      if (mode === "browse") {
        stopInlineEdit(true);
        setSelected(null);
      }
    }
    function selectTarget(target, opts) {
      if (!target) {
        setSelected(null, opts);
        return;
      }
      const el = findElementForTarget(doc, target);
      setSelected(el, opts);
    }
    function onPointerMove(ev) {
      if (!active) return;
      const pe = ev;
      if (isInspectorChrome(pe.target)) {
        if (hoverEl) setHover(null);
        return;
      }
      const hit = findHoverTarget(pe.target, doc.documentElement);
      if (hit !== hoverEl) setHover(hit);
    }
    function onClick(ev) {
      if (!active) return;
      const me = ev;
      if (isInspectorChrome(me.target)) return;
      if (interactionMode === "browse") {
        return;
      }
      if (editingEl && editingEl.contains(me.target)) return;
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
    function onDblClick(ev) {
      if (!active || interactionMode === "browse") return;
      const me = ev;
      if (isInspectorChrome(me.target)) return;
      const hit = findHoverTarget(me.target, doc.documentElement);
      if (!hit) return;
      me.preventDefault();
      me.stopPropagation();
      setSelected(hit);
      startInlineEdit(hit);
    }
    function onKeyDown(ev) {
      if (!active) return;
      const ke = ev;
      if (ke.key === "Escape") {
        if (editingEl) {
          stopInlineEdit(false);
          return;
        }
        setSelected(null);
        setHover(null);
        return;
      }
      if (ke.key === "Enter" && selectedEl && !editingEl && !(ke.target instanceof HTMLInputElement) && !(ke.target instanceof HTMLTextAreaElement) && !(ke.target instanceof HTMLSelectElement)) {
        ke.preventDefault();
        startInlineEdit(selectedEl);
      }
    }
    function onBlurCapture(ev) {
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
      getAncestorChain: () => collectComponentAncestorChain(selectedEl, doc.documentElement)
    };
  }

  // src/host-bridge-pure.ts
  function inspectTargetLabel(target) {
    if (!target) return "Nothing selected";
    const parts = [target.kind];
    if (target.componentId) parts.push(target.componentId);
    if (target.slot) parts.push(`slot:${target.slot}`);
    if (target.prop) parts.push(`prop:${target.prop}`);
    if (target.instanceId) parts.push(`#${target.instanceId}`);
    return parts.join(" \xB7 ");
  }

  // src/registry-panel-pure.ts
  function buildPanelModel(meta, draft) {
    const props = Object.entries(meta.props).map(
      ([key, def]) => ({
        key,
        title: def.title ?? key,
        values: def.values,
        value: draft.props[key] ?? def.default ?? def.values[0] ?? ""
      })
    );
    const slots = Object.entries(meta.slots ?? {}).map(
      ([key, def]) => ({
        key,
        title: def.title ?? key,
        value: draft.slotText[key] ?? "",
        optional: def.optional
      })
    );
    return {
      componentId: meta.id,
      title: meta.title,
      props,
      slots,
      children: meta.acceptsChildren ? draft.children : void 0,
      acceptsChildren: Boolean(meta.acceptsChildren)
    };
  }
  function patchPanelProp(draft, key, value) {
    return {
      ...draft,
      props: { ...draft.props, [key]: value }
    };
  }
  function patchPanelSlot(draft, key, value) {
    return {
      ...draft,
      slotText: { ...draft.slotText, [key]: value }
    };
  }
  function defaultDraftFromMeta(meta) {
    const props = {};
    for (const [key, def] of Object.entries(meta.props)) {
      if (def.default != null) props[key] = def.default;
      else if (def.values[0]) props[key] = def.values[0];
    }
    const slotText = {};
    for (const key of Object.keys(meta.slots ?? {})) {
      slotText[key] = "";
    }
    return {
      props,
      slotText,
      children: meta.acceptsChildren ? "" : ""
    };
  }

  // src/paint-panel-body-dom.ts
  function isActionSlot(key) {
    return /^cta/i.test(key);
  }
  function resolveTab(requested, hasProps, hasContent, hasActions, selectedSlot) {
    if (requested === "props" && hasProps) return "props";
    if (requested === "content" && hasContent) return "content";
    if (requested === "actions" && hasActions) return "actions";
    if (selectedSlot && isActionSlot(selectedSlot) && hasActions) return "actions";
    if (selectedSlot && hasContent) return "content";
    if (hasProps) return "props";
    if (hasContent) return "content";
    return "actions";
  }
  function paintInspectorPanelBody(input) {
    const {
      doc,
      selected,
      meta,
      draft,
      onDraftChange,
      ancestors = [],
      onAncestorClick,
      panelTab,
      onPanelTabChange
    } = input;
    if (!selected) {
      return { node: null, status: "" };
    }
    const status = inspectTargetLabel(selected);
    function appendAncestorTrail(parent) {
      if (ancestors.length === 0) return;
      const trail = doc.createElement("nav");
      trail.setAttribute("data-as-ci-ancestors", "1");
      trail.setAttribute("aria-label", "Component ancestors");
      trail.style.display = "flex";
      trail.style.flexWrap = "wrap";
      trail.style.alignItems = "center";
      trail.style.gap = "4px";
      trail.style.marginBottom = "10px";
      trail.style.fontSize = "11px";
      trail.style.lineHeight = "1.4";
      ancestors.forEach((node, i) => {
        if (i > 0) {
          const sep = doc.createElement("span");
          sep.textContent = "\u2192";
          sep.style.opacity = "0.45";
          trail.appendChild(sep);
        }
        const label = node.componentId ?? node.slot ?? node.source ?? node.kind;
        const isCurrent = node.componentId === selected.componentId && (node.instanceId == null || selected.instanceId == null || node.instanceId === selected.instanceId) && i === ancestors.length - 1;
        if (isCurrent || !onAncestorClick) {
          const span = doc.createElement("span");
          span.setAttribute("data-as-ci-ancestor-current", isCurrent ? "1" : "0");
          span.textContent = label;
          span.style.fontWeight = isCurrent ? "600" : "500";
          span.style.opacity = isCurrent ? "1" : "0.75";
          if (isCurrent) {
            span.style.outline = "1px solid var(--color-accent, #38bdf8)";
            span.style.outlineOffset = "2px";
            span.style.borderRadius = "3px";
            span.style.padding = "1px 4px";
          }
          trail.appendChild(span);
        } else {
          const btn = doc.createElement("button");
          btn.type = "button";
          btn.setAttribute("data-as-ci-btn", "1");
          btn.setAttribute("data-as-ci-ancestor", label);
          btn.textContent = label;
          btn.style.padding = "2px 6px";
          btn.style.fontSize = "11px";
          btn.style.cursor = "pointer";
          btn.title = `Select ${label}`;
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            onAncestorClick(node);
          });
          trail.appendChild(btn);
        }
      });
      parent.appendChild(trail);
    }
    if (!meta || !selected.componentId) {
      const wrap2 = doc.createElement("div");
      appendAncestorTrail(wrap2);
      const titleEl2 = doc.createElement("div");
      titleEl2.style.fontWeight = "600";
      titleEl2.style.marginBottom = "6px";
      titleEl2.textContent = selected.componentId ? selected.componentId : selected.slot ? `slot:${selected.slot}` : `<${selected.source ?? "element"}>`;
      const hint2 = doc.createElement("p");
      hint2.setAttribute("data-as-ci-hint", "1");
      hint2.textContent = "Selected on canvas. Double-click text to type. Registry props appear when a component root is selected.";
      wrap2.append(titleEl2, hint2);
      return { node: wrap2, status };
    }
    const wrap = doc.createElement("div");
    appendAncestorTrail(wrap);
    const model = buildPanelModel(meta, draft);
    const titleEl = doc.createElement("div");
    titleEl.style.fontWeight = "600";
    titleEl.style.marginBottom = "4px";
    titleEl.textContent = model.title;
    wrap.appendChild(titleEl);
    if (selected.slot) {
      const badge = doc.createElement("p");
      badge.setAttribute("data-as-ci-hint", "1");
      badge.style.color = "var(--color-accent, var(--as-color-accent, #0f766e))";
      badge.textContent = `Slot \xB7 ${selected.slot}`;
      wrap.appendChild(badge);
    }
    const propFields = model.props;
    const contentSlots = model.slots.filter((s) => !isActionSlot(s.key));
    const actionSlots = model.slots.filter((s) => isActionSlot(s.key));
    const hasProps = propFields.length > 0;
    const hasContent = contentSlots.length > 0;
    const hasActions = actionSlots.length > 0;
    const active = resolveTab(
      panelTab,
      hasProps,
      hasContent,
      hasActions,
      selected.slot
    );
    const tabBar = doc.createElement("div");
    tabBar.setAttribute("data-as-ci-tabs", "1");
    tabBar.setAttribute("role", "tablist");
    tabBar.style.display = "flex";
    tabBar.style.flexWrap = "wrap";
    tabBar.style.gap = "4px";
    tabBar.style.margin = "8px 0 12px";
    tabBar.style.borderBottom = "1px solid color-mix(in oklab, currentColor 18%, transparent)";
    tabBar.style.paddingBottom = "6px";
    function addTab(id, label, show) {
      if (!show) return;
      const btn = doc.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-as-ci-btn", "1");
      btn.setAttribute("data-as-ci-tab", id);
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", active === id ? "true" : "false");
      btn.textContent = label;
      btn.style.padding = "4px 10px";
      btn.style.fontSize = "11px";
      btn.style.fontWeight = active === id ? "600" : "500";
      btn.style.cursor = "pointer";
      btn.style.borderRadius = "4px 4px 0 0";
      if (active === id) {
        btn.style.background = "color-mix(in oklab, var(--color-accent, #0f766e) 18%, transparent)";
        btn.style.outline = "1px solid var(--color-accent, #0f766e)";
      }
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        onPanelTabChange?.(id);
      });
      tabBar.appendChild(btn);
    }
    const tabCount = Number(hasProps) + Number(hasContent) + Number(hasActions);
    if (tabCount > 1) {
      addTab("props", "Props", hasProps);
      addTab("content", "Content", hasContent);
      addTab("actions", "Actions", hasActions);
      wrap.appendChild(tabBar);
    }
    const hint = doc.createElement("p");
    hint.setAttribute("data-as-ci-hint", "1");
    hint.style.marginBottom = "12px";
    hint.textContent = active === "props" ? "Component knobs (layout / variant). Content lives under Content / Actions." : "Edit slot text here, or double-click on the page to type inline.";
    wrap.appendChild(hint);
    function appendProp(field) {
      const label = doc.createElement("label");
      label.setAttribute("data-as-ci-field", "1");
      label.appendChild(doc.createTextNode(field.title));
      const select = doc.createElement("select");
      select.setAttribute("data-as-ci-control", "1");
      select.dataset.asCiProp = field.key;
      for (const v of field.values) {
        const opt = doc.createElement("option");
        opt.value = v;
        opt.textContent = v;
        if (v === field.value) opt.selected = true;
        select.appendChild(opt);
      }
      select.addEventListener("change", () => {
        onDraftChange(patchPanelProp(draft, field.key, select.value), {
          patch: "full"
        });
      });
      label.appendChild(select);
      wrap.appendChild(label);
    }
    function appendSlot(field) {
      const label = doc.createElement("label");
      label.setAttribute("data-as-ci-field", "1");
      label.appendChild(doc.createTextNode(field.title));
      const input2 = doc.createElement("input");
      input2.type = "text";
      input2.value = field.value;
      input2.setAttribute("data-as-ci-control", "1");
      input2.dataset.asCiSlot = field.key;
      input2.addEventListener("input", () => {
        onDraftChange(patchPanelSlot(draft, field.key, input2.value), {
          patch: "slots"
        });
      });
      input2.addEventListener("change", () => {
        onDraftChange(patchPanelSlot(draft, field.key, input2.value), {
          patch: "slots"
        });
      });
      label.appendChild(input2);
      wrap.appendChild(label);
    }
    if (active === "props") {
      for (const field of propFields) appendProp(field);
    } else if (active === "content") {
      for (const field of contentSlots) appendSlot(field);
    } else {
      for (const field of actionSlots) appendSlot(field);
    }
    return { node: wrap, status };
  }

  // src/standalone-shell.ts
  function parseInspectorDockMode(value) {
    return value === "window" ? "window" : "sidebar";
  }
  function nextInspectorDockMode(mode) {
    return mode === "sidebar" ? "window" : "sidebar";
  }
  var DEFAULT_STORAGE = "as-ci-dock-mode";
  var STYLE_ID2 = "as-ci-shell-style";
  var SHELL_CSS = `
:root {
  --as-ci-sidebar-w: min(360px, 92vw);
}
html { scroll-padding-right: var(--as-ci-sidebar-pad, 0px); }
html[data-as-ci-sidebar-open="1"] body {
  padding-right: var(--as-ci-sidebar-pad, 0px);
  box-sizing: border-box;
  transition: padding-right 160ms ease;
}

#as-ci-standalone {
  font-family: var(--font-sans, "DM Sans", system-ui, sans-serif);
  font-size: 13px;
  line-height: 1.4;
  color: var(--color-ink, var(--as-color-fg, #12151a));
}

#as-ci-standalone [data-as-ci-fab] {
  position: fixed;
  z-index: 2147483646;
  right: 12px;
  bottom: 12px;
  appearance: none;
  border: 1px solid var(--color-line, var(--as-color-border, #d4cbb8));
  background: var(--color-ink, var(--as-color-fg, #12151a));
  color: var(--color-inverse-fg, #f3efe6);
  border-radius: 999px;
  padding: 8px 14px;
  font: 600 12px/1 var(--font-sans, system-ui, sans-serif);
  cursor: pointer;
  box-shadow: 0 4px 16px color-mix(in oklab, #000 35%, transparent);
}
#as-ci-standalone [data-as-ci-fab]:hover {
  background: var(--color-accent, var(--as-color-accent, #0f766e));
}

#as-ci-standalone [data-as-ci-shell] {
  position: fixed;
  z-index: 2147483645;
  display: flex;
  flex-direction: column;
  background: var(--color-paper-raised, var(--as-color-bg-raised, #faf7f0));
  color: var(--color-ink, var(--as-color-fg, #12151a));
  border: 1px solid var(--color-line, var(--as-color-border, #d4cbb8));
  box-shadow: 0 12px 40px color-mix(in oklab, #000 28%, transparent);
  overflow: hidden;
}
/* display:flex above beats UA [hidden]{display:none} \u2014 Close must win */
#as-ci-standalone [data-as-ci-shell][hidden] {
  display: none !important;
}
#as-ci-standalone [data-as-ci-fab][hidden] {
  display: none !important;
}
html.dark #as-ci-standalone [data-as-ci-shell],
html[data-theme="dark"] #as-ci-standalone [data-as-ci-shell] {
  background: var(--color-paper-raised, var(--as-color-bg-raised, #1a2420));
  color: var(--color-ink, var(--as-color-fg, #f3efe6));
  border-color: color-mix(in oklab, var(--color-line, var(--as-color-border, #d4cbb8)) 40%, transparent);
}

#as-ci-standalone [data-as-ci-dock="sidebar"] {
  top: 0;
  right: 0;
  bottom: 0;
  width: var(--as-ci-sidebar-w);
  border-right: none;
  border-radius: 0;
  border-left: 1px solid var(--color-line, var(--as-color-border, #d4cbb8));
}

/*
 * Mobile peek sheet (Vaul modal=false + snap ~42vh):
 * page stays scrollable; no body side-padding; no full-screen modal.
 */
@media (max-width: 719px) {
  #as-ci-standalone:not([data-as-ci-variant="embedded"]) [data-as-ci-dock="sidebar"] {
    top: auto;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: max(220px, 42vh);
    max-height: max(220px, 42vh);
    border-left: none;
    border-right: none;
    border-bottom: none;
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -8px 32px color-mix(in oklab, #000 28%, transparent);
  }
  #as-ci-standalone:not([data-as-ci-variant="embedded"]) [data-as-ci-dock="window"] {
    left: 12px !important;
    right: 12px;
    width: auto !important;
    bottom: 12px;
    top: auto !important;
    height: max(220px, 42vh);
    max-height: max(220px, 42vh);
  }
  /* Never shove the live page with side padding on peek */
  html[data-as-ci-sidebar-open="1"] body {
    padding-right: 0 !important;
  }
  html { scroll-padding-right: 0 !important; }
  /* Peek handle affordance above titlebar */
  #as-ci-standalone:not([data-as-ci-variant="embedded"]) [data-as-ci-dock="sidebar"] [data-as-ci-titlebar]::before {
    content: "";
    position: absolute;
    left: 50%;
    top: 6px;
    width: 40px;
    height: 4px;
    margin-left: -20px;
    border-radius: 999px;
    background: color-mix(in oklab, var(--color-ink-soft, #3a414c) 45%, transparent);
  }
  #as-ci-standalone:not([data-as-ci-variant="embedded"]) [data-as-ci-dock="sidebar"] [data-as-ci-titlebar] {
    position: relative;
    padding-top: 16px;
  }
}

#as-ci-standalone [data-as-ci-dock="window"] {
  width: min(380px, 92vw);
  height: min(520px, 70vh);
  border-radius: 12px;
}

/* Embedded: fill mount host; no document padding / fixed overlay */
#as-ci-standalone[data-as-ci-variant="embedded"] {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  pointer-events: none;
}
#as-ci-standalone[data-as-ci-variant="embedded"] [data-as-ci-fab] {
  display: none !important;
}
#as-ci-standalone[data-as-ci-variant="embedded"] [data-as-ci-shell] {
  pointer-events: auto;
  z-index: 1;
}
/* Embedded sidebar: fill the Live rail host */
#as-ci-standalone[data-as-ci-variant="embedded"] [data-as-ci-dock="sidebar"] {
  position: absolute;
  inset: 0;
  width: auto !important;
  height: auto !important;
  max-width: none;
  max-height: none;
  border-radius: 0;
  border: none;
  box-shadow: none;
}
/* Embedded float: same window chrome as top-level, clipped to rail */
#as-ci-standalone[data-as-ci-variant="embedded"] [data-as-ci-dock="window"] {
  position: absolute;
  width: min(380px, 96%);
  height: min(520px, 92%);
  border-radius: 12px;
  box-shadow: 0 12px 40px color-mix(in oklab, #000 28%, transparent);
}

#as-ci-standalone [data-as-ci-titlebar] {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-line, var(--as-color-border, #d4cbb8));
  background: var(--color-paper, var(--as-color-bg, #f3efe6));
  user-select: none;
  flex-shrink: 0;
}
html.dark #as-ci-standalone [data-as-ci-titlebar],
html[data-theme="dark"] #as-ci-standalone [data-as-ci-titlebar] {
  background: color-mix(in oklab, var(--color-paper, var(--as-color-bg, #0c1210)) 90%, #fff 4%);
}
#as-ci-standalone [data-as-ci-dock="window"] [data-as-ci-titlebar] {
  cursor: grab;
}
#as-ci-standalone [data-as-ci-title] {
  flex: 1;
  font-weight: 600;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#as-ci-standalone [data-as-ci-status] {
  font-size: 10px;
  color: var(--color-ink-soft, var(--as-color-fg-muted, #3a414c));
  max-width: 9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#as-ci-standalone [data-as-ci-btn] {
  appearance: none;
  border: 1px solid var(--color-line, var(--as-color-border, #d4cbb8));
  background: var(--color-paper-raised, var(--as-color-bg-raised, #faf7f0));
  color: var(--color-ink, var(--as-color-fg, #12151a));
  border-radius: 6px;
  padding: 4px 8px;
  font: 500 10px/1.2 var(--font-sans, system-ui, sans-serif);
  cursor: pointer;
}
#as-ci-standalone [data-as-ci-btn]:hover {
  border-color: var(--color-accent, var(--as-color-accent, #0f766e));
}
#as-ci-standalone [data-as-ci-toolbar] {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-line, var(--as-color-border, #d4cbb8));
  background: var(--color-paper, var(--as-color-bg, #f3efe6));
  flex-shrink: 0;
}
html.dark #as-ci-standalone [data-as-ci-toolbar],
html[data-theme="dark"] #as-ci-standalone [data-as-ci-toolbar] {
  background: color-mix(in oklab, var(--color-paper, var(--as-color-bg, #0c1210)) 90%, #fff 4%);
}
#as-ci-standalone [data-as-ci-body] {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px;
}
#as-ci-standalone [data-as-ci-hint] {
  color: var(--color-ink-soft, var(--as-color-fg-muted, #3a414c));
  font-size: 12px;
  line-height: 1.45;
  margin: 0;
}
#as-ci-standalone [data-as-ci-field] {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
  font-size: 11px;
  color: var(--color-ink-soft, var(--as-color-fg-muted, #3a414c));
}
#as-ci-standalone [data-as-ci-control] {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--color-line, var(--as-color-border, #d4cbb8));
  background: var(--color-paper, var(--as-color-bg, #f3efe6));
  color: var(--color-ink, var(--as-color-fg, #12151a));
  border-radius: 8px;
  padding: 6px 8px;
  font: 400 13px/1.3 var(--font-sans, system-ui, sans-serif);
}
`;
  function createStandaloneInspectorShell(deps) {
    const doc = deps.doc;
    const variant = deps.variant ?? "standalone";
    const embedded = variant === "embedded";
    const storageKey = deps.storageKey ?? DEFAULT_STORAGE;
    const mountParent = deps.mount ?? doc.body;
    let open = false;
    let mode = "sidebar";
    try {
      mode = parseInspectorDockMode(deps.win.sessionStorage?.getItem(storageKey));
    } catch {
    }
    let styleEl = doc.getElementById(STYLE_ID2);
    if (!styleEl) {
      styleEl = doc.createElement("style");
      styleEl.id = STYLE_ID2;
      doc.head.appendChild(styleEl);
    }
    styleEl.textContent = SHELL_CSS;
    const root = doc.createElement("div");
    root.id = "as-ci-standalone";
    root.setAttribute("data-as-ci-standalone", "1");
    root.setAttribute("data-as-ci-chrome", "1");
    root.setAttribute("data-as-ci-variant", variant);
    const fab = doc.createElement("button");
    fab.type = "button";
    fab.textContent = "Inspect";
    fab.setAttribute("data-as-ci-fab", "1");
    if (embedded) fab.hidden = true;
    const shell = doc.createElement("aside");
    shell.setAttribute("data-as-ci-shell", "1");
    shell.hidden = true;
    shell.style.setProperty("display", "none", "important");
    const titleBar = doc.createElement("div");
    titleBar.setAttribute("data-as-ci-titlebar", "1");
    const title = doc.createElement("div");
    title.setAttribute("data-as-ci-title", "1");
    title.textContent = "Inspector";
    const status = doc.createElement("div");
    status.setAttribute("data-as-ci-status", "1");
    const dockBtn = doc.createElement("button");
    dockBtn.type = "button";
    dockBtn.setAttribute("data-as-ci-btn", "1");
    dockBtn.setAttribute("data-as-ci-dock-btn", "1");
    dockBtn.title = "Sidebar or floating window";
    const closeBtn = doc.createElement("button");
    closeBtn.type = "button";
    closeBtn.setAttribute("data-as-ci-btn", "1");
    closeBtn.setAttribute("data-as-ci-close", "1");
    closeBtn.textContent = "Close";
    titleBar.append(title, status, dockBtn, closeBtn);
    const toolbar = doc.createElement("div");
    toolbar.setAttribute("data-as-ci-toolbar", "1");
    const body = doc.createElement("div");
    body.setAttribute("data-as-ci-body", "1");
    const empty = doc.createElement("p");
    empty.setAttribute("data-as-ci-hint", "1");
    empty.textContent = "Hover a highlighted block, click to select, double-click text to edit. Props and slots appear here.";
    body.appendChild(empty.cloneNode(true));
    shell.append(titleBar, toolbar, body);
    let drag = null;
    let winPos = {
      top: embedded ? 48 : 72,
      left: embedded ? 16 : Math.max(24, (deps.win.innerWidth || 800) - 420)
    };
    function persistMode() {
      try {
        deps.win.sessionStorage?.setItem(storageKey, mode);
      } catch {
      }
    }
    function syncSidebarPad() {
      if (embedded) return;
      const peek = typeof deps.win.matchMedia === "function" && deps.win.matchMedia("(max-width: 719px)").matches;
      const pad = !peek && open && mode === "sidebar" ? "var(--as-ci-sidebar-w)" : "0px";
      doc.documentElement.style.setProperty("--as-ci-sidebar-pad", pad);
      doc.documentElement.setAttribute(
        "data-as-ci-sidebar-open",
        open && mode === "sidebar" ? "1" : "0"
      );
      doc.documentElement.setAttribute(
        "data-as-ci-peek",
        peek && open ? "1" : "0"
      );
    }
    function applyLayout() {
      dockBtn.textContent = mode === "sidebar" ? "Float" : "Sidebar";
      shell.setAttribute("data-as-ci-dock", mode);
      if (mode === "window") {
        shell.style.top = `${winPos.top}px`;
        shell.style.left = `${winPos.left}px`;
        shell.style.right = "auto";
        shell.style.bottom = "auto";
      } else {
        shell.style.top = "";
        shell.style.left = "";
        shell.style.right = "";
        shell.style.bottom = "";
      }
      syncSidebarPad();
    }
    function applyVisibility(next) {
      shell.hidden = !next;
      if (next) shell.style.setProperty("display", "flex", "important");
      else shell.style.setProperty("display", "none", "important");
      if (!embedded) fab.hidden = next;
    }
    function setOpen(next, opts) {
      const notify = opts?.notify !== false;
      const changed = open !== next;
      open = next;
      applyVisibility(next);
      applyLayout();
      if (notify && (changed || !next)) {
        deps.onOpenChange?.(next);
      }
    }
    function setDockMode(next) {
      mode = next;
      persistMode();
      applyLayout();
      deps.onDockModeChange?.(mode);
    }
    fab.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    fab.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setOpen(true);
    });
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    });
    dockBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDockMode(nextInspectorDockMode(mode));
    });
    titleBar.addEventListener("pointerdown", (e) => {
      if (mode !== "window") return;
      if (e.target.closest("button")) return;
      drag = {
        ox: e.clientX,
        oy: e.clientY,
        sx: winPos.left,
        sy: winPos.top
      };
      titleBar.setPointerCapture(e.pointerId);
    });
    titleBar.addEventListener("pointermove", (e) => {
      if (!drag) return;
      winPos = {
        left: Math.max(8, drag.sx + (e.clientX - drag.ox)),
        top: Math.max(8, drag.sy + (e.clientY - drag.oy))
      };
      applyLayout();
    });
    titleBar.addEventListener("pointerup", () => {
      drag = null;
    });
    for (const type of ["mousedown", "click", "pointerdown"]) {
      root.addEventListener(type, (ev) => ev.stopPropagation());
    }
    root.append(fab, shell);
    if (embedded) {
      const cs = deps.win.getComputedStyle?.(mountParent);
      if (cs && cs.position === "static") {
        mountParent.style.position = "relative";
      }
    }
    mountParent.appendChild(root);
    applyLayout();
    return {
      root,
      toolbar,
      open: () => setOpen(true),
      close: (opts) => setOpen(false, opts),
      isOpen: () => open,
      setDockMode,
      getDockMode: () => mode,
      setStatus: (text) => {
        status.textContent = text;
      },
      setBody: (node) => {
        body.replaceChildren();
        if (node) body.appendChild(node);
        else body.appendChild(empty.cloneNode(true));
      },
      destroy: () => {
        root.remove();
        if (!embedded) {
          doc.documentElement.removeAttribute("data-as-ci-sidebar-open");
          doc.documentElement.style.removeProperty("--as-ci-sidebar-pad");
        }
      }
    };
  }

  // src/inspector-chrome.ts
  function applyBoot(boot) {
    const meta = {
      id: boot.id,
      title: boot.title,
      props: boot.props,
      slots: boot.slots,
      acceptsChildren: boot.acceptsChildren
    };
    return {
      meta,
      draft: boot.draft ?? defaultDraftFromMeta(meta)
    };
  }
  function makeToolbarBtn(doc) {
    const btn = doc.createElement("button");
    btn.type = "button";
    btn.setAttribute("data-as-ci-btn", "1");
    return btn;
  }
  function createInspectorChrome(deps) {
    const doc = deps.doc;
    const shell = createStandaloneInspectorShell({
      doc,
      win: deps.win,
      mount: deps.mount,
      variant: deps.variant ?? "standalone",
      storageKey: deps.storageKey,
      onOpenChange: deps.onOpenChange
    });
    const modeBtn = makeToolbarBtn(doc);
    const outlineBtn = makeToolbarBtn(doc);
    const labelsBtn = makeToolbarBtn(doc);
    function syncModeBtn() {
      const mode = deps.getInteractionMode?.() ?? "select";
      modeBtn.textContent = mode === "browse" ? "Browse" : "Select";
      modeBtn.setAttribute("aria-pressed", mode === "select" ? "true" : "false");
      modeBtn.title = mode === "browse" ? "Browse mode \u2014 links and controls work. Click to select components." : "Select mode \u2014 click components to inspect. Click for Browse.";
    }
    function syncOutlineBtn() {
      const on = deps.getRevealAll();
      outlineBtn.textContent = on ? "Outlines \xB7 on" : "Outlines \xB7 off";
      outlineBtn.setAttribute("aria-pressed", on ? "true" : "false");
    }
    function syncLabelsBtn() {
      const on = deps.getLabelsOn?.() ?? false;
      labelsBtn.textContent = on ? "Labels \xB7 on" : "Labels \xB7 off";
      labelsBtn.setAttribute("aria-pressed", on ? "true" : "false");
      labelsBtn.hidden = !deps.setLabelsOn;
      labelsBtn.title = "Show component name tabs on outlined nodes (BrowserUI-style labels).";
    }
    modeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!deps.setInteractionMode) return;
      const cur = deps.getInteractionMode?.() ?? "select";
      deps.setInteractionMode(cur === "select" ? "browse" : "select");
      syncModeBtn();
    });
    outlineBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      deps.setRevealAll(!deps.getRevealAll());
      syncOutlineBtn();
      if (!deps.getRevealAll() && deps.setLabelsOn && deps.getLabelsOn?.()) {
        deps.setLabelsOn(false);
        syncLabelsBtn();
      }
    });
    labelsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!deps.setLabelsOn) return;
      const next = !(deps.getLabelsOn?.() ?? false);
      if (next && !deps.getRevealAll()) {
        deps.setRevealAll(true);
        syncOutlineBtn();
      }
      deps.setLabelsOn(next);
      syncLabelsBtn();
    });
    if (deps.setInteractionMode) shell.toolbar.appendChild(modeBtn);
    shell.toolbar.appendChild(outlineBtn);
    if (deps.setLabelsOn) shell.toolbar.appendChild(labelsBtn);
    syncModeBtn();
    syncOutlineBtn();
    syncLabelsBtn();
    let draft = { props: {}, slotText: {}, children: "" };
    let meta = null;
    let selected = null;
    let ancestors = [];
    let panelTab = "props";
    let abort = null;
    function paintBody() {
      const painted = paintInspectorPanelBody({
        doc,
        selected,
        meta,
        draft,
        ancestors,
        panelTab,
        onPanelTabChange: (tab) => {
          panelTab = tab;
          paintBody();
        },
        onAncestorClick: deps.selectTarget ? (t) => deps.selectTarget?.(t) : void 0,
        onDraftChange: (next, changeMeta) => {
          draft = next;
          if (selected?.componentId) {
            const instanceId = selected.instanceId || ancestors.find(
              (a) => a.componentId === selected?.componentId && Boolean(a.instanceId)
            )?.instanceId || ancestors.find((a) => Boolean(a.instanceId))?.instanceId;
            deps.applyDraft({
              componentId: selected.componentId,
              instanceId,
              props: draft.props,
              slotText: draft.slotText,
              patch: changeMeta?.patch ?? "slots"
            });
          }
        }
      });
      shell.setStatus(
        painted.status || (selected ? inspectTargetLabel(selected) : "")
      );
      shell.setBody(painted.node);
    }
    function setSelection(target, preloaded, chain) {
      abort?.abort();
      abort = null;
      const prevId = selected?.componentId;
      const prevSlot = selected?.slot;
      const prevInstance = selected?.instanceId ?? "";
      const hadMeta = Boolean(meta);
      selected = target;
      ancestors = chain ?? [];
      if (target?.componentId !== prevId) {
        panelTab = "props";
      }
      if (target?.slot) {
        panelTab = /^cta/i.test(target.slot) ? "actions" : "content";
      }
      if (!target?.componentId) {
        meta = null;
        draft = { props: {}, slotText: {}, children: "" };
        paintBody();
        return;
      }
      if (preloaded && preloaded.id === target.componentId) {
        const applied = applyBoot(preloaded);
        const sameTarget = hadMeta && prevId === target.componentId && prevSlot === target.slot && prevInstance === (target.instanceId ?? "");
        meta = applied.meta;
        if (sameTarget) {
          for (const [key, value] of Object.entries(applied.draft.slotText)) {
            if (draft.slotText[key] === value) continue;
            const input = shell.root.querySelector(
              `[data-as-ci-slot="${CSS.escape(key)}"]`
            );
            if (input instanceof HTMLInputElement && doc.activeElement !== input) {
              input.value = value;
            }
          }
          draft = applied.draft;
          return;
        }
        draft = applied.draft;
        paintBody();
        return;
      }
      abort = new AbortController();
      const signal = abort.signal;
      void deps.fetchMeta(target.componentId, signal).then((boot) => {
        if (signal.aborted) return;
        if (!boot) {
          meta = null;
          paintBody();
          return;
        }
        const applied = applyBoot(boot);
        meta = applied.meta;
        draft = applied.draft;
        paintBody();
      }).catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        meta = null;
        paintBody();
      });
    }
    function applyCanvasTextChange(target, text) {
      const slot = target?.slot?.trim();
      if (!slot) return;
      draft = patchPanelSlot(draft, slot, text);
      if (meta) {
        meta = {
          ...meta,
          draft: {
            ...meta.draft ?? draft,
            slotText: { ...meta.draft?.slotText ?? draft.slotText, [slot]: text }
          }
        };
      }
      const input = shell.root.querySelector(
        `[data-as-ci-slot="${CSS.escape(slot)}"]`
      );
      if (input instanceof HTMLInputElement && doc.activeElement !== input) {
        input.value = text;
      }
    }
    return {
      shell,
      setSelection,
      applyCanvasTextChange,
      open: () => {
        shell.open();
        syncModeBtn();
        syncOutlineBtn();
        syncLabelsBtn();
      },
      close: (opts) => shell.close(opts),
      isOpen: () => shell.isOpen(),
      destroy: () => {
        abort?.abort();
        shell.destroy();
      }
    };
  }

  // src/meta-boot-pure.ts
  var ATTR_SLOT = "data-as-slot";
  var ATTR_INSTANCE = "data-as-instance";
  var ATTR_COMPONENT = "data-as-component";
  function collectSlotTextFromElement(root) {
    const out = {};
    const nodes = root.querySelectorAll(`[${ATTR_SLOT}]`);
    for (const el of nodes) {
      const slot = el.getAttribute(ATTR_SLOT)?.trim();
      if (!slot) continue;
      out[slot] = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    }
    const selfSlot = root.getAttribute(ATTR_SLOT)?.trim();
    if (selfSlot) {
      out[selfSlot] = (root.textContent ?? "").replace(/\s+/g, " ").trim();
    }
    return out;
  }
  function findComponentRoot(doc, target) {
    if (target.instanceId) {
      const byInst = doc.querySelector(
        `[${ATTR_INSTANCE}="${CSS.escape(target.instanceId)}"]`
      );
      if (byInst) return byInst;
    }
    if (target.componentId) {
      return doc.querySelector(
        `[${ATTR_COMPONENT}="${CSS.escape(target.componentId)}"]`
      );
    }
    return null;
  }
  function resolveComponentRootForApply(doc, input) {
    const { componentId, instanceId } = input;
    const componentSel = `[${ATTR_COMPONENT}="${CSS.escape(componentId)}"]`;
    const rootSel = `${componentSel}:not([${ATTR_SLOT}])`;
    if (instanceId) {
      const exact = doc.querySelector(
        `[${ATTR_INSTANCE}="${CSS.escape(instanceId)}"]${rootSel}`
      );
      if (exact) return exact;
      const byInst = doc.querySelector(
        `[${ATTR_INSTANCE}="${CSS.escape(instanceId)}"]`
      );
      if (byInst) {
        if (byInst.hasAttribute(ATTR_SLOT)) {
          const up = byInst.closest(rootSel);
          if (up) return up;
        }
        if (byInst.getAttribute(ATTR_COMPONENT) === componentId && !byInst.hasAttribute(ATTR_SLOT)) {
          return byInst;
        }
      }
    }
    const firstRoot = doc.querySelector(rootSel);
    if (firstRoot) return firstRoot;
    return findComponentRoot(doc, input);
  }
  function enrichMetaBootFromDom(boot, root) {
    const meta = {
      id: boot.id,
      title: boot.title,
      props: boot.props,
      slots: boot.slots,
      acceptsChildren: boot.acceptsChildren
    };
    const base = boot.draft ?? defaultDraftFromMeta(meta);
    if (!root) return { ...boot, draft: base };
    const liveSlots = collectSlotTextFromElement(root);
    return {
      ...boot,
      draft: {
        ...base,
        slotText: { ...base.slotText, ...liveSlots }
      }
    };
  }

  // src/apply-slot-text-pure.ts
  var ATTR_SLOT2 = "data-as-slot";
  var ATTR_COMPONENT2 = "data-as-component";
  function looksLikeHtml(text) {
    return /<[a-z][\s\S]*>/i.test(text);
  }
  function setSlotCopy(host, text) {
    if (looksLikeHtml(text)) {
      host.innerHTML = text;
    } else {
      host.textContent = text;
    }
  }
  function findSlotHost(root, slot) {
    if (root.getAttribute(ATTR_SLOT2) === slot) return root;
    return root.querySelector(`[${ATTR_SLOT2}="${CSS.escape(slot)}"]`);
  }
  function resolveCopyHost(el) {
    return findSlotHost(el, "text") || findSlotHost(el, "content") || findSlotHost(el, "label") || el;
  }
  function applySlotTextInDom(root, slotText) {
    let applied = false;
    for (const [slot, text] of Object.entries(slotText)) {
      if (typeof text !== "string") continue;
      const host = findSlotHost(root, slot);
      if (!host) continue;
      const nested = host.querySelector(`[${ATTR_COMPONENT2}]`);
      const target = nested && nested !== host ? resolveCopyHost(nested) : resolveCopyHost(host);
      setSlotCopy(target, text);
      applied = true;
    }
    return applied;
  }

  // src/guest-boot.ts
  async function applyDraftInGuest(win, msg) {
    if (!msg.componentId) return;
    const el = resolveComponentRootForApply(win.document, {
      componentId: msg.componentId,
      instanceId: msg.instanceId
    });
    if (!el) return;
    const slotText = msg.slotText ?? {};
    const preferSlots = msg.patch !== "full";
    if (preferSlots && Object.keys(slotText).length > 0 && applySlotTextInDom(el, slotText)) {
      return;
    }
    const instanceId = msg.instanceId || el.getAttribute("data-as-instance")?.trim() || void 0;
    try {
      const res = await win.fetch(
        `/__as/canvas-inspector/${encodeURIComponent(msg.componentId)}/render`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            instanceId,
            draft: {
              props: msg.props ?? {},
              slotText,
              children: ""
            }
          })
        }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (!data.html) return;
      el.outerHTML = data.html;
    } catch {
    }
  }
  function isTopLevel(win) {
    try {
      return win.parent === win;
    } catch {
      return true;
    }
  }
  function wantsInspectFromUrl(win) {
    try {
      return /(?:^|[?&])as-inspect=1(?:&|$)/.test(win.location.search || "");
    } catch {
      return false;
    }
  }
  async function fetchMetaBoot(win, componentId) {
    try {
      const res = await win.fetch(
        `/__as/design/components/${encodeURIComponent(componentId)}/inspector.json`
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
  async function enrichSelectMessage(win, msg) {
    const target = msg.target;
    if (!target?.componentId) {
      return { ...msg, meta: null, ancestors: msg.ancestors };
    }
    const boot = await fetchMetaBoot(win, target.componentId);
    if (!boot) return { ...msg, meta: null };
    const root = findComponentRoot(win.document, target);
    return { ...msg, meta: enrichMetaBootFromDom(boot, root) };
  }
  function postToParent(win, data) {
    try {
      win.parent.postMessage(data, "*");
    } catch {
    }
  }
  function mountStandaloneChrome(win, guest) {
    const doc = win.document;
    if (doc.getElementById("as-ci-standalone")) return;
    const chrome = createInspectorChrome({
      doc,
      win,
      variant: "standalone",
      fetchMeta: async (componentId, signal) => {
        const res = await win.fetch(
          `/__as/design/components/${encodeURIComponent(componentId)}/inspector.json`,
          { signal }
        );
        if (!res.ok) return null;
        const boot = await res.json();
        const root = findComponentRoot(doc, { componentId });
        return enrichMetaBootFromDom(boot, root);
      },
      applyDraft: (input) => {
        void applyDraftInGuest(win, {
          protocol: "as-canvas-inspector/1",
          type: "apply-draft",
          componentId: input.componentId,
          instanceId: input.instanceId,
          props: input.props,
          slotText: input.slotText,
          patch: input.patch ?? "slots"
        }).then(() => {
          if (guest.isRevealAll()) guest.setRevealAll(true);
        });
      },
      getRevealAll: () => guest.isRevealAll(),
      setRevealAll: (on) => guest.setRevealAll(on),
      getLabelsOn: () => guest.isLabelsOn(),
      setLabelsOn: (on) => {
        if (on && !guest.isRevealAll()) guest.setRevealAll(true);
        guest.setLabelsOn(on);
      },
      getInteractionMode: () => guest.getInteractionMode(),
      setInteractionMode: (mode) => guest.setInteractionMode(mode),
      selectTarget: (target) => guest.selectTarget(target),
      onOpenChange: (open) => {
        if (open) {
          if (!guest.isActive()) guest.activate();
          if (guest.isRevealAll()) guest.setRevealAll(true);
        } else {
          if (guest.isActive()) guest.deactivate();
        }
      }
    });
    win.addEventListener("message", (ev) => {
      if (!isCanvasInspectorMessage(ev.data)) return;
      if (ev.data.type === "select") {
        if (!ev.data.target) {
          chrome.setSelection(null);
          return;
        }
        if (!chrome.isOpen()) chrome.open();
        chrome.setSelection(ev.data.target, ev.data.meta, ev.data.ancestors);
      }
    });
    if (wantsInspectFromUrl(win)) {
      chrome.open();
    }
  }
  function installCanvasInspectorGuest(win = window) {
    const guest = createGuestInspector(win, {
      postToHost: (data) => {
        if (data && typeof data === "object" && data.type === "select") {
          const selectMsg = data;
          void enrichSelectMessage(win, selectMsg).then((enriched) => {
            postToParent(win, enriched);
          });
          return;
        }
        postToParent(win, data);
      }
    });
    win.addEventListener("message", (ev) => {
      if (!isCanvasInspectorMessage(ev.data)) return;
      const msg = ev.data;
      if (msg.type === "inspect-on") guest.activate();
      else if (msg.type === "inspect-off") guest.deactivate();
      else if (msg.type === "reveal-all") guest.setRevealAll(msg.on);
      else if (msg.type === "labels-on") guest.setLabelsOn(msg.on);
      else if (msg.type === "set-mode") guest.setInteractionMode(msg.mode);
      else if (msg.type === "select-target") {
        guest.selectTarget(msg.target, { silent: Boolean(msg.silent) });
      } else if (msg.type === "apply-draft") {
        void applyDraftInGuest(win, msg).then(() => {
          guest.selectTarget(
            {
              kind: "component",
              componentId: msg.componentId,
              instanceId: msg.instanceId
            },
            { silent: true }
          );
        });
      }
    });
    try {
      win.parent.postMessage(
        { protocol: "as-canvas-inspector/1", type: "ready" },
        "*"
      );
    } catch {
    }
    if (isTopLevel(win)) {
      const boot = () => mountStandaloneChrome(win, guest);
      if (win.document.body) boot();
      else win.addEventListener("DOMContentLoaded", boot, { once: true });
    }
  }

  // src/guest-boot-entry.ts
  installCanvasInspectorGuest();
})();
