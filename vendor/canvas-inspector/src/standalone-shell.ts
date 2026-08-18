/**
 * Standalone inspector chrome — sidebar or floating window (DevTools-lite).
 * Styles are self-contained CSS using project theme vars (--color-*).
 * Do NOT rely on Tailwind utilities here (dynamic DOM is purged from CSS).
 *
 * Variants:
 * - standalone — FAB + fixed sidebar/float on the document (ideal-stack top-level)
 * - embedded — fills `mount` host; no FAB (Studio Live rail owns on/off)
 */

export type InspectorDockMode = "sidebar" | "window";

export type InspectorShellVariant = "standalone" | "embedded";

export const INSPECTOR_DOCK_MODES = ["sidebar", "window"] as const;

export function parseInspectorDockMode(
  value: string | null | undefined,
): InspectorDockMode {
  return value === "window" ? "window" : "sidebar";
}

export function nextInspectorDockMode(
  mode: InspectorDockMode,
): InspectorDockMode {
  return mode === "sidebar" ? "window" : "sidebar";
}

export type ShellOpenOpts = {
  /** When false, skip onOpenChange (host already driving close via sync). */
  notify?: boolean;
};

export type StandaloneShellApi = {
  open: () => void;
  close: (opts?: ShellOpenOpts) => void;
  isOpen: () => boolean;
  setDockMode: (mode: InspectorDockMode) => void;
  getDockMode: () => InspectorDockMode;
  setBody: (node: Node | null) => void;
  setStatus: (text: string) => void;
  toolbar: HTMLElement;
  destroy: () => void;
  root: HTMLElement;
};

export type StandaloneShellDeps = {
  doc: Document;
  win: Window;
  /** Mount parent (default: document.body). Embedded uses this as the rail host. */
  mount?: HTMLElement;
  /** standalone = FAB + page dock; embedded = fill mount, no FAB. */
  variant?: InspectorShellVariant;
  storageKey?: string;
  onOpenChange?: (open: boolean) => void;
  onDockModeChange?: (mode: InspectorDockMode) => void;
};

const DEFAULT_STORAGE = "as-ci-dock-mode";
const STYLE_ID = "as-ci-shell-style";

const SHELL_CSS = `
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
/* display:flex above beats UA [hidden]{display:none} — Close must win */
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

export function createStandaloneInspectorShell(
  deps: StandaloneShellDeps,
): StandaloneShellApi {
  const doc = deps.doc;
  const variant: InspectorShellVariant = deps.variant ?? "standalone";
  const embedded = variant === "embedded";
  const storageKey = deps.storageKey ?? DEFAULT_STORAGE;
  const mountParent = deps.mount ?? doc.body;

  let open = false;
  let mode: InspectorDockMode = "sidebar";
  try {
    mode = parseInspectorDockMode(deps.win.sessionStorage?.getItem(storageKey));
  } catch {
    /* ignore */
  }

  // Always refresh — long-lived Studio sessions kept stale CSS without [hidden] win.
  let styleEl = doc.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = doc.createElement("style");
    styleEl.id = STYLE_ID;
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
  empty.textContent =
    "Hover a highlighted block, click to select, double-click text to edit. Props and slots appear here.";
  body.appendChild(empty.cloneNode(true));

  shell.append(titleBar, toolbar, body);

  let drag: { ox: number; oy: number; sx: number; sy: number } | null = null;
  let winPos = {
    top: embedded ? 48 : 72,
    left: embedded ? 16 : Math.max(24, (deps.win.innerWidth || 800) - 420),
  };

  function persistMode() {
    try {
      deps.win.sessionStorage?.setItem(storageKey, mode);
    } catch {
      /* ignore */
    }
  }

  function syncSidebarPad() {
    if (embedded) return;
    const peek =
      typeof deps.win.matchMedia === "function" &&
      deps.win.matchMedia("(max-width: 719px)").matches;
    // Peek sheet must not reserve side gutter — page stays full-bleed / scrollable.
    const pad =
      !peek && open && mode === "sidebar" ? "var(--as-ci-sidebar-w)" : "0px";
    doc.documentElement.style.setProperty("--as-ci-sidebar-pad", pad);
    doc.documentElement.setAttribute(
      "data-as-ci-sidebar-open",
      open && mode === "sidebar" ? "1" : "0",
    );
    doc.documentElement.setAttribute(
      "data-as-ci-peek",
      peek && open ? "1" : "0",
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

  function applyVisibility(next: boolean) {
    shell.hidden = !next;
    // Inline !important — never lose to display:flex in SHELL_CSS / stale sheets.
    if (next) shell.style.setProperty("display", "flex", "important");
    else shell.style.setProperty("display", "none", "important");
    if (!embedded) fab.hidden = next;
  }

  /**
   * Open/close. Host-driven sync uses `{ notify: false }` so Close → inspect-off
   * does not re-enter onRequestClose → sync → close loops.
   */
  function setOpen(next: boolean, opts?: ShellOpenOpts) {
    const notify = opts?.notify !== false;
    const changed = open !== next;
    open = next;
    applyVisibility(next);
    applyLayout();
    if (notify && (changed || !next)) {
      // Always notify Close (even if already closed) so Studio can catch desync.
      // Open only notifies on actual open.
      deps.onOpenChange?.(next);
    }
  }

  function setDockMode(next: InspectorDockMode) {
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
    // Opposite of open: ask host to turn inspect off (embedded) / deactivate (standalone).
    setOpen(false);
  });
  dockBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDockMode(nextInspectorDockMode(mode));
  });

  titleBar.addEventListener("pointerdown", (e) => {
    if (mode !== "window") return;
    if ((e.target as Element).closest("button")) return;
    drag = {
      ox: e.clientX,
      oy: e.clientY,
      sx: winPos.left,
      sy: winPos.top,
    };
    titleBar.setPointerCapture(e.pointerId);
  });
  titleBar.addEventListener("pointermove", (e) => {
    if (!drag) return;
    winPos = {
      left: Math.max(8, drag.sx + (e.clientX - drag.ox)),
      top: Math.max(8, drag.sy + (e.clientY - drag.oy)),
    };
    applyLayout();
  });
  titleBar.addEventListener("pointerup", () => {
    drag = null;
  });

  for (const type of ["mousedown", "click", "pointerdown"] as const) {
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
    setStatus: (text: string) => {
      status.textContent = text;
    },
    setBody: (node: Node | null) => {
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
    },
  };
}
