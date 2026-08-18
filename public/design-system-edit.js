/**
 * Design system atlas — inline token editor (BrowserUI-style popover).
 * Live CSS var preview + postMessage to Studio parent for disk save.
 */
(function () {
  const bootEl = document.getElementById("as-design-system-boot");
  if (!bootEl) return;

  /** @type {{ design: object, projectId?: string }} */
  let boot = JSON.parse(bootEl.textContent || "{}");
  if (!boot.design?.tokens) return;

  let saveTimer = null;
  let saveState = "idle";
  const statusEl = document.querySelector("[data-as-ds-save-status]");

  function setStatus(text, kind) {
    saveState = kind || "idle";
    if (statusEl) {
      statusEl.textContent = text;
      statusEl.dataset.state = saveState;
    }
  }

  function cssVarForPath(path) {
    const btn = document.querySelector(
      `[data-as-token-path="${CSS.escape(path)}"]`,
    );
    return btn?.getAttribute("data-as-token-css") || null;
  }

  function applyLiveCss(path, value) {
    const cssVar = cssVarForPath(path);
    if (cssVar) {
      document.documentElement.style.setProperty(cssVar, value);
    }
    const btn = document.querySelector(`[data-as-token-path="${CSS.escape(path)}"]`);
    if (btn) {
      btn.setAttribute("data-as-token-value", value);
      const chip = btn.querySelector(".as-ds-swatch__chip");
      if (chip) chip.style.background = value;
      const fill = btn.querySelector(".as-ds-scale-row__fill");
      if (fill && (path.startsWith("space.") || path.startsWith("breakpoint."))) {
        fill.style.width = value;
      }
      const radiusPreview = btn.querySelector(".as-ds-tile__preview:not(.as-ds-tile__preview--shadow)");
      if (radiusPreview && path.startsWith("radius.")) {
        radiusPreview.style.borderRadius = value;
      }
      const shadowPreview = btn.querySelector(".as-ds-tile__preview--shadow");
      if (shadowPreview && path.startsWith("shadow.")) {
        shadowPreview.style.boxShadow = value;
      }
      const display = btn.querySelector("[data-as-token-display]");
      if (display) display.textContent = value;
    }
  }

  function setAtPath(obj, path, value) {
    const parts = path.split(".").filter(Boolean);
    const root = structuredClone(obj);
    let cur = root.tokens;
    for (let i = 0; i < parts.length - 1; i++) {
      const k = parts[i];
      if (cur[k] == null || typeof cur[k] !== "object") cur[k] = {};
      cur = cur[k];
    }
    cur[parts[parts.length - 1]] = value;
    return root;
  }

  function scheduleSave(design) {
    boot.design = design;
    bootEl.textContent = JSON.stringify(boot);
    setStatus("Saving…", "saving");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      persist(design);
    }, 400);
  }

  function persist(design) {
    const payload = {
      type: "as-design-system/1",
      action: "write",
      path: "design/design-system.json",
      content: JSON.stringify(design, null, 2) + "\n",
      themePath: "src/styles/theme.generated.css",
      generatedTsPath: "src/design/design-system.generated.ts",
    };
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(payload, "*");
      setStatus("Saved to Studio", "saved");
    } else {
      setStatus("Open in Studio Design to save", "warn");
    }
  }

  // ── Popover editor ──
  let active = null;

  function closeEditor(opts) {
    if (!active) return;
    const { popover, path, original, pending, onDoc, onKey } = active;
    document.removeEventListener("mousedown", onDoc, true);
    document.removeEventListener("keydown", onKey, true);
    if (opts.revert && pending !== original) {
      applyLiveCss(path, original);
      boot.design = setAtPath(boot.design, path, original);
      bootEl.textContent = JSON.stringify(boot);
    }
    popover.remove();
    active = null;
  }

  function toHex6(value) {
    const v = String(value).trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) return v.toLowerCase();
    if (/^#[0-9a-fA-F]{3}$/.test(v)) {
      const r = v[1],
        g = v[2],
        b = v[3];
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    return "#000000";
  }

  function openEditor(anchor) {
    const path = anchor.getAttribute("data-as-token-path");
    const kind = anchor.getAttribute("data-as-token-kind") || "other";
    const current = anchor.getAttribute("data-as-token-value") || "";
    if (!path) return;

    closeEditor({ revert: false });

    const popover = document.createElement("div");
    popover.className = "as-ds-edit";
    popover.setAttribute("role", "dialog");
    popover.setAttribute("aria-label", `Edit ${path}`);
    popover.innerHTML = `
      <div class="as-ds-edit__head">
        <span class="as-ds-edit__path">${path}</span>
        <button type="button" class="as-ds-edit__close" aria-label="Close">×</button>
      </div>
      <div class="as-ds-edit__body"></div>
      <div class="as-ds-edit__foot"><span>Enter confirm · Esc revert</span></div>
    `;
    const body = popover.querySelector(".as-ds-edit__body");
    let pending = current;

    const emit = (value) => {
      pending = value;
      applyLiveCss(path, value);
      const next = setAtPath(boot.design, path, value);
      scheduleSave(next);
      if (active) active.pending = value;
    };

    if (kind === "color") {
      const wrap = document.createElement("div");
      wrap.className = "as-ds-edit__color";
      const picker = document.createElement("input");
      picker.type = "color";
      picker.value = toHex6(current);
      const text = document.createElement("input");
      text.type = "text";
      text.className = "as-ds-edit__input";
      text.value = current;
      picker.addEventListener("input", () => {
        text.value = picker.value;
        emit(picker.value);
      });
      text.addEventListener("input", () => emit(text.value));
      text.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          closeEditor({ revert: false });
        }
      });
      wrap.appendChild(picker);
      wrap.appendChild(text);
      body.appendChild(wrap);
      requestAnimationFrame(() => text.focus());
    } else {
      const text = document.createElement("input");
      text.type = "text";
      text.className = "as-ds-edit__input";
      text.value = current;
      text.addEventListener("input", () => emit(text.value));
      text.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          closeEditor({ revert: false });
        }
      });
      body.appendChild(text);
      requestAnimationFrame(() => text.focus());
    }

    popover.querySelector(".as-ds-edit__close")?.addEventListener("click", () => {
      closeEditor({ revert: false });
    });

    document.body.appendChild(popover);

    const place = () => {
      const r = anchor.getBoundingClientRect();
      const pr = popover.getBoundingClientRect();
      let top = r.bottom + 8;
      let left = r.left;
      if (top + pr.height > window.innerHeight - 8) {
        top = Math.max(8, r.top - pr.height - 8);
      }
      if (left + pr.width > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - pr.width - 8);
      }
      popover.style.top = `${top}px`;
      popover.style.left = `${left}px`;
    };
    place();

    const onDoc = (e) => {
      if (!(e.target instanceof Node)) return;
      if (popover.contains(e.target) || anchor.contains(e.target)) return;
      closeEditor({ revert: false });
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeEditor({ revert: true });
      }
    };
    document.addEventListener("mousedown", onDoc, true);
    document.addEventListener("keydown", onKey, true);

    active = {
      popover,
      path,
      original: current,
      pending,
      onDoc,
      onKey,
    };
  }

  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const btn = t.closest("[data-as-token-path]");
    if (btn instanceof HTMLElement) {
      e.preventDefault();
      openEditor(btn);
    }
  });

  window.addEventListener("message", (e) => {
    if (e.data?.type === "as-design-system/1" && e.data.action === "write-ack") {
      setStatus(e.data.ok ? "Saved" : e.data.error || "Save failed", e.data.ok ? "saved" : "error");
    }
  });
})();
