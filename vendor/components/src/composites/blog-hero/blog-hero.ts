import { componentStamp, stampSlotOntoHtml } from "../../inspect-stamp.js";

export type BlogHeroLayout = "magazine" | "side" | "backdrop";

/** Component-specific knobs — not content. */
export type BlogHeroProps = {
  layout?: BlogHeroLayout;
  instanceId?: string;
  source?: string;
};

/**
 * Named holes for composing primitives / components.
 * CTAs are separate slots so Button primitives stay selectable in Inspect.
 */
export type BlogHeroSlots = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  byline?: string;
  /** Primary action — typically a Button primitive. */
  ctaPrimary?: string;
  /** Secondary action — typically a Button primitive. */
  ctaSecondary?: string;
  cover?: string;
};

export type BlogHeroRenderInput = {
  props?: BlogHeroProps;
  slots?: BlogHeroSlots;
  /** Not used for blog-hero — prefer slots. Kept for contract symmetry. */
  children?: string;
};

export function renderBlogHero(
  input: BlogHeroRenderInput | (BlogHeroProps & BlogHeroSlots) = {},
): string {
  let props: BlogHeroProps;
  let slots: BlogHeroSlots;

  if ("props" in input || "slots" in input) {
    const r = input as BlogHeroRenderInput;
    props = r.props ?? {};
    slots = r.slots ?? {};
  } else {
    const flat = input as BlogHeroProps & BlogHeroSlots;
    props = {
      layout: flat.layout,
      instanceId: flat.instanceId,
      source: flat.source,
    };
    slots = {
      eyebrow: flat.eyebrow,
      title: flat.title,
      subtitle: flat.subtitle,
      byline: flat.byline,
      ctaPrimary: flat.ctaPrimary,
      ctaSecondary: flat.ctaSecondary,
      cover: flat.cover,
    };
  }

  const layout = props.layout ?? "magazine";
  const {
    eyebrow = "",
    title = `<h1 class="font-display text-display font-bold leading-tight tracking-tight">An untitled essay</h1>`,
    subtitle = "",
    byline = "",
    ctaPrimary = "",
    ctaSecondary = "",
    cover = "",
  } = slots;

  // No band fill / max-width / page gutters — section owns band + sides;
  // container owns max-width; flex/grid own layout. This composite = slots only.
  const backdrop =
    layout === "backdrop"
      ? "min-h-[min(70vh,36rem)] flex flex-col justify-center"
      : "";
  const grid =
    layout === "side"
      ? "grid items-center gap-10 md:grid-cols-[1.1fr_1fr]"
      : "";
  const copyAlign =
    layout === "side"
      ? "items-start text-left"
      : "items-center text-center";
  const actionsAlign =
    layout === "side" ? "justify-start" : "justify-center";

  const stampSlot = (name: string, html: string) =>
    stampSlotOntoHtml({
      componentId: "blog-hero",
      slot: name,
      html,
      instanceId: props.instanceId,
    });

  const stamp = componentStamp({
    componentId: "blog-hero",
    instanceId: props.instanceId,
    source: props.source,
  });

  const primary = stampSlot("ctaPrimary", ctaPrimary);
  const secondary = stampSlot("ctaSecondary", ctaSecondary);
  const actions =
    primary || secondary
      ? `<div class="mt-4 flex flex-wrap items-center gap-4 ${actionsAlign}">${primary}${secondary}</div>`
      : "";

  // Lives as children of Container (compose: section → container → blog-hero).
  // Root = <section> landmark + data-as-component="blog-hero" — never <header>.
  // Transparent — no bg-* / no px-* / no page py-* (section owns those).
  return `<section class="relative w-full text-ink" ${stamp} data-layout="${layout}">
  <div class="relative ${backdrop} ${grid}">
    <div class="flex flex-col gap-5 ${copyAlign}">
      ${stampSlot("eyebrow", eyebrow)}
      ${stampSlot("title", title)}
      ${stampSlot("subtitle", subtitle)}
      ${stampSlot("byline", byline)}
      ${actions}
    </div>
    ${layout === "magazine" && cover ? `<div class="mt-10">${stampSlot("cover", cover)}</div>` : ""}
    ${layout === "side" && cover ? `<div class="order-first md:order-last">${stampSlot("cover", cover)}</div>` : ""}
  </div>
</section>`;
}

export function BlogHero(
  input: BlogHeroProps & BlogHeroSlots = {},
): string {
  return renderBlogHero(input);
}
