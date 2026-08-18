/**
 * HTML shell for Sandbox — Studio-tokenized chrome + project stage.
 * Layout mirrors BrowserUI: canvas left · inspector right (always both).
 */

import type { SandboxRegistry } from "../registry-pure.js";
import type { SandboxInspectorDraft } from "../draft-pure.js";
import type { InspectorBootstrap, SandboxMode } from "../types.js";
import { escapeHtml } from "./escape-pure.js";
import { SANDBOX_CHROME_CSS, SANDBOX_DEFAULT_THEME_CSS } from "./chrome-css.js";
import {
  buildDesignBreadcrumbs,
  DESIGN_CANVAS_NAV_SCRIPT,
  renderDesignBreadcrumbHtml,
} from "./breadcrumb-pure.js";
import {
  renderComponentsCatalogBody,
  toComponentsIndexItems,
} from "./components-index-pure.js";
import { siteThemeBootInlineScript } from "@glassbox-studio/studio-core/browser";

export type SandboxHtmlShellOptions = {
  registry: SandboxRegistry;
  /** Project stylesheets — cascade into the preview stage. */
  stylesheets?: string[];
  /** Extra head HTML (fonts for the component stage). */
  headExtra?: string;
  /** Path prefix for component routes (default /__as/design/components). */
  componentsBasePath?: string;
  /** Inspector client script src (default /design-inspector.js). */
  inspectorScriptSrc?: string;
  /**
   * Pre-rendered `:root` / `.dark` CSS vars (from `themeStyleBlock`).
   * Defaults to Studio theme-default dark/light embedded in the engine.
   */
  themeCss?: string;
  /** Match Studio shell (default dark). */
  colorMode?: "light" | "dark";
  /** Inspector rail width CSS value. */
  inspectorWidth?: string;
  /** Map component id → Studio Nav file path (for breadcrumb sync). */
  componentNavPath?: (id: string) => string | undefined;
};

function basePath(opts: SandboxHtmlShellOptions): string {
  return (opts.componentsBasePath ?? "/__as/design/components").replace(
    /\/$/,
    "",
  );
}

function modeTabs(
  opts: SandboxHtmlShellOptions,
  id: string,
  mode: SandboxMode,
): string {
  const base = basePath(opts);
  const themeQ =
    opts.colorMode === "light" || opts.colorMode === "dark"
      ? `&as-theme=${opts.colorMode}`
      : "";
  return `<nav class="as-sb-mode" role="tablist" aria-label="Preview mode">
    <a role="tab" aria-selected="${mode === "sandbox"}" class="as-sb-mode__tab" href="${escapeHtml(base)}/${escapeHtml(id)}?mode=sandbox${themeQ}" data-as-mode="sandbox">Sandbox</a>
    <a role="tab" aria-selected="${mode === "permutations"}" class="as-sb-mode__tab" href="${escapeHtml(base)}/${escapeHtml(id)}?mode=permutations${themeQ}" data-as-mode="permutations">All permutations</a>
  </nav>`;
}

function themeToggleButton(): string {
  return `<button type="button" class="as-sb-theme-toggle" data-as-theme-toggle aria-label="Toggle color mode" title="Toggle light / dark">☽</button>`;
}

function fieldHint(description?: string): string {
  if (!description) return "";
  return `<span class="as-sb-field__hint">${escapeHtml(description)}</span>`;
}

function inspectorHtml(boot: InspectorBootstrap): string {
  const propFields = Object.entries(boot.props)
    .map(([key, def]) => {
      if (def.type !== "enum") return "";
      const opts = def.values
        .map(
          (v) =>
            `<option value="${escapeHtml(v)}" ${boot.draft.props[key] === v ? "selected" : ""}>${escapeHtml(v)}</option>`,
        )
        .join("");
      return `<label class="as-sb-field">
        <span class="as-sb-field__label">${escapeHtml(def.title ?? key)}</span>
        ${fieldHint(def.description)}
        <select name="prop:${escapeHtml(key)}" data-as-prop="${escapeHtml(key)}" class="as-sb-control">${opts}</select>
      </label>`;
    })
    .join("");

  const slotFields = Object.entries(boot.slots)
    .map(([key, def]) => {
      const val = boot.draft.slotText[key] ?? "";
      return `<label class="as-sb-field">
        <span class="as-sb-field__label">${escapeHtml(def.title ?? key)}</span>
        ${fieldHint(def.description)}
        <input type="text" name="slot:${escapeHtml(key)}" data-as-slot="${escapeHtml(key)}" value="${escapeHtml(val)}" class="as-sb-control" />
      </label>`;
    })
    .join("");

  const childrenField = boot.acceptsChildren
    ? `<label class="as-sb-field">
        <span class="as-sb-field__label">Children</span>
        <span class="as-sb-field__hint">Free-form / mapped content</span>
        <textarea name="children" data-as-children rows="3" class="as-sb-control as-sb-control--mono as-sb-control--area">${escapeHtml(boot.draft.children)}</textarea>
      </label>`
    : "";

  return `<aside class="as-sb-inspector" data-as-inspector aria-label="Component inspector">
    <header class="as-sb-inspector__header">
      <div>
        <p class="as-sb-inspector__eyebrow">Inspector</p>
        <h2 class="as-sb-inspector__title">${escapeHtml(boot.title)}</h2>
      </div>
      <button type="button" data-as-reset class="as-sb-inspector__reset">Reset</button>
    </header>
    <p class="as-sb-inspector__lead">Edits apply to Sandbox and sync across All permutations (shared text / base props).</p>
    <form data-as-inspector-form class="as-sb-inspector__form" onsubmit="return false">
      ${propFields ? `<fieldset class="as-sb-fieldset"><legend class="as-sb-fieldset__legend">Props</legend>${propFields}</fieldset>` : ""}
      ${slotFields ? `<fieldset class="as-sb-fieldset"><legend class="as-sb-fieldset__legend">Slots</legend>${slotFields}</fieldset>` : ""}
      ${childrenField ? `<fieldset class="as-sb-fieldset"><legend class="as-sb-fieldset__legend">Children</legend>${childrenField}</fieldset>` : ""}
    </form>
  </aside>`;
}

function sandboxCard(id: string, html: string): string {
  return `<article class="as-sb-card" data-as-sandbox>
    <div class="as-sb-card__label">
      <span>Preview</span>
      <span class="as-sb-card__label-mono">${escapeHtml(id)}</span>
    </div>
    <div class="as-sb-stage" data-as-stage>${html}</div>
  </article>`;
}

function permutationCard(
  label: string,
  propKey: string,
  value: string,
  html: string,
): string {
  return `<article class="as-sb-card" data-as-permutation="${escapeHtml(propKey)}:${escapeHtml(value)}">
    <div class="as-sb-card__label">
      <span>${escapeHtml(label)}</span>
    </div>
    <div class="as-sb-stage" data-as-stage>${html}</div>
  </article>`;
}

function previewPane(
  registry: SandboxRegistry,
  mode: SandboxMode,
  id: string,
  draft: SandboxInspectorDraft,
): string {
  if (mode === "sandbox") {
    const html = registry.renderWithDraft(id, draft) ?? "";
    return `<div class="as-sb-canvas" data-as-preview>
      <div class="as-sb-canvas__inner" data-as-preview-body>
        ${sandboxCard(id, html)}
      </div>
    </div>`;
  }

  const cards = registry.buildPermutationCards(id, draft) ?? [];
  const gallery = cards
    .map((card) =>
      permutationCard(card.label, card.propKey, card.value, card.html),
    )
    .join("");

  return `<div class="as-sb-canvas" data-as-preview>
    <div class="as-sb-canvas__inner" data-as-preview-body>${gallery}</div>
  </div>`;
}

function documentShell(
  opts: SandboxHtmlShellOptions,
  title: string,
  bodyInner: string,
): string {
  const sheets = (opts.stylesheets ?? [])
    .map((href) => `<link rel="stylesheet" href="${escapeHtml(href)}" />`)
    .join("\n    ");
  const colorMode = opts.colorMode ?? "dark";
  const themeCss = opts.themeCss ?? SANDBOX_DEFAULT_THEME_CSS;
  const width = opts.inspectorWidth ?? "300px";

  return `<!DOCTYPE html>
<html lang="en" class="${colorMode === "dark" ? "dark" : ""}" data-theme="${colorMode}" style="color-scheme:${colorMode}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <script>${siteThemeBootInlineScript({
      storageKey: "as-sandbox:color-mode",
      defaultMode: colorMode,
      toggleSelector: "[data-as-theme-toggle]",
    })}</script>
    ${sheets}
    ${opts.headExtra ?? ""}
    <style id="as-sb-theme">${themeCss}</style>
    <style id="as-sb-chrome">
:root { --as-sb-inspector-width: ${escapeHtml(width)}; }
${SANDBOX_CHROME_CSS}
    </style>
  </head>
  <body class="as-sb">${bodyInner}
  <script>${DESIGN_CANVAS_NAV_SCRIPT}</script>
  </body>
</html>`;
}

export function renderSandboxComponentPage(
  opts: SandboxHtmlShellOptions,
  id: string,
  mode: SandboxMode = "sandbox",
): string | null {
  const boot = opts.registry.inspectorBootstrap(id);
  const draft = opts.registry.createDefaultDraft(id);
  const meta = opts.registry.getMeta(id);
  if (!boot || !draft || !meta) return null;

  const scriptSrc = opts.inspectorScriptSrc ?? "/design-inspector.js";
  const base = basePath(opts);
  const navPath = opts.componentNavPath?.(id);
  const crumbs = buildDesignBreadcrumbs("component", {
    label: meta.title,
    href: `${base}/${id}?mode=sandbox`,
    navPath,
    sitePath: `${base}/${id}`,
  });
  const body = `
  <div class="as-sb-root">
    <header class="as-sb-topbar">
      <div class="as-sb-topbar__meta">
        ${renderDesignBreadcrumbHtml(crumbs)}
        <h1 class="as-sb-topbar__title">${escapeHtml(meta.title)}</h1>
      </div>
      <div class="as-sb-topbar__actions">
        ${modeTabs(opts, id, mode)}
        ${themeToggleButton()}
      </div>
    </header>
    <div class="as-sb-body" data-as-studio-layout data-as-component-id="${escapeHtml(id)}" data-as-mode="${escapeHtml(mode)}">
      ${previewPane(opts.registry, mode, id, draft)}
      ${inspectorHtml(boot)}
    </div>
  </div>
  <script type="application/json" id="as-inspector-boot">${JSON.stringify(boot).replace(/</g, "\\u003c")}</script>
  <script type="module" src="${escapeHtml(scriptSrc)}"></script>`;

  return documentShell(opts, `${meta.title} · Design`, body);
}

export function renderSandboxComponentsIndex(
  opts: SandboxHtmlShellOptions,
): string {
  const base = basePath(opts);
  const crumbs = buildDesignBreadcrumbs("components");
  const items = toComponentsIndexItems(opts.registry.list(), {
    basePath: base,
    componentNavPath: opts.componentNavPath,
  });
  return documentShell(
    opts,
    "Components · Design",
    renderComponentsCatalogBody({
      breadcrumbHtml: renderDesignBreadcrumbHtml(crumbs),
      items,
      themeToggleHtml: themeToggleButton(),
    }),
  );
}

/** JSON render API for live inspector updates. */
export function renderSandboxApiPayload(
  registry: SandboxRegistry,
  id: string,
  mode: SandboxMode,
  draft: SandboxInspectorDraft,
): { html: string } | null {
  if (!registry.getMeta(id)) return null;
  if (mode === "sandbox") {
    return {
      html: sandboxCard(id, registry.renderWithDraft(id, draft) ?? ""),
    };
  }
  const cards = registry.buildPermutationCards(id, draft) ?? [];
  const gallery = cards
    .map((card) =>
      permutationCard(card.label, card.propKey, card.value, card.html),
    )
    .join("");
  return { html: gallery };
}
