/**
 * One inspector chrome for Studio Live rail and top-level site preview.
 * Shell + Mode + Outlines + Labels + Float/Close + props/slots — identical everywhere.
 */

import type { InspectTarget } from "./attr-contract-pure.js";
import { inspectTargetLabel } from "./host-bridge-pure.js";
import { applyDraftMessage } from "./host-bridge-pure.js";
import type { InspectorMetaBoot } from "./meta-boot-pure.js";
import { paintInspectorPanelBody } from "./paint-panel-body-dom.js";
import {
  defaultDraftFromMeta,
  patchPanelSlot,
  type PanelComponentMeta,
  type PanelDraft,
} from "./registry-panel-pure.js";
import {
  createStandaloneInspectorShell,
  type InspectorShellVariant,
  type StandaloneShellApi,
} from "./standalone-shell.js";

export type { InspectorMetaBoot } from "./meta-boot-pure.js";

export type InspectorChromeDeps = {
  doc: Document;
  win: Window;
  mount?: HTMLElement;
  variant?: InspectorShellVariant;
  storageKey?: string;
  /**
   * Load registry bootstrap when guest did not attach `meta` on select
   * (top-level same-origin). Studio should pass preloaded meta from guest.
   */
  fetchMeta: (
    componentId: string,
    signal: AbortSignal,
  ) => Promise<InspectorMetaBoot | null>;
  applyDraft: (input: {
    componentId: string;
    instanceId?: string;
    props: Record<string, string>;
    slotText: Record<string, string>;
    patch?: "slots" | "full";
  }) => void;
  getRevealAll: () => boolean;
  setRevealAll: (on: boolean) => void;
  getLabelsOn?: () => boolean;
  setLabelsOn?: (on: boolean) => void;
  getInteractionMode?: () => "select" | "browse";
  setInteractionMode?: (mode: "select" | "browse") => void;
  /** Panel ancestor trail → re-select in guest. */
  selectTarget?: (target: InspectTarget) => void;
  onOpenChange?: (open: boolean) => void;
};

export type InspectorChromeApi = {
  shell: StandaloneShellApi;
  /** Apply selection; pass `meta` from guest select when available (preferred). */
  setSelection: (
    target: InspectTarget | null,
    meta?: InspectorMetaBoot | null,
    ancestors?: InspectTarget[],
  ) => void;
  /**
   * Canvas inline edit → panel field (no remount — keeps focus elsewhere).
   */
  applyCanvasTextChange: (target: InspectTarget | null, text: string) => void;
  open: () => void;
  close: (opts?: { notify?: boolean }) => void;
  isOpen: () => boolean;
  destroy: () => void;
};

function applyBoot(
  boot: InspectorMetaBoot,
): { meta: PanelComponentMeta; draft: PanelDraft } {
  const meta: PanelComponentMeta = {
    id: boot.id,
    title: boot.title,
    props: boot.props,
    slots: boot.slots,
    acceptsChildren: boot.acceptsChildren,
  };
  return {
    meta,
    draft: boot.draft ?? defaultDraftFromMeta(meta),
  };
}

function makeToolbarBtn(doc: Document): HTMLButtonElement {
  const btn = doc.createElement("button");
  btn.type = "button";
  btn.setAttribute("data-as-ci-btn", "1");
  return btn;
}

/**
 * Mount the shared inspector experience (same DOM chrome everywhere).
 */
export function createInspectorChrome(
  deps: InspectorChromeDeps,
): InspectorChromeApi {
  const doc = deps.doc;

  const shell = createStandaloneInspectorShell({
    doc,
    win: deps.win,
    mount: deps.mount,
    variant: deps.variant ?? "standalone",
    storageKey: deps.storageKey,
    onOpenChange: deps.onOpenChange,
  });

  const modeBtn = makeToolbarBtn(doc);
  const outlineBtn = makeToolbarBtn(doc);
  const labelsBtn = makeToolbarBtn(doc);

  function syncModeBtn() {
    const mode = deps.getInteractionMode?.() ?? "select";
    modeBtn.textContent = mode === "browse" ? "Browse" : "Select";
    modeBtn.setAttribute("aria-pressed", mode === "select" ? "true" : "false");
    modeBtn.title =
      mode === "browse"
        ? "Browse mode — links and controls work. Click to select components."
        : "Select mode — click components to inspect. Click for Browse.";
  }
  function syncOutlineBtn() {
    const on = deps.getRevealAll();
    outlineBtn.textContent = on ? "Outlines · on" : "Outlines · off";
    outlineBtn.setAttribute("aria-pressed", on ? "true" : "false");
  }
  function syncLabelsBtn() {
    const on = deps.getLabelsOn?.() ?? false;
    labelsBtn.textContent = on ? "Labels · on" : "Labels · off";
    labelsBtn.setAttribute("aria-pressed", on ? "true" : "false");
    labelsBtn.hidden = !deps.setLabelsOn;
    labelsBtn.title =
      "Show component name tabs on outlined nodes (BrowserUI-style labels).";
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

  let draft: PanelDraft = { props: {}, slotText: {}, children: "" };
  let meta: PanelComponentMeta | null = null;
  let selected: InspectTarget | null = null;
  let ancestors: InspectTarget[] = [];
  let panelTab: "props" | "content" | "actions" = "props";
  let abort: AbortController | null = null;

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
      onAncestorClick: deps.selectTarget
        ? (t) => deps.selectTarget?.(t)
        : undefined,
      onDraftChange: (next, changeMeta) => {
        draft = next;
        if (selected?.componentId) {
          const instanceId =
            selected.instanceId ||
            ancestors.find(
              (a) =>
                a.componentId === selected?.componentId && Boolean(a.instanceId),
            )?.instanceId ||
            ancestors.find((a) => Boolean(a.instanceId))?.instanceId;
          deps.applyDraft({
            componentId: selected.componentId,
            instanceId,
            props: draft.props,
            slotText: draft.slotText,
            patch: changeMeta?.patch ?? "slots",
          });
        }
        // Do not re-paint body — remounting inputs steals focus and drops
        // in-progress edits. Controls already reflect the new values.
      },
    });
    shell.setStatus(
      painted.status || (selected ? inspectTargetLabel(selected) : ""),
    );
    shell.setBody(painted.node);
  }

  function setSelection(
    target: InspectTarget | null,
    preloaded?: InspectorMetaBoot | null,
    chain?: InspectTarget[],
  ) {
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
      const sameTarget =
        hadMeta &&
        prevId === target.componentId &&
        prevSlot === target.slot &&
        prevInstance === (target.instanceId ?? "");
      meta = applied.meta;
      if (sameTarget) {
        // Canvas typed — patch Content inputs in place (no remount flash).
        for (const [key, value] of Object.entries(applied.draft.slotText)) {
          if (draft.slotText[key] === value) continue;
          const input = shell.root.querySelector(
            `[data-as-ci-slot="${CSS.escape(key)}"]`,
          );
          if (
            input instanceof HTMLInputElement &&
            doc.activeElement !== input
          ) {
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
    void deps
      .fetchMeta(target.componentId, signal)
      .then((boot) => {
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
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        meta = null;
        paintBody();
      });
  }

  function applyCanvasTextChange(target: InspectTarget | null, text: string) {
    const slot = target?.slot?.trim();
    if (!slot) return;
    draft = patchPanelSlot(draft, slot, text);
    if (meta) {
      meta = {
        ...meta,
        draft: {
          ...(meta.draft ?? draft),
          slotText: { ...(meta.draft?.slotText ?? draft.slotText), [slot]: text },
        },
      };
    }
    const input = shell.root.querySelector(
      `[data-as-ci-slot="${CSS.escape(slot)}"]`,
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
    },
  };
}

export function chromeDraftToMessage(input: {
  componentId: string;
  instanceId?: string;
  props: Record<string, string>;
  slotText: Record<string, string>;
}) {
  return applyDraftMessage(input);
}
