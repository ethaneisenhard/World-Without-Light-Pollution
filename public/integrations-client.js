// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/core/vnode.js
function createRemixElement(type, props, key) {
  return {
    $rmx: true,
    key,
    props: normalizeElementProps(props),
    type
  };
}
function isRemixElement(node) {
  return typeof node === "object" && node !== null && "$rmx" in node;
}
function normalizeElementProps(props) {
  if (!props)
    return {};
  if (!("mix" in props))
    return props;
  let { mix, ...rest } = props;
  let normalizedMix = normalizeMixValue(mix);
  return normalizedMix === void 0 ? rest : { ...rest, mix: normalizedMix };
}
function normalizeMixValue(mix) {
  if (!mix)
    return void 0;
  let normalizedMix = [];
  flattenMixValue(mix, normalizedMix);
  return normalizedMix.length === 0 ? void 0 : normalizedMix;
}
function flattenMixValue(mix, out) {
  if (!mix)
    return;
  if (!Array.isArray(mix)) {
    out.push(mix);
    return;
  }
  for (let item of mix) {
    flattenMixValue(item, out);
  }
}

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/jsx.js
function jsx(type, props, key) {
  return createRemixElement(type, props, key);
}

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/typed-event-target.js
var TypedEventTarget = class extends EventTarget {
};

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/component.js
function createComponent(config) {
  return new ComponentRuntime(config);
}
var ComponentRuntime = class {
  frame;
  #config;
  #connectedController;
  #contextValue;
  #handle;
  #props = {};
  #renderController;
  #renderFn;
  #removed = false;
  #scheduleUpdate = () => {
    throw new Error("scheduleUpdate not implemented");
  };
  #tasks = [];
  constructor(config) {
    this.#config = config;
    this.frame = config.frame;
    this.#handle = this.#createHandle();
  }
  render = (nextProps) => {
    if (this.#removed) {
      console.warn("render called after component was removed, potential application memory leak");
      return [null, []];
    }
    this.#abortRenderSignal();
    syncProps(this.#props, nextProps);
    let renderFn = this.#renderFn;
    if (renderFn === void 0) {
      let result = this.#config.type(this.#handle);
      if (typeof result !== "function") {
        let name = this.#config.type.name || "Anonymous";
        throw new Error(`${name} must return a render function, received ${typeof result}`);
      }
      renderFn = result;
      this.#renderFn = renderFn;
    }
    return [renderFn(), this.#dequeueTasks()];
  };
  remove = () => {
    if (this.#removed)
      return [];
    this.#removed = true;
    this.#connectedController?.abort();
    this.#abortRenderSignal();
    return this.#dequeueTasks(AbortSignal.abort());
  };
  setScheduleUpdate = (nextScheduleUpdate) => {
    this.#scheduleUpdate = nextScheduleUpdate;
  };
  getContextValue = () => this.#contextValue;
  isRemoved = () => this.#removed;
  #createHandle() {
    let component = this;
    let context = {
      set: (value) => {
        this.#contextValue = value;
      },
      get: (type) => this.#config.getContext(type)
    };
    return {
      id: this.#config.id,
      props: this.#props,
      update: () => new Promise((resolve) => {
        if (component.#removed) {
          resolve(AbortSignal.abort());
          return;
        }
        this.#tasks.push((signal) => resolve(signal));
        this.#scheduleUpdate();
      }),
      queueTask: (task) => {
        this.#tasks.push(task);
      },
      frame: this.#config.frame,
      frames: {
        get top() {
          return component.#config.getTopFrame?.() ?? component.#config.frame;
        },
        get(name) {
          return component.#config.getFrameByName(name);
        }
      },
      context,
      get signal() {
        return component.#config.signal ?? component.#connectedSignal();
      }
    };
  }
  #connectedSignal() {
    this.#connectedController ??= new AbortController();
    return this.#connectedController.signal;
  }
  #abortRenderSignal() {
    this.#renderController?.abort();
    this.#renderController = void 0;
  }
  #dequeueTasks(signal) {
    let needsSignal = signal === void 0 && this.#tasks.some((task) => task.length >= 1);
    if (needsSignal) {
      this.#renderController ??= new AbortController();
    }
    signal ??= this.#renderController?.signal;
    let tasks = this.#tasks.splice(0, this.#tasks.length);
    return tasks.map((task) => () => task(signal));
  }
};
function syncProps(target, next) {
  for (let key in target) {
    if (!(key in next)) {
      delete target[key];
    }
  }
  for (let key in next) {
    target[key] = next[key];
  }
}
function Frame(handle) {
  void handle;
  return () => null;
}
function Fragment(handle) {
  void handle;
  return () => null;
}
function createFrameHandle(def) {
  return Object.assign(new TypedEventTarget(), {
    src: "/",
    replace: notImplemented("replace not implemented"),
    reload: notImplemented("reload not implemented")
  }, def);
}
function notImplemented(msg) {
  return () => {
    throw new Error(msg);
  };
}

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/error-event.js
function createComponentErrorEvent(error) {
  return new ErrorEvent("error", { error });
}
function getComponentError(event) {
  return event.error;
}

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/invariant.js
function invariant(assertion, message) {
  let prefix = "Framework invariant";
  if (assertion)
    return;
  throw new Error(message ? `${prefix}: ${message}` : prefix);
}

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/document-state.js
function createDocumentState(_doc) {
  let doc = _doc ?? document;
  function getActiveElement() {
    return doc.activeElement || doc.body;
  }
  function hasSelectionCapabilities(elem) {
    let nodeName = elem.nodeName.toLowerCase();
    return nodeName === "input" && "type" in elem && (elem.type === "text" || elem.type === "search" || elem.type === "tel" || elem.type === "url" || elem.type === "password") || nodeName === "textarea" || elem instanceof HTMLElement && elem.contentEditable === "true";
  }
  function getSelection(input) {
    if ("selectionStart" in input && typeof input.selectionStart === "number" && "selectionEnd" in input) {
      let htmlInput = input;
      return {
        start: htmlInput.selectionStart ?? 0,
        end: htmlInput.selectionEnd ?? htmlInput.selectionStart ?? 0
      };
    }
    return null;
  }
  function setSelection(input, offsets) {
    if ("selectionStart" in input && "selectionEnd" in input) {
      try {
        let htmlInput = input;
        htmlInput.selectionStart = offsets.start;
        htmlInput.selectionEnd = Math.min(offsets.end, htmlInput.value?.length ?? 0);
      } catch {
      }
    }
  }
  function isInDocument(node) {
    return doc.documentElement.contains(node);
  }
  function getSelectionInformation() {
    let focusedElem = getActiveElement();
    return {
      focusedElem,
      selectionRange: focusedElem && hasSelectionCapabilities(focusedElem) ? getSelection(focusedElem) : null
    };
  }
  function restoreSelection(priorSelectionInformation) {
    let curFocusedElem = getActiveElement();
    let priorFocusedElem = priorSelectionInformation.focusedElem;
    let priorSelectionRange = priorSelectionInformation.selectionRange;
    if (curFocusedElem !== priorFocusedElem && priorFocusedElem && isInDocument(priorFocusedElem)) {
      let ancestors = [];
      let ancestor = priorFocusedElem;
      while (ancestor) {
        if (ancestor.nodeType === Node.ELEMENT_NODE) {
          let el2 = ancestor;
          ancestors.push({
            element: el2,
            left: el2.scrollLeft ?? 0,
            top: el2.scrollTop ?? 0
          });
        }
        ancestor = ancestor.parentNode;
      }
      if (priorSelectionRange !== null && hasSelectionCapabilities(priorFocusedElem)) {
        setSelection(priorFocusedElem, priorSelectionRange);
      }
      if (priorFocusedElem instanceof HTMLElement && typeof priorFocusedElem.focus === "function") {
        priorFocusedElem.focus();
      }
      for (let info of ancestors) {
        info.element.scrollLeft = info.left;
        info.element.scrollTop = info.top;
      }
    }
  }
  let selectionInfo = null;
  function capture() {
    selectionInfo = getSelectionInformation();
  }
  function restore() {
    if (selectionInfo !== null) {
      restoreSelection(selectionInfo);
    }
    selectionInfo = null;
  }
  return { capture, restore };
}

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/vnode.js
var TEXT_NODE = Symbol("TEXT_NODE");
var NON_RENDER_NODE = Symbol("NON_RENDER_NODE");
var ROOT_VNODE = Symbol("ROOT_VNODE");
function isFragmentNode(node) {
  return node.type === Fragment;
}
function isTextNode(node) {
  return node.type === TEXT_NODE;
}
function isNonRenderNode(node) {
  return node.type === NON_RENDER_NODE;
}
function isCommittedTextNode(node) {
  return isTextNode(node) && node._dom instanceof Text;
}
function isHostNode(node) {
  return typeof node.type === "string";
}
function isCommittedHostNode(node) {
  return isHostNode(node) && node._dom instanceof Element;
}
function isComponentNode(node) {
  return typeof node.type === "function" && node.type !== Frame;
}
function isCommittedComponentNode(node) {
  return isComponentNode(node) && node._content !== void 0;
}
function findContextFromAncestry(node, type) {
  let current = node;
  while (current) {
    if (current.type === type && isComponentNode(current)) {
      return current._handle.getContextValue();
    }
    current = current._parent;
  }
  return void 0;
}

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/style/style.js
function camelToKebab(str) {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
var NUMERIC_CSS_PROPS = /* @__PURE__ */ new Set([
  "aspect-ratio",
  "z-index",
  "opacity",
  "flex-grow",
  "flex-shrink",
  "flex-order",
  "grid-area",
  "grid-row",
  "grid-column",
  "font-weight",
  "line-height",
  "order",
  "orphans",
  "widows",
  "zoom",
  "columns",
  "column-count"
]);
function normalizeCssValue(key, value) {
  if (value == null)
    return String(value);
  if (typeof value === "number" && value !== 0) {
    let cssKey = camelToKebab(key);
    if (!NUMERIC_CSS_PROPS.has(cssKey) && !cssKey.startsWith("--")) {
      return `${value}px`;
    }
  }
  return String(value);
}

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/svg-attributes.js
var XLINK_NS = "http://www.w3.org/1999/xlink";
var XML_NS = "http://www.w3.org/XML/1998/namespace";
var CANONICAL_CAMEL_SVG_ATTRS = /* @__PURE__ */ new Set([
  "accentHeight",
  "attributeName",
  "attributeType",
  "autoReverse",
  "baseFrequency",
  "baseProfile",
  "calcMode",
  "viewBox",
  "preserveAspectRatio",
  "externalResourcesRequired",
  "filterRes",
  "gradientUnits",
  "gradientTransform",
  "glyphRef",
  "kernelMatrix",
  "kernelUnitLength",
  "keyPoints",
  "keySplines",
  "keyTimes",
  "lengthAdjust",
  "limitingConeAngle",
  "markerHeight",
  "patternUnits",
  "patternContentUnits",
  "patternTransform",
  "markerWidth",
  "numOctaves",
  "pathLength",
  "pointsAtX",
  "pointsAtY",
  "pointsAtZ",
  "preserveAlpha",
  "clipPathUnits",
  "maskUnits",
  "maskContentUnits",
  "filterUnits",
  "primitiveUnits",
  "refX",
  "refY",
  "requiredExtensions",
  "requiredFeatures",
  "specularConstant",
  "specularExponent",
  "spreadMethod",
  "startOffset",
  "stdDeviation",
  "stitchTiles",
  "surfaceScale",
  "systemLanguage",
  "tableValues",
  "targetX",
  "targetY",
  "textLength",
  "viewTarget",
  "xChannelSelector",
  "yChannelSelector",
  "zoomAndPan",
  "edgeMode",
  "diffuseConstant",
  "markerUnits"
]);
var SVG_ATTR_ALIASES = /* @__PURE__ */ new Map();
for (let attr of CANONICAL_CAMEL_SVG_ATTRS) {
  SVG_ATTR_ALIASES.set(camelToKebab2(attr), attr);
}
var NAMESPACED_SVG_ALIASES = /* @__PURE__ */ new Map([
  ["xlinkHref", { ns: XLINK_NS, attr: "xlink:href" }],
  ["xlink:href", { ns: XLINK_NS, attr: "xlink:href" }],
  ["xlink-href", { ns: XLINK_NS, attr: "xlink:href" }],
  ["xlinkActuate", { ns: XLINK_NS, attr: "xlink:actuate" }],
  ["xlink:actuate", { ns: XLINK_NS, attr: "xlink:actuate" }],
  ["xlink-actuate", { ns: XLINK_NS, attr: "xlink:actuate" }],
  ["xlinkArcrole", { ns: XLINK_NS, attr: "xlink:arcrole" }],
  ["xlink:arcrole", { ns: XLINK_NS, attr: "xlink:arcrole" }],
  ["xlink-arcrole", { ns: XLINK_NS, attr: "xlink:arcrole" }],
  ["xlinkRole", { ns: XLINK_NS, attr: "xlink:role" }],
  ["xlink:role", { ns: XLINK_NS, attr: "xlink:role" }],
  ["xlink-role", { ns: XLINK_NS, attr: "xlink:role" }],
  ["xlinkShow", { ns: XLINK_NS, attr: "xlink:show" }],
  ["xlink:show", { ns: XLINK_NS, attr: "xlink:show" }],
  ["xlink-show", { ns: XLINK_NS, attr: "xlink:show" }],
  ["xlinkTitle", { ns: XLINK_NS, attr: "xlink:title" }],
  ["xlink:title", { ns: XLINK_NS, attr: "xlink:title" }],
  ["xlink-title", { ns: XLINK_NS, attr: "xlink:title" }],
  ["xlinkType", { ns: XLINK_NS, attr: "xlink:type" }],
  ["xlink:type", { ns: XLINK_NS, attr: "xlink:type" }],
  ["xlink-type", { ns: XLINK_NS, attr: "xlink:type" }],
  ["xmlBase", { ns: XML_NS, attr: "xml:base" }],
  ["xml:base", { ns: XML_NS, attr: "xml:base" }],
  ["xml-base", { ns: XML_NS, attr: "xml:base" }],
  ["xmlLang", { ns: XML_NS, attr: "xml:lang" }],
  ["xml:lang", { ns: XML_NS, attr: "xml:lang" }],
  ["xml-lang", { ns: XML_NS, attr: "xml:lang" }],
  ["xmlSpace", { ns: XML_NS, attr: "xml:space" }],
  ["xml:space", { ns: XML_NS, attr: "xml:space" }],
  ["xml-space", { ns: XML_NS, attr: "xml:space" }],
  ["xmlnsXlink", { attr: "xmlns:xlink" }],
  ["xmlns:xlink", { attr: "xmlns:xlink" }],
  ["xmlns-xlink", { attr: "xmlns:xlink" }]
]);
function normalizeSvgAttributeName(name) {
  let alias = SVG_ATTR_ALIASES.get(name);
  if (alias)
    return alias;
  if (CANONICAL_CAMEL_SVG_ATTRS.has(name))
    return name;
  return camelToKebab2(name);
}
function normalizeSvgAttribute(name) {
  let namespaced = NAMESPACED_SVG_ALIASES.get(name);
  if (namespaced) {
    return namespaced;
  }
  return { attr: normalizeSvgAttributeName(name) };
}
function camelToKebab2(input) {
  return input.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/_/g, "-").toLowerCase();
}

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/core/attributes.js
var ATTRIBUTE_FALLBACK_NAMES = /* @__PURE__ */ new Set([
  "width",
  "height",
  "href",
  "list",
  "form",
  "tabIndex",
  "download",
  "rowSpan",
  "colSpan",
  "role",
  "popover",
  "translate"
]);
var BOOLEANISH_STRING_ATTRIBUTES = /* @__PURE__ */ new Set([
  "autoReverse",
  "contenteditable",
  "draggable",
  "externalResourcesRequired",
  "focusable",
  "preserveAlpha",
  "spellcheck"
]);
function canUseProperty(element, name, isSvg, attr) {
  if (isSvg)
    return false;
  if (ATTRIBUTE_FALLBACK_NAMES.has(name))
    return false;
  if (isBooleanishStringAttribute(attr))
    return false;
  return name in element;
}
function normalizeAttributeName(name, isSvg) {
  if (name.startsWith("aria-") || name.startsWith("data-"))
    return { attr: name };
  if (name === "className")
    return { attr: "class" };
  if (!isSvg) {
    if (name === "htmlFor")
      return { attr: "for" };
    if (name === "tabIndex")
      return { attr: "tabindex" };
    if (name === "acceptCharset")
      return { attr: "accept-charset" };
    if (name === "httpEquiv")
      return { attr: "http-equiv" };
    return { attr: name.toLowerCase() };
  }
  return normalizeSvgAttribute(name);
}
function isBooleanishStringAttribute(name) {
  return BOOLEANISH_STRING_ATTRIBUTES.has(name);
}
function serializeStyleObject(style) {
  let parts = [];
  for (let [key, value] of Object.entries(style)) {
    if (value == null)
      continue;
    if (typeof value === "boolean")
      continue;
    if (typeof value === "number" && !Number.isFinite(value))
      continue;
    let cssKey = toKebabCase(key);
    let cssValue = Array.isArray(value) ? value.join(", ") : normalizeCssValue(key, value);
    parts.push(`${cssKey}: ${cssValue};`);
  }
  return parts.join(" ");
}
function getMergedClassName(props) {
  let classAttr = typeof props.class === "string" ? props.class : "";
  let className = typeof props.className === "string" ? props.className : "";
  let merged = classAttr && className ? `${classAttr} ${className}` : classAttr || className;
  return merged || void 0;
}
function toKebabCase(value) {
  return value.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/core/props.js
var SVG_NS = "http://www.w3.org/2000/svg";
function isFrameworkProp(name) {
  return name === "children" || name === "mix" || name === "key" || name === "animate" || name === "innerHTML" || name === "on";
}
function toLocalName(attrName) {
  let separatorIndex = attrName.indexOf(":");
  if (separatorIndex === -1)
    return attrName;
  return attrName.slice(separatorIndex + 1);
}
function clearRuntimePropertyOnRemoval(dom, name) {
  try {
    if (name === "value" || name === "defaultValue") {
      dom[name] = "";
      return;
    }
    if (name === "checked" || name === "defaultChecked" || name === "selected") {
      dom[name] = false;
      return;
    }
    if (name === "selectedIndex") {
      dom[name] = -1;
    }
  } catch {
  }
}
function patchHostProps(curr, next, dom) {
  let isSvg = dom.namespaceURI === SVG_NS;
  let currClassName = getMergedClassName(curr);
  let nextClassName = getMergedClassName(next);
  if (currClassName !== nextClassName) {
    if (nextClassName) {
      dom.setAttribute("class", nextClassName);
    } else {
      dom.removeAttribute("class");
    }
  }
  for (let name in curr) {
    if (isFrameworkProp(name))
      continue;
    if (name === "class" || name === "className")
      continue;
    if (name in next && next[name] != null)
      continue;
    let { ns, attr } = normalizeAttributeName(name, isSvg);
    if (canUseProperty(dom, name, isSvg, attr)) {
      clearRuntimePropertyOnRemoval(dom, name);
    }
    if (ns)
      dom.removeAttributeNS(ns, toLocalName(attr));
    else
      dom.removeAttribute(attr);
  }
  for (let name in next) {
    if (isFrameworkProp(name))
      continue;
    if (name === "class" || name === "className")
      continue;
    let nextValue = next[name];
    if (nextValue == null)
      continue;
    let prevValue = curr[name];
    if (prevValue === nextValue)
      continue;
    if (name === "style" && isStyleObject(nextValue)) {
      if (isStyleObject(prevValue)) {
        patchStyleObject(dom, prevValue, nextValue);
      } else {
        dom.removeAttribute("style");
        patchStyleObject(dom, void 0, nextValue);
      }
      continue;
    }
    patchHostProp(dom, name, nextValue, isSvg);
  }
}
function patchHostProp(dom, name, value, isSvg) {
  let { ns, attr } = normalizeAttributeName(name, isSvg);
  if (attr === "style" && isStyleObject(value)) {
    patchStyleObject(dom, void 0, value);
    return;
  }
  if (attr === "style" && typeof value === "string") {
    dom.setAttribute("style", value);
    return;
  }
  if (canUseProperty(dom, name, isSvg, attr)) {
    try {
      dom[name] = value == null ? "" : value;
      return;
    } catch {
    }
  }
  if (typeof value === "function")
    return;
  let isAriaOrData = name.startsWith("aria-") || name.startsWith("data-");
  let isBooleanishString = isBooleanishStringAttribute(attr);
  if (value != null && (value !== false || isAriaOrData || isBooleanishString)) {
    let attrValue = name === "popover" && value === true ? "" : String(value);
    if (ns)
      dom.setAttributeNS(ns, attr, attrValue);
    else
      dom.setAttribute(attr, attrValue);
  } else {
    if (ns)
      dom.removeAttributeNS(ns, toLocalName(attr));
    else
      dom.removeAttribute(attr);
  }
}
function isStyleObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function patchStyleObject(dom, curr, next) {
  if (!(dom instanceof HTMLElement || dom instanceof SVGElement)) {
    dom.setAttribute("style", serializeStyleObject(next));
    return;
  }
  let style = dom.style;
  if (curr) {
    for (let name in curr) {
      let nextCssValue = styleValueToCss(name, next[name]);
      if (nextCssValue !== void 0)
        continue;
      let prevCssValue = styleValueToCss(name, curr[name]);
      if (prevCssValue === void 0)
        continue;
      style.removeProperty(toKebabCase(name));
    }
  }
  for (let name in next) {
    let nextCssValue = styleValueToCss(name, next[name]);
    if (nextCssValue === void 0)
      continue;
    let prevCssValue = curr ? styleValueToCss(name, curr[name]) : void 0;
    if (prevCssValue === nextCssValue)
      continue;
    style.setProperty(toKebabCase(name), nextCssValue);
  }
}
function styleValueToCss(name, value) {
  if (value == null)
    return void 0;
  if (typeof value === "boolean")
    return void 0;
  if (typeof value === "number" && !Number.isFinite(value))
    return void 0;
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  return normalizeCssValue(name, value);
}

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/client-entries.js
function logHydrationMismatch(...msg) {
  console.error("Hydration mismatch:", ...msg);
}
function skipComments(cursor) {
  while (cursor && cursor.nodeType === Node.COMMENT_NODE) {
    cursor = cursor.nextSibling;
  }
  return cursor;
}

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/core/children.js
function isEmptyChild(value) {
  return value == null || typeof value === "boolean";
}
function isPrimitiveChild(value) {
  let type = typeof value;
  return type === "string" || type === "number" || type === "bigint";
}
function normalizeChildren(children) {
  for (let child of children) {
    if (Array.isArray(child)) {
      return children.flat(Infinity);
    }
  }
  return children;
}

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/to-vnode.js
function flatMapChildrenToVNodes(node) {
  if (!("children" in node.props))
    return [];
  let children = node.props.children;
  if (!Array.isArray(children))
    return [toVNode(children)];
  let vnodes = [];
  flattenChildrenToVNodes(children, vnodes);
  return vnodes;
}
function flattenChildrenToVNodes(nodes, out) {
  for (let child of normalizeChildren(nodes)) {
    out.push(toVNode(child));
  }
}
function toVNode(node) {
  if (isEmptyChild(node)) {
    return { type: NON_RENDER_NODE };
  }
  if (isPrimitiveChild(node)) {
    return { type: TEXT_NODE, _text: String(node) };
  }
  if (Array.isArray(node)) {
    let children = [];
    flattenChildrenToVNodes(node, children);
    return { type: Fragment, _children: children };
  }
  if (node.type === Fragment) {
    return { type: Fragment, key: node.key, _children: flatMapChildrenToVNodes(node) };
  }
  if (isRemixElement(node)) {
    let children = node.props.innerHTML != null ? [] : flatMapChildrenToVNodes(node);
    return { type: node.type, key: node.key, props: node.props, _children: children };
  }
  invariant(false, "Unexpected RemixNode");
}

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/mixins/mixin.js
var mixinHandleId = 0;
function createMixin(type) {
  return (...args) => ({
    type,
    args
  });
}
function resolveMixedProps(input) {
  let state = input.state ?? createMixinRuntimeState();
  let handle = state.handle;
  if (!handle) {
    handle = createMixinHandle({
      id: state.id,
      hostType: input.hostType,
      frame: input.frame,
      scheduler: input.scheduler,
      getContext: input.getContext ?? (() => void 0),
      getRuntimeSignal: () => getMixinRuntimeSignal(state),
      getBinding: () => state.binding
    });
    state.handle = handle;
  }
  let hostType = input.hostType;
  let descriptors = resolveMixDescriptors(input.props);
  let composedProps = withoutMix(input.props);
  let mixinProps = withoutMixinTreeProps(composedProps);
  let maxDescriptors = 1024;
  for (let index = 0; index < descriptors.length && index < maxDescriptors; index++) {
    let descriptor = descriptors[index];
    let entry = state.runners[index];
    if (!entry || entry.type !== descriptor.type) {
      if (entry) {
        queueMixinRemove(handle, entry.scope);
      }
      let scope = Symbol("mixin-scope");
      handle.setActiveScope(scope);
      entry = {
        scope,
        type: descriptor.type,
        runner: normalizeMixinRunner(descriptor.type(handle, hostType), handle)
      };
      handle.setActiveScope(void 0);
      state.runners[index] = entry;
      let binding = state.binding;
      if (binding?.node) {
        queueMixinInsert(handle, entry.scope, binding.node, binding.parent, binding.key);
      }
    }
    handle.setActiveScope(entry.scope);
    let result = entry.runner(...descriptor.args, mixinProps);
    handle.setActiveScope(void 0);
    if (!result)
      continue;
    if (isMixinElement(result))
      continue;
    let returnedDescriptors = resolveReturnedMixDescriptors(result);
    if (returnedDescriptors) {
      for (let returned of returnedDescriptors)
        descriptors.push(returned);
      continue;
    }
    if (!isRemixElement2(result)) {
      console.error(new Error("mixins must return a remix element"));
      continue;
    }
    let resultType = typeof result.type === "string" ? result.type : isMixinElement(result.type) ? result.type.__rmxMixinElementType : null;
    if (resultType !== hostType) {
      console.error(new Error("mixins must return an element with the same host type"));
      continue;
    }
    if (result.type !== resultType) {
      result = { ...result, type: resultType };
    }
    let nextProps = sanitizeReturnedMixinProps(result.props);
    let nestedDescriptors = resolveMixDescriptors(nextProps);
    for (let nested of nestedDescriptors)
      descriptors.push(nested);
    composedProps = composeMixinProps(composedProps, withoutMix(nextProps));
    mixinProps = withoutMixinTreeProps(composedProps);
  }
  for (let index = descriptors.length; index < state.runners.length; index++) {
    let entry = state.runners[index];
    if (entry) {
      handle.dispatchScopedEvent(entry.scope, new Event("remove"));
      handle.releaseScope(entry.scope);
    }
  }
  if (state.runners.length > descriptors.length) {
    state.runners.length = descriptors.length;
  }
  let nextMix = input.props.mix;
  return {
    state,
    props: {
      ...composedProps,
      ...nextMix === void 0 ? {} : { mix: nextMix }
    }
  };
}
function teardownMixins(state) {
  if (!state)
    return;
  state.binding = void 0;
  prepareMixinRemoval(state);
  cancelPendingMixinRemoval(state);
  let handle = state.handle;
  if (handle) {
    handle.queueCommitTask(() => finalizeMixinTeardown(state));
    return;
  }
  finalizeMixinTeardown(state);
}
function bindMixinRuntime(state, binding, options) {
  if (!state)
    return;
  let previousNode = state.binding?.node;
  let nextBinding = binding;
  state.binding = nextBinding;
  if (!nextBinding?.node || previousNode === nextBinding.node)
    return;
  let nextNode = nextBinding.node;
  let handle = state.handle;
  if (!handle)
    return;
  for (let entry of state.runners) {
    if (options?.dispatchReclaimed) {
      queueMixinReclaimed(handle, entry.scope, nextNode, nextBinding.parent, nextBinding.key);
    } else {
      queueMixinInsert(handle, entry.scope, nextNode, nextBinding.parent, nextBinding.key);
    }
  }
}
function prepareMixinRemoval(state) {
  if (!state || state.removePrepared)
    return state?.pendingRemoval?.done;
  state.removePrepared = true;
  let pendingRemoval;
  let persistTeardowns = [];
  let registerPersistNode = (teardown) => {
    persistTeardowns.push(teardown);
  };
  let handle = state.handle;
  if (!handle)
    return;
  for (let entry of state.runners) {
    dispatchMixinBeforeRemove(handle, entry.scope, registerPersistNode);
  }
  if (persistTeardowns.length > 0) {
    let controller = new AbortController();
    let done = Promise.allSettled(persistTeardowns.map((teardown) => Promise.resolve().then(() => teardown(controller.signal)))).then(() => {
    });
    pendingRemoval = {
      signal: controller.signal,
      cancel(reason) {
        controller.abort(reason);
      },
      done
    };
  }
  state.pendingRemoval = pendingRemoval;
  return pendingRemoval?.done;
}
function cancelPendingMixinRemoval(state, reason = new DOMException("", "AbortError")) {
  if (!state?.pendingRemoval)
    return;
  state.pendingRemoval.cancel(reason);
  state.pendingRemoval = void 0;
  state.removePrepared = false;
}
function createMixinRuntimeState() {
  return {
    id: `m${++mixinHandleId}`,
    aborted: false,
    runners: []
  };
}
function createMixinHandle(options) {
  return new MixinHandleImpl(options);
}
var MixinHandleImpl = class extends TypedEventTarget {
  id;
  context;
  frame;
  element;
  #options;
  #phaseListenerCounts = {
    beforeUpdate: 0,
    commit: 0
  };
  #activeScope;
  #scopeSignals = /* @__PURE__ */ new Map();
  #scopeTargets = /* @__PURE__ */ new Map();
  #scopePhaseCounts = /* @__PURE__ */ new Map();
  #onSchedulerBeforeUpdate = (event) => {
    this.#dispatchSchedulerPhaseToHandle("beforeUpdate", event);
  };
  #onSchedulerCommit = (event) => {
    this.#dispatchSchedulerPhaseToHandle("commit", event);
  };
  constructor(options) {
    super();
    this.#options = options;
    this.id = options.id;
    this.context = {
      get: options.getContext
    };
    this.frame = options.frame;
    let element = ((_2, __) => (props) => ({
      $rmx: true,
      type: options.hostType,
      key: null,
      props
    }));
    element.__rmxMixinElementType = options.hostType;
    this.element = element;
  }
  get signal() {
    let scope = this.#activeScope;
    invariant(scope, "handle.signal is only available during mixin setup, render, or lifecycle callbacks");
    return this.#getScopeSignal(scope);
  }
  addEventListener(type, listener, options) {
    let target = this.#getActiveScopeTarget();
    target.addEventListener(type, listener, options);
    if (!listener || !isSchedulerPhaseType(type))
      return;
    let scope = this.#activeScope;
    invariant(scope);
    let scopePhaseCounts = this.#scopePhaseCounts.get(scope);
    invariant(scopePhaseCounts);
    scopePhaseCounts[type] += 1;
    this.#phaseListenerCounts[type] += 1;
    if (this.#phaseListenerCounts[type] !== 1)
      return;
    if (type === "beforeUpdate") {
      this.#options.scheduler.addEventListener("beforeUpdate", this.#onSchedulerBeforeUpdate);
    } else {
      this.#options.scheduler.addEventListener("commit", this.#onSchedulerCommit);
    }
  }
  removeEventListener(type, listener, options) {
    let target = this.#getActiveScopeTarget();
    target.removeEventListener(type, listener, typeof options === "boolean" ? { capture: options } : options);
    if (!listener || !isSchedulerPhaseType(type))
      return;
    let scope = this.#activeScope;
    invariant(scope);
    let scopePhaseCounts = this.#scopePhaseCounts.get(scope);
    invariant(scopePhaseCounts);
    scopePhaseCounts[type] = Math.max(0, scopePhaseCounts[type] - 1);
    this.#phaseListenerCounts[type] = Math.max(0, this.#phaseListenerCounts[type] - 1);
    if (this.#phaseListenerCounts[type] !== 0)
      return;
    if (type === "beforeUpdate") {
      this.#options.scheduler.removeEventListener("beforeUpdate", this.#onSchedulerBeforeUpdate);
    } else {
      this.#options.scheduler.removeEventListener("commit", this.#onSchedulerCommit);
    }
  }
  update() {
    return new Promise((resolve) => {
      let signal = this.#options.getRuntimeSignal();
      if (signal.aborted) {
        resolve(signal);
        return;
      }
      let binding = this.#options.getBinding();
      if (!binding) {
        resolve(signal);
        return;
      }
      binding.enqueueUpdate(resolve);
    });
  }
  queueTask(task) {
    this.#options.scheduler.enqueueTasks([
      () => {
        let binding = this.#options.getBinding();
        invariant(binding);
        task(binding.node, this.#options.getRuntimeSignal());
      }
    ]);
  }
  queueCommitTask(task) {
    this.#options.scheduler.enqueueCommitPhase([task]);
  }
  setActiveScope(scope) {
    this.#activeScope = scope;
    if (!scope)
      return;
    if (this.#scopeTargets.has(scope))
      return;
    this.#scopeTargets.set(scope, new TypedEventTarget());
    this.#scopePhaseCounts.set(scope, { beforeUpdate: 0, commit: 0 });
  }
  dispatchScopedEvent(scope, event) {
    let previousScope = this.#activeScope;
    this.#activeScope = scope;
    this.#scopeTargets.get(scope)?.dispatchEvent(event);
    this.#activeScope = previousScope;
  }
  releaseScope(scope) {
    let scopePhaseCounts = this.#scopePhaseCounts.get(scope);
    if (scopePhaseCounts) {
      this.#decrementGlobalPhaseCount("beforeUpdate", scopePhaseCounts.beforeUpdate);
      this.#decrementGlobalPhaseCount("commit", scopePhaseCounts.commit);
    }
    let controller = this.#scopeSignals.get(scope);
    if (controller) {
      controller.abort();
      this.#scopeSignals.delete(scope);
    }
    this.#scopePhaseCounts.delete(scope);
    this.#scopeTargets.delete(scope);
    if (this.#activeScope === scope) {
      this.#activeScope = void 0;
    }
  }
  #dispatchSchedulerPhaseToHandle(type, event) {
    let binding = this.#options.getBinding();
    if (!binding)
      return;
    if (!isBindingInUpdateScope(binding, event.parents))
      return;
    for (let [, target] of this.#scopeTargets) {
      let updateEvent = new Event(type);
      updateEvent.node = binding.node;
      target.dispatchEvent(updateEvent);
    }
  }
  #getActiveScopeTarget() {
    let scope = this.#activeScope;
    invariant(scope);
    let target = this.#scopeTargets.get(scope);
    invariant(target);
    return target;
  }
  #getScopeSignal(scope) {
    let controller = this.#scopeSignals.get(scope);
    if (!controller) {
      controller = new AbortController();
      this.#scopeSignals.set(scope, controller);
    }
    return controller.signal;
  }
  #decrementGlobalPhaseCount(type, amount) {
    if (amount <= 0)
      return;
    this.#phaseListenerCounts[type] = Math.max(0, this.#phaseListenerCounts[type] - amount);
    if (this.#phaseListenerCounts[type] !== 0)
      return;
    if (type === "beforeUpdate") {
      this.#options.scheduler.removeEventListener("beforeUpdate", this.#onSchedulerBeforeUpdate);
    } else {
      this.#options.scheduler.removeEventListener("commit", this.#onSchedulerCommit);
    }
  }
};
function getMixinRuntimeSignal(state) {
  let controller = state.controller;
  if (!controller) {
    controller = new AbortController();
    if (state.aborted) {
      controller.abort();
    }
    state.controller = controller;
  }
  return controller.signal;
}
function dispatchMixinBeforeUpdate(state) {
  dispatchMixinUpdateEvent(state, "beforeUpdate");
}
function dispatchMixinCommit(state) {
  dispatchMixinUpdateEvent(state, "commit");
}
function dispatchMixinInsert(handle, scope, node, parent, key) {
  let event = new Event("insert");
  event.node = node;
  event.parent = parent;
  event.key = key;
  handle.dispatchScopedEvent(scope, event);
}
function dispatchMixinReclaimed(handle, scope, node, parent, key) {
  let event = new Event("reclaimed");
  event.node = node;
  event.parent = parent;
  event.key = key;
  handle.dispatchScopedEvent(scope, event);
}
function dispatchMixinBeforeRemove(handle, scope, persistNode) {
  let event = new Event("beforeRemove");
  event.persistNode = persistNode;
  handle.dispatchScopedEvent(scope, event);
}
function queueMixinInsert(handle, scope, node, parent, key) {
  handle.queueCommitTask(() => {
    dispatchMixinInsert(handle, scope, node, parent, key);
  });
}
function queueMixinReclaimed(handle, scope, node, parent, key) {
  handle.queueCommitTask(() => {
    dispatchMixinReclaimed(handle, scope, node, parent, key);
  });
}
function queueMixinRemove(handle, scope) {
  handle.queueCommitTask(() => {
    handle.dispatchScopedEvent(scope, new Event("remove"));
    handle.releaseScope(scope);
  });
}
function dispatchMixinRemoveEvent(state) {
  let runners = state?.runners;
  if (!runners?.length)
    return;
  let handle = state?.handle;
  if (!handle)
    return;
  for (let entry of runners) {
    handle.dispatchScopedEvent(entry.scope, new Event("remove"));
  }
}
function finalizeMixinTeardown(state) {
  dispatchMixinRemoveEvent(state);
  let handle = state.handle;
  if (handle) {
    for (let entry of state.runners) {
      handle.releaseScope(entry.scope);
    }
  }
  state.runners.length = 0;
  state.aborted = true;
  state.controller?.abort();
  state.pendingRemoval = void 0;
  state.removePrepared = true;
  state.handle = void 0;
}
function dispatchMixinUpdateEvent(state, type) {
  let node = state?.binding?.node;
  if (!node)
    return;
  let runners = state?.runners;
  if (!runners?.length)
    return;
  let handle = state?.handle;
  if (!handle)
    return;
  for (let entry of runners) {
    let event = new Event(type);
    event.node = node;
    handle.dispatchScopedEvent(entry.scope, event);
  }
}
function isSchedulerPhaseType(type) {
  return type === "beforeUpdate" || type === "commit";
}
function isBindingInUpdateScope(binding, parents) {
  if (parents.length === 0)
    return false;
  let node = binding.node;
  for (let parent of parents) {
    let parentNode = parent;
    if (parentNode === node)
      return true;
    if (parentNode.contains(node))
      return true;
  }
  return false;
}
function resolveMixDescriptors(props) {
  let mix = props.mix;
  if (!mix)
    return [];
  if (Array.isArray(mix)) {
    if (mix.length === 0)
      return [];
    return mix.filter(Boolean);
  }
  return [mix];
}
function withoutMix(props) {
  if (!("mix" in props))
    return props;
  let output = { ...props };
  delete output.mix;
  return output;
}
function withoutMixinTreeProps(props) {
  if (!("children" in props) && !("innerHTML" in props))
    return props;
  let output = { ...props };
  delete output.children;
  delete output.innerHTML;
  return output;
}
function sanitizeReturnedMixinProps(props) {
  if (!("children" in props) && !("innerHTML" in props))
    return props;
  console.error(new Error("mixins must not return children or innerHTML"));
  return withoutMixinTreeProps(props);
}
function composeMixinProps(previous, next) {
  return { ...previous, ...next };
}
function resolveReturnedMixDescriptors(value) {
  let descriptors = [];
  if (!collectReturnedMixDescriptors(value, descriptors)) {
    return null;
  }
  return descriptors;
}
function collectReturnedMixDescriptors(value, output) {
  if (!value) {
    return true;
  }
  if (Array.isArray(value)) {
    for (let item of value) {
      if (!collectReturnedMixDescriptors(item, output)) {
        return false;
      }
    }
    return true;
  }
  if (!isMixinDescriptor(value)) {
    return false;
  }
  output.push(value);
  return true;
}
function isRemixElement2(value) {
  if (!value || typeof value !== "object")
    return false;
  return value.$rmx === true;
}
function isMixinDescriptor(value) {
  if (!value || typeof value !== "object" || isRemixElement2(value)) {
    return false;
  }
  let descriptor = value;
  return typeof descriptor.type === "function" && Array.isArray(descriptor.args);
}
function isMixinElement(value) {
  if (typeof value !== "function")
    return false;
  return "__rmxMixinElementType" in value;
}
function normalizeMixinRunner(result, handle) {
  if (typeof result === "function" && !isMixinElement(result)) {
    return result;
  }
  if (result === void 0) {
    return () => handle.element;
  }
  return () => result;
}

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/mixins/on-mixin.js
var onMixinType = (handle) => {
  let currentHandler = () => {
  };
  let currentType = "";
  let currentCapture = false;
  let currentNode = null;
  let reentry = null;
  let stableHandler = (event) => {
    reentry?.abort(new DOMException("", "EventReentry"));
    reentry = new AbortController();
    void currentHandler(event, reentry.signal);
  };
  handle.addEventListener("insert", (event) => {
    currentNode = event.node;
    currentNode.addEventListener(currentType, stableHandler, currentCapture);
  });
  handle.addEventListener("remove", () => {
    currentNode?.removeEventListener(currentType, stableHandler, currentCapture);
    currentNode = null;
    reentry?.abort(new DOMException("", "AbortError"));
  });
  return (type, handler, captureBoolean = false) => {
    let previousType = currentType;
    let previousCapture = currentCapture;
    let needsRebind = currentType !== type || currentCapture !== captureBoolean;
    currentType = type;
    currentHandler = handler;
    currentCapture = captureBoolean;
    if (needsRebind && currentNode) {
      currentNode.removeEventListener(previousType, stableHandler, previousCapture);
      currentNode.addEventListener(type, stableHandler, captureBoolean);
    }
    return handle.element;
  };
};
var onMixin = createMixin(onMixinType);
function isOnMixinDescriptor(descriptor) {
  if (!descriptor || typeof descriptor !== "object")
    return false;
  let candidate = descriptor;
  return candidate.type === onMixinType && Array.isArray(candidate.args);
}
function on(type, handler, captureBoolean) {
  return onMixin(type, handler, captureBoolean);
}

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/reconcile.js
var SVG_NS2 = "http://www.w3.org/2000/svg";
var idCounter = 0;
var persistedRemovalToken = 0;
var persistedMixinNodes = /* @__PURE__ */ new Set();
var activeSchedulerUpdateParents;
function getSvgContext(vParent, nodeType) {
  if (typeof nodeType === "string") {
    if (nodeType === "svg")
      return true;
    if (nodeType === "foreignObject")
      return false;
  }
  return vParent._svg ?? false;
}
function getHostProps(node) {
  return node._mixedProps ?? node.props;
}
function markNodePersistedByMixins(node, domParent, token) {
  node._persistedByMixins = true;
  node._persistedParentByMixins = domParent;
  node._persistedRemovalToken = token;
  persistedMixinNodes.add(node);
  bindMixinRuntime(node._mixState, void 0);
}
function unmarkNodePersistedByMixins(node) {
  node._persistedByMixins = false;
  node._persistedParentByMixins = void 0;
  node._persistedRemovalToken = void 0;
  persistedMixinNodes.delete(node);
}
function findMatchingPersistedMixinNode(type, key, domParent) {
  if (key == null)
    return null;
  for (let node of persistedMixinNodes) {
    if (node._persistedParentByMixins !== domParent)
      continue;
    if (node.type !== type)
      continue;
    if (node.key !== key)
      continue;
    return node;
  }
  return null;
}
var EMPTY_DIRECT_EVENT_DESCRIPTORS = [];
function shouldRestoreControlledReflectionOnInput(node, state) {
  if (state.hasControlledChecked)
    return false;
  if (node.type === "select")
    return false;
  return true;
}
function ensureControlledReflection(node, scheduler) {
  let existing = node._controlledState;
  if (existing)
    return existing;
  let state = {
    disposed: false,
    listenersAttached: false,
    pendingRestoreVersion: 0,
    managesValue: false,
    managesChecked: false,
    hasControlledValue: false,
    controlledValue: void 0,
    hasControlledChecked: false,
    controlledChecked: void 0,
    onInput: () => {
      if (!shouldRestoreControlledReflectionOnInput(node, state))
        return;
      scheduleControlledRestore(node, state);
    },
    onChange: () => {
      scheduleControlledRestore(node, state);
    }
  };
  node._controlledState = state;
  scheduler.enqueueTasks([
    () => {
      if (state.disposed)
        return;
      node._dom.addEventListener("input", state.onInput);
      node._dom.addEventListener("change", state.onChange);
      state.listenersAttached = true;
    }
  ]);
  return state;
}
function syncControlledReflection(node, props) {
  let state = node._controlledState;
  if (!state || state.disposed)
    return;
  state.managesValue = canManageValue(node.type, node._dom);
  state.managesChecked = canReflectProperty(node._dom, "checked");
  state.hasControlledValue = state.managesValue && hasControlledValueProp(props);
  state.controlledValue = props.value;
  state.hasControlledChecked = state.managesChecked && hasControlledCheckedProp(props);
  state.controlledChecked = props.checked;
  state.pendingRestoreVersion++;
}
function shouldTrackControlledReflection(props) {
  return hasControlledValueProp(props) || hasControlledCheckedProp(props);
}
function scheduleControlledRestore(node, state) {
  if (state.disposed)
    return;
  let version = ++state.pendingRestoreVersion;
  queueMicrotask(() => {
    if (state.disposed)
      return;
    if (state.pendingRestoreVersion !== version)
      return;
    restoreControlledReflections(node, state);
  });
}
function restoreControlledReflections(node, state) {
  let element = node._dom;
  if (state.hasControlledValue && readDomProp(element, "value") !== state.controlledValue) {
    setPropertyReflection(element, "value", state.controlledValue);
  }
  if (state.hasControlledChecked && readDomProp(element, "checked") !== state.controlledChecked) {
    setPropertyReflection(element, "checked", state.controlledChecked);
  }
}
function teardownControlledReflection(node) {
  let state = node._controlledState;
  if (!state)
    return;
  state.disposed = true;
  state.pendingRestoreVersion++;
  if (state.listenersAttached) {
    node._dom.removeEventListener("input", state.onInput);
    node._dom.removeEventListener("change", state.onChange);
    state.listenersAttached = false;
  }
}
function canManageValue(type, element) {
  if (type === "progress")
    return false;
  return canReflectProperty(element, "value");
}
function hasControlledValueProp(props) {
  return "value" in props && props.value !== void 0;
}
function hasControlledCheckedProp(props) {
  return "checked" in props && props.checked !== void 0;
}
function canReflectProperty(element, key) {
  return key in element && !key.includes("-");
}
function readDomProp(element, key) {
  if (!canReflectProperty(element, key))
    return void 0;
  return element[key];
}
function setPropertyReflection(element, key, value) {
  if (!canReflectProperty(element, key))
    return;
  element[key] = value == null ? "" : value;
}
function resolveNodeMixProps(node, frame, scheduler, state) {
  let mix = node.props.mix;
  let directEventDescriptors = resolveDirectEventDescriptors(mix);
  if (directEventDescriptors) {
    if (state) {
      teardownMixins(state);
    }
    node._mixState = void 0;
    node._mixedProps = node.props;
    node._directEventDescriptors = directEventDescriptors;
    return node.props;
  }
  node._directEventDescriptors = void 0;
  if (state == null && (mix == null || Array.isArray(mix) && mix.length === 0)) {
    node._mixState = void 0;
    node._mixedProps = node.props;
    return node.props;
  }
  let resolved = resolveMixedProps({
    hostType: node.type,
    frame,
    scheduler,
    getContext: (type) => {
      if (typeof type !== "function") {
        return void 0;
      }
      return findContextFromAncestry(node, type);
    },
    props: node.props,
    state
  });
  node._mixState = resolved.state;
  node._mixedProps = resolved.props;
  return resolved.props;
}
function resolveDirectEventDescriptors(mix) {
  if (!mix)
    return EMPTY_DIRECT_EVENT_DESCRIPTORS;
  if (!Array.isArray(mix)) {
    return isOnMixinDescriptor(mix) ? [mix] : null;
  }
  return areOnMixinDescriptors(mix) ? mix : null;
}
function areOnMixinDescriptors(descriptors) {
  for (let item of descriptors) {
    if (!isOnMixinDescriptor(item))
      return false;
  }
  return true;
}
function enqueueMixinBindingUpdate(done) {
  let node = this.target;
  let state = node._mixState;
  this.scheduler.enqueueWork([
    () => {
      if (state?.aborted) {
        done(getMixinRuntimeSignal(state));
        return;
      }
      dispatchMixinBeforeUpdate(state);
      let prevProps = getHostProps(node);
      let nextProps = resolveNodeMixProps(node, this.frame, this.scheduler, state);
      patchHostProps(prevProps, nextProps, this.node);
      if (node._controlledState || shouldTrackControlledReflection(nextProps)) {
        ensureControlledReflection(node, this.scheduler);
        syncControlledReflection(node, nextProps);
      }
      dispatchMixinCommit(state);
      done(state ? getMixinRuntimeSignal(state) : AbortSignal.abort());
    }
  ]);
}
function bindNodeMixRuntime(node, frame, scheduler, styles, reclaimed = false, parent) {
  let state = node._mixState;
  bindMixinRuntime(state, {
    node: node._dom,
    parent: parent ?? node._dom.parentNode,
    key: node.key,
    target: node,
    frame,
    scheduler,
    enqueueUpdate: enqueueMixinBindingUpdate
  }, { dispatchReclaimed: reclaimed });
}
function isHeadHostNode(node) {
  if (node.type === "head")
    return true;
  if (node.type.length !== 4)
    return false;
  return node.type.toLowerCase() === "head";
}
function getDocumentHead(domParent) {
  if (domParent instanceof Document) {
    return domParent.head;
  }
  if (domParent instanceof Node) {
    return domParent.ownerDocument?.head ?? null;
  }
  return null;
}
function diffVNodes(curr, next, domParent, frame, scheduler, styles, vParent, rootTarget, anchor, rootCursor) {
  next._parent = vParent;
  next._svg = getSvgContext(vParent, next.type);
  if (curr === null) {
    return insert(next, domParent, frame, scheduler, styles, vParent, rootTarget, anchor, rootCursor);
  }
  if (curr.type !== next.type) {
    replace(curr, next, domParent, frame, scheduler, styles, vParent, rootTarget, anchor);
    return rootCursor;
  }
  if (isNonRenderNode(curr) && isNonRenderNode(next)) {
    return rootCursor;
  }
  if (isCommittedTextNode(curr) && isTextNode(next)) {
    diffText(curr, next, vParent);
    return rootCursor;
  }
  if (isCommittedHostNode(curr) && isHostNode(next)) {
    diffHost(curr, next, frame, scheduler, styles, vParent, rootTarget);
    return rootCursor;
  }
  if (isCommittedComponentNode(curr) && isComponentNode(next)) {
    diffComponent(curr, next, frame, scheduler, styles, domParent, vParent, rootTarget);
    return rootCursor;
  }
  if (isFragmentNode(curr) && isFragmentNode(next)) {
    diffChildren(curr._children, next._children, domParent, frame, scheduler, styles, next, rootTarget, void 0, anchor);
    return rootCursor;
  }
  if (curr.type === Frame && next.type === Frame) {
    diffFrame(curr, next, domParent, frame, scheduler, styles, vParent, rootTarget, anchor);
    return rootCursor;
  }
  invariant(false, "Unexpected diff case");
}
function replace(curr, next, domParent, frame, scheduler, styles, vParent, rootTarget, anchor) {
  let currAnchor = findFirstDomAnchor(curr);
  if (currAnchor && currAnchor.parentNode === domParent) {
    let replacementAnchor2 = document.createComment("rmx:replace");
    domParent.insertBefore(replacementAnchor2, currAnchor);
    try {
      remove(curr, domParent, scheduler, styles);
      insert(next, domParent, frame, scheduler, styles, vParent, rootTarget, replacementAnchor2);
    } finally {
      replacementAnchor2.parentNode?.removeChild(replacementAnchor2);
    }
    return;
  }
  let replacementAnchor = findNextSiblingDomAnchor(curr) ?? anchor;
  remove(curr, domParent, scheduler, styles);
  insert(next, domParent, frame, scheduler, styles, vParent, rootTarget, replacementAnchor);
}
function diffHost(curr, next, frame, scheduler, styles, vParent, rootTarget) {
  let mixState = curr._mixState;
  let currProps = getHostProps(curr);
  let nextProps = resolveNodeMixProps(next, frame, scheduler, mixState);
  let nextMixState = next._mixState;
  let shouldDispatchMixinLifecycle = (nextMixState?.runners.length ?? 0) > 0 && shouldDispatchInlineMixinLifecycle(curr._dom);
  if (shouldDispatchMixinLifecycle) {
    dispatchMixinBeforeUpdate(nextMixState);
  }
  if (nextProps.innerHTML != null) {
    if (currProps.innerHTML !== nextProps.innerHTML) {
      curr._dom.innerHTML = nextProps.innerHTML;
    }
  } else if (currProps.innerHTML != null) {
    curr._dom.innerHTML = "";
  }
  diffChildren(curr._children, next._children, curr._dom, frame, scheduler, styles, next, rootTarget);
  patchHostProps(currProps, nextProps, curr._dom);
  next._dom = curr._dom;
  next._parent = vParent;
  next._controller = curr._controller;
  next._directEventState = curr._directEventState;
  next._controlledState = curr._controlledState;
  syncDirectEventListeners(next);
  if (next._controlledState || shouldTrackControlledReflection(nextProps)) {
    ensureControlledReflection(next, scheduler);
    syncControlledReflection(next, nextProps);
  }
  if (next._mixState) {
    bindNodeMixRuntime(next, frame, scheduler, styles);
  }
  if (shouldDispatchMixinLifecycle) {
    scheduler.enqueueCommitPhase([() => dispatchMixinCommit(nextMixState)]);
  }
  return;
}
function setupHostNode(node, dom, scheduler) {
  node._dom = dom;
  let props = getHostProps(node);
  let committedNode = node;
  syncDirectEventListeners(committedNode);
  if (shouldTrackControlledReflection(props)) {
    ensureControlledReflection(committedNode, scheduler);
    syncControlledReflection(committedNode, props);
  }
}
function syncDirectEventListeners(node) {
  let descriptors = node._directEventDescriptors;
  if (!descriptors) {
    teardownDirectEventListeners(node);
    return;
  }
  if (descriptors.length === 0) {
    teardownDirectEventListeners(node);
    return;
  }
  let state = node._directEventState;
  if (!state) {
    state = { bindings: [] };
    node._directEventState = state;
  }
  let bindings = state.bindings;
  for (let index = 0; index < descriptors.length; index++) {
    let descriptor = descriptors[index];
    let [type, handler, captureBoolean = false] = descriptor.args;
    let binding = bindings[index];
    if (!binding) {
      binding = createDirectEventBinding(type, handler, captureBoolean);
      bindings[index] = binding;
      attachDirectEventBinding(node._dom, binding);
      continue;
    }
    if (binding.type !== type || binding.capture !== captureBoolean) {
      removeDirectEventBinding(node._dom, binding);
      binding.type = type;
      binding.capture = captureBoolean;
      attachDirectEventBinding(node._dom, binding);
    }
    binding.handler = handler;
  }
  for (let index = descriptors.length; index < bindings.length; index++) {
    removeDirectEventBinding(node._dom, bindings[index]);
  }
  bindings.length = descriptors.length;
}
function createDirectEventBinding(type, handler, capture) {
  let binding = {
    type,
    handler,
    capture,
    reentry: null,
    stableHandler: null
  };
  return binding;
}
function getStableDirectEventHandler(binding) {
  if (binding.stableHandler)
    return binding.stableHandler;
  binding.stableHandler = (event) => {
    invokeDirectEventBinding(binding, event);
  };
  return binding.stableHandler;
}
function attachDirectEventBinding(dom, binding) {
  dom.addEventListener(binding.type, getStableDirectEventHandler(binding), binding.capture);
}
function removeDirectEventBinding(dom, binding) {
  if (binding.stableHandler) {
    dom.removeEventListener(binding.type, binding.stableHandler, binding.capture);
  }
  binding.reentry?.abort(new DOMException("", "AbortError"));
  binding.reentry = null;
}
function teardownDirectEventListeners(node) {
  let state = node._directEventState;
  if (!state)
    return;
  for (let binding of state.bindings) {
    removeDirectEventBinding(node._dom, binding);
  }
  state.bindings.length = 0;
  node._directEventState = void 0;
}
function invokeDirectEventBinding(binding, event) {
  binding.reentry?.abort(new DOMException("", "EventReentry"));
  binding.reentry = new AbortController();
  void binding.handler(event, binding.reentry.signal);
}
function diffText(curr, next, vParent) {
  if (curr._text !== next._text) {
    curr._dom.textContent = next._text;
  }
  next._dom = curr._dom;
  next._parent = vParent;
}
function insert(node, domParent, frame, scheduler, styles, vParent, rootTarget, anchor, cursor) {
  node._parent = vParent;
  node._svg = getSvgContext(vParent, node.type);
  if (cursor && anchor && cursor === anchor) {
    cursor = null;
  }
  cursor = skipCommentsExceptFrameStart(cursor ?? null);
  if (cursor && anchor && cursor === anchor) {
    cursor = null;
  }
  let doInsert = anchor ? (dom) => domParent.insertBefore(dom, anchor) : (dom) => domParent.appendChild(dom);
  if (isNonRenderNode(node)) {
    return cursor;
  }
  if (isTextNode(node)) {
    if (cursor instanceof Text) {
      node._parent = vParent;
      if (cursor.data !== node._text) {
        if (cursor.data.startsWith(node._text) && node._text.length < cursor.data.length) {
          let remainder = cursor.splitText(node._text.length);
          node._dom = cursor;
          return remainder;
        }
        logHydrationMismatch("text mismatch", cursor.data, node._text);
        cursor.data = node._text;
      }
      node._dom = cursor;
      return cursor.nextSibling;
    }
    let dom = document.createTextNode(node._text);
    node._dom = dom;
    node._parent = vParent;
    doInsert(dom);
    return cursor;
  }
  if (isHostNode(node)) {
    let hostProps = resolveNodeMixProps(node, frame, scheduler);
    if (isHeadHostNode(node)) {
      let targetHead = getDocumentHead(domParent);
      if (targetHead) {
        let childCursor = cursor;
        if (cursor instanceof Element && cursor.tagName.toLowerCase() === "head") {
          childCursor = cursor.firstChild;
          let nextCursor = cursor.nextSibling;
          if (cursor !== targetHead) {
            while (cursor.firstChild) {
              targetHead.appendChild(cursor.firstChild);
            }
            cursor.remove();
          }
          cursor = nextCursor;
        }
        diffChildren(null, node._children, targetHead, frame, scheduler, styles, node, rootTarget, childCursor);
        patchHostProps({}, hostProps, targetHead);
        setupHostNode(node, targetHead, scheduler);
        if (node._mixState) {
          bindNodeMixRuntime(node, frame, scheduler, styles);
        }
        return cursor;
      }
    }
    let persistedNode = findMatchingPersistedMixinNode(node.type, node.key, domParent);
    if (persistedNode) {
      reclaimPersistedMixinNode(persistedNode, node, frame, scheduler, styles, vParent, rootTarget);
      return cursor;
    }
    if (cursor instanceof Element) {
      let cursorTag = node._svg ? cursor.tagName : cursor.tagName.toLowerCase();
      if (cursorTag === node.type) {
        let nextCursor = cursor.nextSibling;
        patchHostProps({}, hostProps, cursor);
        if (hostProps.innerHTML != null) {
          cursor.innerHTML = hostProps.innerHTML;
        } else {
          let childCursor = cursor.firstChild;
          diffChildren(null, node._children, cursor, frame, scheduler, styles, node, rootTarget, childCursor);
        }
        setupHostNode(node, cursor, scheduler);
        if (node._mixState) {
          bindNodeMixRuntime(node, frame, scheduler, styles);
        }
        return nextCursor;
      } else {
        let nextSibling = skipComments(cursor.nextSibling);
        if (nextSibling instanceof Element) {
          let nextTag = node._svg ? nextSibling.tagName : nextSibling.tagName.toLowerCase();
          if (nextTag === node.type) {
            let nextCursor = nextSibling.nextSibling;
            patchHostProps({}, hostProps, nextSibling);
            if (hostProps.innerHTML != null) {
              nextSibling.innerHTML = hostProps.innerHTML;
            } else {
              let childCursor = nextSibling.firstChild;
              diffChildren(null, node._children, nextSibling, frame, scheduler, styles, node, rootTarget, childCursor);
            }
            setupHostNode(node, nextSibling, scheduler);
            if (node._mixState) {
              bindNodeMixRuntime(node, frame, scheduler, styles);
            }
            return nextCursor;
          }
        }
        logHydrationMismatch("tag", cursorTag, node.type);
        cursor = void 0;
      }
    }
    let dom = node._svg ? document.createElementNS(SVG_NS2, node.type) : document.createElement(node.type);
    patchHostProps({}, hostProps, dom);
    if (hostProps.innerHTML != null) {
      dom.innerHTML = hostProps.innerHTML;
    } else {
      diffChildren(null, node._children, dom, frame, scheduler, styles, node, rootTarget);
    }
    setupHostNode(node, dom, scheduler);
    if (node._mixState) {
      bindNodeMixRuntime(node, frame, scheduler, styles, false, domParent);
    }
    doInsert(dom);
    return cursor;
  }
  if (isFragmentNode(node)) {
    for (let child of node._children) {
      cursor = insert(child, domParent, frame, scheduler, styles, node, rootTarget, anchor, cursor);
    }
    return cursor;
  }
  if (isComponentNode(node)) {
    return diffComponent(null, node, frame, scheduler, styles, domParent, vParent, rootTarget, anchor, cursor);
  }
  if (node.type === Frame) {
    return insertFrame(node, domParent, frame, scheduler, styles, vParent, rootTarget, anchor, cursor);
  }
  invariant(false, "Unexpected node type");
}
function diffFrame(curr, next, domParent, frame, scheduler, styles, vParent, rootTarget, anchor) {
  let currSrc = getFrameSrc(curr);
  let nextSrc = getFrameSrc(next);
  let currName = getFrameName(curr);
  let nextName = getFrameName(next);
  if (currName !== nextName) {
    let replaceAnchor = curr._rangeEnd?.nextSibling ?? anchor;
    remove(curr, domParent, scheduler, styles);
    insert(next, domParent, frame, scheduler, styles, vParent, rootTarget, replaceAnchor);
    return;
  }
  if (currSrc !== nextSrc && !curr._frameResolved) {
    let replaceAnchor = curr._rangeEnd?.nextSibling ?? anchor;
    remove(curr, domParent, scheduler, styles);
    insert(next, domParent, frame, scheduler, styles, vParent, rootTarget, replaceAnchor);
    return;
  }
  next._rangeStart = curr._rangeStart;
  next._rangeEnd = curr._rangeEnd;
  next._frameInstance = curr._frameInstance;
  next._frameFallbackRoot = curr._frameFallbackRoot;
  next._frameResolveToken = curr._frameResolveToken;
  next._frameResolved = curr._frameResolved;
  next._parent = vParent;
  if (currSrc !== nextSrc) {
    let frameInstance = next._frameInstance;
    if (frameInstance) {
      frameInstance.handle.src = nextSrc;
    }
    let runtime = getFrameRuntime(frame);
    if (runtime) {
      resolveClientFrame(next, runtime);
    }
  }
  if (!next._frameResolved && next._frameFallbackRoot) {
    next._frameFallbackRoot.render(next.props?.fallback ?? null);
  }
}
function insertFrame(node, domParent, frame, scheduler, styles, vParent, rootTarget, anchor, cursor) {
  let runtime = getFrameRuntime(frame);
  if (!runtime || runtime.canResolveFrames === false) {
    throw new Error("Cannot render <Frame /> without frame runtime. Use run() or pass frameInit to createRoot/createRangeRoot.");
  }
  if (isFrameStartComment(cursor)) {
    let start2 = cursor;
    let end2 = findFrameEndComment(start2);
    if (end2) {
      node._rangeStart = start2;
      node._rangeEnd = end2;
      node._parent = vParent;
      node._frameResolveToken = 0;
      node._frameResolveController = void 0;
      node._frameFallbackRoot = void 0;
      node._frameResolved = true;
      let frameId = getFrameIdFromComment(start2);
      let marker = frameId ? runtime.data.f?.[frameId] : void 0;
      let src = marker?.src ?? getFrameSrc(node);
      let instance2 = runtime.frameInstances.get(start2);
      if (!instance2) {
        instance2 = createFrame([start2, end2], {
          name: getFrameName(node),
          src,
          marker: frameId && marker ? { ...marker, id: frameId } : void 0,
          errorTarget: runtime.errorTarget,
          loadModule: runtime.loadModule,
          resolveFrame: runtime.resolveFrame,
          pendingClientEntries: runtime.pendingClientEntries,
          scheduler: runtime.scheduler,
          data: runtime.data,
          moduleCache: runtime.moduleCache,
          moduleLoads: runtime.moduleLoads,
          frameInstances: runtime.frameInstances,
          namedFrames: runtime.namedFrames
        });
        runtime.frameInstances.set(start2, instance2);
      }
      node._frameInstance = instance2;
      return end2.nextSibling;
    }
  }
  let start = document.createComment(` rmx:f:${randomFrameId()} `);
  let end = document.createComment(" /rmx:f ");
  let doInsert = anchor ? (dom) => domParent.insertBefore(dom, anchor) : (dom) => domParent.appendChild(dom);
  doInsert(start);
  doInsert(end);
  node._rangeStart = start;
  node._rangeEnd = end;
  node._parent = vParent;
  let fallbackRoot = createRangeRoot([start, end], {
    frame,
    styleManager: styles
  });
  fallbackRoot.render(node.props?.fallback ?? null);
  node._frameFallbackRoot = fallbackRoot;
  node._frameResolved = false;
  node._frameResolveToken = 0;
  let instance = createFrame([start, end], {
    name: getFrameName(node),
    src: getFrameSrc(node),
    errorTarget: runtime.errorTarget,
    loadModule: runtime.loadModule,
    resolveFrame: runtime.resolveFrame,
    pendingClientEntries: runtime.pendingClientEntries,
    scheduler: runtime.scheduler,
    data: runtime.data,
    moduleCache: runtime.moduleCache,
    moduleLoads: runtime.moduleLoads,
    frameInstances: runtime.frameInstances,
    namedFrames: runtime.namedFrames
  });
  node._frameInstance = instance;
  runtime.frameInstances.set(start, instance);
  resolveClientFrame(node, runtime);
  return cursor;
}
function resolveClientFrame(node, runtime) {
  let frameSrc = getFrameSrc(node);
  let instance = node._frameInstance;
  if (!instance)
    return;
  let token = (node._frameResolveToken ?? 0) + 1;
  node._frameResolveToken = token;
  node._frameResolveController?.abort();
  let resolveController = new AbortController();
  node._frameResolveController = resolveController;
  Promise.resolve(runtime.resolveFrame(frameSrc, resolveController.signal, getFrameName(node))).then(async (content) => {
    if (node._frameResolveToken !== token || resolveController.signal.aborted)
      return;
    node._frameFallbackRoot?.dispose();
    node._frameFallbackRoot = void 0;
    let nextContent = asAbortableFrameContent(content, resolveController.signal);
    await instance.render(nextContent, { signal: resolveController.signal });
    if (node._frameResolveToken !== token || resolveController.signal.aborted)
      return;
    node._frameResolved = true;
  }).catch(() => {
  }).finally(() => {
    if (node._frameResolveController === resolveController) {
      node._frameResolveController = void 0;
    }
  });
}
function disposeFrameResources(node) {
  node._frameResolveToken = (node._frameResolveToken ?? 0) + 1;
  node._frameResolveController?.abort();
  node._frameResolveController = void 0;
  node._frameFallbackRoot?.dispose();
  node._frameFallbackRoot = void 0;
  let frameInstance = node._frameInstance;
  if (frameInstance) {
    frameInstance.dispose();
    node._frameInstance = void 0;
  }
}
function asAbortableFrameContent(content, signal) {
  if (!(content instanceof ReadableStream))
    return content;
  return createAbortableReadableStream(content, signal);
}
function createAbortableReadableStream(source, signal) {
  let reader = source.getReader();
  let aborted = false;
  let onAbort = () => {
    aborted = true;
    void reader.cancel(signal.reason);
  };
  if (signal.aborted)
    onAbort();
  else
    signal.addEventListener("abort", onAbort, { once: true });
  return new ReadableStream({
    async pull(controller) {
      if (aborted) {
        controller.close();
        return;
      }
      let removeAbortReadListener;
      let abortRead = new Promise((resolve) => {
        if (signal.aborted) {
          resolve({ done: true, value: void 0 });
          return;
        }
        let onAbortRead = () => {
          resolve({ done: true, value: void 0 });
        };
        removeAbortReadListener = () => signal.removeEventListener("abort", onAbortRead);
        signal.addEventListener("abort", onAbortRead, { once: true });
      });
      let { done, value } = await Promise.race([reader.read(), abortRead]);
      removeAbortReadListener?.();
      if (done) {
        controller.close();
        return;
      }
      controller.enqueue(value);
    },
    cancel(reason) {
      signal.removeEventListener("abort", onAbort);
      return reader.cancel(reason);
    }
  });
}
function removeFrameDomRange(node, domParent) {
  let start = node._rangeStart;
  let end = node._rangeEnd;
  if (!(start instanceof Comment) || !(end instanceof Comment))
    return;
  let cursor = start;
  while (cursor) {
    let nextSibling = cursor.nextSibling;
    if (cursor.parentNode === domParent) {
      domParent.removeChild(cursor);
    }
    if (cursor === end)
      break;
    cursor = nextSibling;
  }
  node._rangeStart = void 0;
  node._rangeEnd = void 0;
}
function getFrameRuntime(frame) {
  return frame.$runtime;
}
function getFrameSrc(node) {
  let src = node.props?.src;
  invariant(typeof src === "string" && src.length > 0, "<Frame /> requires a src prop");
  return src;
}
function getFrameName(node) {
  let name = node.props?.name;
  return typeof name === "string" && name.length > 0 ? name : void 0;
}
function randomFrameId() {
  return `f${crypto.randomUUID().slice(0, 8)}`;
}
function skipCommentsExceptFrameStart(cursor) {
  while (cursor && cursor.nodeType === Node.COMMENT_NODE) {
    if (isFrameStartComment(cursor))
      return cursor;
    cursor = cursor.nextSibling;
  }
  return cursor;
}
function isFrameStartComment(node) {
  return node instanceof Comment && node.data.trim().startsWith("rmx:f:");
}
function isFrameEndComment(node) {
  return node instanceof Comment && node.data.trim() === "/rmx:f";
}
function getFrameIdFromComment(comment) {
  let text = comment.data.trim();
  if (!text.startsWith("rmx:f:"))
    return void 0;
  return text.slice("rmx:f:".length);
}
function findFrameEndComment(start) {
  let depth = 1;
  let node = start.nextSibling;
  while (node) {
    if (isFrameStartComment(node))
      depth++;
    else if (isFrameEndComment(node)) {
      depth--;
      if (depth === 0)
        return node;
    }
    node = node.nextSibling;
  }
  return null;
}
function renderComponent(handle, currContent, next, domParent, frame, scheduler, styles, rootTarget, vParent, anchor, cursor) {
  if (handle.isRemoved())
    return cursor;
  let [element, tasks] = handle.render(next.props);
  let content = toVNode(element);
  let newCursor = diffVNodes(currContent, content, domParent, frame, scheduler, styles, next, rootTarget, anchor, cursor);
  next._content = content;
  next._handle = handle;
  next._parent = vParent;
  let committed = next;
  handle.setScheduleUpdate(() => {
    scheduler.enqueue(committed, domParent);
  });
  scheduler.enqueueTasks(tasks);
  return newCursor;
}
function diffComponent(curr, next, frame, scheduler, styles, domParent, vParent, rootTarget, anchor, cursor) {
  if (curr === null) {
    let componentId = vParent._pendingHydrationComponentId;
    if (componentId) {
      vParent._pendingHydrationComponentId = void 0;
    } else {
      componentId = `c${++idCounter}`;
    }
    next._handle = createComponent({
      id: componentId,
      frame,
      type: next.type,
      getContext: (type) => findContextFromAncestry(vParent, type),
      getFrameByName(name) {
        let runtime = getFrameRuntime(frame);
        return runtime?.namedFrames.get(name);
      },
      getTopFrame() {
        let runtime = getFrameRuntime(frame);
        return runtime?.topFrame;
      }
    });
    return renderComponent(next._handle, null, next, domParent, frame, scheduler, styles, rootTarget, vParent, anchor, cursor);
  }
  next._handle = curr._handle;
  let { _content, _handle } = curr;
  return renderComponent(_handle, _content, next, domParent, frame, scheduler, styles, rootTarget, vParent, anchor, cursor);
}
function cleanupDescendants(node, scheduler, styles) {
  if (isCommittedTextNode(node)) {
    return;
  }
  if (isCommittedHostNode(node)) {
    for (let child of node._children) {
      cleanupDescendants(child, scheduler, styles);
    }
    teardownMixins(node._mixState);
    teardownDirectEventListeners(node);
    teardownControlledReflection(node);
    if (node._controller)
      node._controller.abort();
    return;
  }
  if (isFragmentNode(node)) {
    for (let child of node._children) {
      cleanupDescendants(child, scheduler, styles);
    }
    return;
  }
  if (isCommittedComponentNode(node)) {
    cleanupDescendants(node._content, scheduler, styles);
    let tasks = node._handle.remove();
    scheduler.enqueueTasks(tasks);
    return;
  }
  if (node.type === Frame) {
    disposeFrameResources(node);
    return;
  }
}
function remove(node, domParent, scheduler, styles) {
  if (isCommittedTextNode(node)) {
    node._dom.parentNode?.removeChild(node._dom);
    return;
  }
  if (isCommittedHostNode(node)) {
    if (node._persistedByMixins)
      return;
    let persistedRemoval = prepareMixinRemoval(node._mixState);
    if (persistedRemoval) {
      let token = ++persistedRemovalToken;
      markNodePersistedByMixins(node, domParent, token);
      void persistedRemoval.catch(() => {
      }).finally(() => {
        if (!node._persistedByMixins)
          return;
        if (node._persistedRemovalToken !== token)
          return;
        unmarkNodePersistedByMixins(node);
        performHostNodeRemoval(node, domParent, scheduler, styles);
      });
      return;
    }
    performHostNodeRemoval(node, domParent, scheduler, styles);
    return;
  }
  if (isFragmentNode(node)) {
    for (let child of node._children) {
      remove(child, domParent, scheduler, styles);
    }
    return;
  }
  if (isCommittedComponentNode(node)) {
    remove(node._content, domParent, scheduler, styles);
    let tasks = node._handle.remove();
    scheduler.enqueueTasks(tasks);
    return;
  }
  if (node.type === Frame) {
    disposeFrameResources(node);
    removeFrameDomRange(node, domParent);
    return;
  }
}
function performHostNodeRemoval(node, domParent, scheduler, styles) {
  if (isHeadHostNode(node)) {
    for (let child of node._children) {
      remove(child, node._dom, scheduler, styles);
    }
  } else {
    for (let child of node._children) {
      cleanupDescendants(child, scheduler, styles);
    }
  }
  teardownMixins(node._mixState);
  teardownDirectEventListeners(node);
  teardownControlledReflection(node);
  if (!isHeadHostNode(node)) {
    node._dom.parentNode?.removeChild(node._dom);
  }
  if (node._controller)
    node._controller.abort();
}
function diffChildren(curr, next, domParent, frame, scheduler, styles, vParent, rootTarget, cursor, anchor) {
  let hasKeys = hasKeyedChildren(next);
  if (curr === null) {
    if (hasKeys) {
      warnDuplicateKeys(next);
    }
    for (let node of next) {
      cursor = insert(node, domParent, frame, scheduler, styles, vParent, rootTarget, anchor, cursor);
    }
    vParent._children = next;
    return cursor;
  }
  if (next.length === 0 && anchor === void 0 && !parentUsesInnerHTML(vParent) && canBulkClearChildren(curr)) {
    for (let node of curr) {
      cleanupDescendants(node, scheduler, styles);
    }
    domParent.textContent = "";
    vParent._children = next;
    return;
  }
  if (!hasKeys) {
    for (let i = 0; i < next.length; i++) {
      let currentNode = i < curr.length ? curr[i] : null;
      diffVNodes(currentNode, next[i], domParent, frame, scheduler, styles, vParent, rootTarget, anchor, cursor);
    }
    if (curr.length > next.length) {
      for (let i = next.length; i < curr.length; i++) {
        let node = curr[i];
        if (node)
          remove(node, domParent, scheduler, styles);
      }
    }
    vParent._children = next;
    return;
  }
  patchKeyedChildren(curr, next, domParent, frame, scheduler, styles, vParent, rootTarget, cursor, anchor);
  return;
}
function parentUsesInnerHTML(parent) {
  return isHostNode(parent) && getHostProps(parent).innerHTML != null;
}
function canBulkClearChildren(children) {
  for (let child of children) {
    if (!canBulkClearNode(child))
      return false;
  }
  return true;
}
function canBulkClearNode(node) {
  if (isCommittedTextNode(node))
    return true;
  if (isCommittedHostNode(node)) {
    if (node._mixState)
      return false;
    for (let child of node._children) {
      if (!canBulkClearNode(child))
        return false;
    }
    return true;
  }
  if (isFragmentNode(node)) {
    return canBulkClearChildren(node._children);
  }
  if (isCommittedComponentNode(node)) {
    return canBulkClearNode(node._content);
  }
  return false;
}
function hasKeyedChildren(children) {
  for (let node of children) {
    if (node.key != null)
      return true;
  }
  return false;
}
function warnDuplicateKeys(children) {
  let seenKeys;
  let duplicateKeys;
  for (let node of children) {
    if (node.key == null)
      continue;
    if (!seenKeys) {
      seenKeys = /* @__PURE__ */ new Set([node.key]);
      continue;
    }
    if (seenKeys.has(node.key)) {
      duplicateKeys ??= /* @__PURE__ */ new Set();
      duplicateKeys.add(node.key);
    } else {
      seenKeys.add(node.key);
    }
  }
  if (duplicateKeys?.size) {
    let quotedKeys = Array.from(duplicateKeys, (key) => `"${key}"`);
    console.warn(`Duplicate keys detected in siblings: ${quotedKeys.join(", ")}. Keys should be unique.`);
  }
}
function patchKeyedChildren(curr, next, domParent, frame, scheduler, styles, vParent, rootTarget, cursor, anchor) {
  let matches = matchKeyedChildrenInOrder(curr, next) ?? matchKeyedChildrenAfterSingleRemoval(curr, next) ?? matchKeyedChildrenAfterPairSwap(curr, next);
  if (!matches) {
    warnDuplicateKeys(next);
    matches = matchKeyedChildren(curr, next);
  }
  let matchAnalysis = analyzeKeyedChildMatches(curr.length, matches);
  if (matchAnalysis.hasRemovals) {
    let usedOldIndexes = new Uint8Array(curr.length);
    for (let match of matches) {
      if (match.oldIndex >= 0) {
        usedOldIndexes[match.oldIndex] = 1;
      }
    }
    for (let oldIndex = 0; oldIndex < curr.length; oldIndex++) {
      if (usedOldIndexes[oldIndex] === 0) {
        remove(curr[oldIndex], domParent, scheduler, styles);
      }
    }
  }
  vParent._children = next;
  for (let index = 0; index < next.length; index++) {
    let match = matches[index];
    let oldNode = match.oldIndex >= 0 ? curr[match.oldIndex] : null;
    diffVNodes(oldNode, next[index], domParent, frame, scheduler, styles, vParent, rootTarget, anchor, cursor);
  }
  if (matchAnalysis.canSkipPlacement) {
    return;
  }
  let stableIndexes = lisMatches(matches);
  let stableCursor = stableIndexes.length - 1;
  let placementAnchor = anchor ?? null;
  for (let index = next.length - 1; index >= 0; index--) {
    let nextNode = next[index];
    let isStable = stableIndexes[stableCursor] === index;
    if (isStable) {
      stableCursor--;
    } else {
      placeVNode(nextNode, domParent, placementAnchor);
    }
    placementAnchor = findFirstDomAnchor(nextNode) ?? placementAnchor;
  }
}
function matchKeyedChildren(curr, next) {
  let oldKeyMap = /* @__PURE__ */ new Map();
  let usedOldIndexes = /* @__PURE__ */ new Set();
  let unkeyedSearchStart = 0;
  for (let index = 0; index < curr.length; index++) {
    let key = curr[index].key;
    if (key != null)
      oldKeyMap.set(key, index);
  }
  return next.map((nextNode) => {
    let oldIndex = -1;
    if (nextNode.key != null) {
      let keyedOldIndex = oldKeyMap.get(nextNode.key);
      if (keyedOldIndex !== void 0) {
        let oldNode = curr[keyedOldIndex];
        if (!usedOldIndexes.has(keyedOldIndex) && oldNode.type === nextNode.type) {
          oldIndex = keyedOldIndex;
        }
      }
    } else {
      for (let index = unkeyedSearchStart; index < curr.length; index++) {
        let oldNode = curr[index];
        if (usedOldIndexes.has(index) || oldNode.key != null || oldNode.type !== nextNode.type) {
          continue;
        }
        oldIndex = index;
        unkeyedSearchStart = index + 1;
        break;
      }
    }
    if (oldIndex >= 0)
      usedOldIndexes.add(oldIndex);
    return { oldIndex };
  });
}
function matchKeyedChildrenInOrder(curr, next) {
  let length = Math.min(curr.length, next.length);
  let matches = [];
  for (let index = 0; index < length; index++) {
    let nextNode = next[index];
    if (nextNode.key == null)
      return null;
    let oldNode = curr[index];
    if (oldNode.key !== nextNode.key || oldNode.type !== nextNode.type) {
      return null;
    }
    matches.push({ oldIndex: index });
  }
  for (let index = length; index < next.length; index++) {
    if (next[index].key == null)
      return null;
    matches.push({ oldIndex: -1 });
  }
  return matches;
}
function matchKeyedChildrenAfterSingleRemoval(curr, next) {
  if (curr.length !== next.length + 1)
    return null;
  let matches = [];
  let oldIndex = 0;
  let skippedOldNode = false;
  for (let nextIndex = 0; nextIndex < next.length; nextIndex++) {
    let nextNode = next[nextIndex];
    if (nextNode.key == null)
      return null;
    let oldNode = curr[oldIndex];
    if (oldNode.key === nextNode.key && oldNode.type === nextNode.type) {
      matches.push({ oldIndex });
      oldIndex++;
      continue;
    }
    if (skippedOldNode)
      return null;
    skippedOldNode = true;
    oldIndex++;
    oldNode = curr[oldIndex];
    if (oldNode.key !== nextNode.key || oldNode.type !== nextNode.type) {
      return null;
    }
    matches.push({ oldIndex });
    oldIndex++;
  }
  return matches;
}
function matchKeyedChildrenAfterPairSwap(curr, next) {
  if (curr.length !== next.length)
    return null;
  let matches = [];
  let firstMismatch = -1;
  let secondMismatch = -1;
  for (let index = 0; index < next.length; index++) {
    let nextNode = next[index];
    if (nextNode.key == null)
      return null;
    let oldNode = curr[index];
    if (oldNode.key === nextNode.key && oldNode.type === nextNode.type) {
      matches.push({ oldIndex: index });
      continue;
    }
    if (firstMismatch === -1) {
      firstMismatch = index;
    } else if (secondMismatch === -1) {
      secondMismatch = index;
    } else {
      return null;
    }
    matches.push({ oldIndex: -1 });
  }
  if (firstMismatch === -1)
    return matches;
  if (secondMismatch === -1)
    return null;
  let firstOldNode = curr[firstMismatch];
  let secondOldNode = curr[secondMismatch];
  let firstNextNode = next[firstMismatch];
  let secondNextNode = next[secondMismatch];
  if (firstOldNode.key !== secondNextNode.key || firstOldNode.type !== secondNextNode.type || secondOldNode.key !== firstNextNode.key || secondOldNode.type !== firstNextNode.type) {
    return null;
  }
  matches[firstMismatch] = { oldIndex: secondMismatch };
  matches[secondMismatch] = { oldIndex: firstMismatch };
  return matches;
}
function analyzeKeyedChildMatches(currentLength, matches) {
  let hasRemovals = matches.length !== currentLength;
  let canSkipPlacement = true;
  let lastOldIndex = -1;
  let sawNewNode = false;
  for (let match of matches) {
    if (match.oldIndex < 0) {
      hasRemovals = true;
      sawNewNode = true;
      continue;
    }
    if (sawNewNode || match.oldIndex < lastOldIndex) {
      canSkipPlacement = false;
    }
    lastOldIndex = match.oldIndex;
  }
  return { hasRemovals, canSkipPlacement };
}
function lisMatches(matches) {
  let predecessors = Array.from({ length: matches.length });
  let tails = [];
  for (let index = 0; index < matches.length; index++) {
    let value = matches[index].oldIndex + 1;
    if (value === 0)
      continue;
    let low = 0;
    let high = tails.length;
    while (low < high) {
      let middle = low + high >> 1;
      if (matches[tails[middle]].oldIndex + 1 < value) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }
    predecessors[index] = low > 0 ? tails[low - 1] : -1;
    tails[low] = index;
  }
  let cursor = tails.at(-1) ?? -1;
  for (let index = tails.length - 1; index >= 0; index--) {
    tails[index] = cursor;
    cursor = predecessors[cursor] ?? -1;
  }
  return tails;
}
function placeVNode(node, domParent, anchor) {
  let firstDom = findFirstDomAnchor(node);
  if (!firstDom || firstDom.parentNode !== domParent)
    return;
  let lastDom = findLastDomAnchor(node);
  if (!lastDom)
    return;
  if (anchor && domRangeContainsNode(firstDom, lastDom, anchor))
    return;
  if (firstDom === anchor)
    return;
  moveDomRange(domParent, firstDom, lastDom, anchor);
}
function findFirstDomAnchor(node) {
  if (!node)
    return null;
  if (isCommittedTextNode(node))
    return node._dom;
  if (isCommittedHostNode(node))
    return node._dom;
  if (isCommittedComponentNode(node))
    return findFirstDomAnchor(node._content);
  if (node.type === Frame)
    return node._rangeStart ?? null;
  if (isFragmentNode(node)) {
    for (let child of node._children) {
      let dom = findFirstDomAnchor(child);
      if (dom)
        return dom;
    }
  }
  return null;
}
function findLastDomAnchor(node) {
  if (!node)
    return null;
  if (isCommittedTextNode(node))
    return node._dom;
  if (isCommittedHostNode(node))
    return node._dom;
  if (isCommittedComponentNode(node))
    return findLastDomAnchor(node._content);
  if (node.type === Frame)
    return node._rangeEnd ?? null;
  if (isFragmentNode(node)) {
    for (let i = node._children.length - 1; i >= 0; i--) {
      let dom = findLastDomAnchor(node._children[i]);
      if (dom)
        return dom;
    }
  }
  return null;
}
function domRangeContainsNode(first, last, node) {
  let current = first;
  while (current) {
    if (current === node)
      return true;
    if (current === last)
      break;
    current = current.nextSibling;
  }
  return false;
}
function moveDomRange(domParent, first, last, before) {
  let current = first;
  while (current) {
    let next = current === last ? null : current.nextSibling;
    domParent.insertBefore(current, before);
    if (current === last)
      break;
    current = next;
  }
}
function setActiveSchedulerUpdateParents(parents) {
  activeSchedulerUpdateParents = parents;
}
function shouldDispatchInlineMixinLifecycle(node) {
  let parents = activeSchedulerUpdateParents;
  if (!parents?.length)
    return true;
  for (let parent of parents) {
    let parentNode = parent;
    if (parentNode === node)
      return false;
    if (parentNode.contains(node))
      return false;
  }
  return true;
}
function findNextSiblingDomAnchor(curr) {
  let vParent = curr._parent;
  if (!vParent || !Array.isArray(vParent._children))
    return null;
  let children = vParent._children;
  if (children.length === 0)
    return findNextSiblingDomAnchor(vParent);
  let idx = children.indexOf(curr);
  if (idx === -1)
    return null;
  for (let i = idx + 1; i < children.length; i++) {
    let dom = findFirstDomAnchor(children[i]);
    if (dom)
      return dom;
  }
  if (isFragmentNode(vParent)) {
    return findNextSiblingDomAnchor(vParent);
  }
  return null;
}
function reclaimPersistedMixinNode(persistedNode, newNode, frame, scheduler, styles, vParent, rootTarget) {
  cancelPendingMixinRemoval(persistedNode._mixState);
  unmarkNodePersistedByMixins(persistedNode);
  newNode._dom = persistedNode._dom;
  newNode._parent = vParent;
  newNode._controller = persistedNode._controller;
  newNode._mixState = persistedNode._mixState;
  newNode._directEventState = persistedNode._directEventState;
  newNode._controlledState = persistedNode._controlledState;
  let prevProps = getHostProps(persistedNode);
  let nextProps = resolveNodeMixProps(newNode, frame, scheduler, newNode._mixState);
  if (shouldDispatchInlineMixinLifecycle(persistedNode._dom)) {
    dispatchMixinBeforeUpdate(newNode._mixState);
  }
  patchHostProps(prevProps, nextProps, persistedNode._dom);
  syncDirectEventListeners(newNode);
  ensureControlledReflection(newNode, scheduler);
  syncControlledReflection(newNode, nextProps);
  diffChildren(persistedNode._children, newNode._children, persistedNode._dom, frame, scheduler, styles, newNode, rootTarget);
  if (newNode._mixState) {
    bindNodeMixRuntime(newNode, frame, scheduler, styles, true);
  }
  if (shouldDispatchInlineMixinLifecycle(persistedNode._dom)) {
    scheduler.enqueueCommitPhase([
      () => dispatchMixinCommit(newNode._mixState)
    ]);
  }
}

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/style/layers.js
var REMIX_UI_STYLE_LAYER = "rmx";

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/style/stylesheet.js
var SERVER_STYLE_SELECTOR = "style[data-rmx]";
function getStyleLayerName(className, layer = REMIX_UI_STYLE_LAYER) {
  return `${layer}.${className}`;
}
function compareNodesInDocumentOrder(a, b2) {
  if (a === b2)
    return 0;
  let position = a.compareDocumentPosition(b2);
  if (position & Node.DOCUMENT_POSITION_FOLLOWING)
    return -1;
  if (position & Node.DOCUMENT_POSITION_PRECEDING)
    return 1;
  return 0;
}
function isParentNode(value) {
  return "querySelectorAll" in value;
}
function collectServerStyleTagsFromNode(node, into) {
  if (isHtmlStyleElement(node) && node.matches(SERVER_STYLE_SELECTOR)) {
    into.add(node);
    return;
  }
  if (!(node instanceof Element) && !(node instanceof Document) && !(node instanceof DocumentFragment)) {
    return;
  }
  let nested = node.querySelectorAll?.(SERVER_STYLE_SELECTOR) ?? [];
  for (let i = 0; i < nested.length; i++) {
    let el2 = nested[i];
    if (isHtmlStyleElement(el2)) {
      into.add(el2);
    }
  }
}
function collectServerStyleTags(source) {
  let styles = /* @__PURE__ */ new Set();
  if (isParentNode(source)) {
    collectServerStyleTagsFromNode(source, styles);
  } else {
    for (let node of source) {
      collectServerStyleTagsFromNode(node, styles);
    }
  }
  return Array.from(styles).sort(compareNodesInDocumentOrder);
}
function isHtmlStyleElement(node) {
  return typeof node === "object" && node !== null && node instanceof HTMLStyleElement;
}
function getStyleSelector(styleEl) {
  let selector = styleEl.getAttribute("data-rmx")?.trim();
  return selector ? selector : null;
}
function createStyleManager(layer = REMIX_UI_STYLE_LAYER) {
  let stylesheet = null;
  let generation = 0;
  let ruleMap = /* @__PURE__ */ new Map();
  let adoptedSelectors = /* @__PURE__ */ new Set();
  function getStylesheet() {
    if (!stylesheet) {
      stylesheet = new CSSStyleSheet();
      document.adoptedStyleSheets.push(stylesheet);
    }
    return stylesheet;
  }
  function removeStylesheet() {
    if (!stylesheet)
      return;
    document.adoptedStyleSheets = Array.from(document.adoptedStyleSheets).filter((s) => s !== stylesheet);
    stylesheet = null;
  }
  function clearStylesheet() {
    if (!stylesheet)
      return;
    for (let i = stylesheet.cssRules.length - 1; i >= 0; i--) {
      stylesheet.deleteRule(i);
    }
  }
  function adoptServerStyleTag(styleEl) {
    let selector = getStyleSelector(styleEl);
    if (!selector)
      return void 0;
    if (ruleMap.has(selector)) {
      if (!adoptedSelectors.has(selector)) {
        let entry = ruleMap.get(selector);
        entry.count++;
        adoptedSelectors.add(selector);
      }
      styleEl.remove();
      return selector;
    }
    let cssText = styleEl.textContent?.trim() ?? "";
    if (cssText.length === 0) {
      styleEl.remove();
      return void 0;
    }
    try {
      let sheet = getStylesheet();
      let index = sheet.cssRules.length;
      sheet.insertRule(cssText, index);
      ruleMap.set(selector, { count: 1, index });
      adoptedSelectors.add(selector);
      styleEl.remove();
      return selector;
    } catch {
      return void 0;
    }
  }
  function has(className) {
    let entry = ruleMap.get(className);
    return entry !== void 0 && entry.count > 0;
  }
  function getGeneration() {
    return generation;
  }
  function insert2(className, rule) {
    let entry = ruleMap.get(className);
    if (entry) {
      entry.count++;
      return;
    }
    let sheet = getStylesheet();
    let index = sheet.cssRules.length;
    sheet.insertRule(`@layer ${getStyleLayerName(className, layer)} { ${rule} }`, index);
    ruleMap.set(className, { count: 1, index });
  }
  function remove2(className) {
    let entry = ruleMap.get(className);
    if (!entry)
      return;
    entry.count--;
    if (entry.count > 0) {
      return;
    }
    let indexToDelete = entry.index;
    ruleMap.delete(className);
    adoptedSelectors.delete(className);
    if (!stylesheet)
      return;
    stylesheet.deleteRule(indexToDelete);
    for (let [, data] of ruleMap.entries()) {
      if (data.index > indexToDelete) {
        data.index--;
      }
    }
  }
  function reset() {
    clearStylesheet();
    ruleMap.clear();
    adoptedSelectors.clear();
    removeStylesheet();
    generation++;
  }
  function adoptServerStyles(source) {
    let styles = collectServerStyleTags(source);
    let adopted = /* @__PURE__ */ new Set();
    for (let styleEl of styles) {
      let selector = adoptServerStyleTag(styleEl);
      if (selector)
        adopted.add(selector);
    }
    return adopted;
  }
  function replaceServerStyles(source) {
    let prior = new Set(adoptedSelectors);
    let adopted = adoptServerStyles(source);
    for (let selector of prior) {
      if (!adopted.has(selector)) {
        adoptedSelectors.delete(selector);
        remove2(selector);
      }
    }
  }
  function selectors() {
    return ruleMap.keys();
  }
  function dispose() {
    removeStylesheet();
    ruleMap.clear();
    adoptedSelectors.clear();
    generation++;
  }
  return {
    insert: insert2,
    remove: remove2,
    has,
    getGeneration,
    reset,
    adoptServerStyles,
    replaceServerStyles,
    selectors,
    dispose
  };
}

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/diff-props.js
var globalStyleManager = typeof window !== "undefined" ? createStyleManager() : null;
var defaultStyleManager = globalStyleManager;

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/scheduler.js
var MAX_CASCADING_UPDATES = 50;
function createScheduler(doc, rootTarget, styles = defaultStyleManager) {
  let documentState = createDocumentState(doc);
  let scheduled = /* @__PURE__ */ new Map();
  let workTasks = [];
  let commitPhaseTasks = [];
  let postCommitTasks = [];
  let flushScheduled = false;
  let flushing = false;
  let cascadingUpdateCount = 0;
  let resetScheduled = false;
  let phaseEvents = new EventTarget();
  let phaseListenerCounts = {
    beforeUpdate: 0,
    commit: 0
  };
  let scheduler;
  function dispatchError(error) {
    console.error(error);
    rootTarget.dispatchEvent(createComponentErrorEvent(error));
  }
  function scheduleCounterReset() {
    if (resetScheduled)
      return;
    resetScheduled = true;
    setTimeout(() => {
      cascadingUpdateCount = 0;
      resetScheduled = false;
    }, 0);
  }
  function getFrameStyleManager(vnode) {
    let runtime = vnode._handle?.frame.$runtime;
    return runtime?.styleManager ?? styles;
  }
  function flush() {
    if (flushing)
      return;
    flushing = true;
    try {
      while (true) {
        flushScheduled = false;
        let batch = new Map(scheduled);
        scheduled.clear();
        let hasWork = batch.size > 0 || workTasks.length > 0 || commitPhaseTasks.length > 0 || postCommitTasks.length > 0;
        if (!hasWork)
          return;
        cascadingUpdateCount++;
        scheduleCounterReset();
        if (cascadingUpdateCount > MAX_CASCADING_UPDATES) {
          let error = new Error("handle.update() infinite loop detected");
          dispatchError(error);
          return;
        }
        documentState.capture();
        let updateParents = batch.size > 0 ? Array.from(new Set(batch.values())) : [];
        setActiveSchedulerUpdateParents(updateParents);
        dispatchPhaseEvent("beforeUpdate", updateParents);
        if (batch.size > 0) {
          let vnodes = Array.from(batch);
          let noScheduledAncestor = /* @__PURE__ */ new Set();
          for (let [vnode, domParent] of vnodes) {
            if (ancestorIsScheduled(vnode, batch, noScheduledAncestor))
              continue;
            let handle = vnode._handle;
            let curr = vnode._content;
            let vParent = vnode._parent;
            let anchor = findNextSiblingDomAnchor(vnode) || void 0;
            try {
              let updateStyles = getFrameStyleManager(vnode);
              renderComponent(handle, curr, vnode, domParent, handle.frame, scheduler, updateStyles, rootTarget, vParent, anchor);
            } catch (error) {
              dispatchError(error);
            }
          }
        }
        flushTaskQueue(workTasks);
        setActiveSchedulerUpdateParents(void 0);
        documentState.restore();
        flushTaskQueue(commitPhaseTasks);
        dispatchPhaseEvent("commit", updateParents);
        flushTaskQueue(postCommitTasks);
      }
    } finally {
      setActiveSchedulerUpdateParents(void 0);
      flushing = false;
    }
  }
  function dispatchPhaseEvent(type, parents) {
    if (phaseListenerCounts[type] === 0)
      return;
    let event = new Event(type);
    event.parents = parents;
    phaseEvents.dispatchEvent(event);
  }
  function flushTaskQueue(queue) {
    while (queue.length > 0) {
      let task = queue.shift();
      if (!task)
        continue;
      try {
        task();
      } catch (error) {
        dispatchError(error);
      }
    }
  }
  function scheduleFlush() {
    if (flushScheduled || flushing)
      return;
    flushScheduled = true;
    queueMicrotask(flush);
  }
  function ancestorIsScheduled(vnode, batch, safe) {
    let path = [];
    let current = vnode._parent;
    while (current) {
      if (safe.has(current)) {
        for (let node of path)
          safe.add(node);
        return false;
      }
      path.push(current);
      if (isCommittedComponentNode(current) && batch.has(current)) {
        return true;
      }
      current = current._parent;
    }
    for (let node of path)
      safe.add(node);
    return false;
  }
  scheduler = {
    enqueue(vnode, domParent) {
      scheduled.set(vnode, domParent);
      scheduleFlush();
    },
    enqueueWork(newTasks) {
      workTasks.push(...newTasks);
      scheduleFlush();
    },
    enqueueCommitPhase(newTasks) {
      commitPhaseTasks.push(...newTasks);
      scheduleFlush();
    },
    enqueueTasks(newTasks) {
      postCommitTasks.push(...newTasks);
      scheduleFlush();
    },
    addEventListener(type, listener, options) {
      if (listener)
        phaseListenerCounts[type]++;
      phaseEvents.addEventListener(type, listener, options);
    },
    removeEventListener(type, listener, options) {
      if (listener)
        phaseListenerCounts[type] = Math.max(0, phaseListenerCounts[type] - 1);
      phaseEvents.removeEventListener(type, listener, options);
    },
    dequeue() {
      flush();
    }
  };
  return scheduler;
}

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/vdom.js
function getHydrationComponentIdFromRangeStart(start) {
  if (!(start instanceof Comment))
    return void 0;
  let marker = start.data.trim();
  if (!marker.startsWith("rmx:h:"))
    return void 0;
  let id = marker.slice("rmx:h:".length);
  return id.length > 0 ? id : void 0;
}
function createRangeRoot(boundaries, options = {}) {
  let [start, end] = boundaries;
  let vroot = null;
  let styles = options.styleManager ?? defaultStyleManager;
  let container = end.parentNode;
  invariant(container, "Expected parent node");
  invariant(start.parentNode === container, "Boundaries must share parent");
  let parent = container;
  let hydrationCursor = start.nextSibling;
  let eventTarget = new TypedEventTarget();
  let scheduler = options.scheduler ?? createScheduler(parent.ownerDocument ?? document, eventTarget, styles);
  let frameStub = options.frame ?? createRootFrameHandle({
    src: options.frameInit?.src,
    resolveFrame: options.frameInit?.resolveFrame,
    loadModule: options.frameInit?.loadModule,
    errorTarget: eventTarget,
    scheduler,
    styleManager: styles
  });
  let isErrorForwardingAttached = false;
  function forwardDomError(event) {
    eventTarget.dispatchEvent(createComponentErrorEvent(getComponentError(event)));
  }
  function attachDomErrorForwarding() {
    if (isErrorForwardingAttached)
      return;
    parent.addEventListener("error", forwardDomError);
    isErrorForwardingAttached = true;
  }
  function detachDomErrorForwarding() {
    if (!isErrorForwardingAttached)
      return;
    parent.removeEventListener("error", forwardDomError);
    isErrorForwardingAttached = false;
  }
  attachDomErrorForwarding();
  return Object.assign(eventTarget, {
    render(element) {
      attachDomErrorForwarding();
      let vnode = toVNode(element);
      let vParent = {
        type: ROOT_VNODE,
        _svg: false,
        _rangeStart: start,
        _rangeEnd: end,
        _pendingHydrationComponentId: getHydrationComponentIdFromRangeStart(start)
      };
      scheduler.enqueueWork([
        () => {
          diffVNodes(vroot, vnode, parent, frameStub, scheduler, styles, vParent, eventTarget, end, hydrationCursor);
          vroot = vnode;
          hydrationCursor = null;
        }
      ]);
      scheduler.dequeue();
    },
    dispose() {
      detachDomErrorForwarding();
      if (!vroot)
        return;
      let current = vroot;
      vroot = null;
      scheduler.enqueueWork([() => remove(current, parent, scheduler, styles)]);
      scheduler.dequeue();
    },
    flush() {
      scheduler.dequeue();
    }
  });
}
function createRoot(container, options = {}) {
  let vroot = null;
  let styles = options.styleManager ?? defaultStyleManager;
  if (container.innerHTML.trim() !== "") {
    styles.replaceServerStyles(container);
  }
  let hydrationCursor = container.innerHTML.trim() !== "" ? container.firstChild : void 0;
  let eventTarget = new TypedEventTarget();
  let scheduler = options.scheduler ?? createScheduler(container.ownerDocument ?? document, eventTarget, styles);
  let frameStub = options.frame ?? createRootFrameHandle({
    src: options.frameInit?.src,
    resolveFrame: options.frameInit?.resolveFrame,
    loadModule: options.frameInit?.loadModule,
    errorTarget: eventTarget,
    scheduler,
    styleManager: styles
  });
  let isErrorForwardingAttached = false;
  function forwardDomError(event) {
    eventTarget.dispatchEvent(createComponentErrorEvent(getComponentError(event)));
  }
  function attachDomErrorForwarding() {
    if (isErrorForwardingAttached)
      return;
    container.addEventListener("error", forwardDomError);
    isErrorForwardingAttached = true;
  }
  function detachDomErrorForwarding() {
    if (!isErrorForwardingAttached)
      return;
    container.removeEventListener("error", forwardDomError);
    isErrorForwardingAttached = false;
  }
  attachDomErrorForwarding();
  return Object.assign(eventTarget, {
    render(element) {
      attachDomErrorForwarding();
      let vnode = toVNode(element);
      let vParent = { type: ROOT_VNODE, _svg: false };
      scheduler.enqueueWork([
        () => {
          diffVNodes(vroot, vnode, container, frameStub, scheduler, styles, vParent, eventTarget, void 0, hydrationCursor);
          vroot = vnode;
          hydrationCursor = void 0;
        }
      ]);
      scheduler.dequeue();
    },
    dispose() {
      detachDomErrorForwarding();
      if (!vroot)
        return;
      let current = vroot;
      vroot = null;
      scheduler.enqueueWork([() => remove(current, container, scheduler, styles)]);
      scheduler.dequeue();
    },
    flush() {
      scheduler.dequeue();
    }
  });
}
function createRootFrameHandle(init) {
  let resolveFrame = init.resolveFrame ?? (() => {
    throw new Error("Cannot render <Frame /> without frame runtime. Use run() or pass frameInit to createRoot/createRangeRoot.");
  });
  let frame = createFrameHandle({
    src: init.src ?? "/",
    $runtime: {
      canResolveFrames: !!init.resolveFrame,
      topFrame: void 0,
      loadModule: init.loadModule ?? (() => {
        throw new Error("loadModule is required to hydrate client entries inside <Frame />");
      }),
      resolveFrame,
      errorTarget: init.errorTarget,
      pendingClientEntries: /* @__PURE__ */ new Map(),
      scheduler: init.scheduler,
      styleManager: init.styleManager,
      data: {},
      moduleCache: /* @__PURE__ */ new Map(),
      moduleLoads: /* @__PURE__ */ new Map(),
      frameInstances: /* @__PURE__ */ new WeakMap(),
      namedFrames: /* @__PURE__ */ new Map()
    }
  });
  let runtime = frame.$runtime;
  if (runtime)
    runtime.topFrame = frame;
  return frame;
}

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/diff-dom.js
function diffNodes(curr, next, context) {
  let parent = curr[0]?.parentNode ?? context.regionParent ?? null;
  invariant(parent, "Parent node not found");
  let regionTailRef = context.regionTailRef ?? (curr.length > 0 ? curr[curr.length - 1].nextSibling : null);
  let currentIndex = 0;
  let nextIndex = 0;
  while (currentIndex < curr.length || nextIndex < next.length) {
    let c = curr[currentIndex];
    let n = next[nextIndex];
    if (!c && n) {
      if (regionTailRef) {
        parent.insertBefore(n, regionTailRef);
      } else {
        parent.appendChild(n);
      }
      nextIndex++;
    } else if (c && !n) {
      removeNode(c, parent, context);
      currentIndex++;
    } else if (c && n) {
      let replacement = getCommentMarkerRangeReplacement(c, n, curr, next, currentIndex, nextIndex, context);
      if (replacement) {
        replaceCommentMarkerRange(replacement, parent, context);
        currentIndex = replacement.currentEndIndex + 1;
        nextIndex = replacement.nextEndIndex + 1;
        continue;
      }
      if (isVirtualRootStartMarker(c) && isVirtualRootStartMarker(n)) {
        let currentEnd = findHydrationEndMarker(c);
        let nextEnd = findHydrationEndMarker(n);
        let nextData = n.data;
        if (c.data !== nextData)
          c.data = nextData;
        let currentEndIndex = curr.indexOf(currentEnd);
        let nextEndIndex = next.indexOf(nextEnd);
        currentIndex = currentEndIndex + 1;
        nextIndex = nextEndIndex + 1;
        continue;
      }
      let cursor = diffNode(c, n, context);
      if (cursor) {
        let nextEndIndex = next.indexOf(cursor);
        let currentEndIndex = isFrameStartMarker(c) && isFrameEndMarker(cursor) ? findFrameEndIndex(curr, currentIndex) : currentIndex;
        currentIndex = currentEndIndex + 1;
        nextIndex = nextEndIndex + 1;
        continue;
      }
      currentIndex++;
      nextIndex++;
    }
  }
}
function diffNode(current, next, context) {
  if (isTextNode2(current) && isTextNode2(next)) {
    let newText = next.textContent || "";
    if (current.textContent !== newText)
      current.textContent = newText;
    return;
  }
  if (isVirtualRootStartMarker(current) && isVirtualRootStartMarker(next)) {
    let nextData = next.data;
    if (current.data !== nextData) {
      current.data = nextData;
    }
    let end = findHydrationEndMarker(next);
    return end;
  }
  if (isCommentNode(current) && isCommentNode(next)) {
    let newData = next.data;
    if (current.data !== newData) {
      let updated = false;
      if (isFrameStartMarker(current)) {
        if (shouldPreserveFrameStartMarker(current, next, context)) {
          current.data = newData;
          updated = true;
          let frame = context.frameInstances.get(current);
          let nextMarkerData = getFrameMarkerData(next, context);
          if (frame && nextMarkerData) {
            if (nextMarkerData.status === "resolved") {
              let nextEnd = findFrameEndMarker(next);
              let nextContent = collectFrameContentFragment(current.ownerDocument, next, nextEnd);
              void frame.renderMarkerContent({ ...nextMarkerData, id: getFrameId(next) }, nextContent, {
                signal: context.signal
              });
              return nextEnd;
            }
            if (frame.isDisplayingResolvedContent()) {
              return findFrameEndMarker(next);
            }
          }
        } else {
          disposeFrameStartMarker(current, context);
          current.data = newData;
          updated = true;
        }
      }
      if (!updated) {
        current.data = newData;
      }
    }
    return;
  }
  if (isElement(current) && isElement(next)) {
    if (current.tagName !== next.tagName) {
      let parent2 = current.parentNode;
      if (parent2) {
        parent2.insertBefore(next, current);
        removeNode(current, parent2, context);
      }
      return;
    }
    diffElementAttributes(current, next);
    if (shouldPreserveElementChildren(current, next))
      return;
    diffElementChildren(current, next, context);
    return;
  }
  let parent = current.parentNode;
  if (parent) {
    parent.insertBefore(next, current);
    removeNode(current, parent, context);
  }
}
function diffElementAttributes(current, next) {
  let prevAttrNames = current.getAttributeNames();
  let nextAttrNames = next.getAttributeNames();
  let nextNameSet = new Set(nextAttrNames);
  for (let name of prevAttrNames) {
    if (!nextNameSet.has(name)) {
      if (shouldPreserveLiveAttribute(current, next, name))
        continue;
      current.removeAttribute(name);
    }
  }
  for (let name of nextAttrNames) {
    let prevVal = current.getAttribute(name);
    let nextVal = next.getAttribute(name);
    if (prevVal !== nextVal) {
      if (shouldPreserveLiveAttribute(current, next, name))
        continue;
      current.setAttribute(name, nextVal == null ? "" : String(nextVal));
    }
  }
}
function shouldPreserveLiveAttribute(current, next, name) {
  if (name === "open") {
    if (current instanceof HTMLDetailsElement && next instanceof HTMLDetailsElement) {
      return current.open !== next.open;
    }
    if (current instanceof HTMLDialogElement && next instanceof HTMLDialogElement) {
      return current.open !== next.open;
    }
  }
  if (name === "checked") {
    if (current instanceof HTMLInputElement && next instanceof HTMLInputElement) {
      return current.checked !== next.checked;
    }
  }
  if (name === "value") {
    if (current instanceof HTMLInputElement && next instanceof HTMLInputElement && shouldPreserveInputValue(current)) {
      return current.value !== next.value;
    }
  }
  if (name === "selected") {
    if (current instanceof HTMLOptionElement && next instanceof HTMLOptionElement) {
      return current.selected !== next.selected;
    }
  }
  if (name === "popover") {
    return isPopoverOpen(current) !== isPopoverOpen(next);
  }
  return false;
}
function shouldPreserveElementChildren(current, next) {
  if (current instanceof HTMLTextAreaElement && next instanceof HTMLTextAreaElement) {
    return current.value !== next.value;
  }
  return false;
}
function shouldPreserveInputValue(input) {
  return input.type !== "button" && input.type !== "checkbox" && input.type !== "hidden" && input.type !== "image" && input.type !== "radio" && input.type !== "reset" && input.type !== "submit";
}
function isPopoverOpen(element) {
  try {
    return element.matches(":popover-open");
  } catch {
    return false;
  }
}
function diffElementChildren(current, next, context) {
  let currentChildren = Array.from(current.childNodes);
  let nextChildren = Array.from(next.childNodes);
  let keyToIndex = /* @__PURE__ */ new Map();
  for (let i = 0; i < currentChildren.length; i++) {
    let node = currentChildren[i];
    if (isElement(node)) {
      let key = node.getAttribute("data-key");
      if (key != null)
        keyToIndex.set(key, i);
    }
  }
  let used = new Array(currentChildren.length).fill(false);
  let matchIndexForNext = new Array(nextChildren.length).fill(-1);
  for (let i = 0; i < nextChildren.length; i++) {
    let nextChild = nextChildren[i];
    let matchIndex = -1;
    if (isFrameEndMarker(nextChild)) {
      for (let j2 = 0; j2 < currentChildren.length; j2++) {
        if (!used[j2] && isFrameEndMarker(currentChildren[j2])) {
          matchIndex = j2;
          break;
        }
      }
    } else if (isElement(nextChild)) {
      let key = nextChild.getAttribute("data-key");
      if (key != null && keyToIndex.has(key)) {
        let idx = keyToIndex.get(key);
        if (!used[idx])
          matchIndex = idx;
      }
    }
    if (matchIndex === -1) {
      let candidateIndex = i;
      if (candidateIndex < currentChildren.length && !used[candidateIndex] && nodeTypesComparable(currentChildren[candidateIndex], nextChild)) {
        matchIndex = candidateIndex;
      }
    }
    if (matchIndex !== -1)
      used[matchIndex] = true;
    matchIndexForNext[i] = matchIndex;
  }
  let committed = new Array(nextChildren.length);
  for (let i = 0; i < nextChildren.length; i++) {
    let mi = matchIndexForNext[i];
    if (mi !== -1) {
      let curChild = currentChildren[mi];
      let nextChild = nextChildren[i];
      let replacement = getCommentMarkerRangeReplacement(curChild, nextChild, currentChildren, nextChildren, mi, i, context);
      if (replacement) {
        replaceCommentMarkerRange(replacement, current, context);
        for (let k = mi; k <= replacement.currentEndIndex; k++)
          used[k] = true;
        committed[i] = replacement.nextStart;
        committed[replacement.nextEndIndex] = nextChildren[replacement.nextEndIndex];
        for (let j2 = i + 1; j2 < replacement.nextEndIndex; j2++)
          committed[j2] = void 0;
        i = replacement.nextEndIndex;
        continue;
      }
      let cursor = diffNode(curChild, nextChild, context);
      if (cursor) {
        let nextEndIdx = nextChildren.indexOf(cursor);
        let currEndIdx = isFrameStartMarker(curChild) && isFrameEndMarker(cursor) ? findFrameEndIndex(currentChildren, mi) : findHydrationEndIndex(currentChildren, mi);
        for (let j2 = i + 1; j2 <= nextEndIdx; j2++) {
          let matchedIndex = matchIndexForNext[j2];
          if (matchedIndex > currEndIdx) {
            used[matchedIndex] = false;
          }
          matchIndexForNext[j2] = -1;
        }
        for (let k = mi; k <= currEndIdx; k++)
          used[k] = true;
        committed[i] = curChild;
        committed[nextEndIdx] = currentChildren[currEndIdx];
        for (let j2 = i + 1; j2 < nextEndIdx; j2++)
          committed[j2] = void 0;
        i = nextEndIdx;
        continue;
      }
      committed[i] = curChild;
    } else {
      committed[i] = nextChildren[i];
    }
  }
  let anchor = void 0;
  for (let i = committed.length - 1; i >= 0; i--) {
    let node = committed[i];
    if (!node)
      continue;
    let ref = anchor && anchor.parentNode === current ? anchor : null;
    if (isVirtualRootStartMarker(node) || isVirtualRootEndMarker(node) || isFrameStartMarker(node) || isFrameEndMarker(node)) {
      if (node.parentNode !== current) {
        current.insertBefore(node, ref);
      }
      anchor = node;
      continue;
    }
    if (node.parentNode === current) {
      let targetNext = ref;
      let alreadyInPlace = targetNext === null && node.nextSibling === null || node.nextSibling === targetNext;
      if (!alreadyInPlace) {
        current.insertBefore(node, targetNext);
      }
    } else {
      current.insertBefore(node, ref);
    }
    if (node.parentNode === current) {
      anchor = node;
    }
  }
  for (let i = 0; i < currentChildren.length; i++) {
    if (!used[i]) {
      let nodeToRemove = currentChildren[i];
      removeNode(nodeToRemove, current, context);
    }
  }
}
function nodeTypesComparable(a, b2) {
  if (isTextNode2(a) && isTextNode2(b2))
    return true;
  if (isElement(a) && isElement(b2))
    return a.tagName === b2.tagName;
  if (isVirtualRootStartMarker(a) && isVirtualRootStartMarker(b2))
    return true;
  if (isVirtualRootEndMarker(a) && isVirtualRootEndMarker(b2))
    return true;
  if (isCommentNode(a) && isCommentNode(b2))
    return true;
  return false;
}
function isHydrationEndComment(node) {
  return isCommentNode(node) && node.data.trim() === "/rmx:h";
}
function findHydrationEndMarker(start) {
  let node = start.nextSibling;
  let depth = 1;
  while (node) {
    if (isCommentNode(node)) {
      if (isVirtualRootStartMarker(node))
        depth++;
      if (isVirtualRootEndMarker(node)) {
        depth--;
        if (depth === 0)
          return node;
      }
    }
    node = node.nextSibling;
  }
  throw new Error("Hydration end marker not found");
}
function findHydrationEndIndex(nodes, startIdx) {
  for (let j2 = startIdx + 1; j2 < nodes.length; j2++) {
    if (isHydrationEndComment(nodes[j2]))
      return j2;
  }
  return startIdx;
}
function findFrameEndMarker(start) {
  let node = start.nextSibling;
  let depth = 1;
  while (node) {
    if (isFrameStartMarker(node))
      depth++;
    if (isFrameEndMarker(node)) {
      depth--;
      if (depth === 0)
        return node;
    }
    node = node.nextSibling;
  }
  throw new Error("Frame end marker not found");
}
function findFrameEndIndex(nodes, startIdx) {
  let depth = 1;
  for (let j2 = startIdx + 1; j2 < nodes.length; j2++) {
    let node = nodes[j2];
    if (isFrameStartMarker(node))
      depth++;
    if (isFrameEndMarker(node)) {
      depth--;
      if (depth === 0)
        return j2;
    }
  }
  return startIdx;
}
function isTextNode2(node) {
  return node.nodeType === Node.TEXT_NODE;
}
function isElement(node) {
  return node.nodeType === Node.ELEMENT_NODE;
}
function isCommentNode(node) {
  return node.nodeType === Node.COMMENT_NODE;
}
function isFrameStartMarker(node) {
  return node instanceof Comment && node.data.trim().startsWith("rmx:f:");
}
function isFrameEndMarker(node) {
  return node instanceof Comment && node.data.trim() === "/rmx:f";
}
function shouldPreserveFrameStartMarker(current, next, context) {
  if (!isFrameStartMarker(next))
    return false;
  let currentData = getFrameMarkerData(current, context);
  let nextData = getFrameMarkerData(next, context);
  return currentData !== void 0 && nextData !== void 0 && currentData.src === nextData.src && currentData.name === nextData.name;
}
function getCommentMarkerRangeReplacement(current, next, currentNodes, nextNodes, currentIndex, nextIndex, context) {
  if (isFrameStartMarker(current) && isFrameStartMarker(next) && !shouldPreserveFrameStartMarker(current, next, context)) {
    return {
      currentStart: current,
      nextStart: next,
      currentEndIndex: findFrameEndIndex(currentNodes, currentIndex),
      nextEndIndex: findFrameEndIndex(nextNodes, nextIndex)
    };
  }
}
function getFrameMarkerData(marker, context) {
  let id = getFrameId(marker);
  return context.data.f?.[id];
}
function getFrameId(marker) {
  let trimmed = marker.data.trim();
  invariant(trimmed.startsWith("rmx:f:"), "Invalid frame start marker");
  return trimmed.slice("rmx:f:".length);
}
function replaceCommentMarkerRange(replacement, parent, context) {
  let currentEnd = findFrameEndMarker(replacement.currentStart);
  let nextEnd = findFrameEndMarker(replacement.nextStart);
  let nextNodes = collectNodeRange(replacement.nextStart, nextEnd);
  let currentNodes = collectNodeRange(replacement.currentStart, currentEnd);
  for (let node of nextNodes) {
    parent.insertBefore(node, replacement.currentStart);
  }
  for (let node of currentNodes) {
    removeNode(node, parent, context);
  }
}
function collectNodeRange(start, end) {
  let nodes = [];
  let node = start;
  while (node) {
    nodes.push(node);
    if (node === end)
      break;
    node = node.nextSibling;
  }
  return nodes;
}
function collectFrameContentFragment(doc, start, end) {
  let fragment = doc.createDocumentFragment();
  let node = start.nextSibling;
  while (node && node !== end) {
    let next = node.nextSibling;
    fragment.appendChild(node);
    node = next;
  }
  return fragment;
}
function removeNode(node, parent, context) {
  disposeRemovedVirtualRoots(node);
  disposeRemovedSubFrames(node, context);
  if (node.parentNode === parent) {
    parent.removeChild(node);
  }
}
function disposeRemovedVirtualRoots(node) {
  let stack = [node];
  while (stack.length > 0) {
    let next = stack.pop();
    if (!next)
      continue;
    if (isHydratedVirtualRootStartMarker(next)) {
      next.$rmx.dispose();
      continue;
    }
    for (let child of Array.from(next.childNodes)) {
      stack.push(child);
    }
  }
}
function disposeRemovedSubFrames(node, context) {
  let stack = [node];
  while (stack.length > 0) {
    let next = stack.pop();
    if (!next)
      continue;
    if (isFrameStartMarker(next)) {
      disposeFrameStartMarker(next, context);
    }
    for (let child of Array.from(next.childNodes)) {
      stack.push(child);
    }
  }
}
function disposeFrameStartMarker(marker, context) {
  let subFrame = context.frameInstances.get(marker);
  if (subFrame) {
    subFrame.dispose();
    context.frameInstances.delete(marker);
  }
}
function isVirtualRootStartMarker(node) {
  return isCommentNode(node) && node.data.trim().startsWith("rmx:h:");
}
function isHydratedVirtualRootStartMarker(node) {
  return isVirtualRootStartMarker(node) && "$rmx" in node;
}
function isVirtualRootEndMarker(node) {
  return isCommentNode(node) && node.data.trim() === "/rmx:h";
}

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/stream-protocol.js
var FLUSH_MARKER_PATTERN = /<!--\s*rmx:flush\s+(document|fragment)\s*-->/g;
function findFlushMarker(html, startIndex) {
  FLUSH_MARKER_PATTERN.lastIndex = startIndex;
  let match = FLUSH_MARKER_PATTERN.exec(html);
  if (!match)
    return void 0;
  return {
    index: match.index,
    endIndex: FLUSH_MARKER_PATTERN.lastIndex,
    kind: match[1]
  };
}

// ../../node_modules/.pnpm/@remix-run+ui@0.4.0/node_modules/@remix-run/ui/dist/runtime/frame.js
var bufferedFrameTemplates = /* @__PURE__ */ new Map();
var frameTemplateListeners = /* @__PURE__ */ new Map();
var DOCTYPE_PATTERN = /<!doctype(?:\s[^>]*)?>/gi;
function stripDoctypeMarkup(html) {
  return html.replace(DOCTYPE_PATTERN, "");
}
function syncElementAttributes(target, source) {
  for (let attribute of Array.from(target.attributes)) {
    if (!source.hasAttribute(attribute.name)) {
      target.removeAttribute(attribute.name);
    }
  }
  for (let attribute of Array.from(source.attributes)) {
    if (target.getAttribute(attribute.name) !== attribute.value) {
      target.setAttribute(attribute.name, attribute.value);
    }
  }
}
function createFrame(root, init) {
  let container = createContainer(root);
  let contentRoot;
  let reloadController;
  let styleManager = init.styleManager ?? createStyleManager();
  let currentMarker = init.marker;
  let displayedContentStatus = init.marker?.status ?? "resolved";
  let pendingTemplateMarkerId;
  let pendingTemplateObserver;
  let pendingTemplateUnsubscribe;
  let inheritedReloadPending = false;
  let inheritedReloadAbortUnsubscribe;
  mergeRmxDataFromDocument(init.data, container.doc);
  let runtime = createFrameRuntime({ ...init, styleManager });
  let frame = createFrameHandle({
    src: init.src,
    $runtime: runtime,
    reload: async () => {
      reloadController?.abort();
      let controller = new AbortController();
      reloadController = controller;
      frame.dispatchEvent(new Event("reloadStart"));
      startSubFrameInheritedReloads(getContentNodes(), controller.signal);
      try {
        let content = await init.resolveFrame(frame.src, controller.signal, frameName);
        if (reloadController !== controller || controller.signal.aborted)
          return controller.signal;
        await render(content, { signal: controller.signal });
        return controller.signal;
      } catch (error) {
        if (reloadController !== controller || controller.signal.aborted)
          return controller.signal;
        init.errorTarget.dispatchEvent(createComponentErrorEvent(error));
        throw error;
      } finally {
        if (reloadController === controller) {
          frame.dispatchEvent(new Event("reloadComplete"));
        }
      }
    },
    replace: async (content) => {
      await render(content);
    }
  });
  runtime.topFrame = runtime.topFrame ?? init.topFrame ?? frame;
  let frameName = init.marker?.name ?? init.name;
  if (frameName) {
    init.namedFrames.set(frameName, frame);
  }
  let context = {
    topFrame: runtime.topFrame,
    errorTarget: init.errorTarget,
    loadModule: init.loadModule,
    resolveFrame: init.resolveFrame,
    pendingClientEntries: init.pendingClientEntries,
    scheduler: init.scheduler,
    frame,
    styleManager,
    data: init.data,
    moduleCache: init.moduleCache,
    moduleLoads: init.moduleLoads,
    frameInstances: init.frameInstances,
    namedFrames: init.namedFrames,
    regionTailRef: container.regionTailRef,
    regionParent: container.regionParent
  };
  async function render(content, options) {
    if (options?.signal?.aborted)
      return;
    if (content instanceof ReadableStream) {
      await renderFrameStream(content, container.doc, async (html, flushKind) => {
        if (options?.signal?.aborted)
          return;
        await render(html, { ...options, flushKind });
      });
      return;
    }
    if (isRemixNodeFrameContent(content)) {
      if (!contentRoot) {
        let currentNodes = getContentNodes();
        removeVirtualRoots(currentNodes);
        disposeSubFrames(currentNodes, context);
        clearFrameContent();
        contentRoot = createFrameContentRoot();
      }
      if (options?.signal?.aborted)
        return;
      contentRoot.render(content);
      displayedContentStatus = options?.contentStatus ?? "resolved";
      return;
    }
    if (contentRoot) {
      contentRoot.dispose();
      contentRoot = void 0;
    }
    if (typeof content === "string") {
      let flushed = await consumeFlushBatches(content, async (html, flushKind) => {
        await render(html, { ...options, flushKind });
      });
      if (flushed.applied) {
        if (flushed.remainder !== "") {
          await render(flushed.remainder, { ...options, flushKind: "fragment" });
        }
        return;
      }
    }
    let htmlContent = typeof content === "string" ? stripDoctypeMarkup(content) : void 0;
    let isFullDocumentReload = container.root instanceof Document && htmlContent !== void 0 && options?.flushKind === "document";
    if (isFullDocumentReload && htmlContent !== void 0) {
      let parsed = new DOMParser().parseFromString(htmlContent, "text/html");
      mergeRmxDataFromDocument(context.data, parsed);
      context.styleManager.replaceServerStyles(collectFrameServerStyleTags(createElementContainer(parsed)));
      syncElementAttributes(container.doc.documentElement, parsed.documentElement);
      diffNodes([container.doc.head], [parsed.head], {
        ...context,
        regionParent: container.doc.documentElement,
        regionTailRef: null,
        signal: options?.signal
      });
      diffNodes([container.doc.body], [parsed.body], {
        ...context,
        regionParent: container.doc.documentElement,
        regionTailRef: null,
        signal: options?.signal
      });
      let bodyContainer = createElementContainer(container.doc.body);
      if (options?.signal?.aborted)
        return;
      scheduleHydrationInContainer(bodyContainer, context, options?.initialHydrationTracker);
      await createSubFrames(bodyContainer.childNodes, context, options);
      displayedContentStatus = options?.contentStatus ?? "resolved";
      return;
    }
    let fragment = htmlContent !== void 0 ? createFragmentFromString(container.doc, htmlContent) : content;
    context.styleManager.replaceServerStyles(collectFrameServerStyleTags(createElementContainer(fragment)));
    removeEmptyHeads(fragment);
    mergeRmxDataFromFragment(context.data, fragment);
    let nextContainer = createContainer(fragment);
    if (options?.signal?.aborted)
      return;
    diffNodes(container.childNodes, Array.from(nextContainer.childNodes), {
      ...context,
      regionTailRef: container.regionTailRef,
      regionParent: container.regionParent,
      signal: options?.signal
    });
    if (options?.signal?.aborted)
      return;
    scheduleHydrationInContainer(container, context, options?.initialHydrationTracker);
    await createSubFrames(container.childNodes, context, options);
    displayedContentStatus = options?.contentStatus ?? "resolved";
  }
  function createFrameContentRoot() {
    let virtualRoot;
    if (container.root instanceof Document) {
      virtualRoot = createRoot(container.doc.body, {
        scheduler: context.scheduler,
        frame,
        styleManager: context.styleManager
      });
    } else {
      invariant(Array.isArray(root), "Expected comment-bounded frame root");
      virtualRoot = createRangeRoot(root, {
        scheduler: context.scheduler,
        frame,
        styleManager: context.styleManager
      });
    }
    virtualRoot.addEventListener("error", (event) => {
      if (context.errorTarget === virtualRoot)
        return;
      context.errorTarget.dispatchEvent(createComponentErrorEvent(getComponentError(event)));
    });
    return virtualRoot;
  }
  function getContentNodes() {
    return container.root instanceof Document ? Array.from(container.doc.body.childNodes) : container.childNodes;
  }
  function clearFrameContent() {
    for (let node of getContentNodes()) {
      node.parentNode?.removeChild(node);
    }
  }
  async function hydrateInitial() {
    let initialHydrationTracker = createInitialHydrationTracker();
    context.styleManager.replaceServerStyles(collectFrameServerStyleTags(container));
    await createSubFrames(container.childNodes, context);
    scheduleHydrationInContainer(container, context, initialHydrationTracker);
    if (currentMarker?.status === "pending") {
      await watchPendingFrameTemplate(currentMarker, initialHydrationTracker);
    }
    initialHydrationTracker.finalize();
    await initialHydrationTracker.ready();
  }
  function dispose() {
    reloadController?.abort();
    reloadController = void 0;
    contentRoot?.dispose();
    contentRoot = void 0;
    clearPendingFrameTemplateWatch();
    removeVirtualRoots(container.childNodes);
    disposeSubFrames(container.childNodes, context);
    context.styleManager.dispose();
    if (frameName) {
      if (init.namedFrames.get(frameName) === frame) {
        init.namedFrames.delete(frameName);
      }
    }
  }
  let readyPromise = hydrateInitial();
  return {
    render,
    ready: () => readyPromise,
    flush: () => context.scheduler.dequeue(),
    clearPendingTemplateWatch: clearPendingFrameTemplateWatch,
    isDisplayingResolvedContent: () => displayedContentStatus === "resolved",
    startInheritedReload,
    updateMarker,
    renderMarkerContent,
    dispose,
    handle: frame
  };
  async function updateMarker(marker, options) {
    if (options?.signal?.aborted)
      return;
    let previousMarker = currentMarker;
    let isInheritedReload = previousMarker !== void 0 && previousMarker.id !== marker.id;
    currentMarker = marker;
    if (isInheritedReload) {
      startInheritedReload(options?.signal);
    }
    if (marker.status === "pending") {
      await watchPendingFrameTemplate(marker, options?.initialHydrationTracker, options?.signal, isInheritedReload ? () => {
        completeInheritedReload();
      } : void 0);
    } else {
      clearPendingFrameTemplateWatch();
      if (isInheritedReload && !options?.signal?.aborted) {
        completeInheritedReload();
      }
    }
  }
  async function renderMarkerContent(marker, content, options) {
    if (options?.signal?.aborted)
      return;
    let previousMarker = currentMarker;
    let isInheritedReload = previousMarker !== void 0 && previousMarker.id !== marker.id;
    currentMarker = marker;
    if (isInheritedReload) {
      startInheritedReload(options?.signal);
    }
    clearPendingFrameTemplateWatch();
    await render(content, { ...options, contentStatus: "resolved" });
    if (isInheritedReload && !options?.signal?.aborted) {
      completeInheritedReload();
    }
  }
  function startInheritedReload(signal) {
    if (signal?.aborted)
      return;
    if (!inheritedReloadPending) {
      inheritedReloadPending = true;
      frame.dispatchEvent(new Event("reloadStart"));
      startSubFrameInheritedReloads(getContentNodes(), signal);
    }
    inheritedReloadAbortUnsubscribe?.();
    inheritedReloadAbortUnsubscribe = void 0;
    if (signal) {
      let abort = () => completeInheritedReload();
      signal.addEventListener("abort", abort, { once: true });
      inheritedReloadAbortUnsubscribe = () => {
        signal.removeEventListener("abort", abort);
      };
    }
  }
  function completeInheritedReload() {
    if (!inheritedReloadPending)
      return;
    inheritedReloadPending = false;
    inheritedReloadAbortUnsubscribe?.();
    inheritedReloadAbortUnsubscribe = void 0;
    frame.dispatchEvent(new Event("reloadComplete"));
  }
  function startSubFrameInheritedReloads(nodes, signal) {
    for (let i = 0; i < nodes.length; i++) {
      if (signal?.aborted)
        break;
      let node = nodes[i];
      if (isFrameStart(node)) {
        let end = findEndMarker(node, isFrameStart, isFrameEnd);
        context.frameInstances.get(node)?.startInheritedReload(signal);
        i = nodes.indexOf(end);
        continue;
      }
      if (node.childNodes && node.childNodes.length > 0) {
        startSubFrameInheritedReloads(Array.from(node.childNodes), signal);
      }
    }
  }
  function clearPendingFrameTemplateWatch() {
    pendingTemplateUnsubscribe?.();
    pendingTemplateUnsubscribe = void 0;
    pendingTemplateObserver?.disconnect();
    pendingTemplateObserver = void 0;
    pendingTemplateMarkerId = void 0;
  }
  async function watchPendingFrameTemplate(marker, initialHydrationTracker, signal, onResolved) {
    if (signal?.aborted)
      return;
    if (pendingTemplateMarkerId === marker.id)
      return;
    clearPendingFrameTemplateWatch();
    pendingTemplateMarkerId = marker.id;
    let early = consumeFrameTemplate(marker.id) ?? getEarlyFrameContent(marker.id);
    if (early) {
      clearPendingFrameTemplateWatch();
      await render(early, { initialHydrationTracker, signal, contentStatus: "resolved" });
      if (!signal?.aborted)
        onResolved?.();
      return;
    }
    if (signal?.aborted) {
      clearPendingFrameTemplateWatch();
      return;
    }
    let observer = setupTemplateObserver();
    pendingTemplateObserver = observer;
    let unsubscribe = subscribeFrameTemplate(marker.id, async (fragment) => {
      if (signal?.aborted)
        return;
      if (pendingTemplateMarkerId !== marker.id)
        return;
      clearPendingFrameTemplateWatch();
      await render(fragment, { signal, contentStatus: "resolved" });
      if (!signal?.aborted)
        onResolved?.();
    });
    pendingTemplateUnsubscribe = unsubscribe;
    signal?.addEventListener("abort", () => {
      if (pendingTemplateMarkerId === marker.id) {
        clearPendingFrameTemplateWatch();
      }
    }, { once: true });
    let buffered = consumeFrameTemplate(marker.id);
    if (buffered) {
      clearPendingFrameTemplateWatch();
      await render(buffered, { initialHydrationTracker, signal, contentStatus: "resolved" });
      if (!signal?.aborted)
        onResolved?.();
    }
  }
}
function createFrameRuntime(init) {
  return {
    topFrame: init.topFrame,
    errorTarget: init.errorTarget,
    loadModule: init.loadModule,
    resolveFrame: init.resolveFrame,
    pendingClientEntries: init.pendingClientEntries,
    scheduler: init.scheduler,
    styleManager: init.styleManager,
    data: init.data,
    moduleCache: init.moduleCache,
    moduleLoads: init.moduleLoads,
    frameInstances: init.frameInstances,
    namedFrames: init.namedFrames
  };
}
function createInitialHydrationTracker() {
  let pending = 0;
  let finalized = false;
  let resolveReady;
  let readyPromise = new Promise((resolve) => {
    resolveReady = resolve;
  });
  function maybeResolve() {
    if (finalized && pending === 0) {
      resolveReady?.();
      resolveReady = void 0;
    }
  }
  return {
    track() {
      pending++;
      let completed = false;
      return () => {
        if (completed)
          return;
        completed = true;
        pending--;
        maybeResolve();
      };
    },
    finalize() {
      finalized = true;
      maybeResolve();
    },
    ready() {
      return readyPromise;
    }
  };
}
function mergeRmxDataFromDocument(into, doc) {
  let scripts = Array.from(doc.querySelectorAll("script#rmx-data"));
  for (let script of scripts) {
    if (!(script instanceof HTMLScriptElement))
      continue;
    mergeRmxData(into, parseRmxDataScript(script));
    script.remove();
  }
}
function mergeRmxDataFromFragment(into, fragment) {
  let scripts = Array.from(fragment.querySelectorAll("script#rmx-data"));
  for (let script of scripts) {
    if (!(script instanceof HTMLScriptElement))
      continue;
    mergeRmxData(into, parseRmxDataScript(script));
    script.remove();
  }
}
function removeEmptyHeads(fragment) {
  let heads = Array.from(fragment.querySelectorAll("head"));
  for (let head of heads) {
    if (!head.childNodes.length) {
      head.remove();
    }
  }
}
function collectFrameServerStyleTags(container) {
  let styles = [];
  let nodes = container.root instanceof Document ? [...Array.from(container.doc.head.childNodes), ...Array.from(container.doc.body.childNodes)] : container.childNodes;
  collectOwnedServerStyleTags(nodes, styles);
  return styles;
}
function collectOwnedServerStyleTags(nodes, styles) {
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    if (isFrameStart(node)) {
      let end = findEndMarker(node, isFrameStart, isFrameEnd);
      i = nodes.indexOf(end);
      continue;
    }
    if (node instanceof HTMLStyleElement && node.matches("style[data-rmx]")) {
      styles.push(node);
      continue;
    }
    if (node instanceof Element || node instanceof Document || node instanceof DocumentFragment) {
      collectOwnedServerStyleTags(Array.from(node.childNodes), styles);
    }
  }
}
function parseRmxDataScript(script) {
  try {
    return JSON.parse(script.textContent || "{}");
  } catch {
    console.error("[createFrame] Failed to parse rmx-data script");
    return {};
  }
}
function mergeRmxData(into, from) {
  if (from.h) {
    if (!into.h)
      into.h = {};
    copyOwnRmxEntries(into.h, from.h);
  }
  if (from.f) {
    if (!into.f)
      into.f = {};
    copyOwnRmxEntries(into.f, from.f);
  }
}
function copyOwnRmxEntries(target, source) {
  for (let key of Object.keys(source)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype")
      continue;
    if (!Object.hasOwn(source, key))
      continue;
    target[key] = source[key];
  }
}
function scheduleHydrationInContainer(container, context, initialHydrationTracker) {
  let hydrationMarkers = findHydrationMarkers(container);
  if (hydrationMarkers.length === 0)
    return;
  let hydrationData = context.data.h;
  if (!hydrationData)
    return;
  for (let marker of hydrationMarkers) {
    let entry = hydrationData[marker.id];
    if (!entry)
      continue;
    scheduleHydrationMarker(marker, entry, context, initialHydrationTracker);
  }
}
function scheduleHydrationMarker(marker, entry, context, initialHydrationTracker) {
  let done = initialHydrationTracker?.track();
  let key = `${entry.moduleUrl}#${entry.exportName}`;
  let hydrateWithComponent = (component) => {
    if (!isHydrationMarkerLive(marker, context))
      return;
    let vElement = createElement(component, entry.props);
    context.pendingClientEntries.set(marker.start, [marker.end, vElement]);
    hydrateRegion(vElement, marker.start, marker.end, context);
  };
  let cached = context.moduleCache.get(key);
  if (cached) {
    hydrateWithComponent(cached);
    done?.();
    return;
  }
  getOrStartModuleLoad(key, entry, marker.id, context).then((component) => {
    if (component) {
      hydrateWithComponent(component);
    }
  }).finally(() => {
    done?.();
  });
}
function getOrStartModuleLoad(key, entry, markerId, context) {
  let inFlight = context.moduleLoads.get(key);
  if (inFlight)
    return inFlight;
  let loadPromise = (async () => {
    try {
      let mod = await context.loadModule(entry.moduleUrl, entry.exportName);
      if (typeof mod !== "function") {
        throw new Error(`Export "${entry.exportName}" from "${entry.moduleUrl}" is not a function`);
      }
      context.moduleCache.set(key, mod);
      return mod;
    } catch (error) {
      console.error(`[createFrame] Failed to load module for ${markerId}:`, error);
      return void 0;
    } finally {
      context.moduleLoads.delete(key);
    }
  })();
  context.moduleLoads.set(key, loadPromise);
  return loadPromise;
}
function createElement(component, props) {
  let revivedProps = reviveSerializedValue(props);
  return jsx(component, revivedProps);
}
function reviveSerializedValue(value) {
  if (value === null || value === void 0)
    return value;
  if (typeof value !== "object")
    return value;
  if (Array.isArray(value)) {
    return value.map((item) => reviveSerializedValue(item));
  }
  let record = value;
  if (record.$rmxFrame === true) {
    let props = reviveSerializedObject(record.props);
    let key = reviveSerializedValue(record.key);
    return jsx(Frame, props, key);
  }
  if (record.$rmx === true && typeof record.type === "string") {
    let props = reviveSerializedObject(record.props);
    let key = reviveSerializedValue(record.key);
    return jsx(record.type, props, key);
  }
  let revived = {};
  for (let key in record) {
    revived[key] = reviveSerializedValue(record[key]);
  }
  return revived;
}
function reviveSerializedObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return {};
  let revived = reviveSerializedValue(value);
  if (!revived || typeof revived !== "object" || Array.isArray(revived))
    return {};
  return revived;
}
function hydrateRegion(vElement, start, end, context) {
  context.pendingClientEntries.delete(start);
  if (isHydratedVirtualRootMarker(start)) {
    start.$rmx.render(vElement);
    return;
  }
  let root = createRangeRoot([start, end], {
    scheduler: context.scheduler,
    frame: context.frame,
    styleManager: context.styleManager
  });
  root.addEventListener("error", (event) => {
    if (context.errorTarget === root)
      return;
    context.errorTarget.dispatchEvent(createComponentErrorEvent(getComponentError(event)));
  });
  Object.defineProperty(start, "$rmx", { value: root, enumerable: false });
  root.render(vElement);
}
async function createSubFrames(nodes, context, options) {
  let tasks = [];
  for (let i = 0; i < nodes.length; i++) {
    if (options?.signal?.aborted)
      break;
    let node = nodes[i];
    if (isFrameStart(node)) {
      let end = findEndMarker(node, isFrameStart, isFrameEnd);
      let existingFrame = context.frameInstances.get(node);
      let id = getFrameId2(node);
      let marker = context.data.f?.[id];
      if (existingFrame) {
        if (marker) {
          let frameMarker = { ...marker, id };
          tasks.push(existingFrame.updateMarker(frameMarker, options));
        } else {
          existingFrame.clearPendingTemplateWatch();
        }
      } else {
        if (marker) {
          let frameMarker = { ...marker, id };
          let subFrame = createFrame([node, end], {
            src: frameMarker.src,
            marker: frameMarker,
            topFrame: context.topFrame,
            errorTarget: context.errorTarget,
            loadModule: context.loadModule,
            resolveFrame: context.resolveFrame,
            pendingClientEntries: context.pendingClientEntries,
            scheduler: context.scheduler,
            data: context.data,
            moduleCache: context.moduleCache,
            moduleLoads: context.moduleLoads,
            frameInstances: context.frameInstances,
            namedFrames: context.namedFrames
          });
          context.frameInstances.set(node, subFrame);
        }
      }
      i = nodes.indexOf(end);
      continue;
    }
    if (node.childNodes && node.childNodes.length > 0) {
      tasks.push(createSubFrames(Array.from(node.childNodes), context, options));
    }
  }
  await Promise.all(tasks);
}
function isHydrationMarkerLive(marker, context) {
  if (!marker.start.isConnected || !marker.end.isConnected)
    return false;
  if (marker.start.parentNode !== marker.end.parentNode)
    return false;
  let startText = marker.start.data.trim();
  if (startText !== `rmx:h:${marker.id}`)
    return false;
  if (marker.end.data.trim() !== "/rmx:h")
    return false;
  let parent = marker.start.parentNode;
  if (!parent)
    return false;
  if (context.regionTailRef) {
    let startPosition = marker.start.compareDocumentPosition(context.regionTailRef);
    let endPosition = marker.end.compareDocumentPosition(context.regionTailRef);
    let tailFollowsStart = (startPosition & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    let tailFollowsEnd = (endPosition & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    if (!tailFollowsStart || !tailFollowsEnd)
      return false;
  }
  return true;
}
function removeVirtualRoots(nodes) {
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    if (isHydratedVirtualRootMarker(node)) {
      node.$rmx.dispose();
      let end = findEndMarker(node, isHydrationStart, isHydrationEnd);
      i = nodes.indexOf(end);
      continue;
    }
    if (node.childNodes && node.childNodes.length > 0) {
      removeVirtualRoots(Array.from(node.childNodes));
    }
  }
}
function disposeSubFrames(nodes, context) {
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    if (isFrameStart(node)) {
      let end = findEndMarker(node, isFrameStart, isFrameEnd);
      let subFrame = context.frameInstances.get(node);
      if (subFrame) {
        subFrame.dispose();
        context.frameInstances.delete(node);
      }
      i = nodes.indexOf(end);
      continue;
    }
    if (node.childNodes && node.childNodes.length > 0) {
      disposeSubFrames(Array.from(node.childNodes), context);
    }
  }
}
function getEarlyFrameContent(id) {
  let template = document.querySelector(`template#${id}`);
  if (template instanceof HTMLTemplateElement) {
    let fragment = template.content;
    template.remove();
    return fragment;
  }
  return null;
}
function setupTemplateObserver() {
  let root = document.body ?? document.documentElement ?? document;
  let observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
      for (let node of mutation.addedNodes) {
        collectAndPublishTemplates(node);
      }
    }
  });
  observer.observe(root, { childList: true, subtree: true });
  return observer;
}
function collectAndPublishTemplates(node) {
  if (node instanceof HTMLTemplateElement) {
    publishFrameTemplateElement(node);
    return;
  }
  if (!(node instanceof Element))
    return;
  let templates = Array.from(node.querySelectorAll("template"));
  for (let template of templates) {
    if (!(template instanceof HTMLTemplateElement))
      continue;
    publishFrameTemplateElement(template);
  }
}
function publishFrameTemplateElement(template) {
  if (!template.id)
    return;
  template.remove();
  publishFrameTemplate(template.id, template.content);
}
function publishFrameTemplate(id, fragment) {
  let listeners = frameTemplateListeners.get(id);
  if (!listeners || listeners.size === 0) {
    let queue = bufferedFrameTemplates.get(id);
    if (!queue) {
      queue = [];
      bufferedFrameTemplates.set(id, queue);
    }
    queue.push(fragment);
    return;
  }
  for (let listener of listeners) {
    listener(fragment.cloneNode(true));
  }
}
function consumeFrameTemplate(id) {
  let queue = bufferedFrameTemplates.get(id);
  if (!queue || queue.length === 0)
    return null;
  let fragment = queue.shift() ?? null;
  if (queue.length === 0) {
    bufferedFrameTemplates.delete(id);
  }
  return fragment;
}
function subscribeFrameTemplate(id, listener) {
  let listeners = frameTemplateListeners.get(id);
  if (!listeners) {
    listeners = /* @__PURE__ */ new Set();
    frameTemplateListeners.set(id, listeners);
  }
  listeners.add(listener);
  return () => {
    let current = frameTemplateListeners.get(id);
    if (!current)
      return;
    current.delete(listener);
    if (current.size === 0) {
      frameTemplateListeners.delete(id);
    }
  };
}
var COMPLETE_TEMPLATE_WITH_ID_PATTERN = /<template\b[^>]*\bid=(?:"([^"]+)"|'([^']+)')[^>]*>[\s\S]*?<\/template>/gi;
function extractTemplatesFromBuffer(doc, buffer, onTemplate) {
  let html = "";
  let cursor = 0;
  let hadMatch = false;
  COMPLETE_TEMPLATE_WITH_ID_PATTERN.lastIndex = 0;
  let match = COMPLETE_TEMPLATE_WITH_ID_PATTERN.exec(buffer);
  while (match) {
    hadMatch = true;
    let index = match.index;
    let fullMatch = match[0];
    let id = match[1] ?? match[2];
    let matchEnd = index + fullMatch.length;
    html += buffer.slice(cursor, index);
    if (id) {
      let parsed = createFragmentFromString(doc, fullMatch);
      let template = parsed.querySelector("template");
      if (template instanceof HTMLTemplateElement && template.id) {
        onTemplate(template.id, template.content);
      }
    }
    cursor = matchEnd;
    match = COMPLETE_TEMPLATE_WITH_ID_PATTERN.exec(buffer);
  }
  let tail = buffer.slice(cursor);
  if (tail === "")
    return { html, remainder: "" };
  let tailStart = tail.toLowerCase().lastIndexOf("<template");
  if (tailStart === -1) {
    return { html: html + tail, remainder: "" };
  }
  if (!hadMatch) {
    return {
      html: buffer.slice(0, tailStart),
      remainder: buffer.slice(tailStart)
    };
  }
  return {
    html: html + tail.slice(0, tailStart),
    remainder: tail.slice(tailStart)
  };
}
async function renderFrameStream(stream, doc, applyHtml) {
  let reader = stream.getReader();
  let decoder = new TextDecoder();
  let buffer = "";
  let html = "";
  let appliedOnce = false;
  try {
    while (true) {
      let { done, value } = await reader.read();
      if (done)
        break;
      buffer += decoder.decode(value, { stream: true });
      let parsed2 = extractTemplatesFromBuffer(doc, buffer, publishFrameTemplate);
      buffer = parsed2.remainder;
      if (parsed2.html !== "") {
        html += parsed2.html;
        let flushed = await consumeFlushBatches(html, applyHtml);
        appliedOnce = flushed.applied || appliedOnce;
        html = flushed.remainder;
      }
    }
    buffer += decoder.decode();
    let parsed = extractTemplatesFromBuffer(doc, buffer, publishFrameTemplate);
    html += parsed.html;
    buffer = parsed.remainder;
    if (buffer !== "") {
      html += buffer;
      buffer = "";
    }
    if (html !== "") {
      await applyHtml(html, "fragment");
      appliedOnce = true;
    }
    if (html === "" && !appliedOnce) {
      await applyHtml("", "fragment");
    }
  } finally {
    reader.releaseLock();
  }
}
async function consumeFlushBatches(html, applyHtml) {
  let applied = false;
  let cursor = 0;
  let marker = findFlushMarker(html, cursor);
  while (marker) {
    let batch = html.slice(cursor, marker.index);
    await applyHtml(batch, marker.kind);
    applied = true;
    cursor = marker.endIndex;
    marker = findFlushMarker(html, cursor);
  }
  return { applied, remainder: html.slice(cursor) };
}
function createContainer(root) {
  return Array.isArray(root) ? createCommentContainer(root) : createElementContainer(root);
}
function createElementContainer(root) {
  let doc = root instanceof Document ? root : root.ownerDocument ?? document;
  return {
    doc,
    root,
    get childNodes() {
      return Array.from(root.childNodes);
    }
  };
}
function createCommentContainer([start, end]) {
  let parent = end.parentNode;
  invariant(parent, "Invalid comment container");
  invariant(start.parentNode === parent, "Boundaries must share parent");
  let doc = parent.ownerDocument ?? document;
  let getChildNodesBetween = () => {
    let nodes = [];
    let node = start.nextSibling;
    while (node && node !== end) {
      nodes.push(node);
      node = node.nextSibling;
    }
    return nodes;
  };
  return {
    doc,
    root: parent,
    get childNodes() {
      return getChildNodesBetween();
    },
    regionTailRef: end,
    regionParent: parent
  };
}
function createFragmentFromString(doc, content) {
  let template = doc.createElement("template");
  template.innerHTML = stripDoctypeMarkup(content).trim();
  return template.content;
}
function isRemixNodeFrameContent(content) {
  return !(content instanceof ReadableStream || content instanceof DocumentFragment || typeof content === "string");
}
function findHydrationMarkers(container) {
  let results = [];
  forEachComment(container, (comment) => {
    let trimmed = comment.data.trim();
    if (!trimmed.startsWith("rmx:h:"))
      return;
    let id = trimmed.slice("rmx:h:".length);
    let end = findEndMarker(comment, isHydrationStart, isHydrationEnd);
    results.push({ id, start: comment, end });
  });
  return results;
}
function forEachComment(container, cb) {
  walkCommentsInNodes(container.childNodes, cb);
}
function walkCommentsInNodes(nodes, cb) {
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    if (isFrameStart(node)) {
      let end = findEndMarker(node, isFrameStart, isFrameEnd);
      i = nodes.indexOf(end);
      continue;
    }
    if (node.nodeType === Node.COMMENT_NODE)
      cb(node);
    if (node.childNodes && node.childNodes.length > 0) {
      walkCommentsInNodes(Array.from(node.childNodes), cb);
    }
  }
}
function isHydrationStart(node) {
  return node.data.trim().startsWith("rmx:h:");
}
function isHydrationEnd(node) {
  return node.data.trim() === "/rmx:h";
}
function isHydratedVirtualRootMarker(node) {
  return node instanceof Comment && "$rmx" in node;
}
function isFrameStart(node) {
  return node instanceof Comment && node.data.trim().startsWith("rmx:f:");
}
function isFrameEnd(node) {
  return node.data.trim() === "/rmx:f";
}
function getFrameId2(start) {
  let trimmed = start.data.trim();
  invariant(trimmed.startsWith("rmx:f:"), "Invalid frame start marker");
  return trimmed.slice("rmx:f:".length);
}
function findEndMarker(start, isStart, isEnd) {
  let node = start.nextSibling;
  let depth = 1;
  while (node) {
    if (node.nodeType === Node.COMMENT_NODE) {
      let comment = node;
      if (isStart(comment))
        depth++;
      else if (isEnd(comment)) {
        depth--;
        if (depth === 0)
          return comment;
      }
    }
    node = node.nextSibling;
  }
  throw new Error("End marker not found");
}

// ../../packages/studio/studio-core/src/nav-studio-panels-pure.ts
var ANALYTICS_NAV_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "funnels", label: "Funnels" },
  { id: "tracking-plan", label: "Tracking plan" },
  { id: "events", label: "Live events" }
];

// ../../packages/studio/studio-core/src/canvas-window-registry-pure.ts
function resolveCanvasWindowPresentation(def, ctx = {}) {
  if (ctx.globalShell && def.globalShell) {
    return {
      label: def.globalShell.label ?? def.label,
      title: def.globalShell.title ?? def.globalShell.label ?? def.title,
      hint: def.globalShell.hint ?? def.hint
    };
  }
  return { label: def.label, title: def.title, hint: def.hint };
}
var CANVAS_VIEW_MENU_GROUP_ORDER = [
  "studio",
  "canvas",
  "runtime",
  "panels"
];
var CANVAS_WINDOW_REGISTRY = [
  {
    id: "home",
    title: "Home",
    label: "Home",
    hint: "Studio overview",
    viewGroup: "studio",
    order: 10,
    urlFlag: "home",
    windowId: "studio-home",
    icon: "home",
    accentClass: "studio-win--home",
    visibility: { mode: "always" }
  },
  {
    id: "workspace",
    title: "Workspace Home",
    label: "Workspace Home",
    hint: "Selected workspace overview",
    globalShell: {
      label: "Workspaces",
      title: "Workspaces",
      hint: "All linked workspaces"
    },
    viewGroup: "studio",
    order: 20,
    urlFlag: "workspace",
    windowId: "studio-workspace",
    icon: "home",
    accentClass: "studio-win--workspace",
    visibility: { mode: "always" }
  },
  {
    id: "settings",
    title: "Settings",
    label: "Settings",
    hint: "Conductor config",
    viewGroup: "studio",
    order: 30,
    urlFlag: "settings",
    windowId: "studio-settings",
    icon: "cog-6-tooth",
    accentClass: "studio-win--settings",
    visibility: { mode: "always" }
  },
  {
    id: "code",
    title: "Code",
    label: "Code",
    hint: "Code window",
    viewGroup: "canvas",
    order: 10,
    urlFlag: "code",
    windowId: "studio-code",
    icon: "code-bracket",
    accentClass: "studio-win--code",
    visibility: { mode: "kinds", kinds: ["app"] }
  },
  {
    id: "live",
    title: "Website Preview",
    label: "Website Preview",
    hint: "Running website in Studio",
    viewGroup: "canvas",
    order: 20,
    urlFlag: "live",
    windowId: "studio-live",
    icon: "globe-alt",
    accentClass: "studio-win--live",
    visibility: { mode: "kinds", kinds: ["app"] }
  },
  {
    id: "design",
    title: "Design",
    label: "Design",
    hint: "Design canvas",
    viewGroup: "canvas",
    order: 30,
    urlFlag: "design",
    windowId: "studio-design",
    icon: "swatch",
    accentClass: "studio-win--design",
    visibility: { mode: "kinds", kinds: ["app"] }
  },
  {
    id: "runtimes",
    title: "Workspace Servers",
    label: "Workspace Servers",
    hint: "Host health & workspace Dev servers",
    viewGroup: "runtime",
    order: 10,
    urlFlag: "runtimes",
    windowId: "studio-runtimes",
    icon: "server",
    accentClass: "studio-win--runtimes",
    visibility: { mode: "kinds", kinds: ["app"] }
  },
  {
    id: "terminal",
    title: "Terminal",
    label: "Terminal",
    hint: "Process logs",
    viewGroup: "runtime",
    order: 20,
    urlFlag: "terminal",
    windowId: "studio-terminal",
    icon: "command-line",
    accentClass: "studio-win--terminal",
    visibility: { mode: "kinds", kinds: ["app"] }
  },
  {
    id: "chat",
    title: "Chat",
    label: "Chat",
    hint: "Harness chat",
    viewGroup: "runtime",
    order: 30,
    urlFlag: "chat",
    windowId: "studio-chat",
    icon: "chat-bubble-left-right",
    accentClass: "studio-win--chat",
    visibility: { mode: "always" }
  },
  {
    id: "calendar",
    title: "Calendar",
    label: "Calendar",
    hint: "Ledger events",
    viewGroup: "panels",
    order: 10,
    urlFlag: "calendar",
    windowId: "studio-calendar",
    icon: "calendar",
    accentClass: "studio-win--calendar",
    visibility: { mode: "always" }
  },
  {
    id: "media",
    title: "Media",
    label: "Media",
    hint: "Media library",
    viewGroup: "panels",
    order: 20,
    urlFlag: "media",
    windowId: "studio-media",
    icon: "photo",
    accentClass: "studio-win--media",
    visibility: { mode: "always" }
  },
  {
    id: "converter",
    title: "File Converter",
    label: "File Converter",
    hint: "Host FFmpeg convert",
    viewGroup: "panels",
    order: 30,
    urlFlag: "converter",
    windowId: "studio-converter",
    icon: "arrows-right-left",
    accentClass: "studio-win--converter",
    visibility: { mode: "kinds", kinds: ["app"] }
  },
  {
    id: "data",
    title: "Data",
    label: "Data",
    hint: "Destinations + SQLite",
    viewGroup: "panels",
    order: 40,
    urlFlag: "data",
    windowId: "studio-data",
    icon: "circle-stack",
    accentClass: "studio-win--data",
    visibility: { mode: "kinds", kinds: ["app"] }
  },
  {
    id: "sheets",
    title: "Sheets",
    label: "Sheets",
    hint: "Workbook / formulas",
    viewGroup: "panels",
    order: 45,
    urlFlag: "sheets",
    windowId: "studio-sheets",
    icon: "table-cells",
    accentClass: "studio-win--sheets",
    visibility: { mode: "kinds", kinds: ["app"] }
  },
  {
    id: "forms",
    title: "Forms",
    label: "Forms",
    hint: "Form inbox",
    viewGroup: "panels",
    order: 50,
    urlFlag: "forms",
    windowId: "studio-forms",
    icon: "inbox",
    accentClass: "studio-win--forms",
    visibility: { mode: "kinds", kinds: ["app"] }
  },
  {
    id: "integrations",
    title: "Integrations",
    label: "Integrations",
    hint: "Integration catalog",
    viewGroup: "panels",
    order: 60,
    urlFlag: "integrations",
    windowId: "studio-integrations",
    icon: "puzzle-piece",
    accentClass: "studio-win--integrations",
    visibility: { mode: "kinds", kinds: ["app"] }
  },
  {
    id: "workflows",
    title: "Workflows",
    label: "Workflows",
    hint: "n8n triggers",
    viewGroup: "panels",
    order: 70,
    urlFlag: "workflows",
    windowId: "studio-workflows",
    icon: "arrow-path",
    accentClass: "studio-win--workflows",
    visibility: { mode: "kinds", kinds: ["app"] }
  },
  {
    id: "email",
    title: "Email",
    label: "Email",
    hint: "Campaigns + deliverability",
    viewGroup: "panels",
    order: 80,
    urlFlag: "email",
    windowId: "studio-email",
    icon: "envelope",
    accentClass: "studio-win--email",
    visibility: { mode: "kinds", kinds: ["app"] }
  },
  {
    id: "messages",
    title: "Messages",
    label: "Messages",
    hint: "Inbox",
    viewGroup: null,
    order: 85,
    urlFlag: "messages",
    windowId: "studio-messages",
    icon: "inbox-stack",
    accentClass: "studio-win--messages",
    visibility: { mode: "kinds", kinds: ["app"] }
  },
  {
    id: "notifications",
    title: "Notifications",
    label: "Notifications",
    hint: "Unified feed + prefs",
    viewGroup: "studio",
    order: 12,
    urlFlag: "notifications",
    windowId: "studio-notifications",
    icon: "bell",
    accentClass: "studio-win--notifications",
    visibility: { mode: "always" }
  },
  {
    id: "analytics",
    title: "Analytics",
    label: "Analytics",
    hint: "First-party CDP",
    viewGroup: "panels",
    order: 90,
    urlFlag: "analytics",
    windowId: "studio-analytics",
    icon: "chart-bar",
    accentClass: "studio-win--analytics",
    visibility: { mode: "kinds", kinds: ["app"] }
  },
  {
    id: "memory",
    title: "Memory",
    label: "Memory",
    hint: "Agent beliefs + learn inbox",
    viewGroup: "panels",
    order: 100,
    urlFlag: "memory",
    windowId: "studio-memory",
    icon: "circle-stack",
    accentClass: "studio-win--memory",
    visibility: { mode: "always" }
  },
  {
    id: "roadmap",
    title: "Roadmap",
    label: "Roadmap",
    hint: "Studio + project kanban",
    viewGroup: "panels",
    order: 110,
    urlFlag: "roadmap",
    windowId: "studio-roadmap",
    icon: "queue-list",
    accentClass: "studio-win--roadmap",
    visibility: { mode: "always" }
  },
  {
    id: "notes",
    title: "Notes",
    label: "Notes",
    hint: "Scoped global vault (Studio + per-project select)",
    viewGroup: "panels",
    order: 120,
    urlFlag: "notes",
    windowId: "studio-notes",
    icon: "document-text",
    accentClass: "studio-win--notes",
    visibility: { mode: "always" }
  }
];
function canvasWindowIds() {
  return CANVAS_WINDOW_REGISTRY.map((d2) => d2.id);
}
function deriveViewMenuGroups(registry = CANVAS_WINDOW_REGISTRY, ctx = {}) {
  return CANVAS_VIEW_MENU_GROUP_ORDER.map((groupId) => {
    const items = registry.filter((d2) => d2.viewGroup === groupId).slice().sort((a, b2) => a.order - b2.order).map((d2) => {
      const face = resolveCanvasWindowPresentation(d2, ctx);
      return {
        id: d2.id,
        label: face.label,
        hint: face.hint
      };
    });
    return { id: groupId, items };
  }).filter((g2) => g2.items.length > 0);
}

// ../../packages/studio/studio-core/src/view-menu-pure.ts
var VIEW_MENU_GROUPS = deriveViewMenuGroups(CANVAS_WINDOW_REGISTRY);

// ../../packages/studio/studio-core/src/studio-service-registry-pure.ts
var STUDIO_SERVICE_DEFS = {
  n8n: {
    id: "n8n",
    label: "n8n",
    railLabel: "n8n - Workflows",
    defaultUrl: "http://127.0.0.1:5678",
    preview: true,
    order: 10
  },
  voice: {
    id: "voice",
    label: "Voice",
    railLabel: "Voice",
    defaultUrl: "http://127.0.0.1:4412/",
    preview: true,
    order: 20
  }
};
function listStudioServiceIds() {
  return Object.keys(STUDIO_SERVICE_DEFS).sort(
    (a, b2) => STUDIO_SERVICE_DEFS[a].order - STUDIO_SERVICE_DEFS[b2].order
  );
}

// ../../packages/studio/studio-core/src/chat-pure.ts
var CHAT_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
var STUDIO_ROOT_CHAT_TOOLS = [
  "tools.search",
  "tools.describe",
  "tools.call",
  "studio.config.get",
  "studio.config.patch",
  "studio.theme.get",
  "studio.theme.set",
  "studio.windowColors.get",
  "studio.windowColors.set",
  "studio.windows.list",
  "studio.experience.get",
  "studio.experience.set",
  "studio.experience.patch",
  "studio.nav",
  "studio.workspace.create",
  "studio.workspace.switch",
  "studio.workspace.list",
  "studio.workspace.get",
  "studio.workspace.link",
  "studio.workspace.patch",
  "studio.workspace.unlink",
  "studio.workspace.delete",
  "skills.list",
  "skills.read",
  "agents.room.list",
  "agents.room.claim",
  "agents.spawn",
  "memory.search",
  "memory.propose",
  "memory.get",
  "skills.forge",
  "mcp.list_tools",
  "mcp.call"
];
var STUDIO_ROOT_CHAT_TOOLS_ALL = [
  ...STUDIO_ROOT_CHAT_TOOLS,
  "files.list",
  "files.read",
  "files.write",
  "files.apply_proposal",
  "files.discard_proposal",
  "git.status",
  "git.diff",
  "git.commit",
  "git.push"
];

// ../../packages/studio/studio-core/src/preview-pure.ts
var PREVIEW_VIEWPORTS = Object.freeze({
  desktop: { id: "desktop", label: "Desktop", width: 1280, height: 800 },
  tablet: { id: "tablet", label: "Tablet", width: 820, height: 1180 },
  mobile: { id: "mobile", label: "Mobile", width: 390, height: 844 }
});
var PREVIEW_VIEWPORT_WIDTH = {
  desktop: PREVIEW_VIEWPORTS.desktop.width,
  tablet: PREVIEW_VIEWPORTS.tablet.width,
  mobile: PREVIEW_VIEWPORTS.mobile.width
};

// ../../packages/studio/studio-core/src/email-studio-pure.ts
var EMAIL_STUDIO_TABS = [
  "campaigns",
  "audiences",
  "deliverability"
];

// ../../packages/studio/studio-core/src/studio-nav-pure.ts
var KIND_SET = new Set(canvasWindowIds());
var ASECT_SET = new Set(ANALYTICS_NAV_SECTIONS.map((s) => s.id));
var EMAIL_TAB_SET = new Set(EMAIL_STUDIO_TABS);

// ../../packages/studio/studio-core/src/window-colors-pure.ts
var DEFAULT_WINDOW_KIND_HUES = {
  code: "blue",
  live: "emerald",
  design: "violet",
  runtimes: "slate",
  terminal: "cyan",
  chat: "amber",
  home: "cyan",
  workspace: "emerald",
  settings: "slate",
  calendar: "blue",
  media: "rose",
  converter: "orange",
  data: "cyan",
  sheets: "emerald",
  forms: "orange",
  integrations: "violet",
  workflows: "fuchsia",
  email: "cyan",
  messages: "blue",
  notifications: "amber",
  analytics: "violet",
  memory: "amber",
  roadmap: "lime",
  notes: "yellow"
};
var STUDIO_WINDOW_COLOR_KINDS = Object.keys(
  DEFAULT_WINDOW_KIND_HUES
);

// ../../packages/studio/studio-core/src/chat-model-pure.ts
var STUDIO_CHAT_MODELS = [
  { id: "claude-haiku-4-5", label: "Haiku 4.5" },
  { id: "claude-sonnet-4-5", label: "Sonnet 4.5" },
  { id: "claude-opus-4-5", label: "Opus 4.5" }
];
var KODY_CHAT_MODELS = [
  { id: "claude-haiku-4-5", label: "Haiku 4.5" },
  ...STUDIO_CHAT_MODELS.filter((m2) => m2.id !== "claude-haiku-4-5"),
  { id: "auto", label: "Kody default" },
  { id: "composer-2.5", label: "Composer 2.5 (if package supports)" },
  { id: "gpt-4.1", label: "GPT-4.1 (if package supports)" }
];

// ../../node_modules/.pnpm/marked@18.0.6/node_modules/marked/lib/marked.esm.js
function M() {
  return { async: false, breaks: false, extensions: null, gfm: true, hooks: null, pedantic: false, renderer: null, silent: false, tokenizer: null, walkTokens: null };
}
var T = M();
function N(l3) {
  T = l3;
}
var _ = { exec: () => null };
function E(l3) {
  let e = [];
  return (t) => {
    let n = Math.max(0, Math.min(3, t - 1)), s = e[n];
    return s || (s = l3(n), e[n] = s), s;
  };
}
function d(l3, e = "") {
  let t = typeof l3 == "string" ? l3 : l3.source, n = { replace: (s, r) => {
    let i = typeof r == "string" ? r : r.source;
    return i = i.replace(m.caret, "$1"), t = t.replace(s, i), n;
  }, getRegex: () => new RegExp(t, e) };
  return n;
}
var Te = ((l3 = "") => {
  try {
    return !!new RegExp("(?<=1)(?<!1)" + l3);
  } catch {
    return false;
  }
})();
var m = { codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm, outputLinkReplace: /\\([\[\]])/g, indentCodeCompensation: /^(\s+)(?:```)/, beginningSpace: /^\s+/, endingHash: /#$/, startingSpaceChar: /^ /, endingSpaceChar: / $/, nonSpaceChar: /[^ ]/, newLineCharGlobal: /\n/g, tabCharGlobal: /\t/g, multipleSpaceGlobal: /\s+/g, blankLine: /^[ \t]*$/, doubleBlankLine: /\n[ \t]*\n[ \t]*$/, blockquoteStart: /^ {0,3}>/, blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g, blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm, listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g, listIsTask: /^\[[ xX]\] +\S/, listReplaceTask: /^\[[ xX]\] +/, listTaskCheckbox: /\[[ xX]\]/, anyLine: /\n.*\n/, hrefBrackets: /^<(.*)>$/, tableDelimiter: /[:|]/, tableAlignChars: /^\||\| *$/g, tableRowBlankLine: /\n[ \t]*$/, tableAlignRight: /^ *-+: *$/, tableAlignCenter: /^ *:-+: *$/, tableAlignLeft: /^ *:-+ *$/, startATag: /^<a /i, endATag: /^<\/a>/i, startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i, endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i, startAngleBracket: /^</, endAngleBracket: />$/, pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/, unicodeAlphaNumeric: /[\p{L}\p{N}]/u, escapeTest: /[&<>"']/, escapeReplace: /[&<>"']/g, escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g, caret: /(^|[^\[])\^/g, percentDecode: /%25/g, findPipe: /\|/g, splitPipe: / \|/, slashPipe: /\\\|/g, carriageReturn: /\r\n|\r/g, spaceLine: /^ +$/gm, notSpaceStart: /^\S*/, endingNewline: /\n$/, listItemRegex: (l3) => new RegExp(`^( {0,3}${l3})((?:[	 ][^\\n]*)?(?:\\n|$))`), nextBulletRegex: E((l3) => new RegExp(`^ {0,${l3}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`)), hrRegex: E((l3) => new RegExp(`^ {0,${l3}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`)), fencesBeginRegex: E((l3) => new RegExp(`^ {0,${l3}}(?:\`\`\`|~~~)`)), headingBeginRegex: E((l3) => new RegExp(`^ {0,${l3}}#`)), htmlBeginRegex: E((l3) => new RegExp(`^ {0,${l3}}<(?:[a-z].*>|!--)`, "i")), blockquoteBeginRegex: E((l3) => new RegExp(`^ {0,${l3}}>`)) };
var Oe = /^(?:[ \t]*(?:\n|$))+/;
var we = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
var ye = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/;
var B = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
var Pe = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
var j = / {0,3}(?:[*+-]|\d{1,9}[.)])/;
var oe = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/;
var ae = d(oe).replace(/bull/g, j).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex();
var Se = d(oe).replace(/bull/g, j).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex();
var F = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/;
var $e = /^[^\n]+/;
var U = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/;
var Le = d(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", U).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex();
var _e = d(/^(bull)([ \t][^\n]*?)?(?:\n|$)/).replace(/bull/g, j).getRegex();
var H = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
var K = /<!--(?:-?>|[\s\S]*?(?:-->|$))/;
var ze = d("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>[^\\n]*\\n+|$)|<![A-Z][\\s\\S]*?(?:>[^\\n]*\\n+|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>[^\\n]*\\n+|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", K).replace("tag", H).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
var le = (l3) => d(F).replace("hr", B).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", l3).replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", H).getRegex();
var Me = le(/ {0,3}(?:[*+-]|1[.)])[ \t]+[^ \t\n]/);
var Ee = le(/ {0,3}(?:[*+-]|\d{1,9}[.)])[ \t]+[^ \t\n]/);
var Ie = d(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", Ee).getRegex();
var W = { blockquote: Ie, code: we, def: Le, fences: ye, heading: Pe, hr: B, html: ze, lheading: ae, list: _e, newline: Oe, paragraph: Me, table: _, text: $e };
var se = d("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", B).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", H).getRegex();
var Ae = { ...W, lheading: Se, table: se, paragraph: d(F).replace("hr", B).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", se).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", H).getRegex() };
var Ce = { ...W, html: d(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", K).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(), def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/, heading: /^(#{1,6})(.*)(?:\n+|$)/, fences: _, lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/, paragraph: d(F).replace("hr", B).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", ae).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex() };
var Be = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
var qe = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
var ue = /^( {2,}|\\)\n(?!\s*$)/;
var De = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
var I = /[\p{P}\p{S}]/u;
var Z = /[\s\p{P}\p{S}]/u;
var X = /[^\s\p{P}\p{S}]/u;
var ve = d(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, Z).getRegex();
var pe = /(?!~)[\p{P}\p{S}]/u;
var He = /(?!~)[\s\p{P}\p{S}]/u;
var Ze = /(?:[^\s\p{P}\p{S}]|~)/u;
var Ge = d(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", Te ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex();
var ce = /^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/;
var Ne = d(ce, "u").replace(/punct/g, I).getRegex();
var Qe = d(ce, "u").replace(/punct/g, pe).getRegex();
var he = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)";
var je = d(he, "gu").replace(/notPunctSpace/g, X).replace(/punctSpace/g, Z).replace(/punct/g, I).getRegex();
var Fe = d(he, "gu").replace(/notPunctSpace/g, Ze).replace(/punctSpace/g, He).replace(/punct/g, pe).getRegex();
var Ue = d("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, X).replace(/punctSpace/g, Z).replace(/punct/g, I).getRegex();
var Ke = d(/^~~?(?:((?!~)punct)|[^\s~])/, "u").replace(/punct/g, I).getRegex();
var We = "^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)";
var Xe = d(We, "gu").replace(/notPunctSpace/g, X).replace(/punctSpace/g, Z).replace(/punct/g, I).getRegex();
var Je = d(/\\(punct)/, "gu").replace(/punct/g, I).getRegex();
var Ve = d(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex();
var Ye = d(K).replace("(?:-->|$)", "-->").getRegex();
var et = d("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Ye).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex();
var v = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/;
var tt = d(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?\s*\)/).replace("label", v).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]+|(?=\))/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex();
var ke = d(/^!?\[(label)\]\[(ref)\]/).replace("label", v).replace("ref", U).getRegex();
var de = d(/^!?\[(ref)\](?:\[\])?/).replace("ref", U).getRegex();
var nt = d("reflink|nolink(?!\\()", "g").replace("reflink", ke).replace("nolink", de).getRegex();
var ie = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/;
var J = { _backpedal: _, anyPunctuation: Je, autolink: Ve, blockSkip: Ge, br: ue, code: qe, del: _, delLDelim: _, delRDelim: _, emStrongLDelim: Ne, emStrongRDelimAst: je, emStrongRDelimUnd: Ue, escape: Be, link: tt, nolink: de, punctuation: ve, reflink: ke, reflinkSearch: nt, tag: et, text: De, url: _ };
var rt = { ...J, link: d(/^!?\[(label)\]\((.*?)\)/).replace("label", v).getRegex(), reflink: d(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", v).getRegex() };
var Q = { ...J, emStrongRDelimAst: Fe, emStrongLDelim: Qe, delLDelim: Ke, delRDelim: Xe, url: d(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", ie).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(), _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/, del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/, text: d(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", ie).getRegex() };
var st = { ...Q, br: d(ue).replace("{2,}", "*").getRegex(), text: d(Q.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex() };
var q = { normal: W, gfm: Ae, pedantic: Ce };
var A = { normal: J, gfm: Q, breaks: st, pedantic: rt };
var it = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
var ge = (l3) => it[l3];
function O(l3, e) {
  if (e) {
    if (m.escapeTest.test(l3)) return l3.replace(m.escapeReplace, ge);
  } else if (m.escapeTestNoEncode.test(l3)) return l3.replace(m.escapeReplaceNoEncode, ge);
  return l3;
}
function V(l3) {
  try {
    l3 = encodeURI(l3).replace(m.percentDecode, "%");
  } catch {
    return null;
  }
  return l3;
}
function Y(l3, e) {
  let t = l3.replace(m.findPipe, (r, i, o) => {
    let u = false, a = i;
    for (; --a >= 0 && o[a] === "\\"; ) u = !u;
    return u ? "|" : " |";
  }), n = t.split(m.splitPipe), s = 0;
  if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), e) if (n.length > e) n.splice(e);
  else for (; n.length < e; ) n.push("");
  for (; s < n.length; s++) n[s] = n[s].trim().replace(m.slashPipe, "|");
  return n;
}
function $(l3, e, t) {
  let n = l3.length;
  if (n === 0) return "";
  let s = 0;
  for (; s < n; ) {
    let r = l3.charAt(n - s - 1);
    if (r === e && !t) s++;
    else if (r !== e && t) s++;
    else break;
  }
  return l3.slice(0, n - s);
}
function ee(l3) {
  let e = l3.split(`
`), t = e.length - 1;
  for (; t >= 0 && m.blankLine.test(e[t]); ) t--;
  return e.length - t <= 2 ? l3 : e.slice(0, t + 1).join(`
`);
}
function fe(l3, e) {
  if (l3.indexOf(e[1]) === -1) return -1;
  let t = 0;
  for (let n = 0; n < l3.length; n++) if (l3[n] === "\\") n++;
  else if (l3[n] === e[0]) t++;
  else if (l3[n] === e[1] && (t--, t < 0)) return n;
  return t > 0 ? -2 : -1;
}
function me(l3, e = 0) {
  let t = e, n = "";
  for (let s of l3) if (s === "	") {
    let r = 4 - t % 4;
    n += " ".repeat(r), t += r;
  } else n += s, t++;
  return n;
}
function xe(l3, e, t, n, s) {
  let r = e.href, i = e.title || null, o = l3[1].replace(s.other.outputLinkReplace, "$1");
  n.state.inLink = true;
  let u = { type: l3[0].charAt(0) === "!" ? "image" : "link", raw: t, href: r, title: i, text: o, tokens: n.inlineTokens(o) };
  return n.state.inLink = false, u;
}
function ot(l3, e, t) {
  let n = l3.match(t.other.indentCodeCompensation);
  if (n === null) return e;
  let s = n[1];
  return e.split(`
`).map((r) => {
    let i = r.match(t.other.beginningSpace);
    if (i === null) return r;
    let [o] = i;
    return o.length >= s.length ? r.slice(s.length) : r;
  }).join(`
`);
}
var w = class {
  options;
  rules;
  lexer;
  constructor(e) {
    this.options = e || T;
  }
  space(e) {
    let t = this.rules.block.newline.exec(e);
    if (t && t[0].length > 0) return { type: "space", raw: t[0] };
  }
  code(e) {
    let t = this.rules.block.code.exec(e);
    if (t) {
      let n = this.options.pedantic ? t[0] : ee(t[0]), s = n.replace(this.rules.other.codeRemoveIndent, "");
      return { type: "code", raw: n, codeBlockStyle: "indented", text: s };
    }
  }
  fences(e) {
    let t = this.rules.block.fences.exec(e);
    if (t) {
      let n = t[0], s = ot(n, t[3] || "", this.rules);
      return { type: "code", raw: n, lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2], text: s };
    }
  }
  heading(e) {
    let t = this.rules.block.heading.exec(e);
    if (t) {
      let n = t[2].trim();
      if (this.rules.other.endingHash.test(n)) {
        let s = $(n, "#");
        (this.options.pedantic || !s || this.rules.other.endingSpaceChar.test(s)) && (n = s.trim());
      }
      return { type: "heading", raw: $(t[0], `
`), depth: t[1].length, text: n, tokens: this.lexer.inline(n) };
    }
  }
  hr(e) {
    let t = this.rules.block.hr.exec(e);
    if (t) return { type: "hr", raw: $(t[0], `
`) };
  }
  blockquote(e) {
    let t = this.rules.block.blockquote.exec(e);
    if (t) {
      let n = $(t[0], `
`).split(`
`), s = "", r = "", i = [];
      for (; n.length > 0; ) {
        let o = false, u = [], a;
        for (a = 0; a < n.length; a++) if (this.rules.other.blockquoteStart.test(n[a])) u.push(n[a]), o = true;
        else if (!o) u.push(n[a]);
        else break;
        n = n.slice(a);
        let c = u.join(`
`), p = c.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
        s = s ? `${s}
${c}` : c, r = r ? `${r}
${p}` : p;
        let k = this.lexer.state.top;
        if (this.lexer.state.top = true, this.lexer.blockTokens(p, i, true), this.lexer.state.top = k, n.length === 0) break;
        let h = i.at(-1);
        if (h?.type === "code") break;
        if (h?.type === "blockquote") {
          let R = h, f = R.raw + `
` + n.join(`
`), S = this.blockquote(f);
          i[i.length - 1] = S, s = s.substring(0, s.length - R.raw.length) + S.raw, r = r.substring(0, r.length - R.text.length) + S.text;
          break;
        } else if (h?.type === "list") {
          let R = h, f = R.raw + `
` + n.join(`
`), S = this.list(f);
          i[i.length - 1] = S, s = s.substring(0, s.length - h.raw.length) + S.raw, r = r.substring(0, r.length - R.raw.length) + S.raw, n = f.substring(i.at(-1).raw.length).split(`
`);
          continue;
        }
      }
      return { type: "blockquote", raw: s, tokens: i, text: r };
    }
  }
  list(e) {
    let t = this.rules.block.list.exec(e);
    if (t) {
      let n = t[1].trim(), s = n.length > 1, r = { type: "list", raw: "", ordered: s, start: s ? +n.slice(0, -1) : "", loose: false, items: [] };
      n = s ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = s ? n : "[*+-]");
      let i = this.rules.other.listItemRegex(n), o = false;
      for (; e; ) {
        let a = false, c = "", p = "";
        if (!(t = i.exec(e)) || this.rules.block.hr.test(e)) break;
        c = t[0], e = e.substring(c.length);
        let k = me(t[2].split(`
`, 1)[0], t[1].length), h = e.split(`
`, 1)[0], R = !k.trim(), f = 0;
        if (this.options.pedantic ? (f = 2, p = k.trimStart()) : R ? f = t[1].length + 1 : (f = k.search(this.rules.other.nonSpaceChar), f = f > 4 ? 1 : f, p = k.slice(f), f += t[1].length), R && this.rules.other.blankLine.test(h) && (c += h + `
`, e = e.substring(h.length + 1), a = true), !a) {
          let S = this.rules.other.nextBulletRegex(f), te = this.rules.other.hrRegex(f), ne = this.rules.other.fencesBeginRegex(f), re = this.rules.other.headingBeginRegex(f), be = this.rules.other.htmlBeginRegex(f), Re = this.rules.other.blockquoteBeginRegex(f);
          for (; e; ) {
            let G = e.split(`
`, 1)[0], C;
            if (h = G, this.options.pedantic ? (h = h.replace(this.rules.other.listReplaceNesting, "  "), C = h) : C = h.replace(this.rules.other.tabCharGlobal, "    "), ne.test(h) || re.test(h) || be.test(h) || Re.test(h) || S.test(h) || te.test(h)) break;
            if (C.search(this.rules.other.nonSpaceChar) >= f || !h.trim()) p += `
` + C.slice(f);
            else {
              if (R || k.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || ne.test(k) || re.test(k) || te.test(k)) break;
              p += `
` + h;
            }
            R = !h.trim(), c += G + `
`, e = e.substring(G.length + 1), k = C.slice(f);
          }
        }
        r.loose || (o ? r.loose = true : this.rules.other.doubleBlankLine.test(c) && (o = true)), r.items.push({ type: "list_item", raw: c, task: !!this.options.gfm && this.rules.other.listIsTask.test(p), loose: false, text: p, tokens: [] }), r.raw += c;
      }
      let u = r.items.at(-1);
      if (u) u.raw = u.raw.trimEnd(), u.text = u.text.trimEnd();
      else return;
      r.raw = r.raw.trimEnd();
      for (let a of r.items) {
        this.lexer.state.top = false, a.tokens = this.lexer.blockTokens(a.text, []);
        let c = a.tokens[0];
        if (a.task && (c?.type === "text" || c?.type === "paragraph")) {
          a.text = a.text.replace(this.rules.other.listReplaceTask, ""), c.raw = c.raw.replace(this.rules.other.listReplaceTask, ""), c.text = c.text.replace(this.rules.other.listReplaceTask, "");
          for (let k = this.lexer.inlineQueue.length - 1; k >= 0; k--) if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[k].src)) {
            this.lexer.inlineQueue[k].src = this.lexer.inlineQueue[k].src.replace(this.rules.other.listReplaceTask, "");
            break;
          }
          let p = this.rules.other.listTaskCheckbox.exec(a.raw);
          if (p) {
            let k = { type: "checkbox", raw: p[0] + " ", checked: p[0] !== "[ ]" };
            a.checked = k.checked, r.loose ? a.tokens[0] && ["paragraph", "text"].includes(a.tokens[0].type) && "tokens" in a.tokens[0] && a.tokens[0].tokens ? (a.tokens[0].raw = k.raw + a.tokens[0].raw, a.tokens[0].text = k.raw + a.tokens[0].text, a.tokens[0].tokens.unshift(k)) : a.tokens.unshift({ type: "paragraph", raw: k.raw, text: k.raw, tokens: [k] }) : a.tokens.unshift(k);
          }
        } else a.task && (a.task = false);
        if (!r.loose) {
          let p = a.tokens.filter((h) => h.type === "space"), k = p.length > 0 && p.some((h) => this.rules.other.anyLine.test(h.raw));
          r.loose = k;
        }
      }
      if (r.loose) for (let a of r.items) {
        a.loose = true;
        for (let c of a.tokens) c.type === "text" && (c.type = "paragraph");
      }
      return r;
    }
  }
  html(e) {
    let t = this.rules.block.html.exec(e);
    if (t) {
      let n = ee(t[0]);
      return { type: "html", block: true, raw: n, pre: t[1] === "pre" || t[1] === "script" || t[1] === "style", text: n };
    }
  }
  def(e) {
    let t = this.rules.block.def.exec(e);
    if (t) {
      let n = t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), s = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", r = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
      return { type: "def", tag: n, raw: $(t[0], `
`), href: s, title: r };
    }
  }
  table(e) {
    let t = this.rules.block.table.exec(e);
    if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
    let n = Y(t[1]), s = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), r = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], i = { type: "table", raw: $(t[0], `
`), header: [], align: [], rows: [] };
    if (n.length === s.length) {
      for (let o of s) this.rules.other.tableAlignRight.test(o) ? i.align.push("right") : this.rules.other.tableAlignCenter.test(o) ? i.align.push("center") : this.rules.other.tableAlignLeft.test(o) ? i.align.push("left") : i.align.push(null);
      for (let o = 0; o < n.length; o++) i.header.push({ text: n[o], tokens: this.lexer.inline(n[o]), header: true, align: i.align[o] });
      for (let o of r) i.rows.push(Y(o, i.header.length).map((u, a) => ({ text: u, tokens: this.lexer.inline(u), header: false, align: i.align[a] })));
      return i;
    }
  }
  lheading(e) {
    let t = this.rules.block.lheading.exec(e);
    if (t) {
      let n = t[1].trim();
      return { type: "heading", raw: $(t[0], `
`), depth: t[2].charAt(0) === "=" ? 1 : 2, text: n, tokens: this.lexer.inline(n) };
    }
  }
  paragraph(e) {
    let t = this.rules.block.paragraph.exec(e);
    if (t) {
      let n = t[1].charAt(t[1].length - 1) === `
` ? t[1].slice(0, -1) : t[1];
      return { type: "paragraph", raw: t[0], text: n, tokens: this.lexer.inline(n) };
    }
  }
  text(e) {
    let t = this.rules.block.text.exec(e);
    if (t) return { type: "text", raw: t[0], text: t[0], tokens: this.lexer.inline(t[0]) };
  }
  escape(e) {
    let t = this.rules.inline.escape.exec(e);
    if (t) return { type: "escape", raw: t[0], text: t[1] };
  }
  tag(e) {
    let t = this.rules.inline.tag.exec(e);
    if (t) return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = true : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = false), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = true : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = false), { type: "html", raw: t[0], inLink: this.lexer.state.inLink, inRawBlock: this.lexer.state.inRawBlock, block: false, text: t[0] };
  }
  link(e) {
    let t = this.rules.inline.link.exec(e);
    if (t) {
      let n = t[2].trim();
      if (!this.options.pedantic && this.rules.other.startAngleBracket.test(n)) {
        if (!this.rules.other.endAngleBracket.test(n)) return;
        let i = $(n.slice(0, -1), "\\");
        if ((n.length - i.length) % 2 === 0) return;
      } else {
        let i = fe(t[2], "()");
        if (i === -2) return;
        if (i > -1) {
          let u = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + i;
          t[2] = t[2].substring(0, i), t[0] = t[0].substring(0, u).trim(), t[3] = "";
        }
      }
      let s = t[2], r = "";
      if (this.options.pedantic) {
        let i = this.rules.other.pedanticHrefTitle.exec(s);
        i && (s = i[1], r = i[3]);
      } else r = t[3] ? t[3].slice(1, -1) : "";
      return s = s.trim(), this.rules.other.startAngleBracket.test(s) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(n) ? s = s.slice(1) : s = s.slice(1, -1)), xe(t, { href: s && s.replace(this.rules.inline.anyPunctuation, "$1"), title: r && r.replace(this.rules.inline.anyPunctuation, "$1") }, t[0], this.lexer, this.rules);
    }
  }
  reflink(e, t) {
    let n;
    if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
      let s = (n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " "), r = t[s.toLowerCase()];
      if (!r) {
        let i = n[0].charAt(0);
        return { type: "text", raw: i, text: i };
      }
      return xe(n, r, n[0], this.lexer, this.rules);
    }
  }
  emStrong(e, t, n = "") {
    let s = this.rules.inline.emStrongLDelim.exec(e);
    if (!s || !s[1] && !s[2] && !s[3] && !s[4] || s[4] && n.match(this.rules.other.unicodeAlphaNumeric)) return;
    if (!(s[1] || s[3] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      let i = [...s[0]].length - 1, o, u, a = i, c = 0, p = s[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (p.lastIndex = 0, t = t.slice(-1 * e.length + i); (s = p.exec(t)) !== null; ) {
        if (o = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !o) continue;
        if (u = [...o].length, s[3] || s[4]) {
          a += u;
          continue;
        } else if ((s[5] || s[6]) && i % 3 && !((i + u) % 3)) {
          c += u;
          continue;
        }
        if (a -= u, a > 0) continue;
        u = Math.min(u, u + a + c);
        let k = [...s[0]][0].length, h = e.slice(0, i + s.index + k + u);
        if (Math.min(i, u) % 2) {
          let f = h.slice(1, -1);
          return { type: "em", raw: h, text: f, tokens: this.lexer.inlineTokens(f) };
        }
        let R = h.slice(2, -2);
        return { type: "strong", raw: h, text: R, tokens: this.lexer.inlineTokens(R) };
      }
    }
  }
  codespan(e) {
    let t = this.rules.inline.code.exec(e);
    if (t) {
      let n = t[2].replace(this.rules.other.newLineCharGlobal, " "), s = this.rules.other.nonSpaceChar.test(n), r = this.rules.other.startingSpaceChar.test(n) && this.rules.other.endingSpaceChar.test(n);
      return s && r && (n = n.substring(1, n.length - 1)), { type: "codespan", raw: t[0], text: n };
    }
  }
  br(e) {
    let t = this.rules.inline.br.exec(e);
    if (t) return { type: "br", raw: t[0] };
  }
  del(e, t, n = "") {
    let s = this.rules.inline.delLDelim.exec(e);
    if (!s) return;
    if (!(s[1] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      let i = [...s[0]].length - 1, o, u, a = i, c = this.rules.inline.delRDelim;
      for (c.lastIndex = 0, t = t.slice(-1 * e.length + i); (s = c.exec(t)) !== null; ) {
        if (o = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !o || (u = [...o].length, u !== i)) continue;
        if (s[3] || s[4]) {
          a += u;
          continue;
        }
        if (a -= u, a > 0) continue;
        u = Math.min(u, u + a);
        let p = [...s[0]][0].length, k = e.slice(0, i + s.index + p + u), h = k.slice(i, -i);
        return { type: "del", raw: k, text: h, tokens: this.lexer.inlineTokens(h) };
      }
    }
  }
  autolink(e) {
    let t = this.rules.inline.autolink.exec(e);
    if (t) {
      let n, s;
      return t[2] === "@" ? (n = t[1], s = "mailto:" + n) : (n = t[1], s = n), { type: "link", raw: t[0], text: n, href: s, tokens: [{ type: "text", raw: n, text: n }] };
    }
  }
  url(e) {
    let t;
    if (t = this.rules.inline.url.exec(e)) {
      let n, s;
      if (t[2] === "@") n = t[0], s = "mailto:" + n;
      else {
        let r;
        do
          r = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? "";
        while (r !== t[0]);
        n = t[0], t[1] === "www." ? s = "http://" + t[0] : s = t[0];
      }
      return { type: "link", raw: t[0], text: n, href: s, tokens: [{ type: "text", raw: n, text: n }] };
    }
  }
  inlineText(e) {
    let t = this.rules.inline.text.exec(e);
    if (t) {
      let n = this.lexer.state.inRawBlock;
      return { type: "text", raw: t[0], text: t[0], escaped: n };
    }
  }
};
var x = class l {
  tokens;
  options;
  state;
  inlineQueue;
  tokenizer;
  constructor(e) {
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = e || T, this.options.tokenizer = this.options.tokenizer || new w(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = { inLink: false, inRawBlock: false, top: true };
    let t = { other: m, block: q.normal, inline: A.normal };
    this.options.pedantic ? (t.block = q.pedantic, t.inline = A.pedantic) : this.options.gfm && (t.block = q.gfm, this.options.breaks ? t.inline = A.breaks : t.inline = A.gfm), this.tokenizer.rules = t;
  }
  static get rules() {
    return { block: q, inline: A };
  }
  static lex(e, t) {
    return new l(t).lex(e);
  }
  static lexInline(e, t) {
    return new l(t).inlineTokens(e);
  }
  lex(e) {
    e = e.replace(m.carriageReturn, `
`), this.blockTokens(e, this.tokens);
    for (let t = 0; t < this.inlineQueue.length; t++) {
      let n = this.inlineQueue[t];
      this.inlineTokens(n.src, n.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e, t = [], n = false) {
    this.tokenizer.lexer = this, this.options.pedantic && (e = e.replace(m.tabCharGlobal, "    ").replace(m.spaceLine, ""));
    let s = 1 / 0;
    for (; e; ) {
      if (e.length < s) s = e.length;
      else {
        this.infiniteLoopError(e.charCodeAt(0));
        break;
      }
      let r;
      if (this.options.extensions?.block?.some((o) => (r = o.call({ lexer: this }, e, t)) ? (e = e.substring(r.raw.length), t.push(r), true) : false)) continue;
      if (r = this.tokenizer.space(e)) {
        e = e.substring(r.raw.length);
        let o = t.at(-1);
        r.raw.length === 1 && o !== void 0 ? o.raw += `
` : t.push(r);
        continue;
      }
      if (r = this.tokenizer.code(e)) {
        e = e.substring(r.raw.length);
        let o = t.at(-1);
        o?.type === "paragraph" || o?.type === "text" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.text, this.inlineQueue.at(-1).src = o.text) : t.push(r);
        continue;
      }
      if (r = this.tokenizer.fences(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.heading(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.hr(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.blockquote(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.list(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.html(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.def(e)) {
        e = e.substring(r.raw.length);
        let o = t.at(-1);
        o?.type === "paragraph" || o?.type === "text" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.raw, this.inlineQueue.at(-1).src = o.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = { href: r.href, title: r.title }, t.push(r));
        continue;
      }
      if (r = this.tokenizer.table(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.lheading(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      let i = e;
      if (this.options.extensions?.startBlock) {
        let o = 1 / 0, u = e.slice(1), a;
        this.options.extensions.startBlock.forEach((c) => {
          a = c.call({ lexer: this }, u), typeof a == "number" && a >= 0 && (o = Math.min(o, a));
        }), o < 1 / 0 && o >= 0 && (i = e.substring(0, o + 1));
      }
      if (this.state.top && (r = this.tokenizer.paragraph(i))) {
        let o = t.at(-1);
        n && o?.type === "paragraph" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = o.text) : t.push(r), n = i.length !== e.length, e = e.substring(r.raw.length);
        continue;
      }
      if (r = this.tokenizer.text(e)) {
        e = e.substring(r.raw.length);
        let o = t.at(-1);
        o?.type === "text" ? (o.raw += (o.raw.endsWith(`
`) ? "" : `
`) + r.raw, o.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = o.text) : t.push(r);
        continue;
      }
      if (e) {
        this.infiniteLoopError(e.charCodeAt(0));
        break;
      }
    }
    return this.state.top = true, t;
  }
  inline(e, t = []) {
    return this.inlineQueue.push({ src: e, tokens: t }), t;
  }
  inlineTokens(e, t = []) {
    this.tokenizer.lexer = this;
    let n = e, s = null;
    if (this.tokens.links) {
      let a = Object.keys(this.tokens.links);
      if (a.length > 0) for (; (s = this.tokenizer.rules.inline.reflinkSearch.exec(n)) !== null; ) a.includes(s[0].slice(s[0].lastIndexOf("[") + 1, -1)) && (n = n.slice(0, s.index) + "[" + "a".repeat(s[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (s = this.tokenizer.rules.inline.anyPunctuation.exec(n)) !== null; ) n = n.slice(0, s.index) + "++" + n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    let r;
    for (; (s = this.tokenizer.rules.inline.blockSkip.exec(n)) !== null; ) r = s[2] ? s[2].length : 0, n = n.slice(0, s.index + r) + "[" + "a".repeat(s[0].length - r - 2) + "]" + n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    n = this.options.hooks?.emStrongMask?.call({ lexer: this }, n) ?? n;
    let i = false, o = "", u = 1 / 0;
    for (; e; ) {
      if (e.length < u) u = e.length;
      else {
        this.infiniteLoopError(e.charCodeAt(0));
        break;
      }
      i || (o = ""), i = false;
      let a;
      if (this.options.extensions?.inline?.some((p) => (a = p.call({ lexer: this }, e, t)) ? (e = e.substring(a.raw.length), t.push(a), true) : false)) continue;
      if (a = this.tokenizer.escape(e)) {
        e = e.substring(a.raw.length), t.push(a);
        continue;
      }
      if (a = this.tokenizer.tag(e)) {
        e = e.substring(a.raw.length), t.push(a);
        continue;
      }
      if (a = this.tokenizer.link(e)) {
        e = e.substring(a.raw.length), t.push(a);
        continue;
      }
      if (a = this.tokenizer.reflink(e, this.tokens.links)) {
        e = e.substring(a.raw.length);
        let p = t.at(-1);
        a.type === "text" && p?.type === "text" ? (p.raw += a.raw, p.text += a.text) : t.push(a);
        continue;
      }
      if (a = this.tokenizer.emStrong(e, n, o)) {
        e = e.substring(a.raw.length), t.push(a);
        continue;
      }
      if (a = this.tokenizer.codespan(e)) {
        e = e.substring(a.raw.length), t.push(a);
        continue;
      }
      if (a = this.tokenizer.br(e)) {
        e = e.substring(a.raw.length), t.push(a);
        continue;
      }
      if (a = this.tokenizer.del(e, n, o)) {
        e = e.substring(a.raw.length), t.push(a);
        continue;
      }
      if (a = this.tokenizer.autolink(e)) {
        e = e.substring(a.raw.length), t.push(a);
        continue;
      }
      if (!this.state.inLink && (a = this.tokenizer.url(e))) {
        e = e.substring(a.raw.length), t.push(a);
        continue;
      }
      let c = e;
      if (this.options.extensions?.startInline) {
        let p = 1 / 0, k = e.slice(1), h;
        this.options.extensions.startInline.forEach((R) => {
          h = R.call({ lexer: this }, k), typeof h == "number" && h >= 0 && (p = Math.min(p, h));
        }), p < 1 / 0 && p >= 0 && (c = e.substring(0, p + 1));
      }
      if (a = this.tokenizer.inlineText(c)) {
        e = e.substring(a.raw.length), a.raw.slice(-1) !== "_" && (o = a.raw.slice(-1)), i = true;
        let p = t.at(-1);
        p?.type === "text" ? (p.raw += a.raw, p.text += a.text) : t.push(a);
        continue;
      }
      if (e) {
        this.infiniteLoopError(e.charCodeAt(0));
        break;
      }
    }
    return t;
  }
  infiniteLoopError(e) {
    let t = "Infinite loop on byte: " + e;
    if (this.options.silent) console.error(t);
    else throw new Error(t);
  }
};
var y = class {
  options;
  parser;
  constructor(e) {
    this.options = e || T;
  }
  space(e) {
    return "";
  }
  code({ text: e, lang: t, escaped: n }) {
    let s = (t || "").match(m.notSpaceStart)?.[0], r = e.replace(m.endingNewline, "") + `
`;
    return s ? '<pre><code class="language-' + O(s) + '">' + (n ? r : O(r, true)) + `</code></pre>
` : "<pre><code>" + (n ? r : O(r, true)) + `</code></pre>
`;
  }
  blockquote({ tokens: e }) {
    return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
  }
  html({ text: e }) {
    return e;
  }
  def(e) {
    return "";
  }
  heading({ tokens: e, depth: t }) {
    return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
  }
  hr(e) {
    return `<hr>
`;
  }
  list(e) {
    let t = e.ordered, n = e.start, s = "";
    for (let o = 0; o < e.items.length; o++) {
      let u = e.items[o];
      s += this.listitem(u);
    }
    let r = t ? "ol" : "ul", i = t && n !== 1 ? ' start="' + n + '"' : "";
    return "<" + r + i + `>
` + s + "</" + r + `>
`;
  }
  listitem(e) {
    return `<li>${this.parser.parse(e.tokens)}</li>
`;
  }
  checkbox({ checked: e }) {
    return "<input " + (e ? 'checked="" ' : "") + 'disabled="" type="checkbox"> ';
  }
  paragraph({ tokens: e }) {
    return `<p>${this.parser.parseInline(e)}</p>
`;
  }
  table(e) {
    let t = "", n = "";
    for (let r = 0; r < e.header.length; r++) n += this.tablecell(e.header[r]);
    t += this.tablerow({ text: n });
    let s = "";
    for (let r = 0; r < e.rows.length; r++) {
      let i = e.rows[r];
      n = "";
      for (let o = 0; o < i.length; o++) n += this.tablecell(i[o]);
      s += this.tablerow({ text: n });
    }
    return s && (s = `<tbody>${s}</tbody>`), `<table>
<thead>
` + t + `</thead>
` + s + `</table>
`;
  }
  tablerow({ text: e }) {
    return `<tr>
${e}</tr>
`;
  }
  tablecell(e) {
    let t = this.parser.parseInline(e.tokens), n = e.header ? "th" : "td";
    return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>
`;
  }
  strong({ tokens: e }) {
    return `<strong>${this.parser.parseInline(e)}</strong>`;
  }
  em({ tokens: e }) {
    return `<em>${this.parser.parseInline(e)}</em>`;
  }
  codespan({ text: e }) {
    return `<code>${O(e, true)}</code>`;
  }
  br(e) {
    return "<br>";
  }
  del({ tokens: e }) {
    return `<del>${this.parser.parseInline(e)}</del>`;
  }
  link({ href: e, title: t, tokens: n }) {
    let s = this.parser.parseInline(n), r = V(e);
    if (r === null) return s;
    e = r;
    let i = '<a href="' + e + '"';
    return t && (i += ' title="' + O(t) + '"'), i += ">" + s + "</a>", i;
  }
  image({ href: e, title: t, text: n, tokens: s }) {
    s && (n = this.parser.parseInline(s, this.parser.textRenderer));
    let r = V(e);
    if (r === null) return O(n);
    e = r;
    let i = `<img src="${e}" alt="${O(n)}"`;
    return t && (i += ` title="${O(t)}"`), i += ">", i;
  }
  text(e) {
    return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : "escaped" in e && e.escaped ? e.text : O(e.text);
  }
};
var L = class {
  strong({ text: e }) {
    return e;
  }
  em({ text: e }) {
    return e;
  }
  codespan({ text: e }) {
    return e;
  }
  del({ text: e }) {
    return e;
  }
  html({ text: e }) {
    return e;
  }
  text({ text: e }) {
    return e;
  }
  link({ text: e }) {
    return "" + e;
  }
  image({ text: e }) {
    return "" + e;
  }
  br() {
    return "";
  }
  checkbox({ raw: e }) {
    return e;
  }
};
var b = class l2 {
  options;
  renderer;
  textRenderer;
  constructor(e) {
    this.options = e || T, this.options.renderer = this.options.renderer || new y(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new L();
  }
  static parse(e, t) {
    return new l2(t).parse(e);
  }
  static parseInline(e, t) {
    return new l2(t).parseInline(e);
  }
  parse(e) {
    this.renderer.parser = this;
    let t = "";
    for (let n = 0; n < e.length; n++) {
      let s = e[n];
      if (this.options.extensions?.renderers?.[s.type]) {
        let i = s, o = this.options.extensions.renderers[i.type].call({ parser: this }, i);
        if (o !== false || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "def", "paragraph", "text"].includes(i.type)) {
          t += o || "";
          continue;
        }
      }
      let r = s;
      switch (r.type) {
        case "space": {
          t += this.renderer.space(r);
          break;
        }
        case "hr": {
          t += this.renderer.hr(r);
          break;
        }
        case "heading": {
          t += this.renderer.heading(r);
          break;
        }
        case "code": {
          t += this.renderer.code(r);
          break;
        }
        case "table": {
          t += this.renderer.table(r);
          break;
        }
        case "blockquote": {
          t += this.renderer.blockquote(r);
          break;
        }
        case "list": {
          t += this.renderer.list(r);
          break;
        }
        case "checkbox": {
          t += this.renderer.checkbox(r);
          break;
        }
        case "html": {
          t += this.renderer.html(r);
          break;
        }
        case "def": {
          t += this.renderer.def(r);
          break;
        }
        case "paragraph": {
          t += this.renderer.paragraph(r);
          break;
        }
        case "text": {
          t += this.renderer.text(r);
          break;
        }
        default: {
          let i = 'Token with "' + r.type + '" type was not found.';
          if (this.options.silent) return console.error(i), "";
          throw new Error(i);
        }
      }
    }
    return t;
  }
  parseInline(e, t = this.renderer) {
    this.renderer.parser = this;
    let n = "";
    for (let s = 0; s < e.length; s++) {
      let r = e[s];
      if (this.options.extensions?.renderers?.[r.type]) {
        let o = this.options.extensions.renderers[r.type].call({ parser: this }, r);
        if (o !== false || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(r.type)) {
          n += o || "";
          continue;
        }
      }
      let i = r;
      switch (i.type) {
        case "escape": {
          n += t.text(i);
          break;
        }
        case "html": {
          n += t.html(i);
          break;
        }
        case "link": {
          n += t.link(i);
          break;
        }
        case "image": {
          n += t.image(i);
          break;
        }
        case "checkbox": {
          n += t.checkbox(i);
          break;
        }
        case "strong": {
          n += t.strong(i);
          break;
        }
        case "em": {
          n += t.em(i);
          break;
        }
        case "codespan": {
          n += t.codespan(i);
          break;
        }
        case "br": {
          n += t.br(i);
          break;
        }
        case "del": {
          n += t.del(i);
          break;
        }
        case "text": {
          n += t.text(i);
          break;
        }
        default: {
          let o = 'Token with "' + i.type + '" type was not found.';
          if (this.options.silent) return console.error(o), "";
          throw new Error(o);
        }
      }
    }
    return n;
  }
};
var P = class {
  options;
  block;
  constructor(e) {
    this.options = e || T;
  }
  static passThroughHooks = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens", "emStrongMask"]);
  static passThroughHooksRespectAsync = /* @__PURE__ */ new Set(["preprocess", "postprocess", "processAllTokens"]);
  preprocess(e) {
    return e;
  }
  postprocess(e) {
    return e;
  }
  processAllTokens(e) {
    return e;
  }
  emStrongMask(e) {
    return e;
  }
  provideLexer(e = this.block) {
    return e ? x.lex : x.lexInline;
  }
  provideParser(e = this.block) {
    return e ? b.parse : b.parseInline;
  }
};
var D = class {
  defaults = M();
  options = this.setOptions;
  parse = this.parseMarkdown(true);
  parseInline = this.parseMarkdown(false);
  Parser = b;
  Renderer = y;
  TextRenderer = L;
  Lexer = x;
  Tokenizer = w;
  Hooks = P;
  constructor(...e) {
    this.use(...e);
  }
  walkTokens(e, t) {
    let n = [];
    for (let s of e) switch (n = n.concat(t.call(this, s)), s.type) {
      case "table": {
        let r = s;
        for (let i of r.header) n = n.concat(this.walkTokens(i.tokens, t));
        for (let i of r.rows) for (let o of i) n = n.concat(this.walkTokens(o.tokens, t));
        break;
      }
      case "list": {
        let r = s;
        n = n.concat(this.walkTokens(r.items, t));
        break;
      }
      default: {
        let r = s;
        this.defaults.extensions?.childTokens?.[r.type] ? this.defaults.extensions.childTokens[r.type].forEach((i) => {
          let o = r[i].flat(1 / 0);
          n = n.concat(this.walkTokens(o, t));
        }) : r.tokens && (n = n.concat(this.walkTokens(r.tokens, t)));
      }
    }
    return n;
  }
  use(...e) {
    let t = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return e.forEach((n) => {
      let s = { ...n };
      if (s.async = this.defaults.async || s.async || false, n.extensions && (n.extensions.forEach((r) => {
        if (!r.name) throw new Error("extension name required");
        if ("renderer" in r) {
          let i = t.renderers[r.name];
          i ? t.renderers[r.name] = function(...o) {
            let u = r.renderer.apply(this, o);
            return u === false && (u = i.apply(this, o)), u;
          } : t.renderers[r.name] = r.renderer;
        }
        if ("tokenizer" in r) {
          if (!r.level || r.level !== "block" && r.level !== "inline") throw new Error("extension level must be 'block' or 'inline'");
          let i = t[r.level];
          i ? i.unshift(r.tokenizer) : t[r.level] = [r.tokenizer], r.start && (r.level === "block" ? t.startBlock ? t.startBlock.push(r.start) : t.startBlock = [r.start] : r.level === "inline" && (t.startInline ? t.startInline.push(r.start) : t.startInline = [r.start]));
        }
        "childTokens" in r && r.childTokens && (t.childTokens[r.name] = r.childTokens);
      }), s.extensions = t), n.renderer) {
        let r = this.defaults.renderer || new y(this.defaults);
        for (let i in n.renderer) {
          if (!(i in r)) throw new Error(`renderer '${i}' does not exist`);
          if (["options", "parser"].includes(i)) continue;
          let o = i, u = n.renderer[o], a = r[o];
          r[o] = (...c) => {
            let p = u.apply(r, c);
            return p === false && (p = a.apply(r, c)), p || "";
          };
        }
        s.renderer = r;
      }
      if (n.tokenizer) {
        let r = this.defaults.tokenizer || new w(this.defaults);
        for (let i in n.tokenizer) {
          if (!(i in r)) throw new Error(`tokenizer '${i}' does not exist`);
          if (["options", "rules", "lexer"].includes(i)) continue;
          let o = i, u = n.tokenizer[o], a = r[o];
          r[o] = (...c) => {
            let p = u.apply(r, c);
            return p === false && (p = a.apply(r, c)), p;
          };
        }
        s.tokenizer = r;
      }
      if (n.hooks) {
        let r = this.defaults.hooks || new P();
        for (let i in n.hooks) {
          if (!(i in r)) throw new Error(`hook '${i}' does not exist`);
          if (["options", "block"].includes(i)) continue;
          let o = i, u = n.hooks[o], a = r[o];
          P.passThroughHooks.has(i) ? r[o] = (c) => {
            if (this.defaults.async && P.passThroughHooksRespectAsync.has(i)) return (async () => {
              let k = await u.call(r, c);
              return a.call(r, k);
            })();
            let p = u.call(r, c);
            return a.call(r, p);
          } : r[o] = (...c) => {
            if (this.defaults.async) return (async () => {
              let k = await u.apply(r, c);
              return k === false && (k = await a.apply(r, c)), k;
            })();
            let p = u.apply(r, c);
            return p === false && (p = a.apply(r, c)), p;
          };
        }
        s.hooks = r;
      }
      if (n.walkTokens) {
        let r = this.defaults.walkTokens, i = n.walkTokens;
        s.walkTokens = function(o) {
          let u = [];
          return u.push(i.call(this, o)), r && (u = u.concat(r.call(this, o))), u;
        };
      }
      this.defaults = { ...this.defaults, ...s };
    }), this;
  }
  setOptions(e) {
    return this.defaults = { ...this.defaults, ...e }, this;
  }
  lexer(e, t) {
    return x.lex(e, t ?? this.defaults);
  }
  parser(e, t) {
    return b.parse(e, t ?? this.defaults);
  }
  parseMarkdown(e) {
    return (n, s) => {
      let r = { ...s }, i = { ...this.defaults, ...r }, o = this.onError(!!i.silent, !!i.async);
      if (this.defaults.async === true && r.async === false) return o(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof n > "u" || n === null) return o(new Error("marked(): input parameter is undefined or null"));
      if (typeof n != "string") return o(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
      if (i.hooks && (i.hooks.options = i, i.hooks.block = e), i.async) return (async () => {
        let u = i.hooks ? await i.hooks.preprocess(n) : n, c = await (i.hooks ? await i.hooks.provideLexer(e) : e ? x.lex : x.lexInline)(u, i), p = i.hooks ? await i.hooks.processAllTokens(c) : c;
        i.walkTokens && await Promise.all(this.walkTokens(p, i.walkTokens));
        let h = await (i.hooks ? await i.hooks.provideParser(e) : e ? b.parse : b.parseInline)(p, i);
        return i.hooks ? await i.hooks.postprocess(h) : h;
      })().catch(o);
      try {
        i.hooks && (n = i.hooks.preprocess(n));
        let a = (i.hooks ? i.hooks.provideLexer(e) : e ? x.lex : x.lexInline)(n, i);
        i.hooks && (a = i.hooks.processAllTokens(a)), i.walkTokens && this.walkTokens(a, i.walkTokens);
        let p = (i.hooks ? i.hooks.provideParser(e) : e ? b.parse : b.parseInline)(a, i);
        return i.hooks && (p = i.hooks.postprocess(p)), p;
      } catch (u) {
        return o(u);
      }
    };
  }
  onError(e, t) {
    return (n) => {
      if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
        let s = "<p>An error occurred:</p><pre>" + O(n.message + "", true) + "</pre>";
        return t ? Promise.resolve(s) : s;
      }
      if (t) return Promise.reject(n);
      throw n;
    };
  }
};
var z = new D();
function g(l3, e) {
  return z.parse(l3, e);
}
g.options = g.setOptions = function(l3) {
  return z.setOptions(l3), g.defaults = z.defaults, N(g.defaults), g;
};
g.getDefaults = M;
g.defaults = T;
g.use = function(...l3) {
  return z.use(...l3), g.defaults = z.defaults, N(g.defaults), g;
};
g.walkTokens = function(l3, e) {
  return z.walkTokens(l3, e);
};
g.parseInline = z.parseInline;
g.Parser = b;
g.parser = b.parse;
g.Renderer = y;
g.TextRenderer = L;
g.Lexer = x;
g.lexer = x.lex;
g.Tokenizer = w;
g.Hooks = P;
g.parse = g;
var Kt = g.options;
var Wt = g.setOptions;
var Xt = g.use;
var Jt = g.walkTokens;
var Vt = g.parseInline;
var en = b.parse;
var tn = x.lex;

// ../../packages/studio/studio-core/src/chat-context-usage-pure.ts
var CONTEXT_USAGE_RING_RADIUS = 9;
var CONTEXT_USAGE_RING_CIRCUMFERENCE = 2 * Math.PI * CONTEXT_USAGE_RING_RADIUS;

// ../../packages/studio/studio-core/src/calendar-events-pure.ts
var CALENDAR_EVENT_KINDS = [
  { id: "chat", label: "Chats" },
  { id: "write", label: "Writes" },
  { id: "workflow", label: "Automations" },
  { id: "ship", label: "Ships" }
];
var CALENDAR_KIND_FILTERS = [
  { id: "all", label: "All" },
  ...CALENDAR_EVENT_KINDS
];
var ALL_CALENDAR_EVENT_KINDS = CALENDAR_EVENT_KINDS.map((k) => k.id);

// ../../packages/studio/studio-core/src/automation-pure.ts
var AUTOMATION_EVENT_NAMES = [
  "content.page.published",
  "content.page.unpublished",
  "record.blog.published",
  "record.blog.scheduled",
  "form.submitted",
  "auth.user.registered",
  "auth.user.login",
  "consent.updated",
  "analytics.event",
  "workflow.manual",
  "content.scheduled",
  "email.campaign.sent"
];
var EVENT_SET = new Set(AUTOMATION_EVENT_NAMES);
var DEFAULT_N8N_BASE_URL = STUDIO_SERVICE_DEFS.n8n.defaultUrl.replace(
  /\/+$/,
  ""
);

// ../../packages/studio/studio-core/src/dbhub-dsn-pure.ts
function buildDbhubSqliteDsn(filePath) {
  const raw = filePath.trim();
  if (!raw) {
    throw new Error("buildDbhubSqliteDsn: empty path");
  }
  if (raw.startsWith("sqlite:")) return raw;
  const p = raw.replace(/\\/g, "/");
  if (/^[A-Za-z]:\//.test(p)) {
    return `sqlite:///${p}`;
  }
  if (p.startsWith("/")) {
    return `sqlite://${p}`;
  }
  const rel = p.replace(/^\.\//, "");
  return `sqlite:///${rel}`;
}
function defaultDbhubD1StandInPath(destinationId) {
  const id = destinationId.trim() || "primary-d1";
  return `.data/${id}.sqlite`;
}
function dbhubStdioNpxArgs(input) {
  const args = [
    "-y",
    "@bytebase/dbhub@latest",
    "--transport",
    "stdio",
    "--dsn",
    input.dsn
  ];
  if (input.id?.trim()) {
    args.push("--id", input.id.trim());
  }
  return args;
}

// ../../packages/studio/studio-core/src/mcp-starter-packs-pure.ts
var DEFAULT_DBHUB_D1_DSN = buildDbhubSqliteDsn(
  defaultDbhubD1StandInPath("primary-d1")
);
var MCP_STARTER_PACKS = [
  {
    id: "n8n-local",
    label: "n8n (local)",
    description: "Local n8n MCP at :5678 \u2014 set N8N_MCP_TOKEN",
    server: {
      id: "n8n-local",
      kind: "http",
      enabled: true,
      url: "http://127.0.0.1:5678/mcp-server/http",
      label: "n8n MCP",
      authHeaderEnv: "N8N_MCP_TOKEN"
    }
  },
  {
    id: "filesystem-stdio",
    label: "Filesystem (stdio)",
    description: "Official filesystem MCP via npx (cwd = project when used)",
    server: {
      id: "filesystem",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "."],
      label: "Filesystem"
    }
  },
  {
    id: "dbhub-d1",
    label: "DBHub (D1 / SQLite)",
    description: "DBHub MCP on project .data/primary-d1.sqlite \u2014 run with project cwd; swap DSN for other destinations",
    server: {
      id: "dbhub-d1",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: dbhubStdioNpxArgs({ dsn: DEFAULT_DBHUB_D1_DSN, id: "studio-d1" }),
      label: "DBHub D1"
    }
  },
  {
    id: "studio-http",
    label: "Studio HTTP twin",
    description: "This Studio API as MCP (:3847) \u2014 usually already present",
    server: {
      id: "studio-http",
      kind: "http",
      enabled: true,
      url: "http://127.0.0.1:3847",
      label: "Studio HTTP twin"
    }
  }
];

// ../../packages/studio/studio-core/src/capability-catalog-pure.ts
function mcpRowsFromStarterPacks() {
  return MCP_STARTER_PACKS.map((pack) => ({
    id: `mcp:${pack.id}`,
    kind: "mcp",
    label: pack.label,
    description: pack.description,
    install: { kind: "mcp-starter-pack", ref: pack.id },
    auth: pack.server.authHeaderEnv != null ? { kind: "env", env: pack.server.authHeaderEnv } : { kind: "none" }
  }));
}
var CAPABILITY_CATALOG = [
  {
    id: "harness:anthropic",
    kind: "harness",
    label: "Anthropic (Claude API)",
    description: "Studio AI loop via ANTHROPIC_API_KEY \u2014 default Hosted path",
    install: { kind: "config-flag", ref: "anthropic" },
    auth: { kind: "env", env: "ANTHROPIC_API_KEY" }
  },
  {
    id: "harness:cursor",
    kind: "harness",
    label: "Cursor Agent",
    description: "Host Cursor Agent CLI (cursor-agent) + login",
    install: {
      kind: "host-cli-script",
      ref: "cursor",
      bin: "cursor-agent"
    },
    auth: { kind: "cli-login" }
  },
  {
    id: "harness:hermes",
    kind: "harness",
    label: "Hermes",
    description: "Host Hermes CLI (hermes chat)",
    install: { kind: "host-cli-script", ref: "hermes", bin: "hermes" },
    auth: { kind: "cli-login" }
  },
  {
    id: "harness:grok",
    kind: "harness",
    label: "Grok Build",
    description: "Host Grok Build CLI (grok) \u2014 `grok login` or XAI_API_KEY",
    install: { kind: "host-cli-script", ref: "grok", bin: "grok" },
    // Primary: grok login → ~/.grok/auth.json; headless also accepts XAI_API_KEY.
    auth: { kind: "cli-login", env: "XAI_API_KEY" }
  },
  {
    id: "harness:kody",
    kind: "harness",
    label: "Kody",
    description: "Remote Kody /api/chat SSE",
    install: { kind: "config-flag", ref: "kody" },
    auth: { kind: "url-env", env: "KODY_CHAT_URL" }
  },
  ...mcpRowsFromStarterPacks(),
  {
    id: "skill:chrome",
    kind: "skill",
    label: "Chrome skill",
    description: "Studio chrome MCP guidance (skills.read id=chrome)",
    install: { kind: "skill-enable", ref: "chrome" },
    auth: { kind: "none" }
  },
  {
    id: "integration:n8n",
    kind: "integration",
    label: "n8n automation",
    description: "Project automation via n8n \u2014 pair with mcp:n8n-local",
    install: { kind: "config-flag", ref: "n8n" },
    auth: { kind: "env", env: "N8N_MCP_TOKEN" },
    dependsOn: ["mcp:n8n-local"]
  }
];

// ../../packages/studio/studio-core/src/home-widget-registry-pure.ts
var HOME_WIDGET_REGISTRY = [
  {
    id: "greeting",
    label: "Greeting",
    description: "Welcome line using profile display name",
    kind: "peek",
    defaultSize: { w: 2, h: 1 },
    sizes: [
      { w: 2, h: 1 },
      { w: 3, h: 1 },
      { w: 4, h: 1 },
      { w: 2, h: 2 },
      { w: 4, h: 2 }
    ]
  },
  {
    id: "activity",
    label: "Activity",
    description: "Recent chats and calendar events",
    kind: "peek",
    defaultSize: { w: 2, h: 2 },
    // Cap h at 2 so Activity stays band-aligned with Calendar (uniform Home).
    sizes: [
      { w: 1, h: 1 },
      { w: 2, h: 1 },
      { w: 2, h: 2 },
      { w: 3, h: 2 },
      { w: 4, h: 2 }
    ]
  },
  {
    id: "calendar-week",
    label: "Calendar week",
    description: "Compact week strip \u2014 opens Calendar",
    kind: "peek",
    defaultSize: { w: 2, h: 2 },
    sizes: [
      { w: 1, h: 1 },
      { w: 2, h: 1 },
      { w: 2, h: 2 },
      { w: 3, h: 2 },
      { w: 4, h: 2 }
    ]
  },
  {
    id: "workspaces",
    label: "Workspaces",
    description: "Workspace chips \u2014 select or open",
    kind: "peek",
    defaultSize: { w: 2, h: 1 },
    sizes: [
      { w: 1, h: 1 },
      { w: 2, h: 1 },
      { w: 3, h: 1 },
      { w: 4, h: 1 },
      { w: 2, h: 2 },
      { w: 4, h: 2 }
    ]
  },
  {
    id: "app-launcher",
    label: "App launcher",
    description: "Open a DeskPane window (props.kind = canvas kind)",
    kind: "launch",
    defaultSize: { w: 1, h: 2 },
    sizes: [
      { w: 1, h: 2 },
      { w: 1, h: 1 },
      { w: 2, h: 1 },
      { w: 2, h: 2 }
    ],
    acceptsProps: true
  },
  {
    id: "apps-folder",
    label: "Apps folder",
    description: "Group of app launchers (props.kinds = canvas kinds)",
    kind: "launch",
    defaultSize: { w: 2, h: 2 },
    sizes: [
      { w: 1, h: 1 },
      { w: 2, h: 1 },
      { w: 2, h: 2 },
      { w: 3, h: 2 },
      { w: 4, h: 2 },
      { w: 2, h: 3 }
    ],
    acceptsProps: true
  }
];
var BY_ID = new Map(HOME_WIDGET_REGISTRY.map((d2) => [d2.id, d2]));

// ../../packages/studio/studio-core/src/directory-pure.ts
function clampDirectoryPage(page, totalPages) {
  const max = Math.max(1, totalPages);
  if (!Number.isFinite(page) || page < 1) return 1;
  if (page > max) return max;
  return Math.floor(page);
}
function paginateDirectory(items, page, pageSize) {
  const size = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 9;
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / size) || 1);
  const safePage = clampDirectoryPage(page, totalPages);
  const start = (safePage - 1) * size;
  return {
    items: items.slice(start, start + size),
    page: safePage,
    pageSize: size,
    total,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages
  };
}
function filterDirectoryByQuery(items, query, fields) {
  const q2 = query.trim().toLowerCase();
  if (!q2) return [...items];
  return items.filter(
    (item) => fields(item).some((f) => (f ?? "").toLowerCase().includes(q2))
  );
}
function filterDirectoryByCategory(items, categoryId, match) {
  const id = categoryId.trim().toLowerCase();
  if (!id || id === "all") return [...items];
  return items.filter((item) => match(item, id));
}

// ../../packages/studio/studio-core/src/studio-rail-pure.ts
function studioServiceRailItems() {
  return listStudioServiceIds().map((id) => {
    const def = STUDIO_SERVICE_DEFS[id];
    return {
      kind: "service",
      id,
      label: def.railLabel,
      serviceId: id,
      url: def.defaultUrl
    };
  });
}
var N8N_STUDIO_RAIL_ITEM = studioServiceRailItems().find((i) => i.id === "n8n");
var VOICE_STUDIO_RAIL_ITEM = studioServiceRailItems().find((i) => i.id === "voice");
var MESSAGES_STUDIO_RAIL_ITEM = {
  kind: "window",
  id: "messages",
  label: "Messages",
  window: "messages"
};
var NOTIFICATIONS_STUDIO_RAIL_ITEM = {
  kind: "window",
  id: "notifications",
  label: "Notifications",
  window: "notifications"
};
var STUDIO_RAIL_ITEMS = [
  { kind: "window", id: "home", label: "Home", window: "home" },
  NOTIFICATIONS_STUDIO_RAIL_ITEM,
  ...studioServiceRailItems(),
  MESSAGES_STUDIO_RAIL_ITEM
];

// ../../packages/studio/studio-core/src/left-rail-layout-pure.ts
var DEFAULT_LEFT_RAIL_LAYOUT = {
  zones: ["studio", "chats", "workspaces", "global-chat"],
  workspaceSlots: ["nav", "files"]
};

// ../../packages/studio/studio-core/src/converter-presets-pure.ts
var CONVERTER_PRESETS = [
  {
    id: "mp4-h264",
    label: "MP4 (H.264 + AAC)",
    ext: "mp4",
    kind: "video"
  },
  {
    id: "webm-vp9",
    label: "WebM (VP9)",
    ext: "webm",
    kind: "video"
  },
  { id: "mp3", label: "MP3 audio", ext: "mp3", kind: "audio" },
  { id: "gif", label: "GIF (short clip)", ext: "gif", kind: "gif" },
  { id: "image-webp", label: "WebP image", ext: "webp", kind: "image" },
  { id: "image-png", label: "PNG image", ext: "png", kind: "image" }
];
var PRESET_BY_ID = new Map(CONVERTER_PRESETS.map((p) => [p.id, p]));

// ../../packages/studio/studio-core/src/markdown-pure.ts
g.setOptions({
  gfm: true,
  // Single newlines in Source → <br> on Live (authors expect Enter to show).
  breaks: true
});

// ../../packages/studio/studio-core/src/terminal-scrollback-pure.ts
var TERMINAL_SHELL_SCROLLBACK_BYTES = 512 * 1024;
var TERMINAL_CLIENT_OUTPUT_MAX_BYTES = 1024 * 1024;

// ../../packages/studio/studio-core/src/harness-policy-pure.ts
var BUILTIN_HARNESS_IDS = {
  /**
   * Legacy alias for the Claude Messages API path.
   * Not shown in the composer; normalize to `anthropic`.
   */
  studio: "studio",
  /** Claude Messages API + progressive Studio MCP tools (API harness). */
  anthropic: "anthropic",
  cursor: "cursor",
  kody: "kody",
  hermes: "hermes",
  grok: "grok",
  electric: "electric"
};
var REGISTERED_HARNESS_IDS = [
  BUILTIN_HARNESS_IDS.studio,
  BUILTIN_HARNESS_IDS.anthropic,
  BUILTIN_HARNESS_IDS.cursor,
  BUILTIN_HARNESS_IDS.kody,
  BUILTIN_HARNESS_IDS.hermes,
  BUILTIN_HARNESS_IDS.grok,
  BUILTIN_HARNESS_IDS.electric
];
var COMPOSER_HARNESS_IDS = [
  BUILTIN_HARNESS_IDS.cursor,
  BUILTIN_HARNESS_IDS.anthropic,
  BUILTIN_HARNESS_IDS.kody,
  BUILTIN_HARNESS_IDS.hermes,
  BUILTIN_HARNESS_IDS.grok
];

// ../../packages/studio/studio-core/src/mcp-directory-pure.ts
var DBHUB_D1_DSN = buildDbhubSqliteDsn(
  defaultDbhubD1StandInPath("primary-d1")
);
var MCP_DIRECTORY_CATALOG = [
  {
    id: "pack:n8n-local",
    title: "n8n",
    description: "Workflow automation \u2014 local MCP at :5678 (set N8N_MCP_TOKEN).",
    category: "automation",
    icon: "bolt",
    popular: true,
    server: MCP_STARTER_PACKS.find((p) => p.id === "n8n-local").server
  },
  {
    id: "pack:filesystem",
    title: "Filesystem",
    description: "Read and write project files via official MCP filesystem server.",
    category: "local",
    icon: "folder",
    popular: true,
    server: MCP_STARTER_PACKS.find((p) => p.id === "filesystem-stdio").server
  },
  {
    id: "pack:studio-http",
    title: "Studio HTTP",
    description: "This Studio API as MCP \u2014 same tools the AI tab uses.",
    category: "studio",
    icon: "server",
    popular: true,
    server: MCP_STARTER_PACKS.find((p) => p.id === "studio-http").server
  },
  {
    id: "pack:memory",
    title: "Memory",
    description: "Persistent notes for the agent via MCP memory server.",
    category: "other",
    icon: "circle-stack",
    popular: true,
    server: {
      id: "memory",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-memory"],
      label: "Memory"
    }
  },
  {
    id: "pack:github",
    title: "GitHub",
    description: "Repos, issues, and PRs through the GitHub MCP server.",
    category: "remote",
    icon: "globe",
    popular: true,
    server: {
      id: "github",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      label: "GitHub",
      authHeaderEnv: "GITHUB_PERSONAL_ACCESS_TOKEN"
    }
  },
  {
    id: "pack:postgres",
    title: "PostgreSQL",
    description: "Query a Postgres database from the agent (stdio MCP).",
    category: "local",
    icon: "circle-stack",
    server: {
      id: "postgres",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-postgres"],
      label: "PostgreSQL"
    }
  },
  {
    id: "pack:brave-search",
    title: "Brave Search",
    description: "Optional paid Brave Search API MCP. Prefer built-in web.search + local SearXNG (pnpm searxng:dev) \u2014 no API key.",
    category: "remote",
    icon: "globe",
    server: {
      id: "brave-search",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-brave-search"],
      label: "Brave Search",
      authHeaderEnv: "BRAVE_API_KEY"
    }
  },
  {
    id: "pack:puppeteer",
    title: "Puppeteer",
    description: "Browse and screenshot pages with a headless browser MCP.",
    category: "automation",
    icon: "cog",
    server: {
      id: "puppeteer",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-puppeteer"],
      label: "Puppeteer"
    }
  },
  {
    id: "pack:sqlite",
    title: "SQLite",
    description: "Local SQLite database access for structured project data.",
    category: "local",
    icon: "circle-stack",
    server: {
      id: "sqlite",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-sqlite"],
      label: "SQLite"
    }
  },
  {
    id: "pack:dbhub-d1",
    title: "DBHub (D1 Studio)",
    description: "Token-efficient SQL MCP for the project D1 stand-in (.data/primary-d1.sqlite). Pair with the Data window table browser.",
    category: "local",
    icon: "circle-stack",
    popular: true,
    server: {
      id: "dbhub-d1",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: dbhubStdioNpxArgs({ dsn: DBHUB_D1_DSN, id: "studio-d1" }),
      label: "DBHub D1"
    }
  },
  {
    id: "pack:slack",
    title: "Slack",
    description: "Post and read Slack channels when the Slack MCP is configured.",
    category: "other",
    icon: "chat",
    server: {
      id: "slack",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-slack"],
      label: "Slack",
      authHeaderEnv: "SLACK_BOT_TOKEN"
    }
  },
  {
    id: "pack:fetch",
    title: "Fetch",
    description: "HTTP fetch utility for APIs and public URLs.",
    category: "remote",
    icon: "cloud",
    popular: true,
    server: {
      id: "fetch",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-fetch"],
      label: "Fetch"
    }
  },
  {
    id: "pack:time",
    title: "Time",
    description: "Time and timezone helpers for scheduling-aware agents.",
    category: "other",
    icon: "cog",
    server: {
      id: "time",
      kind: "stdio",
      enabled: true,
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-time"],
      label: "Time"
    }
  }
];

// ../../packages/studio/studio-core/src/workspace-rail-experience-pure.ts
var DEFAULT_WORKSPACE_RAIL_SLOTS = DEFAULT_LEFT_RAIL_LAYOUT.workspaceSlots;

// ../../packages/library/components/src/remix/directory/directory-classes.ts
var DIRECTORY_CLASS_DEFAULTS = {
  shell: "flex min-h-0 min-w-0 flex-1 flex-col gap-4",
  header: "flex flex-col gap-1",
  title: "m-0 text-lg font-semibold tracking-tight",
  lead: "m-0 max-w-[62ch] text-sm leading-relaxed opacity-80",
  layout: "flex min-h-0 min-w-0 flex-1 gap-4 max-md:flex-col max-md:gap-2",
  nav: "flex w-44 shrink-0 flex-col gap-4 max-md:w-full max-md:flex-row max-md:flex-nowrap max-md:items-center max-md:gap-2 max-md:overflow-x-auto",
  navGroup: "flex flex-col gap-1 max-md:min-w-0 max-md:flex-1 max-md:flex-row max-md:flex-nowrap max-md:items-center max-md:gap-1.5 max-md:overflow-x-auto",
  navLabel: "px-1 text-[10px] font-semibold uppercase tracking-[0.08em] opacity-70 max-md:shrink-0 max-md:px-0",
  navBtn: "inline-flex min-h-8 cursor-pointer items-center rounded-md border border-transparent px-2.5 py-1.5 text-left text-sm max-md:min-h-9 max-md:shrink-0 max-md:whitespace-nowrap max-md:px-3",
  navBtnActive: "inline-flex min-h-8 cursor-pointer items-center rounded-md border px-2.5 py-1.5 text-left text-sm font-medium max-md:min-h-9 max-md:shrink-0 max-md:whitespace-nowrap max-md:px-3",
  /** Hosts should scope card-grid CQs to this column (`@container`), not the outer pane. */
  main: "@container flex min-w-0 flex-1 flex-col gap-3",
  toolbar: "flex flex-wrap items-center gap-2",
  searchWrap: "flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-2.5 py-1.5",
  search: "min-w-0 flex-1 border-0 bg-transparent text-sm outline-none",
  grid: "grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
  empty: "m-0 px-4 py-6 text-center text-sm opacity-70",
  /** Always one row — hosts must not pass flex-wrap / flex-col. */
  pager: "flex shrink-0 flex-row items-center justify-between gap-3 border-t px-3.5 py-2",
  pagerMeta: "min-w-0 flex-1 truncate text-xs leading-none opacity-70",
  pagerActions: "inline-flex shrink-0 items-center gap-1.5",
  btn: "inline-flex cursor-pointer items-center gap-1 rounded-md border px-2.5 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50",
  searchIcon: "size-4 shrink-0 opacity-60"
};
function mergeDirectoryClasses(override) {
  if (!override) return { ...DIRECTORY_CLASS_DEFAULTS };
  return { ...DIRECTORY_CLASS_DEFAULTS, ...override };
}

// ../../packages/library/ui-icons/src/create-icon.tsx
function resolveClass(props, fallback) {
  return props.class ?? props.className ?? fallback;
}
function glyphEl(glyph, key) {
  const a = glyph.attrs;
  switch (glyph.tag) {
    case "path":
      return /* @__PURE__ */ jsx("path", { d: a.d, fill: a.fill, "fill-rule": a["fill-rule"], "clip-rule": a["clip-rule"] }, key);
    case "circle":
      return /* @__PURE__ */ jsx(
        "circle",
        {
          cx: a.cx,
          cy: a.cy,
          r: a.r,
          fill: a.fill
        },
        key
      );
    case "rect":
      return /* @__PURE__ */ jsx(
        "rect",
        {
          x: a.x,
          y: a.y,
          width: a.width,
          height: a.height,
          rx: a.rx,
          ry: a.ry,
          fill: a.fill
        },
        key
      );
    case "line":
      return /* @__PURE__ */ jsx(
        "line",
        {
          x1: a.x1,
          y1: a.y1,
          x2: a.x2,
          y2: a.y2
        },
        key
      );
    case "polyline":
      return /* @__PURE__ */ jsx("polyline", { points: a.points, fill: a.fill }, key);
    case "polygon":
      return /* @__PURE__ */ jsx("polygon", { points: a.points, fill: a.fill }, key);
    default:
      return null;
  }
}
function createOutlineIcon(glyphs) {
  return function OutlineIcon(props = {}) {
    return /* @__PURE__ */ jsx(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        "stroke-width": "1.5",
        stroke: "currentColor",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        class: resolveClass(props, "size-5 shrink-0"),
        "aria-hidden": props.title ? void 0 : "true",
        "data-slot": "icon",
        children: [
          props.title ? /* @__PURE__ */ jsx("title", { children: props.title }) : null,
          glyphs.map((g2, i) => glyphEl(g2, i))
        ]
      }
    );
  };
}

// ../../packages/library/ui-icons/src/generated/heroicons/outline/magnifying-glass.json
var magnifying_glass_default = [
  {
    tag: "path",
    attrs: {
      d: "M21 21L15.8033 15.8033M15.8033 15.8033C17.1605 14.4461 18 12.5711 18 10.5C18 6.35786 14.6421 3 10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18C12.5711 18 14.4461 17.1605 15.8033 15.8033Z"
    }
  }
];

// ../../packages/library/ui-icons/src/24/outline/magnifying-glass.ts
var MagnifyingGlassIcon = createOutlineIcon(magnifying_glass_default);

// ../../packages/library/components/src/remix/directory/directory-view.tsx
function renderDirectory(props) {
  const {
    on: on2,
    title,
    lead,
    navGroups,
    category,
    setCategory,
    search,
    setSearch,
    pageResult,
    setPage,
    renderCard,
    toolbarExtra,
    emptyLabel = "No matches.",
    componentId = "directory",
    searchPlaceholder = "Search\u2026",
    renderPager
  } = props;
  const ui = mergeDirectoryClasses(props.classes);
  return /* @__PURE__ */ jsx("div", { class: ui.shell, "data-as-component": componentId, children: [
    /* @__PURE__ */ jsx("header", { class: ui.header, children: [
      /* @__PURE__ */ jsx("h2", { class: ui.title, children: title }),
      lead ? /* @__PURE__ */ jsx("p", { class: ui.lead, children: lead }) : null
    ] }),
    /* @__PURE__ */ jsx("div", { class: ui.layout, children: [
      /* @__PURE__ */ jsx("nav", { class: ui.nav, "aria-label": "Directory filters", children: navGroups.map((group) => /* @__PURE__ */ jsx("div", { class: ui.navGroup, children: [
        /* @__PURE__ */ jsx("span", { class: ui.navLabel, children: group.label }),
        group.items.map((item) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            class: category() === item.id ? ui.navBtnActive : ui.navBtn,
            "aria-pressed": category() === item.id ? "true" : "false",
            mix: [
              on2("click", () => {
                setCategory(item.id);
                setPage(1);
              })
            ],
            children: item.label
          },
          item.id
        ))
      ] }, group.id)) }),
      /* @__PURE__ */ jsx("div", { class: ui.main, children: [
        /* @__PURE__ */ jsx("div", { class: ui.toolbar, children: [
          /* @__PURE__ */ jsx("label", { class: ui.searchWrap, children: [
            /* @__PURE__ */ jsx("span", { class: "sr-only", children: "Search" }),
            MagnifyingGlassIcon({
              class: ui.searchIcon ?? "size-4 shrink-0"
            }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "search",
                class: ui.search,
                placeholder: searchPlaceholder,
                value: search(),
                mix: [
                  on2("input", (e) => {
                    setSearch(e.currentTarget.value);
                    setPage(1);
                  })
                ]
              }
            )
          ] }),
          toolbarExtra ? toolbarExtra() : null
        ] }),
        pageResult().items.length === 0 ? /* @__PURE__ */ jsx("p", { class: ui.empty, children: emptyLabel }) : /* @__PURE__ */ jsx("div", { class: ui.grid, children: pageResult().items.map((entry) => renderCard(entry)) }),
        renderPager ? renderPager({
          page: pageResult().page,
          totalPages: pageResult().totalPages,
          total: pageResult().total,
          hasPrev: pageResult().hasPrev,
          hasNext: pageResult().hasNext,
          setPage
        }) : /* @__PURE__ */ jsx("div", { class: ui.pager, children: [
          /* @__PURE__ */ jsx("span", { class: ui.pagerMeta, children: pageResult().total === 0 ? "0 results" : `Page ${pageResult().page} of ${pageResult().totalPages} \xB7 ${pageResult().total} total` }),
          /* @__PURE__ */ jsx("div", { class: ui.pagerActions, children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                class: ui.btn,
                disabled: !pageResult().hasPrev,
                mix: [
                  on2(
                    "click",
                    () => setPage(Math.max(1, pageResult().page - 1))
                  )
                ],
                children: "Previous"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                class: ui.btn,
                disabled: !pageResult().hasNext,
                mix: [on2("click", () => setPage(pageResult().page + 1))],
                children: "Next"
              }
            )
          ] })
        ] })
      ] })
    ] })
  ] });
}

// ../../packages/library/ui-icons/src/generated/heroicons/outline/bolt.json
var bolt_default = [
  {
    tag: "path",
    attrs: {
      d: "M3.75 13.5L14.25 2.25L12 10.5H20.25L9.75 21.75L12 13.5H3.75Z"
    }
  }
];

// ../../packages/library/ui-icons/src/24/outline/bolt.ts
var BoltIcon = createOutlineIcon(bolt_default);

// ../../packages/library/ui-icons/src/generated/heroicons/outline/chat-bubble-left-right.json
var chat_bubble_left_right_default = [
  {
    tag: "path",
    attrs: {
      d: "M20.25 8.51104C21.1341 8.79549 21.75 9.6392 21.75 10.6082V14.8938C21.75 16.0304 20.9026 16.9943 19.7697 17.0867C19.4308 17.1144 19.0909 17.1386 18.75 17.1592V20.25L15.75 17.25C14.3963 17.25 13.0556 17.1948 11.7302 17.0866C11.4319 17.0623 11.1534 16.9775 10.9049 16.8451M20.25 8.51104C20.0986 8.46232 19.9393 8.43 19.7739 8.41628C18.4472 8.30616 17.1051 8.25 15.75 8.25C14.3948 8.25 13.0528 8.30616 11.7261 8.41627C10.595 8.51015 9.75 9.47323 9.75 10.6082V14.8937C9.75 15.731 10.2099 16.4746 10.9049 16.8451M20.25 8.51104V6.63731C20.25 5.01589 19.0983 3.61065 17.4903 3.40191C15.4478 3.13676 13.365 3 11.2503 3C9.13533 3 7.05233 3.13678 5.00963 3.40199C3.40173 3.61074 2.25 5.01598 2.25 6.63738V12.8626C2.25 14.484 3.40173 15.8893 5.00964 16.098C5.58661 16.1729 6.16679 16.2376 6.75 16.2918V21L10.9049 16.8451"
    }
  }
];

// ../../packages/library/ui-icons/src/24/outline/chat-bubble-left-right.ts
var ChatBubbleLeftRightIcon = createOutlineIcon(chat_bubble_left_right_default);

// ../../packages/library/ui-icons/src/generated/heroicons/outline/circle-stack.json
var circle_stack_default = [
  {
    tag: "path",
    attrs: {
      d: "M20.25 6.375C20.25 8.65317 16.5563 10.5 12 10.5C7.44365 10.5 3.75 8.65317 3.75 6.375M20.25 6.375C20.25 4.09683 16.5563 2.25 12 2.25C7.44365 2.25 3.75 4.09683 3.75 6.375M20.25 6.375V17.625C20.25 19.9032 16.5563 21.75 12 21.75C7.44365 21.75 3.75 19.9032 3.75 17.625V6.375M20.25 6.375V10.125M3.75 6.375V10.125M20.25 10.125V13.875C20.25 16.1532 16.5563 18 12 18C7.44365 18 3.75 16.1532 3.75 13.875V10.125M20.25 10.125C20.25 12.4032 16.5563 14.25 12 14.25C7.44365 14.25 3.75 12.4032 3.75 10.125"
    }
  }
];

// ../../packages/library/ui-icons/src/24/outline/circle-stack.ts
var CircleStackIcon = createOutlineIcon(circle_stack_default);

// ../../packages/library/ui-icons/src/generated/heroicons/outline/cloud.json
var cloud_default = [
  {
    tag: "path",
    attrs: {
      d: "M2.25 15C2.25 17.4853 4.26472 19.5 6.75 19.5H18C20.0711 19.5 21.75 17.8211 21.75 15.75C21.75 14.1479 20.7453 12.7805 19.3316 12.2433C19.4407 11.9324 19.5 11.5981 19.5 11.25C19.5 9.59315 18.1569 8.25 16.5 8.25C16.1767 8.25 15.8654 8.30113 15.5737 8.39575C14.9765 6.1526 12.9312 4.5 10.5 4.5C7.6005 4.5 5.25 6.85051 5.25 9.75C5.25 10.0832 5.28105 10.4092 5.3404 10.7252C3.54555 11.3167 2.25 13.0071 2.25 15Z"
    }
  }
];

// ../../packages/library/ui-icons/src/24/outline/cloud.ts
var CloudIcon = createOutlineIcon(cloud_default);

// ../../packages/library/ui-icons/src/generated/heroicons/outline/cog-6-tooth.json
var cog_6_tooth_default = [
  {
    tag: "path",
    attrs: {
      d: "M9.59356 3.94014C9.68397 3.39768 10.1533 3.00009 10.7033 3.00009H13.2972C13.8472 3.00009 14.3165 3.39768 14.4069 3.94014L14.6204 5.22119C14.6828 5.59523 14.9327 5.9068 15.2645 6.09045C15.3387 6.13151 15.412 6.17393 15.4844 6.21766C15.8095 6.41393 16.2048 6.47495 16.5604 6.34175L17.7772 5.88587C18.2922 5.69293 18.8712 5.9006 19.1462 6.37687L20.4432 8.6233C20.7181 9.09957 20.6085 9.70482 20.1839 10.0544L19.1795 10.8812C18.887 11.122 18.742 11.4938 18.7491 11.8726C18.7498 11.915 18.7502 11.9575 18.7502 12.0001C18.7502 12.0427 18.7498 12.0852 18.7491 12.1275C18.742 12.5064 18.887 12.8782 19.1795 13.119L20.1839 13.9458C20.6085 14.2953 20.7181 14.9006 20.4432 15.3769L19.1462 17.6233C18.8712 18.0996 18.2922 18.3072 17.7772 18.1143L16.5604 17.6584C16.2048 17.5252 15.8095 17.5862 15.4844 17.7825C15.412 17.8263 15.3387 17.8687 15.2645 17.9097C14.9327 18.0934 14.6828 18.4049 14.6204 18.779L14.4069 20.06C14.3165 20.6025 13.8472 21.0001 13.2972 21.0001H10.7033C10.1533 21.0001 9.68397 20.6025 9.59356 20.06L9.38005 18.779C9.31771 18.4049 9.06774 18.0934 8.73597 17.9097C8.66179 17.8687 8.58847 17.8263 8.51604 17.7825C8.19101 17.5863 7.79568 17.5252 7.44011 17.6584L6.22325 18.1143C5.70826 18.3072 5.12926 18.0996 4.85429 17.6233L3.55731 15.3769C3.28234 14.9006 3.39199 14.2954 3.81657 13.9458L4.82092 13.119C5.11343 12.8782 5.25843 12.5064 5.25141 12.1276C5.25063 12.0852 5.25023 12.0427 5.25023 12.0001C5.25023 11.9575 5.25063 11.915 5.25141 11.8726C5.25843 11.4938 5.11343 11.122 4.82092 10.8812L3.81657 10.0544C3.39199 9.70484 3.28234 9.09958 3.55731 8.62332L4.85429 6.37688C5.12926 5.90061 5.70825 5.69295 6.22325 5.88588L7.4401 6.34176C7.79566 6.47496 8.19099 6.41394 8.51603 6.21767C8.58846 6.17393 8.66179 6.13151 8.73597 6.09045C9.06774 5.9068 9.31771 5.59523 9.38005 5.22119L9.59356 3.94014Z"
    }
  },
  {
    tag: "path",
    attrs: {
      d: "M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3432 10.3431 9.00001 12 9.00001C13.6569 9.00001 15 10.3432 15 12Z"
    }
  }
];

// ../../packages/library/ui-icons/src/24/outline/cog-6-tooth.ts
var Cog6ToothIcon = createOutlineIcon(cog_6_tooth_default);

// ../../packages/library/ui-icons/src/generated/heroicons/outline/command-line.json
var command_line_default = [
  {
    tag: "path",
    attrs: {
      d: "M6.75 7.5L9.75 9.75L6.75 12M11.25 12H14.25M5.25 20.25H18.75C19.9926 20.25 21 19.2426 21 18V6C21 4.75736 19.9926 3.75 18.75 3.75H5.25C4.00736 3.75 3 4.75736 3 6V18C3 19.2426 4.00736 20.25 5.25 20.25Z"
    }
  }
];

// ../../packages/library/ui-icons/src/24/outline/command-line.ts
var CommandLineIcon = createOutlineIcon(command_line_default);

// ../../packages/library/ui-icons/src/generated/heroicons/outline/folder.json
var folder_default = [
  {
    tag: "path",
    attrs: {
      d: "M2.25 12.75V12C2.25 10.7574 3.25736 9.75 4.5 9.75H19.5C20.7426 9.75 21.75 10.7574 21.75 12V12.75M13.0607 6.31066L10.9393 4.18934C10.658 3.90804 10.2765 3.75 9.87868 3.75H4.5C3.25736 3.75 2.25 4.75736 2.25 6V18C2.25 19.2426 3.25736 20.25 4.5 20.25H19.5C20.7426 20.25 21.75 19.2426 21.75 18V9C21.75 7.75736 20.7426 6.75 19.5 6.75H14.1213C13.7235 6.75 13.342 6.59197 13.0607 6.31066Z"
    }
  }
];

// ../../packages/library/ui-icons/src/24/outline/folder.ts
var FolderIcon = createOutlineIcon(folder_default);

// ../../packages/library/ui-icons/src/generated/heroicons/outline/globe-alt.json
var globe_alt_default = [
  {
    tag: "path",
    attrs: {
      d: "M12 21C16.1926 21 19.7156 18.1332 20.7157 14.2529M12 21C7.80742 21 4.28442 18.1332 3.2843 14.2529M12 21C14.4853 21 16.5 16.9706 16.5 12C16.5 7.02944 14.4853 3 12 3M12 21C9.51472 21 7.5 16.9706 7.5 12C7.5 7.02944 9.51472 3 12 3M12 3C15.3652 3 18.299 4.84694 19.8431 7.58245M12 3C8.63481 3 5.70099 4.84694 4.15692 7.58245M19.8431 7.58245C17.7397 9.40039 14.9983 10.5 12 10.5C9.00172 10.5 6.26027 9.40039 4.15692 7.58245M19.8431 7.58245C20.5797 8.88743 21 10.3946 21 12C21 12.778 20.9013 13.5329 20.7157 14.2529M20.7157 14.2529C18.1334 15.6847 15.1619 16.5 12 16.5C8.8381 16.5 5.86662 15.6847 3.2843 14.2529M3.2843 14.2529C3.09871 13.5329 3 12.778 3 12C3 10.3946 3.42032 8.88743 4.15692 7.58245"
    }
  }
];

// ../../packages/library/ui-icons/src/24/outline/globe-alt.ts
var GlobeAltIcon = createOutlineIcon(globe_alt_default);

// ../../packages/library/ui-icons/src/generated/heroicons/outline/puzzle-piece.json
var puzzle_piece_default = [
  {
    tag: "path",
    attrs: {
      d: "M14.25 6.08694C14.25 5.73178 14.4361 5.41076 14.6512 5.1282C14.8721 4.8381 15 4.494 15 4.125C15 3.08947 13.9926 2.25 12.75 2.25C11.5074 2.25 10.5 3.08947 10.5 4.125C10.5 4.494 10.6279 4.8381 10.8488 5.1282C11.064 5.41076 11.25 5.73178 11.25 6.08694V6.08694C11.25 6.44822 10.9542 6.73997 10.593 6.72957C9.18939 6.68914 7.80084 6.58845 6.42989 6.43C6.61626 8.04276 6.72269 9.67987 6.74511 11.3373C6.75007 11.7032 6.45293 12 6.08694 12V12C5.73178 12 5.41076 11.814 5.1282 11.5988C4.8381 11.3779 4.494 11.25 4.125 11.25C3.08947 11.25 2.25 12.2574 2.25 13.5C2.25 14.7426 3.08947 15.75 4.125 15.75C4.494 15.75 4.8381 15.6221 5.1282 15.4012C5.41076 15.186 5.73178 15 6.08694 15V15C6.39613 15 6.64157 15.2608 6.6189 15.5691C6.49306 17.2812 6.27742 18.9682 5.97668 20.6256C7.49458 20.8157 9.03451 20.9348 10.5931 20.9797C10.9542 20.9901 11.2501 20.6983 11.2501 20.337V20.337C11.2501 19.9818 11.0641 19.6608 10.8489 19.3782C10.628 19.0881 10.5001 18.744 10.5001 18.375C10.5001 17.3395 11.5075 16.5 12.7501 16.5C13.9928 16.5 15.0001 17.3395 15.0001 18.375C15.0001 18.744 14.8722 19.0881 14.6513 19.3782C14.4362 19.6608 14.2501 19.9818 14.2501 20.337V20.337C14.2501 20.6699 14.5281 20.9357 14.8605 20.9161C16.6992 20.8081 18.5102 20.5965 20.2876 20.2872C20.5571 18.7389 20.7523 17.1652 20.8696 15.5698C20.8923 15.2611 20.6466 15 20.3371 15V15C19.9819 15 19.6609 15.1861 19.3783 15.4013C19.0882 15.6221 18.7441 15.75 18.3751 15.75C17.3396 15.75 16.5001 14.7427 16.5001 13.5C16.5001 12.2574 17.3396 11.25 18.3751 11.25C18.7441 11.25 19.0882 11.378 19.3783 11.5988C19.6609 11.814 19.9819 12 20.3371 12V12C20.7034 12 21.0008 11.703 20.9959 11.3367C20.9713 9.52413 20.8463 7.73572 20.6261 5.97698C18.7403 6.31916 16.816 6.55115 14.8603 6.66605C14.528 6.68557 14.25 6.41979 14.25 6.08694V6.08694Z"
    }
  }
];

// ../../packages/library/ui-icons/src/24/outline/puzzle-piece.ts
var PuzzlePieceIcon = createOutlineIcon(puzzle_piece_default);

// ../../packages/library/ui-icons/src/generated/heroicons/outline/server.json
var server_default = [
  {
    tag: "path",
    attrs: {
      d: "M21.75 17.25V17.0223C21.75 16.6753 21.7099 16.3294 21.6304 15.9916L19.3622 6.35199C19.0035 4.82745 17.6431 3.75 16.077 3.75H7.92305C6.35688 3.75 4.99648 4.82745 4.63777 6.35199L2.36962 15.9916C2.29014 16.3294 2.25 16.6753 2.25 17.0223V17.25M21.75 17.25C21.75 18.9069 20.4069 20.25 18.75 20.25H5.25C3.59315 20.25 2.25 18.9069 2.25 17.25M21.75 17.25C21.75 15.5931 20.4069 14.25 18.75 14.25H5.25C3.59315 14.25 2.25 15.5931 2.25 17.25M18.75 17.25H18.7575V17.2575H18.75V17.25ZM15.75 17.25H15.7575V17.2575H15.75V17.25Z"
    }
  }
];

// ../../packages/library/ui-icons/src/24/outline/server.ts
var ServerIcon = createOutlineIcon(server_default);

// ../../packages/library/components/src/remix/directory/directory-icons.ts
var iconClass = "size-5 shrink-0";
function directoryHeroIcon(id, props = {}) {
  const p = { class: props.class ?? iconClass };
  switch (id) {
    case "bolt":
      return BoltIcon(p);
    case "folder":
      return FolderIcon(p);
    case "server":
      return ServerIcon(p);
    case "cloud":
      return CloudIcon(p);
    case "cog":
      return Cog6ToothIcon(p);
    case "chat":
      return ChatBubbleLeftRightIcon(p);
    case "circle-stack":
      return CircleStackIcon(p);
    case "globe":
      return GlobeAltIcon(p);
    case "command-line":
      return CommandLineIcon(p);
    case "puzzle":
    default:
      return PuzzlePieceIcon(p);
  }
}

// client/integrations/starter-directory-classes.ts
var starterDirectoryClasses = {
  shell: "flex min-h-0 flex-1 flex-col gap-6",
  header: "flex flex-col gap-2",
  title: "m-0 font-display text-2xl font-semibold tracking-tight text-ink",
  lead: "m-0 max-w-[62ch] text-sm leading-relaxed text-ink-soft",
  layout: "flex min-h-0 flex-1 gap-8 max-md:flex-col",
  nav: "flex w-48 shrink-0 flex-col gap-5 max-md:w-full max-md:flex-row max-md:flex-wrap",
  navGroup: "flex flex-col gap-1",
  navLabel: "px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft",
  navBtn: "inline-flex min-h-9 cursor-pointer items-center rounded-lg border border-transparent px-3 py-1.5 text-left text-sm text-ink hover:bg-sand",
  navBtnActive: "inline-flex min-h-9 cursor-pointer items-center rounded-lg border border-line bg-paper-raised px-3 py-1.5 text-left text-sm font-medium text-ink",
  main: "flex min-w-0 flex-1 flex-col gap-4",
  toolbar: "flex flex-wrap items-center gap-2",
  searchWrap: "flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-paper-raised px-3 py-2",
  search: "min-w-0 flex-1 border-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft",
  grid: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
  empty: "m-0 px-4 py-8 text-center text-sm text-ink-soft",
  pager: "flex shrink-0 flex-row items-center justify-between gap-3 border-t border-line px-3.5 py-2",
  pagerMeta: "min-w-0 flex-1 truncate text-xs text-ink-soft",
  pagerActions: "inline-flex shrink-0 items-center gap-1.5",
  btn: "inline-flex cursor-pointer items-center gap-1 rounded-lg border border-line bg-paper-raised px-3 py-1.5 text-xs text-ink hover:bg-sand disabled:cursor-not-allowed disabled:opacity-50",
  searchIcon: "size-4 shrink-0 text-ink-soft"
};
var starterDirectoryCardClass = "flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-paper-raised p-4 text-left shadow-sm transition-colors hover:border-accent/40";
var starterDirectoryCardIconClass = "inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-paper text-accent";
var starterDirectoryBadgeClass = "inline-flex items-center rounded-full border border-line px-2 py-0.5 text-[10px] text-ink-soft";

// client/integrations/integrations-demo-root.tsx
var NAV = [
  {
    id: "explore",
    label: "Explore",
    items: [
      { id: "popular", label: "Most popular" },
      { id: "all", label: "All" }
    ]
  },
  {
    id: "categories",
    label: "Categories",
    items: [
      { id: "automation", label: "Automation" },
      { id: "cms", label: "CMS" },
      { id: "crm", label: "CRM" },
      { id: "marketing", label: "Marketing" },
      { id: "messaging", label: "Messaging" },
      { id: "other", label: "Other" }
    ]
  }
];
var CATALOG = [
  {
    id: "n8n",
    title: "n8n",
    description: "Workflow automation for your agent and site backends.",
    category: "automation",
    icon: "bolt",
    popular: true
  },
  {
    id: "zapier",
    title: "Zapier",
    description: "Easy automation for busy people.",
    category: "automation",
    icon: "bolt",
    popular: true
  },
  {
    id: "sanity",
    title: "Sanity",
    description: "Headless CMS content for marketing pages.",
    category: "cms",
    icon: "folder",
    popular: true
  },
  {
    id: "hubspot",
    title: "HubSpot",
    description: "CRM contacts and deal pipelines.",
    category: "crm",
    icon: "circle-stack"
  },
  {
    id: "mailchimp",
    title: "Mailchimp",
    description: "Email campaigns and audiences.",
    category: "marketing",
    icon: "chat",
    popular: true
  },
  {
    id: "slack",
    title: "Slack",
    description: "Team messaging and channel alerts.",
    category: "messaging",
    icon: "chat",
    popular: true
  },
  {
    id: "intercom",
    title: "Intercom",
    description: "Customer messaging and support inbox.",
    category: "messaging",
    icon: "chat"
  },
  {
    id: "stripe",
    title: "Stripe",
    description: "Payments and billing for products.",
    category: "other",
    icon: "cloud",
    popular: true
  },
  {
    id: "airtable",
    title: "Airtable",
    description: "Flexible databases for ops and content.",
    category: "other",
    icon: "circle-stack"
  },
  {
    id: "webflow",
    title: "Webflow",
    description: "Visual CMS and site publishing.",
    category: "cms",
    icon: "globe"
  },
  {
    id: "salesforce",
    title: "Salesforce",
    description: "Enterprise CRM and automation.",
    category: "crm",
    icon: "server"
  },
  {
    id: "segment",
    title: "Segment",
    description: "Customer data pipeline for analytics.",
    category: "marketing",
    icon: "cog"
  }
];
function readParams() {
  const sp = new URLSearchParams(window.location.search);
  return {
    cat: sp.get("cat") || "popular",
    q: sp.get("q") || "",
    page: Math.max(1, Number(sp.get("page") || "1") || 1)
  };
}
function writeParams(next) {
  const sp = new URLSearchParams(window.location.search);
  if (next.cat !== void 0) sp.set("cat", next.cat);
  if (next.q !== void 0) {
    if (next.q.trim()) sp.set("q", next.q);
    else sp.delete("q");
  }
  if (next.page !== void 0) {
    if (next.page <= 1) sp.delete("page");
    else sp.set("page", String(next.page));
  }
  const url = `${window.location.pathname}?${sp.toString()}`.replace(/\?$/, "");
  window.history.replaceState({}, "", url);
}
function IntegrationsDemoRoot(handle) {
  return () => {
    const params = readParams();
    const matchCat = (entry, cat) => {
      if (cat === "all") return true;
      if (cat === "popular") return entry.popular === true;
      return entry.category === cat;
    };
    const filtered = filterDirectoryByQuery(
      filterDirectoryByCategory(CATALOG, params.cat, matchCat),
      params.q,
      (e) => [e.title, e.description, e.category]
    );
    const pageResult = () => paginateDirectory(filtered, params.page, 9);
    return /* @__PURE__ */ jsx("main", { class: "min-h-screen bg-paper px-4 py-10 text-ink md:px-8", children: /* @__PURE__ */ jsx("div", { class: "mx-auto max-w-6xl", children: renderDirectory({
      on,
      title: "Connect to third-party apps",
      lead: "Same headless directory as Studio Integrations \u2014 this project styles it with @theme tokens (paper / ink / accent).",
      navGroups: NAV,
      category: () => params.cat,
      setCategory: (id) => {
        writeParams({ cat: id, page: 1 });
        handle.update();
      },
      search: () => params.q,
      setSearch: (q2) => {
        writeParams({ q: q2, page: 1 });
        handle.update();
      },
      pageResult,
      setPage: (page) => {
        writeParams({ page });
        handle.update();
      },
      classes: starterDirectoryClasses,
      componentId: "integrations-directory",
      searchPlaceholder: "Search integrations\u2026",
      emptyLabel: "No integrations match this filter.",
      renderCard: (entry) => /* @__PURE__ */ jsx(
        "article",
        {
          class: starterDirectoryCardClass,
          "data-integration-id": entry.id,
          children: [
            /* @__PURE__ */ jsx("div", { class: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx("span", { class: starterDirectoryCardIconClass, "aria-hidden": "true", children: directoryHeroIcon(entry.icon) }),
              /* @__PURE__ */ jsx("div", { class: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsx("h3", { class: "m-0 text-sm font-semibold text-ink", children: entry.title }),
                /* @__PURE__ */ jsx("p", { class: "m-0 mt-1 line-clamp-2 text-xs leading-snug text-ink-soft", children: entry.description })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { class: "mt-auto flex flex-wrap gap-1.5 pt-1", children: [
              /* @__PURE__ */ jsx("span", { class: starterDirectoryBadgeClass, children: entry.category }),
              entry.popular ? /* @__PURE__ */ jsx("span", { class: starterDirectoryBadgeClass, children: "Popular" }) : null
            ] })
          ]
        },
        entry.id
      )
    }) }) });
  };
}

// client/integrations/entry.tsx
var el = document.getElementById("root");
if (el) {
  const root = createRoot(el);
  root.render(/* @__PURE__ */ jsx(IntegrationsDemoRoot, {}));
  root.flush();
}
//# sourceMappingURL=integrations-client.js.map
