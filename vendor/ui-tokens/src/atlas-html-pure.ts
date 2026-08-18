/**
 * BrowserUI-inspired design-system atlas HTML (pure string).
 * Clickable swatches/rows — client script binds editors via data-as-token-*.
 */

import {
  enumerateTokenAtlas,
  type DesignSystemDoc,
  type TokenAtlasEntry,
} from "./design-system.ts";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function groupByKind(atlas: TokenAtlasEntry[]) {
  const groups = new Map<string, TokenAtlasEntry[]>();
  for (const e of atlas) {
    const list = groups.get(e.kind) ?? [];
    list.push(e);
    groups.set(e.kind, list);
  }
  return groups;
}

function tokenButtonAttrs(e: TokenAtlasEntry): string {
  return [
    `type="button"`,
    `data-as-token-path="${escapeAttr(e.path)}"`,
    `data-as-token-kind="${escapeAttr(e.kind)}"`,
    `data-as-token-css="${escapeAttr(e.cssVar)}"`,
    `data-as-token-value="${escapeAttr(e.value)}"`,
    `title="${escapeAttr(`${e.path} — ${e.value} (click to edit)`)}"`,
  ].join(" ");
}

function renderColorSection(entries: TokenAtlasEntry[]): string {
  if (!entries.length) return "";
  const swatches = entries
    .map(
      (e) => {
        const name = e.path.replace(/^color\./, "");
        return `<button class="as-ds-swatch" ${tokenButtonAttrs(e)}>
          <span class="as-ds-swatch__chip" style="background:${escapeAttr(e.value)}"></span>
          <span class="as-ds-swatch__name">${escapeHtml(name)}</span>
          <span class="as-ds-swatch__value" data-as-token-display>${escapeHtml(e.value)}</span>
        </button>`;
      },
    )
    .join("");
  return sectionCard(
    "color",
    "Colors",
    "Brand + surface palette — click a swatch to edit",
    `<div class="as-ds-swatch-grid">${swatches}</div>`,
  );
}

function renderSpaceSection(entries: TokenAtlasEntry[]): string {
  if (!entries.length) return "";
  const rows = entries
    .map((e) => {
      const name = e.path.replace(/^space\./, "");
      return `<button class="as-ds-scale-row" ${tokenButtonAttrs(e)}>
        <span class="as-ds-scale-row__name">${escapeHtml(name)}</span>
        <span class="as-ds-scale-row__bar"><span class="as-ds-scale-row__fill" style="width:${escapeAttr(e.value)}"></span></span>
        <span class="as-ds-scale-row__value" data-as-token-display>${escapeHtml(e.value)}</span>
      </button>`;
    })
    .join("");
  return sectionCard(
    "space",
    "Spacing",
    "Padding / gap scale",
    `<div class="as-ds-scale">${rows}</div>`,
  );
}

function renderFontSection(entries: TokenAtlasEntry[]): string {
  if (!entries.length) return "";
  const families = entries.filter((e) => e.path.startsWith("font.family."));
  const sizes = entries.filter((e) => e.path.startsWith("font.size."));
  const weights = entries.filter((e) => e.path.startsWith("font.weight."));
  const lineHeights = entries.filter((e) =>
    e.path.startsWith("font.lineHeight."),
  );
  const other = entries.filter(
    (e) =>
      !e.path.startsWith("font.family.") &&
      !e.path.startsWith("font.size.") &&
      !e.path.startsWith("font.weight.") &&
      !e.path.startsWith("font.lineHeight."),
  );

  const block = (
    title: string,
    list: TokenAtlasEntry[],
    sample: (e: TokenAtlasEntry) => string,
  ) => {
    if (!list.length) return "";
    const rows = list
      .map((e) => {
        const name = e.path.replace(/^font\.[^.]+\./, "");
        return `<button class="as-ds-font-row" ${tokenButtonAttrs(e)}>
          <span class="as-ds-scale-row__name">${escapeHtml(name)}</span>
          <span class="as-ds-font-row__sample" style="${sample(e)}">The quick brown fox</span>
          <span class="as-ds-scale-row__value" data-as-token-display>${escapeHtml(e.value)}</span>
        </button>`;
      })
      .join("");
    return `<div class="as-ds-font-block"><h3 class="as-ds-font-block__title">${escapeHtml(title)}</h3><div class="as-ds-scale">${rows}</div></div>`;
  };

  const body = [
    block("Families", families, (e) => `font-family:${escapeAttr(e.value)}`),
    block("Sizes", sizes, (e) => `font-size:${escapeAttr(e.value)}`),
    block("Weights", weights, (e) => `font-weight:${escapeAttr(e.value)}`),
    block("Line heights", lineHeights, (e) => `line-height:${escapeAttr(e.value)}`),
    other.length
      ? block("Other", other, () => "")
      : "",
  ].join("");

  return sectionCard("font", "Typography", "Families, sizes, weights", body);
}

function renderRadiusSection(entries: TokenAtlasEntry[]): string {
  if (!entries.length) return "";
  const tiles = entries
    .map((e) => {
      const name = e.path.replace(/^radius\./, "");
      return `<button class="as-ds-tile" ${tokenButtonAttrs(e)}>
        <span class="as-ds-tile__preview" style="border-radius:${escapeAttr(e.value)}"></span>
        <span class="as-ds-scale-row__name">${escapeHtml(name)}</span>
        <span class="as-ds-scale-row__value" data-as-token-display>${escapeHtml(e.value)}</span>
      </button>`;
    })
    .join("");
  return sectionCard(
    "radius",
    "Radius",
    "Corner scale",
    `<div class="as-ds-tile-grid">${tiles}</div>`,
  );
}

function renderShadowSection(entries: TokenAtlasEntry[]): string {
  if (!entries.length) return "";
  const tiles = entries
    .map((e) => {
      const name = e.path.replace(/^shadow\./, "");
      return `<button class="as-ds-tile" ${tokenButtonAttrs(e)}>
        <span class="as-ds-tile__preview as-ds-tile__preview--shadow" style="box-shadow:${escapeAttr(e.value)}"></span>
        <span class="as-ds-scale-row__name">${escapeHtml(name)}</span>
        <span class="as-ds-scale-row__value" data-as-token-display>${escapeHtml(e.value)}</span>
      </button>`;
    })
    .join("");
  return sectionCard(
    "shadow",
    "Shadow",
    "Elevation",
    `<div class="as-ds-tile-grid">${tiles}</div>`,
  );
}

function renderOtherSection(
  kind: string,
  label: string,
  entries: TokenAtlasEntry[],
): string {
  if (!entries.length) return "";
  const rows = entries
    .map((e) => {
      const name = e.path.includes(".")
        ? e.path.slice(e.path.indexOf(".") + 1)
        : e.path;
      return `<button class="as-ds-scale-row" ${tokenButtonAttrs(e)}>
        <span class="as-ds-scale-row__name">${escapeHtml(name)}</span>
        <span class="as-ds-scale-row__bar"><span class="as-ds-scale-row__fill" style="width:40%"></span></span>
        <span class="as-ds-scale-row__value" data-as-token-display>${escapeHtml(e.value)}</span>
      </button>`;
    })
    .join("");
  return sectionCard(
    kind,
    label,
    "Click a row to edit",
    `<div class="as-ds-scale">${rows}</div>`,
  );
}

function sectionCard(
  id: string,
  title: string,
  hint: string,
  body: string,
): string {
  return `<section class="as-ds-section" data-as-token-section="${escapeAttr(id)}" id="as-ds-${escapeAttr(id)}">
    <header class="as-ds-section__head">
      <div class="as-ds-section__copy">
        <h2 class="as-ds-section__title">${escapeHtml(title)}</h2>
        <p class="as-ds-section__hint">${escapeHtml(hint)}</p>
      </div>
      <span class="as-ds-section__path">tokens/${escapeHtml(id)}</span>
    </header>
    <div class="as-ds-section__body">${body}</div>
  </section>`;
}

function renderHero(atlas: TokenAtlasEntry[]): string {
  const kinds = new Set(atlas.map((e) => e.kind));
  const fonts = atlas.filter((e) => e.path.startsWith("font.family.")).length;
  return `<div class="as-ds-hero">
    <div class="as-ds-hero__stats">
      <span class="as-ds-hero__stat">${kinds.size} token groups</span>
      <span class="as-ds-hero__stat">Inline edit</span>
      ${fonts > 0 ? `<span class="as-ds-hero__stat">${fonts} font famil${fonts === 1 ? "y" : "ies"}</span>` : ""}
    </div>
    <p class="as-ds-hero__note">Click any swatch or row to edit. Changes preview live and save to <code class="font-mono text-xs">design/design-system.json</code>.</p>
  </div>`;
}

function renderSamples(): string {
  return `<section class="as-ds-section" data-as-token-section="samples">
    <header class="as-ds-section__head as-ds-section__head--static">
      <div class="as-ds-section__copy">
        <h2 class="as-ds-section__title">Live samples</h2>
        <p class="as-ds-section__hint">Tokens in context — updates as you edit</p>
      </div>
    </header>
    <div class="as-ds-section__body">
      <div class="as-ds-samples">
        <button type="button" class="as-ds-sample-btn">Primary button</button>
        <button type="button" class="as-ds-sample-btn as-ds-sample-btn--ghost">Ghost</button>
        <div class="as-ds-sample-card">
          <p class="font-display text-xl font-semibold text-ink">Display heading</p>
          <p class="mt-2 text-sm text-ink-soft">Body copy uses ink-soft on paper-raised.</p>
        </div>
      </div>
    </div>
  </section>`;
}

/** Inner atlas markup (no document shell). */
export function renderDesignSystemAtlasBody(design: DesignSystemDoc): string {
  const atlas = enumerateTokenAtlas(design);
  const byKind = groupByKind(atlas);

  const sections = [
    renderHero(atlas),
    renderColorSection(byKind.get("color") ?? []),
    renderSpaceSection(byKind.get("space") ?? []),
    renderFontSection(byKind.get("font") ?? []),
    renderRadiusSection(byKind.get("radius") ?? []),
    renderShadowSection(byKind.get("shadow") ?? []),
    renderOtherSection("other", "Motion & other", byKind.get("other") ?? []),
    renderSamples(),
  ].join("\n");

  return `<div class="as-ds-page" data-as-design-system-atlas>
    <header class="as-ds-page__intro">
      <p class="as-ds-page__eyebrow">Design system</p>
      <h1 class="as-ds-page__title">Tokens</h1>
      <p class="as-ds-page__lead">Source of truth for the site. Edit inline — every utility using the token updates live.</p>
    </header>
    ${sections}
  </div>`;
}
