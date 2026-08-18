/**
 * Site logo composite — link + Logo primitive.
 * Default mark = GlassBoxMarkIcon SSR twin (`glass-box-mark`). Pass
 * `markVariant: "initials"` for non–Glass Box wordmarks (Design atlas demos).
 */

import { componentStamp } from "../../inspect-stamp.js";
import { escapeAttr } from "../../ssr-escape.js";
import {
  renderLogo,
  type LogoProps,
  type LogoSlots,
} from "../../primitives/logo/logo.js";

export type SiteLogoProps = {
  href?: string;
  className?: string;
  instanceId?: string;
  size?: LogoProps["size"];
  /**
   * Default: `glass-box-mark` (GlassBoxMarkIcon design-system mark).
   * Use `initials` / `image` / `glass-box-splash` only when intentional.
   */
  markVariant?: LogoProps["markVariant"];
  markSrc?: LogoProps["markSrc"];
  initials?: LogoProps["initials"];
};
export type SiteLogoSlots = LogoSlots;
export type SiteLogoRenderInput = {
  props?: SiteLogoProps;
  slots?: SiteLogoSlots;
  children?: string;
};

export function renderSiteLogo(
  input: SiteLogoRenderInput | SiteLogoProps = {},
): string {
  const normalized =
    "props" in input || "slots" in input || "children" in input
      ? (input as SiteLogoRenderInput)
      : { props: input as SiteLogoProps };
  const props = normalized.props ?? {};
  const slots = normalized.slots ?? {};
  const stamp = componentStamp({
    componentId: "site-logo",
    instanceId: props.instanceId,
  });
  const cls = [
    "inline-flex items-center gap-3 font-semibold text-ink no-underline",
    props.className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  const logo = renderLogo({
    props: {
      size: props.size ?? "sm",
      className: "gap-2 font-semibold text-ink",
      instanceId: props.instanceId,
      markVariant: props.markVariant ?? "glass-box-mark",
      markSrc: props.markSrc,
      initials: props.initials,
    },
    slots,
    children: normalized.children,
  });
  return `<a href="${escapeAttr(props.href ?? "/")}" class="${escapeAttr(cls)}" ${stamp}>${logo}</a>`;
}

export function SiteLogo(
  props: SiteLogoProps & SiteLogoSlots & { children?: string } = {},
): string {
  const { children, mark, wordmark, ...rest } = props;
  return renderSiteLogo({
    props: rest,
    slots: { mark, wordmark },
    children,
  });
}
