/**
 * Design canvas home — brand overview + nav CTAs (pure HTML).
 */

export type DesignHomeBrand = {
  name: string;
  initials: string;
  tagline?: string;
};

export type DesignHomeLink = {
  id: "system" | "components";
  title: string;
  description: string;
  /** Project-relative path Studio should select (file or folder). */
  navPath: string;
  href: string;
};

export type DesignHomeSwatch = {
  name: string;
  value: string;
};

export type DesignHomeInput = {
  brand: DesignHomeBrand;
  overview: string;
  links: readonly DesignHomeLink[];
  swatches: readonly DesignHomeSwatch[];
  typeSample?: string;
  colorMode?: "light" | "dark";
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Inner body for Design home (no document shell). */
export function renderDesignHomeBody(input: DesignHomeInput): string {
  const { brand, overview, links, swatches } = input;
  const tagline = brand.tagline?.trim();
  const typeSample =
    input.typeSample?.trim() ||
    "Aa Bb Cc — ship the work that matters.";

  const swatchHtml = swatches
    .map(
      (s) =>
        `<div class="as-dh-swatch" title="${escapeHtml(s.name)}">
          <span class="as-dh-swatch__chip" style="background:${escapeHtml(s.value)}"></span>
          <span class="as-dh-swatch__name">${escapeHtml(s.name)}</span>
          <span class="as-dh-swatch__value">${escapeHtml(s.value)}</span>
        </div>`,
    )
    .join("");

  const cards = links
    .map(
      (link) =>
        `<a
          class="as-dh-card"
          href="${escapeHtml(link.href)}"
          data-as-design-nav="${escapeHtml(link.navPath)}"
        >
          <span class="as-dh-card__eyebrow">${escapeHtml(link.id === "system" ? "Tokens" : "Library")}</span>
          <span class="as-dh-card__title">${escapeHtml(link.title)}</span>
          <span class="as-dh-card__desc">${escapeHtml(link.description)}</span>
          <span class="as-dh-card__cta">Open →</span>
        </a>`,
    )
    .join("");

  return `<div class="as-dh">
  <header class="as-dh-hero">
    <div class="as-dh-mark" aria-hidden="true">${escapeHtml(brand.initials)}</div>
    <div class="as-dh-hero__text">
      <p class="as-dh-eyebrow">Design</p>
      <h1 class="as-dh-title">${escapeHtml(brand.name)}</h1>
      ${tagline ? `<p class="as-dh-tagline">${escapeHtml(tagline)}</p>` : ""}
      <p class="as-dh-overview">${escapeHtml(overview)}</p>
    </div>
  </header>

  <section class="as-dh-section" aria-label="Brand tokens">
    <h2 class="as-dh-section__title">Palette</h2>
    <div class="as-dh-swatches">${swatchHtml}</div>
    <p class="as-dh-type-sample" style="font-family:var(--font-display)">${escapeHtml(typeSample)}</p>
  </section>

  <nav class="as-dh-nav" aria-label="Design sections">
    ${cards}
  </nav>
</div>`;
}

/** postMessage bridge — Studio selects Nav path, keeps Design window linked. */
export const DESIGN_HOME_NAV_SCRIPT = `(function(){
  document.addEventListener("click", function(e){
    var t = e.target;
    if (!t || !t.closest) return;
    var a = t.closest("[data-as-design-nav]");
    if (!a) return;
    var path = a.getAttribute("data-as-design-nav");
    if (!path) return;
    e.preventDefault();
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: "as-design-nav/1",
          action: "open",
          path: path
        }, "*");
      } else {
        window.location.href = a.getAttribute("href") || "/__as/design";
      }
    } catch (_) {
      window.location.href = a.getAttribute("href") || "/__as/design";
    }
  });
})();`;
