/**
 * Seed inspector draft from live DOM (data-as-slot text).
 * Keep free of attr-contract imports to avoid cycles.
 */

import {
  defaultDraftFromMeta,
  type PanelComponentMeta,
  type PanelDraft,
} from "./registry-panel-pure.js";

export type InspectorMetaBoot = {
  id: string;
  title: string;
  props: PanelComponentMeta["props"];
  slots?: PanelComponentMeta["slots"];
  acceptsChildren?: boolean;
  draft?: PanelDraft;
};

const ATTR_SLOT = "data-as-slot";
const ATTR_INSTANCE = "data-as-instance";
const ATTR_COMPONENT = "data-as-component";

/** Read data-as-slot → text map under a component root. */
export function collectSlotTextFromElement(root: Element): Record<string, string> {
  const out: Record<string, string> = {};
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

export function findComponentRoot(
  doc: Document,
  target: { componentId?: string; instanceId?: string },
): Element | null {
  if (target.instanceId) {
    const byInst = doc.querySelector(
      `[${ATTR_INSTANCE}="${CSS.escape(target.instanceId)}"]`,
    );
    if (byInst) return byInst;
  }
  if (target.componentId) {
    return doc.querySelector(
      `[${ATTR_COMPONENT}="${CSS.escape(target.componentId)}"]`,
    );
  }
  return null;
}

/**
 * Component root to replace on apply-draft (never a slot host).
 * Prefers instance + component without data-as-slot.
 */
export function resolveComponentRootForApply(
  doc: Document,
  input: { componentId: string; instanceId?: string },
): Element | null {
  const { componentId, instanceId } = input;
  const componentSel = `[${ATTR_COMPONENT}="${CSS.escape(componentId)}"]`;
  const rootSel = `${componentSel}:not([${ATTR_SLOT}])`;

  if (instanceId) {
    const exact = doc.querySelector(
      `[${ATTR_INSTANCE}="${CSS.escape(instanceId)}"]${rootSel}`,
    );
    if (exact) return exact;

    const byInst = doc.querySelector(
      `[${ATTR_INSTANCE}="${CSS.escape(instanceId)}"]`,
    );
    if (byInst) {
      if (byInst.hasAttribute(ATTR_SLOT)) {
        const up = byInst.closest(rootSel);
        if (up) return up;
      }
      if (
        byInst.getAttribute(ATTR_COMPONENT) === componentId &&
        !byInst.hasAttribute(ATTR_SLOT)
      ) {
        return byInst;
      }
    }
  }

  const firstRoot = doc.querySelector(rootSel);
  if (firstRoot) return firstRoot;
  return findComponentRoot(doc, input);
}

/** Merge registry boot + live DOM slot text into one boot payload. */
export function enrichMetaBootFromDom(
  boot: InspectorMetaBoot,
  root: Element | null,
): InspectorMetaBoot {
  const meta: PanelComponentMeta = {
    id: boot.id,
    title: boot.title,
    props: boot.props,
    slots: boot.slots,
    acceptsChildren: boot.acceptsChildren,
  };
  const base = boot.draft ?? defaultDraftFromMeta(meta);
  if (!root) return { ...boot, draft: base };
  const liveSlots = collectSlotTextFromElement(root);
  return {
    ...boot,
    draft: {
      ...base,
      slotText: { ...base.slotText, ...liveSlots },
    },
  };
}
