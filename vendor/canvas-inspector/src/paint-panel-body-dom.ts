/**
 * Shared DOM painter for Canvas Inspector props/slots panel body.
 * Used by top-level guest chrome and Studio Live embedded shell.
 *
 * Tabs mirror BrowserUI Component Designer (Props / Content / Actions).
 */

import type { InspectTarget } from "./attr-contract-pure.js";
import { inspectTargetLabel } from "./host-bridge-pure.js";
import {
  buildPanelModel,
  patchPanelProp,
  patchPanelSlot,
  type PanelComponentMeta,
  type PanelDraft,
  type PanelPropField,
  type PanelSlotField,
} from "./registry-panel-pure.js";

export type InspectorPanelTab = "props" | "content" | "actions";

export type PaintPanelBodyInput = {
  doc: Document;
  selected: InspectTarget | null;
  meta: PanelComponentMeta | null;
  draft: PanelDraft;
  /** Outer → inner component chain for trail navigation. */
  ancestors?: InspectTarget[];
  onAncestorClick?: (target: InspectTarget) => void;
  /** Active designer tab (host owns so re-paints keep selection). */
  panelTab?: InspectorPanelTab;
  onPanelTabChange?: (tab: InspectorPanelTab) => void;
  onDraftChange: (draft: PanelDraft, meta?: { patch: "slots" | "full" }) => void;
};

export type PaintPanelBodyResult = {
  /** Body node to pass to shell.setBody; null → empty hint. */
  node: Node | null;
  status: string;
};

function isActionSlot(key: string): boolean {
  return /^cta/i.test(key);
}

function resolveTab(
  requested: InspectorPanelTab | undefined,
  hasProps: boolean,
  hasContent: boolean,
  hasActions: boolean,
  selectedSlot?: string,
): InspectorPanelTab {
  // Honor explicit user tab click first (slot select only sets the default).
  if (requested === "props" && hasProps) return "props";
  if (requested === "content" && hasContent) return "content";
  if (requested === "actions" && hasActions) return "actions";

  // Defaults when opening a selection / no requested tab yet.
  if (selectedSlot && isActionSlot(selectedSlot) && hasActions) return "actions";
  if (selectedSlot && hasContent) return "content";
  if (hasProps) return "props";
  if (hasContent) return "content";
  return "actions";
}

/**
 * Build panel body for current selection + meta + draft.
 * Callers own draft state and re-paint after onDraftChange.
 */
export function paintInspectorPanelBody(
  input: PaintPanelBodyInput,
): PaintPanelBodyResult {
  const {
    doc,
    selected,
    meta,
    draft,
    onDraftChange,
    ancestors = [],
    onAncestorClick,
    panelTab,
    onPanelTabChange,
  } = input;

  if (!selected) {
    return { node: null, status: "" };
  }

  const status = inspectTargetLabel(selected);

  function appendAncestorTrail(parent: HTMLElement) {
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
        sep.textContent = "→";
        sep.style.opacity = "0.45";
        trail.appendChild(sep);
      }
      const label =
        node.componentId ?? node.slot ?? node.source ?? node.kind;
      const isCurrent =
        node.componentId === selected.componentId &&
        (node.instanceId == null ||
          selected.instanceId == null ||
          node.instanceId === selected.instanceId) &&
        i === ancestors.length - 1;

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
    const wrap = doc.createElement("div");
    appendAncestorTrail(wrap);
    const titleEl = doc.createElement("div");
    titleEl.style.fontWeight = "600";
    titleEl.style.marginBottom = "6px";
    titleEl.textContent = selected.componentId
      ? selected.componentId
      : selected.slot
        ? `slot:${selected.slot}`
        : `<${selected.source ?? "element"}>`;
    const hint = doc.createElement("p");
    hint.setAttribute("data-as-ci-hint", "1");
    hint.textContent =
      "Selected on canvas. Double-click text to type. Registry props appear when a component root is selected.";
    wrap.append(titleEl, hint);
    return { node: wrap, status };
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
    badge.textContent = `Slot · ${selected.slot}`;
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
    selected.slot,
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

  function addTab(id: InspectorPanelTab, label: string, show: boolean) {
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
      btn.style.background =
        "color-mix(in oklab, var(--color-accent, #0f766e) 18%, transparent)";
      btn.style.outline = "1px solid var(--color-accent, #0f766e)";
    }
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      onPanelTabChange?.(id);
    });
    tabBar.appendChild(btn);
  }

  const tabCount =
    Number(hasProps) + Number(hasContent) + Number(hasActions);
  if (tabCount > 1) {
    addTab("props", "Props", hasProps);
    addTab("content", "Content", hasContent);
    addTab("actions", "Actions", hasActions);
    wrap.appendChild(tabBar);
  }

  const hint = doc.createElement("p");
  hint.setAttribute("data-as-ci-hint", "1");
  hint.style.marginBottom = "12px";
  hint.textContent =
    active === "props"
      ? "Component knobs (layout / variant). Content lives under Content / Actions."
      : "Edit slot text here, or double-click on the page to type inline.";
  wrap.appendChild(hint);

  function appendProp(field: PanelPropField) {
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
        patch: "full",
      });
    });
    label.appendChild(select);
    wrap.appendChild(label);
  }

  function appendSlot(field: PanelSlotField) {
    const label = doc.createElement("label");
    label.setAttribute("data-as-ci-field", "1");
    label.appendChild(doc.createTextNode(field.title));
    const input = doc.createElement("input");
    input.type = "text";
    input.value = field.value;
    input.setAttribute("data-as-ci-control", "1");
    input.dataset.asCiSlot = field.key;
    input.addEventListener("input", () => {
      onDraftChange(patchPanelSlot(draft, field.key, input.value), {
        patch: "slots",
      });
    });
    input.addEventListener("change", () => {
      onDraftChange(patchPanelSlot(draft, field.key, input.value), {
        patch: "slots",
      });
    });
    label.appendChild(input);
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
