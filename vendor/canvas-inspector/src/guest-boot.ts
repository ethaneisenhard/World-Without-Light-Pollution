/**
 * Iframe + top-level guest boot.
 * Guest enriches select with same-origin meta (+ live slot text) so Studio
 * chrome is identical without cross-origin fetches.
 */

import {
  isCanvasInspectorMessage,
  type CanvasInspectorGuestToHost,
  type CanvasInspectorHostToGuest,
} from "./attr-contract-pure.js";
import { createGuestInspector } from "./guest-runtime.js";
import {
  createInspectorChrome,
  type InspectorMetaBoot,
} from "./inspector-chrome.js";
import {
  enrichMetaBootFromDom,
  findComponentRoot,
  resolveComponentRootForApply,
} from "./meta-boot-pure.js";
import { applySlotTextInDom } from "./apply-slot-text-pure.js";

/**
 * Prefer in-DOM slot text patch (keeps live classes/props).
 * `patch: "full"` (or no slot hosts) → sandbox re-render.
 */
async function applyDraftInGuest(
  win: Window,
  msg: Extract<CanvasInspectorHostToGuest, { type: "apply-draft" }>,
): Promise<void> {
  if (!msg.componentId) return;
  const el = resolveComponentRootForApply(win.document, {
    componentId: msg.componentId,
    instanceId: msg.instanceId,
  });
  if (!el) return;

  const slotText = msg.slotText ?? {};
  const preferSlots = msg.patch !== "full";
  if (
    preferSlots &&
    Object.keys(slotText).length > 0 &&
    applySlotTextInDom(el, slotText)
  ) {
    return;
  }

  const instanceId =
    msg.instanceId ||
    el.getAttribute("data-as-instance")?.trim() ||
    undefined;
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
            children: "",
          },
        }),
      },
    );
    if (!res.ok) return;
    const data = (await res.json()) as { html?: string };
    if (!data.html) return;
    el.outerHTML = data.html;
  } catch {
    /* ignore */
  }
}

function isTopLevel(win: Window): boolean {
  try {
    return win.parent === win;
  } catch {
    return true;
  }
}

function wantsInspectFromUrl(win: Window): boolean {
  try {
    return /(?:^|[?&])as-inspect=1(?:&|$)/.test(win.location.search || "");
  } catch {
    return false;
  }
}

async function fetchMetaBoot(
  win: Window,
  componentId: string,
): Promise<InspectorMetaBoot | null> {
  try {
    const res = await win.fetch(
      `/__as/design/components/${encodeURIComponent(componentId)}/inspector.json`,
    );
    if (!res.ok) return null;
    return (await res.json()) as InspectorMetaBoot;
  } catch {
    return null;
  }
}

/** Attach registry meta + live DOM slot seed to a select payload. */
async function enrichSelectMessage(
  win: Window,
  msg: Extract<CanvasInspectorGuestToHost, { type: "select" }>,
): Promise<Extract<CanvasInspectorGuestToHost, { type: "select" }>> {
  const target = msg.target;
  if (!target?.componentId) {
    return { ...msg, meta: null, ancestors: msg.ancestors };
  }
  const boot = await fetchMetaBoot(win, target.componentId);
  if (!boot) return { ...msg, meta: null };
  const root = findComponentRoot(win.document, target);
  return { ...msg, meta: enrichMetaBootFromDom(boot, root) };
}

function postToParent(win: Window, data: unknown) {
  try {
    win.parent.postMessage(data, "*");
  } catch {
    /* ignore */
  }
}

function mountStandaloneChrome(
  win: Window,
  guest: ReturnType<typeof createGuestInspector>,
): void {
  const doc = win.document;
  if (doc.getElementById("as-ci-standalone")) return;

  const chrome = createInspectorChrome({
    doc,
    win,
    variant: "standalone",
    fetchMeta: async (componentId, signal) => {
      const res = await win.fetch(
        `/__as/design/components/${encodeURIComponent(componentId)}/inspector.json`,
        { signal },
      );
      if (!res.ok) return null;
      const boot = (await res.json()) as InspectorMetaBoot;
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
        patch: input.patch ?? "slots",
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
        // Close = leave inspect mode (outlines + listeners). Always deactivate.
        if (guest.isActive()) guest.deactivate();
      }
    },
  });

  win.addEventListener("message", (ev: MessageEvent) => {
    if (!isCanvasInspectorMessage(ev.data)) return;
    if (ev.data.type === "select") {
      // Null select is teardown (deactivate) — must NOT reopen chrome.
      // That loop made Close look like a no-op on top-level :9889.
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

export function installCanvasInspectorGuest(win: Window = window): void {
  const guest = createGuestInspector(win, {
    postToHost: (data) => {
      if (
        data &&
        typeof data === "object" &&
        (data as { type?: string }).type === "select"
      ) {
        const selectMsg = data as Extract<
          CanvasInspectorGuestToHost,
          { type: "select" }
        >;
        void enrichSelectMessage(win, selectMsg).then((enriched) => {
          postToParent(win, enriched);
          // Top-level chrome also listens on window message from self? 
          // Guest posts to parent — top-level parent===self so it receives.
          // Top-level chrome listens on win message — good.
        });
        return;
      }
      postToParent(win, data);
    },
  });

  win.addEventListener("message", (ev: MessageEvent) => {
    if (!isCanvasInspectorMessage(ev.data)) return;
    const msg = ev.data as CanvasInspectorHostToGuest;
    if (msg.type === "inspect-on") guest.activate();
    else if (msg.type === "inspect-off") guest.deactivate();
    else if (msg.type === "reveal-all") guest.setRevealAll(msg.on);
    else if (msg.type === "labels-on") guest.setLabelsOn(msg.on);
    else if (msg.type === "set-mode") guest.setInteractionMode(msg.mode);
    else if (msg.type === "select-target") {
      guest.selectTarget(msg.target, { silent: Boolean(msg.silent) });
    } else if (msg.type === "apply-draft") {
      void applyDraftInGuest(win, msg).then(() => {
        // Re-assert outline after patch (All-view keeps in sync).
        guest.selectTarget(
          {
            kind: "component",
            componentId: msg.componentId,
            instanceId: msg.instanceId,
          },
          { silent: true },
        );
      });
    }
  });

  try {
    win.parent.postMessage(
      { protocol: "as-canvas-inspector/1", type: "ready" },
      "*",
    );
  } catch {
    /* ignore */
  }

  if (isTopLevel(win)) {
    const boot = () => mountStandaloneChrome(win, guest);
    if (win.document.body) boot();
    else win.addEventListener("DOMContentLoaded", boot, { once: true });
  }
}
