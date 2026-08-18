import { createActor, type ActorRefFrom } from "xstate";
import {
  CONSENT_CATEGORIES,
  OPTIONAL_CONSENT_CATEGORIES,
  type ConsentCategory,
} from "./categories.js";
import type { ConsentApi, ConsentCategoryMap } from "./consent-api.js";
import {
  privacyPromptMachine,
  type PrivacyPromptMode,
} from "./privacy-prompt-machine.js";

/** Custom event name when consent categories change. */
export const CONSENT_GRANT_EVENT = "agentStudio:consent-grant";

/** Open cookie preferences from a footer link (`data-as-action="cookie-preferences"`). */
export const CONSENT_PREFERENCES_OPEN_EVENT = "agentStudio:consent-preferences-open";

export interface PrivacyPromptBannerCopy {
  title: string;
  description: string;
  acceptAllLabel: string;
  rejectNonEssentialLabel: string;
  customizeLabel: string;
  privacyPolicyUrl: string;
}

export interface PrivacyPromptCategoryMeta {
  label: string;
  description: string;
}

export interface PrivacyPromptPreferencesCopy {
  linkLabel: string;
  title: string;
  saveLabel: string;
  closeLabel?: string;
}

export interface MountPrivacyPromptOptions {
  consent: ConsentApi;
  banner: PrivacyPromptBannerCopy;
  categories?: Partial<Record<ConsentCategory, PrivacyPromptCategoryMeta>>;
  preferences?: PrivacyPromptPreferencesCopy;
  document?: Document;
  /** Called after accept/reject/save so hosts can start analytics. */
  onConsentDecision?: (api: ConsentApi) => void;
}

type PrivacyPromptActor = ActorRefFrom<typeof privacyPromptMachine>;

const ROOT_ID = "as-consent-root";
const STYLES_ID = "as-consent-styles";

/**
 * Mount BrowserUI-parity consent UI: fixed overlay + floating panel, injected CSS,
 * banner / customize / preferences modes. Dispatches `agentStudio:consent-grant`.
 */
export function mountPrivacyPrompt(opts: MountPrivacyPromptOptions): { dispose: () => void } {
  const doc = opts.document ?? (typeof document !== "undefined" ? document : undefined);
  const win = doc?.defaultView ?? (typeof window !== "undefined" ? window : undefined);
  if (!doc?.body || !win) {
    return { dispose() {} };
  }

  const actor = createActor(privacyPromptMachine);
  let scrollY = 0;
  let scrollLocked = false;

  const lockScroll = () => {
    if (!doc.body || !doc.documentElement) return;
    scrollY = win.scrollY || win.pageYOffset || 0;
    doc.documentElement.classList.add("as-consent-scroll-lock");
    doc.body.classList.add("as-consent-scroll-lock");
    doc.body.style.top = `-${scrollY}px`;
    scrollLocked = true;
  };

  const unlockScroll = () => {
    if (!scrollLocked) return;
    scrollLocked = false;
    doc.documentElement?.classList.remove("as-consent-scroll-lock");
    if (doc.body) {
      doc.body.classList.remove("as-consent-scroll-lock");
      doc.body.style.top = "";
    }
    win.scrollTo(0, scrollY);
  };

  const closeRoot = () => {
    doc.getElementById(ROOT_ID)?.remove();
    unlockScroll();
  };

  const paint = (mode: PrivacyPromptMode) => {
    ensureStyles(doc);
    closeRoot();
    openPanel({
      doc,
      win,
      mode,
      opts,
      actor,
      lockScroll,
      onDecision: () => {
        dispatchGrant(doc, opts.consent);
        opts.onConsentDecision?.(opts.consent);
      },
    });
  };

  const sub = actor.subscribe((snapshot) => {
    if (snapshot.matches("hidden")) {
      closeRoot();
      return;
    }
    const mode = snapshot.context.mode;
    if (mode) paint(mode);
  });

  actor.start();
  actor.send({ type: "BOOT", hasStoredConsent: opts.consent.hasStoredConsent() });

  const onPreferencesOpen = () => {
    actor.send({ type: "OPEN_PREFERENCES" });
  };
  doc.addEventListener(CONSENT_PREFERENCES_OPEN_EVENT, onPreferencesOpen);

  const onDocClick = (ev: Event) => {
    const target = (ev.target as Element | null)?.closest?.(
      '[data-as-action="cookie-preferences"]',
    );
    if (!target) return;
    ev.preventDefault();
    doc.dispatchEvent(new CustomEvent(CONSENT_PREFERENCES_OPEN_EVENT));
  };
  doc.addEventListener("click", onDocClick);

  return {
    dispose() {
      sub.unsubscribe();
      doc.removeEventListener(CONSENT_PREFERENCES_OPEN_EVENT, onPreferencesOpen);
      doc.removeEventListener("click", onDocClick);
      closeRoot();
      doc.getElementById(STYLES_ID)?.remove();
      actor.stop();
    },
  };
}

function openPanel(args: {
  doc: Document;
  win: Window;
  mode: PrivacyPromptMode;
  opts: MountPrivacyPromptOptions;
  actor: PrivacyPromptActor;
  lockScroll: () => void;
  onDecision: () => void;
}) {
  const { doc, mode, opts, actor, lockScroll, onDecision } = args;
  if (!doc.body) return;

  const root = doc.createElement("div");
  root.id = ROOT_ID;
  root.setAttribute("data-as-component", "consent-banner");
  root.setAttribute("data-as-consent-root", "1");
  root.setAttribute("role", "presentation");
  if (mode === "preferences") root.dataset.asPreferences = "true";

  const panel = doc.createElement("div");
  panel.className = "as-consent-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.tabIndex = -1;

  const selection = buildSelection(opts.consent);
  const prefs = opts.preferences ?? {
    linkLabel: "Cookie preferences",
    title: "Your privacy choices",
    saveLabel: "Save preferences",
    closeLabel: "Close",
  };

  const header = doc.createElement("div");
  header.className = "as-consent-header";

  const title = doc.createElement("h2");
  title.id = "as-consent-title";
  title.textContent =
    mode === "preferences" || mode === "customize" ? prefs.title : opts.banner.title;
  panel.setAttribute("aria-labelledby", "as-consent-title");
  header.appendChild(title);

  if (mode === "preferences" || mode === "customize") {
    const close = doc.createElement("button");
    close.type = "button";
    close.className = "as-consent-close";
    close.setAttribute("aria-label", prefs.closeLabel ?? "Close");
    close.textContent = "\u00d7";
    close.addEventListener("click", () => {
      actor.send({ type: "CLOSE" });
    });
    header.appendChild(close);
  }

  const desc = doc.createElement("p");
  desc.textContent = opts.banner.description;

  const categoriesEl = doc.createElement("div");
  categoriesEl.className = "as-consent-categories";
  const showCategories = mode === "customize" || mode === "preferences";
  if (showCategories) {
    buildCategoryRows(doc, categoriesEl, opts.categories, selection);
  }

  const actions = doc.createElement("div");
  actions.className = "as-consent-actions";

  if (mode === "banner") {
    const accept = doc.createElement("button");
    accept.type = "button";
    accept.className = "primary";
    accept.textContent = opts.banner.acceptAllLabel;
    accept.addEventListener("click", () => {
      opts.consent.acceptAll();
      actor.send({ type: "ACCEPT_ALL" });
      onDecision();
    });

    const reject = doc.createElement("button");
    reject.type = "button";
    reject.className = "secondary";
    reject.textContent = opts.banner.rejectNonEssentialLabel;
    reject.addEventListener("click", () => {
      opts.consent.rejectNonEssential();
      actor.send({ type: "REJECT_NON_ESSENTIAL" });
      onDecision();
    });

    const customize = doc.createElement("button");
    customize.type = "button";
    customize.className = "secondary";
    customize.textContent = opts.banner.customizeLabel;
    customize.addEventListener("click", () => {
      actor.send({ type: "OPEN_CUSTOMIZE" });
    });

    actions.append(accept, reject, customize);
  } else {
    const save = doc.createElement("button");
    save.type = "button";
    save.className = "primary";
    save.textContent = prefs.saveLabel;
    save.addEventListener("click", () => {
      opts.consent.setMany(readSelection(categoriesEl, selection));
      actor.send({ type: "SAVE" });
      onDecision();
    });
    actions.appendChild(save);
  }

  const privacy = doc.createElement("a");
  privacy.className = "as-consent-privacy";
  privacy.href = opts.banner.privacyPolicyUrl;
  privacy.textContent = "Privacy policy";

  panel.append(header, desc);
  if (showCategories) panel.append(categoriesEl);
  panel.append(actions, privacy);
  root.appendChild(panel);
  doc.body.appendChild(root);
  lockScroll();
  focusWithoutScroll(panel);
}

function buildSelection(consent: ConsentApi): ConsentCategoryMap {
  return { ...consent.categories, strictly_necessary: true };
}

function buildCategoryRows(
  doc: Document,
  container: HTMLElement,
  meta: MountPrivacyPromptOptions["categories"],
  selection: ConsentCategoryMap,
) {
  container.replaceChildren();
  for (const id of CONSENT_CATEGORIES) {
    const catMeta = meta?.[id] ?? fallbackCategoryMeta(id);
    const row = doc.createElement("div");
    row.className = "as-consent-row";
    const copy = doc.createElement("div");
    const strong = doc.createElement("strong");
    strong.textContent = catMeta.label;
    const span = doc.createElement("span");
    span.textContent = catMeta.description;
    copy.append(strong, span);
    const toggle = doc.createElement("input");
    toggle.type = "checkbox";
    toggle.checked = !!selection[id];
    toggle.disabled = id === "strictly_necessary";
    toggle.dataset.category = id;
    row.append(copy, toggle);
    container.appendChild(row);
  }
}

function readSelection(
  categoriesEl: HTMLElement,
  fallback: ConsentCategoryMap,
): ConsentCategoryMap {
  const next: ConsentCategoryMap = { ...fallback, strictly_necessary: true };
  const inputs = categoriesEl.querySelectorAll<HTMLInputElement>("input[data-category]");
  if (!inputs.length) return next;
  for (const input of Array.from(inputs)) {
    const key = input.dataset.category as ConsentCategory | undefined;
    if (!key || key === "strictly_necessary") continue;
    if ((OPTIONAL_CONSENT_CATEGORIES as readonly string[]).includes(key)) {
      next[key] = input.checked;
    }
  }
  return next;
}

function fallbackCategoryMeta(id: ConsentCategory): PrivacyPromptCategoryMeta {
  const labels: Record<ConsentCategory, PrivacyPromptCategoryMeta> = {
    strictly_necessary: {
      label: "Strictly necessary",
      description: "Required for security and basic site operation. Always on.",
    },
    functional: {
      label: "Functional",
      description: "Preferences and embedded media that improve the experience.",
    },
    analytics: {
      label: "Analytics",
      description: "Anonymous usage measurement.",
    },
    marketing: {
      label: "Marketing",
      description: "Campaign attribution and ads.",
    },
    personalization: {
      label: "Personalization",
      description: "Tailored content and experiments.",
    },
  };
  return labels[id];
}

function ensureStyles(doc: Document) {
  if (doc.getElementById(STYLES_ID)) return;
  if (!doc.head) return;
  const style = doc.createElement("style");
  style.id = STYLES_ID;
  // Self-contained overlay CSS (BrowserUI parity) — cannot rely on host Tailwind.
  style.textContent = [
    "html.as-consent-scroll-lock,body.as-consent-scroll-lock{overflow:hidden!important}",
    "body.as-consent-scroll-lock{position:fixed;width:100%;left:0;right:0}",
    `#${ROOT_ID}{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-end;justify-content:center;padding:1rem;background:rgba(15,23,42,.45);pointer-events:auto;box-sizing:border-box}`,
    ".as-consent-panel{max-width:36rem;width:100%;max-height:min(90vh,40rem);overflow:auto;background:#fff;color:#0f172a;border-radius:.75rem;box-shadow:0 25px 50px -12px rgba(0,0,0,.35);padding:1.25rem;pointer-events:auto;box-sizing:border-box;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}",
    ".as-consent-header{display:flex;align-items:flex-start;justify-content:space-between;gap:.75rem;margin-bottom:.5rem}",
    ".as-consent-header h2{margin:0;font-size:1.125rem;line-height:1.35;flex:1;font-weight:600;color:#0f172a}",
    ".as-consent-close{flex:0 0 auto;border:0;background:#f1f5f9;color:#475569;border-radius:.375rem;width:2rem;height:2rem;font-size:1.25rem;line-height:1;cursor:pointer}",
    ".as-consent-close:hover{background:#e2e8f0;color:#0f172a}",
    ".as-consent-panel>p{margin:0 0 1rem;line-height:1.5;font-size:.9375rem;color:#475569}",
    ".as-consent-actions{display:flex;flex-wrap:wrap;gap:.5rem}",
    ".as-consent-actions button{border:0;border-radius:.5rem;padding:.625rem .875rem;font-size:.875rem;font-weight:500;cursor:pointer;line-height:1.25}",
    ".as-consent-actions .primary{background:#4f46e5;color:#fff}",
    ".as-consent-actions .primary:hover{background:#4338ca}",
    ".as-consent-actions .secondary{background:#e2e8f0;color:#0f172a}",
    ".as-consent-actions .secondary:hover{background:#cbd5e1}",
    ".as-consent-categories{display:grid;gap:.75rem;margin:0 0 1rem}",
    ".as-consent-row{display:grid;grid-template-columns:1fr auto;gap:.75rem;align-items:start}",
    ".as-consent-row strong{display:block;font-size:.875rem;color:#0f172a}",
    ".as-consent-row span{display:block;font-size:.8125rem;color:#64748b;margin-top:.125rem}",
    ".as-consent-privacy{display:inline-block;margin-top:.75rem;font-size:.8125rem;color:#64748b}",
    ".as-consent-privacy:hover{color:#4f46e5}",
  ].join("");
  doc.head.appendChild(style);
}

function focusWithoutScroll(el: HTMLElement) {
  try {
    el.focus({ preventScroll: true });
  } catch {
    el.focus();
  }
}

function dispatchGrant(doc: Document, consent: ConsentApi) {
  doc.dispatchEvent(
    new CustomEvent(CONSENT_GRANT_EVENT, {
      detail: { categories: consent.categories },
    }),
  );
}
