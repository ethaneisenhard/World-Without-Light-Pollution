/**
 * Shared site design registry for @glassbox-studio/components.
 */

import {
  createSandboxRegistry,
  type SandboxComponentModule,
  type SandboxInspectorDraft,
  type SandboxRegistry,
} from "@glassbox-studio/sandbox-engine";
import {
  meta as sectionMeta,
  renderSection,
} from "./primitives/section/component.js";
import {
  meta as containerMeta,
  renderContainer,
} from "./primitives/container/component.js";
import {
  meta as flexMeta,
  renderFlex,
} from "./primitives/flex/component.js";
import {
  meta as gridMeta,
  renderGrid,
} from "./primitives/grid/component.js";
import {
  meta as buttonMeta,
  renderButton,
  slotTextDefaults as buttonSlotText,
  slotsFromPlainText as buttonSlotsFromText,
} from "./primitives/button/component.js";
import { buttonClassName } from "./primitives/button/button-classes.js";
import {
  meta as headingMeta,
  renderHeading,
  slotTextDefaults as headingSlotText,
  slotsFromPlainText as headingSlotsFromText,
} from "./primitives/heading/component.js";
import {
  meta as eyebrowMeta,
  renderEyebrow,
  slotTextDefaults as eyebrowSlotText,
  slotsFromPlainText as eyebrowSlotsFromText,
} from "./primitives/eyebrow/component.js";
import {
  meta as textMeta,
  renderText,
  slotTextDefaults as textSlotText,
  slotsFromPlainText as textSlotsFromText,
} from "./primitives/text/component.js";
import {
  meta as blogHeroMeta,
  renderBlogHero,
  slotTextDefaults as blogHeroSlotText,
  slotsFromPlainText as blogHeroSlotsFromText,
} from "./composites/blog-hero/component.js";
import { meta as boxMeta, renderBox } from "./primitives/box/component.js";
import { meta as cardMeta, renderCard } from "./primitives/card/component.js";
import {
  meta as dividerMeta,
  renderDivider,
} from "./primitives/divider/component.js";
import { meta as linkMeta, renderLink, slotTextDefaults as linkSlotText, slotsFromPlainText as linkSlotsFromText } from "./primitives/link/component.js";
import { meta as listMeta, renderList, slotTextDefaults as listSlotText, slotsFromPlainText as listSlotsFromText } from "./primitives/list/component.js";
import { meta as figureMeta, renderFigure, slotTextDefaults as figureSlotText, slotsFromPlainText as figureSlotsFromText } from "./primitives/figure/component.js";
import {
  meta as optimizedImageMeta,
  renderOptimizedImage,
  slotTextDefaults as optimizedImageSlotText,
  slotsFromPlainText as optimizedImageSlotsFromText,
} from "./primitives/optimized-image/component.js";
import { meta as pillMeta, renderPill, slotTextDefaults as pillSlotText, slotsFromPlainText as pillSlotsFromText } from "./primitives/pill/component.js";
import { meta as calloutMeta, renderCallout, slotTextDefaults as calloutSlotText, slotsFromPlainText as calloutSlotsFromText } from "./primitives/callout/component.js";
import { meta as proseMeta, renderProse, slotTextDefaults as proseSlotText, slotsFromPlainText as proseSlotsFromText } from "./primitives/prose/component.js";
import { meta as blockquoteMeta, renderBlockquote, slotTextDefaults as blockquoteSlotText, slotsFromPlainText as blockquoteSlotsFromText } from "./primitives/blockquote/component.js";
import { meta as definitionRowMeta, renderDefinitionRow, slotTextDefaults as definitionRowSlotText, slotsFromPlainText as definitionRowSlotsFromText } from "./primitives/definition-row/component.js";
import { meta as logoMeta, renderLogo, slotTextDefaults as logoSlotText, slotsFromPlainText as logoSlotsFromText } from "./primitives/logo/component.js";
import { meta as iconMeta, renderIcon } from "./primitives/icon/component.js";
import { meta as fieldMeta, renderField, slotTextDefaults as fieldSlotText, slotsFromPlainText as fieldSlotsFromText } from "./primitives/form/field/component.js";
import { meta as inputMeta, renderInput } from "./primitives/form/input/component.js";
import { meta as textareaMeta, renderTextarea } from "./primitives/form/textarea/component.js";
import {
  meta as accordionMeta,
  renderAccordion,
} from "./primitives/accordion/component.js";
import { meta as accordionItemMeta, renderAccordionItem, slotTextDefaults as accordionItemSlotText, slotsFromPlainText as accordionItemSlotsFromText } from "./primitives/accordion-item/component.js";
import { meta as heroMeta, renderHero, slotTextDefaults as heroSlotText, slotsFromPlainText as heroSlotsFromText } from "./composites/hero/component.js";
import { meta as ctaBandMeta, renderCtaBand, slotTextDefaults as ctaBandSlotText, slotsFromPlainText as ctaBandSlotsFromText } from "./composites/cta-band/component.js";
import { meta as postCardMeta, renderPostCard, slotTextDefaults as postCardSlotText, slotsFromPlainText as postCardSlotsFromText } from "./composites/post-card/component.js";
import { meta as postMetaMeta, renderPostMeta, slotTextDefaults as postMetaSlotText, slotsFromPlainText as postMetaSlotsFromText } from "./composites/post-meta/component.js";
import { meta as contactFormMeta, renderContactForm, slotTextDefaults as contactFormSlotText, slotsFromPlainText as contactFormSlotsFromText } from "./composites/contact-form/component.js";
import { meta as headerMeta, renderHeader, slotTextDefaults as headerSlotText, slotsFromPlainText as headerSlotsFromText } from "./composites/header/component.js";
import { meta as footerMeta, renderFooter, slotTextDefaults as footerSlotText, slotsFromPlainText as footerSlotsFromText } from "./composites/footer/component.js";
import { meta as siteLogoMeta, renderSiteLogo, slotTextDefaults as siteLogoSlotText, slotsFromPlainText as siteLogoSlotsFromText } from "./composites/site-logo/component.js";
import { meta as navLinkMeta, renderNavLink, slotTextDefaults as navLinkSlotText, slotsFromPlainText as navLinkSlotsFromText } from "./composites/nav-link/component.js";

export type DesignComponentId =
  | "section"
  | "container"
  | "flex"
  | "grid"
  | "button"
  | "heading"
  | "eyebrow"
  | "text"
  | "blog-hero"
  | "box"
  | "card"
  | "divider"
  | "link"
  | "list"
  | "figure"
  | "pill"
  | "callout"
  | "prose"
  | "blockquote"
  | "definition-row"
  | "logo"
  | "icon"
  | "field"
  | "input"
  | "textarea"
  | "accordion"
  | "accordion-item"
  | "hero"
  | "cta-band"
  | "post-card"
  | "post-meta"
  | "contact-form"
  | "header"
  | "footer"
  | "site-logo"
  | "nav-link";

/** Studio Nav paths for Design breadcrumb / nav sync. */
export const DESIGN_COMPONENT_NAV_PATHS: Record<DesignComponentId, string> = {
  section: "packages/library/components/src/primitives/section/component.ts",
  container: "packages/library/components/src/primitives/container/component.ts",
  flex: "packages/library/components/src/primitives/flex/component.ts",
  grid: "packages/library/components/src/primitives/grid/component.ts",
  button: "packages/library/components/src/primitives/button/component.ts",
  heading: "packages/library/components/src/primitives/heading/component.ts",
  eyebrow: "packages/library/components/src/primitives/eyebrow/component.ts",
  text: "packages/library/components/src/primitives/text/component.ts",
  "blog-hero": "packages/library/components/src/composites/blog-hero/component.ts",
  box: "packages/library/components/src/primitives/box/component.ts",
  card: "packages/library/components/src/primitives/card/component.ts",
  divider: "packages/library/components/src/primitives/divider/component.ts",
  link: "packages/library/components/src/primitives/link/component.ts",
  list: "packages/library/components/src/primitives/list/component.ts",
  figure: "packages/library/components/src/primitives/figure/component.ts",
  pill: "packages/library/components/src/primitives/pill/component.ts",
  callout: "packages/library/components/src/primitives/callout/component.ts",
  prose: "packages/library/components/src/primitives/prose/component.ts",
  blockquote: "packages/library/components/src/primitives/blockquote/component.ts",
  "definition-row": "packages/library/components/src/primitives/definition-row/component.ts",
  logo: "packages/library/components/src/primitives/logo/component.ts",
  icon: "packages/library/components/src/primitives/icon/component.ts",
  "field": "packages/library/components/src/primitives/form/field/component.ts",
  "input": "packages/library/components/src/primitives/form/input/component.ts",
  "textarea": "packages/library/components/src/primitives/form/textarea/component.ts",
  accordion: "packages/library/components/src/primitives/accordion/component.ts",
  "accordion-item": "packages/library/components/src/primitives/accordion-item/component.ts",
  hero: "packages/library/components/src/composites/hero/component.ts",
  "cta-band": "packages/library/components/src/composites/cta-band/component.ts",
  "post-card": "packages/library/components/src/composites/post-card/component.ts",
  "post-meta": "packages/library/components/src/composites/post-meta/component.ts",
  "contact-form": "packages/library/components/src/composites/contact-form/component.ts",
  header: "packages/library/components/src/composites/header/component.ts",
  footer: "packages/library/components/src/composites/footer/component.ts",
  "site-logo": "packages/library/components/src/composites/site-logo/component.ts",
  "nav-link": "packages/library/components/src/composites/nav-link/component.ts",
};

export function designComponentNavPath(id: string): string | undefined {
  return DESIGN_COMPONENT_NAV_PATHS[id as DesignComponentId];
}
export type { SandboxInspectorDraft as DesignInspectorDraft };

const modules: SandboxComponentModule[] = [
  {
    meta: sectionMeta,
    defaultChildren: "Section content",
    renderHtml: (ctx) =>
      renderSection({
        props: ctx.props as never,
        children: ctx.children,
        chrome: "sandbox",
      }),
  },
  {
    meta: containerMeta,
    defaultChildren: "Container content",
    renderHtml: (ctx) =>
      renderContainer({
        props: ctx.props as never,
        children: ctx.children,
        chrome: "sandbox",
      }),
  },
  {
    meta: flexMeta,
    defaultChildren: "",
    renderHtml: (ctx) =>
      renderFlex({
        props: ctx.props as never,
        children: ctx.children,
        chrome: "sandbox",
      }),
  },
  {
    meta: gridMeta,
    defaultChildren: "",
    renderHtml: (ctx) =>
      renderGrid({
        props: ctx.props as never,
        children: ctx.children,
        chrome: "sandbox",
      }),
  },
  {
    meta: buttonMeta,
    slotTextDefaults: { ...buttonSlotText },
    slotsFromText: (text) => buttonSlotsFromText(text),
    renderHtml: (ctx) =>
      renderButton({
        props: {
          variant: (ctx.props.variant as "primary" | "secondary" | "ghost") ?? "primary",
          type: (ctx.props.type as "button" | "submit" | "reset") ?? "button",
          className: buttonClassName(
            (ctx.props.variant as "primary" | "secondary" | "ghost") ?? "primary",
          ),
        },
        slots: ctx.slots as never,
      }),
  },
  {
    meta: headingMeta,
    slotTextDefaults: { ...headingSlotText },
    slotsFromText: (text) => headingSlotsFromText(text),
    renderHtml: (ctx) =>
      renderHeading({
        props: {
          level: (Number(ctx.props.level) || 1) as 1 | 2 | 3 | 4 | 5 | 6,
          size: (ctx.props.size as "xs" | "sm" | "md" | "lg" | "xl" | "display") ?? "lg",
          align: (ctx.props.align as "left" | "center" | "right") ?? "left",
          weight:
            (ctx.props.weight as "normal" | "medium" | "semibold" | "bold") ??
            "bold",
          color:
            (ctx.props.color as "ink" | "muted" | "brand" | "inherit") ?? "ink",
        },
        slots: ctx.slots as never,
      }),
  },
  {
    meta: eyebrowMeta,
    slotTextDefaults: { ...eyebrowSlotText },
    slotsFromText: (text) => eyebrowSlotsFromText(text),
    renderHtml: (ctx) =>
      renderEyebrow({
        props: {
          align: (ctx.props.align as "left" | "center" | "right") ?? "left",
          color: (ctx.props.color as "ink" | "muted" | "brand") ?? "muted",
        },
        slots: ctx.slots as never,
      }),
  },
  {
    meta: textMeta,
    slotTextDefaults: { ...textSlotText },
    slotsFromText: (text) => textSlotsFromText(text),
    renderHtml: (ctx) =>
      renderText({
        props: {
          as: (ctx.props.as as "p" | "span" | "div") ?? "p",
          variant:
            (ctx.props.variant as "lead" | "body" | "small" | "caption") ??
            "body",
          align:
            (ctx.props.align as "left" | "center" | "right" | "justify") ??
            "left",
          weight:
            (ctx.props.weight as "normal" | "medium" | "semibold" | "bold") ??
            "normal",
          color:
            (ctx.props.color as "ink" | "muted" | "brand" | "inherit") ?? "ink",
        },
        slots: ctx.slots as never,
      }),
  },
  {
    meta: blogHeroMeta,
    slotTextDefaults: { ...blogHeroSlotText },
    slotsFromText: (text) => blogHeroSlotsFromText(text),
    renderHtml: (ctx) =>
      renderBlogHero({
        props: ctx.props as never,
        slots: ctx.slots as never,
      }),
  },
  {
    meta: boxMeta,
    defaultChildren: "Box content",
    renderHtml: (ctx) =>
      renderBox({
        props: ctx.props as never,
        children: ctx.children,
      }),
  },
  {
    meta: cardMeta,
    defaultChildren: "Card content",
    renderHtml: (ctx) =>
      renderCard({
        props: ctx.props as never,
        children: ctx.children,
      }),
  },
  {
    meta: dividerMeta,
    renderHtml: (ctx) =>
      renderDivider({
        props: ctx.props as never,
      }),
  },
  {
    meta: linkMeta,
    slotTextDefaults: { ...linkSlotText },
    slotsFromText: (text) => linkSlotsFromText(text),
    renderHtml: (ctx) =>
      renderLink({
        props: ctx.props as never,
        slots: ctx.slots as never,
      }),
  },
  {
    meta: listMeta,
    defaultChildren: "Item one\nItem two",
    slotTextDefaults: { ...listSlotText },
    slotsFromText: (text) => listSlotsFromText(text),
    renderHtml: (ctx) =>
      renderList({
        props: ctx.props as never,
        slots: ctx.slots as never,
        children: ctx.children,
      }),
  },
  {
    meta: figureMeta,
    slotTextDefaults: { ...figureSlotText },
    slotsFromText: (text) => figureSlotsFromText(text),
    renderHtml: (ctx) =>
      renderFigure({
        props: ctx.props as never,
        slots: ctx.slots as never,
        children: ctx.children,
      }),
  },
  {
    meta: optimizedImageMeta,
    slotTextDefaults: { ...optimizedImageSlotText },
    slotsFromText: (text) => optimizedImageSlotsFromText(text),
    renderHtml: (ctx) =>
      renderOptimizedImage({
        props: ctx.props as never,
        slots: ctx.slots as never,
      }),
  },
  {
    meta: pillMeta,
    slotTextDefaults: { ...pillSlotText },
    slotsFromText: (text) => pillSlotsFromText(text),
    renderHtml: (ctx) =>
      renderPill({
        props: ctx.props as never,
        slots: ctx.slots as never,
        children: ctx.children,
      }),
  },
  {
    meta: calloutMeta,
    slotTextDefaults: { ...calloutSlotText },
    slotsFromText: (text) => calloutSlotsFromText(text),
    renderHtml: (ctx) =>
      renderCallout({
        props: ctx.props as never,
        slots: ctx.slots as never,
        children: ctx.children,
      }),
  },
  {
    meta: proseMeta,
    defaultChildren: "<p>Prose content</p>",
    slotTextDefaults: { ...proseSlotText },
    slotsFromText: (text) => proseSlotsFromText(text),
    renderHtml: (ctx) =>
      renderProse({
        props: ctx.props as never,
        slots: ctx.slots as never,
        children: ctx.children,
      }),
  },
  {
    meta: blockquoteMeta,
    defaultChildren: "Quote",
    slotTextDefaults: { ...blockquoteSlotText },
    slotsFromText: (text) => blockquoteSlotsFromText(text),
    renderHtml: (ctx) =>
      renderBlockquote({
        props: ctx.props as never,
        slots: ctx.slots as never,
        children: ctx.children,
      }),
  },
  {
    meta: definitionRowMeta,
    slotTextDefaults: { ...definitionRowSlotText },
    slotsFromText: (text) => definitionRowSlotsFromText(text),
    renderHtml: (ctx) =>
      renderDefinitionRow({
        props: ctx.props as never,
        slots: ctx.slots as never,
        children: ctx.children,
      }),
  },
  {
    meta: logoMeta,
    slotTextDefaults: { ...logoSlotText },
    slotsFromText: (text) => logoSlotsFromText(text),
    renderHtml: (ctx) =>
      renderLogo({
        props: ctx.props as never,
        slots: ctx.slots as never,
        children: ctx.children,
      }),
  },
  {
    meta: iconMeta,
    renderHtml: (ctx) =>
      renderIcon({
        props: ctx.props as never,
      }),
  },
  {
    meta: fieldMeta,
    slotTextDefaults: { ...fieldSlotText },
    slotsFromText: (text) => fieldSlotsFromText(text),
    renderHtml: (ctx) =>
      renderField({
        props: ctx.props as never,
        slots: ctx.slots as never,
        children: ctx.children,
      }),
  },
  {
    meta: inputMeta,
    renderHtml: (ctx) =>
      renderInput({
        props: ctx.props as never,
      }),
  },
  {
    meta: textareaMeta,
    renderHtml: (ctx) =>
      renderTextarea({
        props: ctx.props as never,
      }),
  },
  {
    meta: accordionMeta,
    defaultChildren: "<details open><summary>Accordion item</summary><div>Accordion content</div></details>",
    renderHtml: (ctx) =>
      renderAccordion({
        props: ctx.props as never,
        children: ctx.children,
      }),
  },
  {
    meta: accordionItemMeta,
    slotTextDefaults: { ...accordionItemSlotText },
    slotsFromText: (text) => accordionItemSlotsFromText(text),
    renderHtml: (ctx) =>
      renderAccordionItem({
        props: ctx.props as never,
        slots: ctx.slots as never,
        children: ctx.children,
      }),
  },
  {
    meta: heroMeta,
    slotTextDefaults: { ...heroSlotText },
    slotsFromText: (text) => heroSlotsFromText(text),
    renderHtml: (ctx) =>
      renderHero({
        props: ctx.props as never,
        slots: ctx.slots as never,
        children: ctx.children,
      }),
  },
  {
    meta: ctaBandMeta,
    slotTextDefaults: { ...ctaBandSlotText },
    slotsFromText: (text) => ctaBandSlotsFromText(text),
    renderHtml: (ctx) =>
      renderCtaBand({
        props: ctx.props as never,
        slots: ctx.slots as never,
        children: ctx.children,
      }),
  },
  {
    meta: postCardMeta,
    slotTextDefaults: { ...postCardSlotText },
    slotsFromText: (text) => postCardSlotsFromText(text),
    renderHtml: (ctx) =>
      renderPostCard({
        props: ctx.props as never,
        slots: ctx.slots as never,
        children: ctx.children,
      }),
  },
  {
    meta: postMetaMeta,
    slotTextDefaults: { ...postMetaSlotText },
    slotsFromText: (text) => postMetaSlotsFromText(text),
    renderHtml: (ctx) =>
      renderPostMeta({
        props: ctx.props as never,
        slots: ctx.slots as never,
        children: ctx.children,
      }),
  },
  {
    meta: contactFormMeta,
    slotTextDefaults: { ...contactFormSlotText },
    slotsFromText: (text) => contactFormSlotsFromText(text),
    renderHtml: (ctx) =>
      renderContactForm({
        props: ctx.props as never,
        slots: ctx.slots as never,
        children: ctx.children,
      }),
  },
  {
    meta: headerMeta,
    slotTextDefaults: { ...headerSlotText },
    slotsFromText: (text) => headerSlotsFromText(text),
    renderHtml: (ctx) =>
      renderHeader({
        props: ctx.props as never,
        slots: ctx.slots as never,
        children: ctx.children,
      }),
  },
  {
    meta: footerMeta,
    slotTextDefaults: { ...footerSlotText },
    slotsFromText: (text) => footerSlotsFromText(text),
    renderHtml: (ctx) =>
      renderFooter({
        props: ctx.props as never,
        slots: ctx.slots as never,
        children: ctx.children,
      }),
  },
  {
    meta: siteLogoMeta,
    slotTextDefaults: { ...siteLogoSlotText },
    slotsFromText: (text) => siteLogoSlotsFromText(text),
    renderHtml: (ctx) =>
      renderSiteLogo({
        props: ctx.props as never,
        slots: ctx.slots as never,
        children: ctx.children,
      }),
  },
  {
    meta: navLinkMeta,
    slotTextDefaults: { ...navLinkSlotText },
    slotsFromText: (text) => navLinkSlotsFromText(text),
    renderHtml: (ctx) =>
      renderNavLink({
        props: ctx.props as never,
        slots: ctx.slots as never,
        children: ctx.children,
      }),
  },
];

export const designSandboxRegistry: SandboxRegistry =
  createSandboxRegistry(modules);

export function listDesignComponents() {
  return designSandboxRegistry.list();
}

export function getDesignComponent(id: string) {
  return designSandboxRegistry.getMeta(id);
}

export function createDefaultDraft(id: DesignComponentId) {
  return designSandboxRegistry.createDefaultDraft(id)!;
}

export function defaultPropsFor(id: DesignComponentId) {
  return createDefaultDraft(id).props;
}

export function renderWithDraft(
  id: DesignComponentId,
  draft: SandboxInspectorDraft,
  propOverrides: Record<string, string> = {},
) {
  return designSandboxRegistry.renderWithDraft(id, draft, propOverrides)!;
}

export function buildPermutationCards(
  id: DesignComponentId,
  draft?: SandboxInspectorDraft,
) {
  return designSandboxRegistry.buildPermutationCards(id, draft)!;
}

export function buildPermutationSpecs(
  id: DesignComponentId,
  draft?: SandboxInspectorDraft,
) {
  return designSandboxRegistry.buildPermutationSpecs(id, draft)!;
}

export function inspectorBootstrap(id: DesignComponentId) {
  return designSandboxRegistry.inspectorBootstrap(id)!;
}

/** @deprecated Prefer renderWithDraft */
export function renderDesignComponent(
  id: DesignComponentId,
  props: Record<string, string> = {},
) {
  const draft = createDefaultDraft(id);
  return renderWithDraft(id, {
    ...draft,
    props: { ...draft.props, ...props },
  });
}
