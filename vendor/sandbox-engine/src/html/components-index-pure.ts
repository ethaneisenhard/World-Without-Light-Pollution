/**
 * Design Components catalog — directory-style HTML (nav · search · cards).
 * Pure: no DOM; hosts inject chrome CSS + filter script.
 */

import type { DesignComponentMeta } from "@glassbox-studio/studio-core/browser";
import { escapeHtml } from "./escape-pure.js";

export type ComponentsIndexItem = {
  id: string;
  title: string;
  layer: string;
  href: string;
  sitePath: string;
  navPath?: string;
  blurb: string;
};

export function componentsCatalogBlurb(meta: {
  id: string;
  title: string;
  layer: string;
  acceptsChildren?: boolean;
}): string {
  const layer = String(meta.layer ?? "component").toLowerCase();
  if (layer === "composite") {
    return `Composite pattern — open the sandbox to tune slots and layout for ${meta.title}.`;
  }
  if (layer === "primitive") {
    return meta.acceptsChildren
      ? `Layout primitive — wraps children; inspect props in the sandbox.`
      : `Primitive — building block for pages and composites.`;
  }
  return `Open the sandbox to inspect props, slots, and permutations.`;
}

export function layerLabel(layer: string): string {
  const l = String(layer ?? "component").toLowerCase();
  if (l === "primitive") return "Primitive";
  if (l === "composite") return "Composite";
  return l ? l.charAt(0).toUpperCase() + l.slice(1) : "Component";
}

/** Unique layers in registry order (primitives first when present). */
export function catalogLayers(
  items: readonly { layer: string }[],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const prefer = ["primitive", "composite"];
  for (const p of prefer) {
    if (items.some((i) => String(i.layer).toLowerCase() === p)) {
      seen.add(p);
      out.push(p);
    }
  }
  for (const i of items) {
    const l = String(i.layer ?? "component").toLowerCase();
    if (!seen.has(l)) {
      seen.add(l);
      out.push(l);
    }
  }
  return out;
}

export function toComponentsIndexItems(
  metas: readonly DesignComponentMeta[],
  opts: {
    basePath: string;
    componentNavPath?: (id: string) => string | undefined;
  },
): ComponentsIndexItem[] {
  const base = opts.basePath.replace(/\/$/, "");
  return metas.map((c) => ({
    id: c.id,
    title: c.title,
    layer: String(c.layer ?? "component").toLowerCase(),
    href: `${base}/${c.id}?mode=sandbox`,
    sitePath: `${base}/${c.id}`,
    navPath: opts.componentNavPath?.(c.id),
    blurb: componentsCatalogBlurb(c),
  }));
}

/** Client filter for layer tabs + search (no framework). */
export const COMPONENTS_CATALOG_FILTER_SCRIPT = `(function(){
  var root = document.querySelector("[data-as-sb-catalog]");
  if (!root) return;
  var q = root.querySelector("[data-as-sb-catalog-q]");
  var cards = Array.prototype.slice.call(root.querySelectorAll("[data-as-sb-catalog-card]"));
  var navBtns = Array.prototype.slice.call(root.querySelectorAll("[data-as-sb-catalog-layer]"));
  var empty = root.querySelector("[data-as-sb-catalog-empty]");
  var countEl = root.querySelector("[data-as-sb-catalog-count]");
  var layer = "all";
  function apply() {
    var query = (q && q.value || "").trim().toLowerCase();
    var n = 0;
    cards.forEach(function(card) {
      var L = card.getAttribute("data-layer") || "";
      var hay = (card.getAttribute("data-search") || "").toLowerCase();
      var okLayer = layer === "all" || L === layer;
      var okQ = !query || hay.indexOf(query) !== -1;
      var show = okLayer && okQ;
      card.hidden = !show;
      if (show) n++;
    });
    if (empty) empty.hidden = n > 0;
    if (countEl) countEl.textContent = n + " component" + (n === 1 ? "" : "s");
  }
  navBtns.forEach(function(btn) {
    btn.addEventListener("click", function() {
      layer = btn.getAttribute("data-as-sb-catalog-layer") || "all";
      navBtns.forEach(function(b) {
        var on = b === btn;
        b.setAttribute("aria-pressed", on ? "true" : "false");
        b.classList.toggle("as-sb-catalog__nav-btn--active", on);
      });
      apply();
    });
  });
  if (q) q.addEventListener("input", apply);
  apply();
})();`;

export function renderComponentsCatalogBody(input: {
  breadcrumbHtml: string;
  items: readonly ComponentsIndexItem[];
  themeToggleHtml?: string;
}): string {
  const { breadcrumbHtml, items, themeToggleHtml = "" } = input;
  const layers = catalogLayers(items);
  const navLayers = [
    { id: "all", label: "All" },
    ...layers.map((l) => ({ id: l, label: layerLabel(l) })),
  ];

  const navHtml = navLayers
    .map(
      (item, i) =>
        `<button type="button" class="as-sb-catalog__nav-btn${i === 0 ? " as-sb-catalog__nav-btn--active" : ""}" data-as-sb-catalog-layer="${escapeHtml(item.id)}" aria-pressed="${i === 0 ? "true" : "false"}">${escapeHtml(item.label)}</button>`,
    )
    .join("");

  const layerCounts = layers
    .map((l) => {
      const n = items.filter((i) => i.layer === l).length;
      return `<span class="as-sb-catalog__stat"><strong>${n}</strong> ${escapeHtml(layerLabel(l))}${n === 1 ? "" : "s"}</span>`;
    })
    .join("");

  const cards = items
    .map((c) => {
      const navAttr = c.navPath
        ? ` data-as-design-nav="${escapeHtml(c.navPath)}"`
        : "";
      const search = `${c.title} ${c.id} ${c.layer}`;
      const mark = escapeHtml(
        c.title
          .split(/\s+/)
          .map((w) => w[0] ?? "")
          .join("")
          .slice(0, 2)
          .toUpperCase() || c.id.slice(0, 2).toUpperCase(),
      );
      return `<a
        class="as-sb-catalog__card"
        href="${escapeHtml(c.href)}"
        data-as-sb-catalog-card
        data-layer="${escapeHtml(c.layer)}"
        data-search="${escapeHtml(search)}"
        data-as-design-site="${escapeHtml(c.sitePath)}"${navAttr}
      >
        <span class="as-sb-catalog__card-mark" aria-hidden="true">${mark}</span>
        <span class="as-sb-catalog__card-body">
          <span class="as-sb-catalog__card-row">
            <span class="as-sb-catalog__card-title">${escapeHtml(c.title)}</span>
            <span class="as-sb-catalog__badge">${escapeHtml(layerLabel(c.layer))}</span>
          </span>
          <span class="as-sb-catalog__card-id">${escapeHtml(c.id)}</span>
          <span class="as-sb-catalog__card-desc">${escapeHtml(c.blurb)}</span>
          <span class="as-sb-catalog__card-cta">Open sandbox</span>
        </span>
      </a>`;
    })
    .join("\n");

  return `<div class="as-sb-catalog" data-as-sb-catalog data-as-component="design-components-catalog">
  <header class="as-sb-catalog__hero">
    <div class="as-sb-catalog__hero-text">
      ${breadcrumbHtml}
      <p class="as-sb-catalog__eyebrow">Design library</p>
      <h1 class="as-sb-catalog__title">Components</h1>
      <p class="as-sb-catalog__lead">Browse primitives and composites — open any card for the interactive sandbox (props, slots, permutations).</p>
      <div class="as-sb-catalog__stats" aria-label="Library counts">
        <span class="as-sb-catalog__stat"><strong data-as-sb-catalog-count>${items.length} components</strong></span>
        ${layerCounts}
      </div>
    </div>
    ${themeToggleHtml ? `<div class="as-sb-catalog__hero-actions">${themeToggleHtml}</div>` : ""}
  </header>

  <div class="as-sb-catalog__layout">
    <nav class="as-sb-catalog__nav" aria-label="Component layers">
      <span class="as-sb-catalog__nav-label">Explore</span>
      ${navHtml}
    </nav>

    <div class="as-sb-catalog__main">
      <label class="as-sb-catalog__search">
        <span class="as-sb-catalog__search-icon" aria-hidden="true">⌕</span>
        <span class="sr-only">Search components</span>
        <input type="search" data-as-sb-catalog-q class="as-sb-catalog__search-input" placeholder="Search by name or id…" autocomplete="off" />
      </label>

      <div class="as-sb-catalog__grid" data-as-sb-catalog-grid>
        ${cards}
      </div>
      <p class="as-sb-catalog__empty" data-as-sb-catalog-empty hidden>No components match.</p>
    </div>
  </div>
</div>
<script>${COMPONENTS_CATALOG_FILTER_SCRIPT}</script>`;
}
