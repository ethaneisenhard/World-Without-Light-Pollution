/**
 * @glassbox-studio/components — shared Glass Box Studio components.
 *
 * - Default export / registry: site design primitives + composites (SSR / Inspect).
 * - Remix headless: import from `@glassbox-studio/components/directory` (and future
 *   `@glassbox-studio/components/remix/*`) — structure + events; hosts pass Tailwind.
 *
 * Not Studio chrome (`ui-tokens` / `ui-primitives` / `ui-components` / `ui-layouts` — ADR 0009).
 */

export {
  componentStamp,
  parseSingleRootElement,
  stampComponentAttrs,
  stampSlotAttrs,
  stampSlotOntoHtml,
  wrapInspectableHtml,
} from "./inspect-stamp.js";

export {
  DESIGN_COMPONENT_NAV_PATHS,
  buildPermutationCards,
  buildPermutationSpecs,
  createDefaultDraft,
  defaultPropsFor,
  designComponentNavPath,
  designSandboxRegistry,
  getDesignComponent,
  inspectorBootstrap,
  listDesignComponents,
  renderDesignComponent,
  renderWithDraft,
  type DesignComponentId,
  type DesignInspectorDraft,
} from "./registry.js";

export {
  Button,
  meta as buttonMeta,
  renderButton,
  slotsFromPlainText as buttonSlotsFromText,
  slotTextDefaults as buttonSlotText,
  type ButtonProps,
  type ButtonSlots,
} from "./primitives/button/component.js";
export { buttonClassName } from "./primitives/button/button-classes.js";

export {
  Section,
  meta as sectionMeta,
  renderSection,
  type SectionProps,
} from "./primitives/section/component.js";

export {
  Container,
  meta as containerMeta,
  renderContainer,
  type ContainerProps,
} from "./primitives/container/component.js";

export {
  Flex,
  meta as flexMeta,
  renderFlex,
  type FlexProps,
} from "./primitives/flex/component.js";

export {
  Grid,
  meta as gridMeta,
  renderGrid,
  type GridProps,
} from "./primitives/grid/component.js";

export {
  Heading,
  meta as headingMeta,
  renderHeading,
  slotsFromPlainText as headingSlotsFromText,
  slotTextDefaults as headingSlotText,
  type HeadingProps,
  type HeadingSlots,
} from "./primitives/heading/component.js";

export {
  Eyebrow,
  meta as eyebrowMeta,
  renderEyebrow,
  slotsFromPlainText as eyebrowSlotsFromText,
  slotTextDefaults as eyebrowSlotText,
  type EyebrowProps,
  type EyebrowSlots,
} from "./primitives/eyebrow/component.js";

export {
  Text,
  meta as textMeta,
  renderText,
  slotsFromPlainText as textSlotsFromText,
  slotTextDefaults as textSlotText,
  type TextProps,
  type TextSlots,
} from "./primitives/text/component.js";

export {
  LAYOUT_LIVE_ROOT_CLASS,
  LAYOUT_SHELL_CHILDREN_CLASS,
  LAYOUT_SHELL_ROOT_CLASS,
  layoutRootClass,
  wrapLayoutChildren,
  wrapLayoutShellChildren,
  type LayoutChrome,
} from "./primitives/layout-shell.js";

export {
  LAYOUT_DEMO_CELL_ACCENT_CLASS,
  LAYOUT_DEMO_CELL_CLASS,
  LAYOUT_DEMO_CELL_SOFT_CLASS,
  layoutDemoCellHtml,
  layoutDemoCellsHtml,
} from "./primitives/layout-demo.js";

export {
  BlogHero,
  meta as blogHeroMeta,
  renderBlogHero,
  slotsFromPlainText as blogHeroSlotsFromText,
  slotTextDefaults as blogHeroSlotText,
  type BlogHeroProps,
  type BlogHeroSlots,
} from "./composites/blog-hero/component.js";
export {
  Box,
  meta as boxMeta,
  renderBox,
  type BoxProps,
  type BoxSlots,
} from "./primitives/box/component.js";
export {
  Card,
  meta as cardMeta,
  renderCard,
  type CardProps,
  type CardSlots,
} from "./primitives/card/component.js";
export {
  Divider,
  meta as dividerMeta,
  renderDivider,
  type DividerProps,
  type DividerSlots,
} from "./primitives/divider/component.js";
export {
  Link,
  meta as linkMeta,
  renderLink,
  slotsFromPlainText as linkSlotsFromText,
  slotTextDefaults as linkSlotText,
  type LinkProps,
  type LinkSlots,
} from "./primitives/link/component.js";
export {
  List,
  meta as listMeta,
  renderList,
  slotsFromPlainText as listSlotsFromText,
  slotTextDefaults as listSlotText,
  type ListProps,
  type ListSlots,
} from "./primitives/list/component.js";
export {
  Figure,
  meta as figureMeta,
  renderFigure,
  slotsFromPlainText as figureSlotsFromText,
  slotTextDefaults as figureSlotText,
  type FigureProps,
  type FigureSlots,
} from "./primitives/figure/component.js";
export {
  OptimizedImage,
  meta as optimizedImageMeta,
  renderOptimizedImage,
  slotsFromPlainText as optimizedImageSlotsFromText,
  slotTextDefaults as optimizedImageSlotText,
  type OptimizedImageProps,
  type OptimizedImageSlots,
} from "./primitives/optimized-image/component.js";
export {
  Pill,
  meta as pillMeta,
  renderPill,
  slotsFromPlainText as pillSlotsFromText,
  slotTextDefaults as pillSlotText,
  type PillProps,
  type PillSlots,
} from "./primitives/pill/component.js";
export {
  Callout,
  meta as calloutMeta,
  renderCallout,
  slotsFromPlainText as calloutSlotsFromText,
  slotTextDefaults as calloutSlotText,
  type CalloutProps,
  type CalloutSlots,
} from "./primitives/callout/component.js";
export {
  Prose,
  meta as proseMeta,
  renderProse,
  slotsFromPlainText as proseSlotsFromText,
  slotTextDefaults as proseSlotText,
  type ProseProps,
  type ProseSlots,
} from "./primitives/prose/component.js";
export {
  Blockquote,
  meta as blockquoteMeta,
  renderBlockquote,
  slotsFromPlainText as blockquoteSlotsFromText,
  slotTextDefaults as blockquoteSlotText,
  type BlockquoteProps,
  type BlockquoteSlots,
} from "./primitives/blockquote/component.js";
export {
  DefinitionRow,
  meta as definitionRowMeta,
  renderDefinitionRow,
  slotsFromPlainText as definitionRowSlotsFromText,
  slotTextDefaults as definitionRowSlotText,
  type DefinitionRowProps,
  type DefinitionRowSlots,
} from "./primitives/definition-row/component.js";
export {
  Logo,
  meta as logoMeta,
  renderLogo,
  slotsFromPlainText as logoSlotsFromText,
  slotTextDefaults as logoSlotText,
  type LogoProps,
  type LogoSlots,
} from "./primitives/logo/component.js";
export {
  Icon,
  meta as iconMeta,
  renderIcon,
  type IconProps,
  type IconSlots,
} from "./primitives/icon/component.js";
export {
  Field,
  meta as fieldMeta,
  renderField,
  slotsFromPlainText as fieldSlotsFromText,
  slotTextDefaults as fieldSlotText,
  type FieldProps,
  type FieldSlots,
} from "./primitives/form/field/component.js";
export {
  Input,
  meta as inputMeta,
  renderInput,
  type InputProps,
  type InputSlots,
} from "./primitives/form/input/component.js";
export {
  Textarea,
  meta as textareaMeta,
  renderTextarea,
  type TextareaProps,
  type TextareaSlots,
} from "./primitives/form/textarea/component.js";
export {
  Accordion,
  meta as accordionMeta,
  renderAccordion,
  type AccordionProps,
  type AccordionSlots,
} from "./primitives/accordion/component.js";
export {
  AccordionItem,
  meta as accordionItemMeta,
  renderAccordionItem,
  slotsFromPlainText as accordionItemSlotsFromText,
  slotTextDefaults as accordionItemSlotText,
  type AccordionItemProps,
  type AccordionItemSlots,
} from "./primitives/accordion-item/component.js";
export {
  Hero,
  meta as heroMeta,
  renderHero,
  slotsFromPlainText as heroSlotsFromText,
  slotTextDefaults as heroSlotText,
  type HeroProps,
  type HeroSlots,
} from "./composites/hero/component.js";
export {
  CtaBand,
  meta as ctaBandMeta,
  renderCtaBand,
  slotsFromPlainText as ctaBandSlotsFromText,
  slotTextDefaults as ctaBandSlotText,
  type CtaBandProps,
  type CtaBandSlots,
} from "./composites/cta-band/component.js";
export {
  PostCard,
  meta as postCardMeta,
  renderPostCard,
  slotsFromPlainText as postCardSlotsFromText,
  slotTextDefaults as postCardSlotText,
  type PostCardProps,
  type PostCardSlots,
} from "./composites/post-card/component.js";
export {
  PostMeta,
  meta as postMetaMeta,
  renderPostMeta,
  slotsFromPlainText as postMetaSlotsFromText,
  slotTextDefaults as postMetaSlotText,
  type PostMetaProps,
  type PostMetaSlots,
} from "./composites/post-meta/component.js";
export {
  ContactForm,
  meta as contactFormMeta,
  renderContactForm,
  slotsFromPlainText as contactFormSlotsFromText,
  slotTextDefaults as contactFormSlotText,
  type ContactFormProps,
  type ContactFormSlots,
} from "./composites/contact-form/component.js";
export {
  Header,
  meta as headerMeta,
  renderHeader,
  renderThemeToggleButton,
  slotsFromPlainText as headerSlotsFromText,
  slotTextDefaults as headerSlotText,
  type HeaderProps,
  type HeaderSlots,
} from "./composites/header/component.js";
export {
  Footer,
  meta as footerMeta,
  renderFooter,
  slotsFromPlainText as footerSlotsFromText,
  slotTextDefaults as footerSlotText,
  type FooterProps,
  type FooterSlots,
} from "./composites/footer/component.js";
export {
  SiteLogo,
  meta as siteLogoMeta,
  renderSiteLogo,
  slotsFromPlainText as siteLogoSlotsFromText,
  slotTextDefaults as siteLogoSlotText,
  type SiteLogoProps,
  type SiteLogoSlots,
} from "./composites/site-logo/component.js";
export {
  NavLink,
  meta as navLinkMeta,
  renderNavLink,
  slotsFromPlainText as navLinkSlotsFromText,
  slotTextDefaults as navLinkSlotText,
  type NavLinkProps,
  type NavLinkSlots,
} from "./composites/nav-link/component.js";
