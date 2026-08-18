export {
  AS_ATTR,
  AUTHORING_ATTRS,
  CANVAS_INSPECTOR_PROTOCOL,
  INSPECT_KINDS,
  inferInspectKind,
  isCanvasInspectorMessage,
  isInspectKind,
  parseInspectTarget,
  resolveStripAttrsFlag,
  serializeInspectAttrs,
  serializeSelectPayload,
  stripAuthoringAttrs,
  stripAuthoringAttrsFromHtml,
  type AsAttrName,
  type AttrMap,
  type CanvasInspectorGuestToHost,
  type CanvasInspectorHostToGuest,
  type InspectKind,
  type InspectTarget,
} from "./attr-contract-pure.js";

export {
  applyDraftMessage,
  inspectOffMessage,
  inspectOnMessage,
  inspectTargetLabel,
  labelsOnMessage,
  revealAllMessage,
  selectTargetMessage,
  setModeMessage,
} from "./host-bridge-pure.js";

export {
  collectComponentAncestorChain,
  findElementForTarget,
  INSPECTABLE_SELECTOR,
  REVEAL_SELECTOR,
  CHROME_SELECTOR,
  OUTLINE_HOVER_CLASS,
  OUTLINE_SELECT_CLASS,
  REVEAL_CLASS,
  attrsFromElement,
  applyRevealAll,
  clearGuestStyles,
  createGuestInspector,
  ensureGuestStyles,
  findHoverTarget,
  findInspectableAncestor,
  isInspectorChrome,
  isMeaningfulTarget,
  parseTargetFromElement,
  targetFromElement,
  type GuestInspector,
  type GuestInspectorHandlers,
  type GuestInspectorOptions,
} from "./guest-runtime.js";

export {
  initialCanvasInspectorHostState,
  reduceCanvasInspectorHostMessage,
  applyTextChangeToHostState,
  toggleInspectOn,
  type CanvasInspectorHostState,
} from "./host-state-pure.js";

export { installCanvasInspectorGuest } from "./guest-boot.js";

export {
  createInspectorChrome,
  chromeDraftToMessage,
  type InspectorChromeApi,
  type InspectorChromeDeps,
  type InspectorMetaBoot,
} from "./inspector-chrome.js";

export {
  collectSlotTextFromElement,
  enrichMetaBootFromDom,
  findComponentRoot,
  resolveComponentRootForApply,
} from "./meta-boot-pure.js";

export {
  applySlotTextInDom,
  findSlotHost,
  resolveCopyHost,
} from "./apply-slot-text-pure.js";

export {
  INSPECT_PEEK_MAX_PX,
  INSPECT_PEEK_SNAP,
  INSPECT_PEEK_MIN_PX,
  inspectUsesPeekSheet,
  inspectPeekHeightCss,
} from "./peek-sheet-pure.js";
export {
  createStandaloneInspectorShell,
  nextInspectorDockMode,
  parseInspectorDockMode,
  type InspectorDockMode,
  type InspectorShellVariant,
  type StandaloneShellApi,
  type StandaloneShellDeps,
} from "./standalone-shell.js";

export {
  paintInspectorPanelBody,
  type InspectorPanelTab,
  type PaintPanelBodyInput,
  type PaintPanelBodyResult,
} from "./paint-panel-body-dom.js";
export {
  inspectAttrString,
  mergeComponentAttrOntoOpenTag,
  stampComponentAttrs,
  stampSlotAttrs,
  wrapInspectableHtml,
} from "./emit-pure.js";

export {
  buildPanelModel,
  defaultDraftFromMeta,
  patchPanelProp,
  patchPanelSlot,
  type CanvasInspectorPanelModel,
  type PanelComponentMeta,
  type PanelDraft,
  type PanelEnumPropDef,
  type PanelPropField,
  type PanelSlotField,
} from "./registry-panel-pure.js";
