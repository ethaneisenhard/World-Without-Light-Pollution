/**
 * Design Sandbox inspector — props + slots draft, live preview refresh.
 * Canonical logic: @glassbox-studio/sandbox-engine/src/client/inspector.js
 * (copied here so Worker ASSETS can serve without package URL imports).
 */
const bootEl = document.getElementById("as-inspector-boot");
const layout = document.querySelector("[data-as-studio-layout]");
if (!bootEl || !(layout instanceof HTMLElement)) {
  // not a component preview page
} else {
  const boot = JSON.parse(bootEl.textContent || "{}");
  let draft = structuredClone(boot.draft);

  const form = document.querySelector("[data-as-inspector-form]");
  const previewBody = document.querySelector("[data-as-preview-body]");
  const resetBtn = document.querySelector("[data-as-reset]");

  function readDraftFromForm() {
    const next = {
      props: { ...draft.props },
      slotText: { ...draft.slotText },
      children: draft.children,
    };
    if (!(form instanceof HTMLFormElement)) return next;
    for (const el of form.querySelectorAll("[data-as-prop]")) {
      if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) {
        next.props[el.dataset.asProp] = el.value;
      }
    }
    for (const el of form.querySelectorAll("[data-as-slot]")) {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        next.slotText[el.dataset.asSlot] = el.value;
      }
    }
    const childrenEl = form.querySelector("[data-as-children]");
    if (
      childrenEl instanceof HTMLTextAreaElement ||
      childrenEl instanceof HTMLInputElement
    ) {
      next.children = childrenEl.value;
    }
    return next;
  }

  function writeFormFromDraft(d) {
    if (!(form instanceof HTMLFormElement)) return;
    for (const el of form.querySelectorAll("[data-as-prop]")) {
      if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) {
        const key = el.dataset.asProp;
        if (key && d.props[key] != null) el.value = d.props[key];
      }
    }
    for (const el of form.querySelectorAll("[data-as-slot]")) {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        const key = el.dataset.asSlot;
        if (key && d.slotText[key] != null) el.value = d.slotText[key];
      }
    }
    const childrenEl = form.querySelector("[data-as-children]");
    if (
      childrenEl instanceof HTMLTextAreaElement ||
      childrenEl instanceof HTMLInputElement
    ) {
      childrenEl.value = d.children ?? "";
    }
  }

  let timer = null;
  async function refreshPreview() {
    const mode =
      layout.dataset.asMode === "permutations" ? "permutations" : "sandbox";
    const id = layout.dataset.asComponentId;
    if (!id || !(previewBody instanceof HTMLElement)) return;
    try {
      const res = await fetch(
        `/__as/design/components/${encodeURIComponent(id)}/render`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, draft }),
        },
      );
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.html === "string") {
        previewBody.innerHTML = data.html;
      }
    } catch {
      /* ignore network blips */
    }
  }

  function scheduleRefresh() {
    draft = readDraftFromForm();
    clearTimeout(timer);
    timer = setTimeout(() => {
      void refreshPreview();
    }, 120);
  }

  if (form instanceof HTMLFormElement) {
    form.addEventListener("input", scheduleRefresh);
    form.addEventListener("change", scheduleRefresh);
  }

  if (resetBtn instanceof HTMLElement) {
    resetBtn.addEventListener("click", () => {
      draft = structuredClone(boot.draft);
      writeFormFromDraft(draft);
      void refreshPreview();
    });
  }
}
