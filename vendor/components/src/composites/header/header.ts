/**
 * Header composite — BrowserUI Site Header shape.
 * Desktop (md+): brand | nav | actions.
 * Mobile: brand + hamburger <details>; full-bleed panel with nav + actions.
 */

import {
  bars3OutlineSvg,
  moonOutlineSvg,
  sunOutlineSvg,
  xMarkOutlineSvg,
} from "@glassbox-studio/ui-icons/ssr";
import { componentStamp, stampSlotAttrs } from "../../inspect-stamp.js";
import { escapeAttr } from "../../ssr-escape.js";

export type HeaderProps = {
  sticky?: "off" | "on";
  transparent?: "off" | "on";
  borderBottom?: "off" | "on";
  className?: string;
  instanceId?: string;
};

export type HeaderSlots = {
  brand?: string;
  nav?: string;
  actions?: string;
};

export type HeaderRenderInput = {
  props?: HeaderProps;
  slots?: HeaderSlots;
  children?: string;
};

/** Heroicons via @glassbox-studio/ui-icons SSR helpers (same catalog as remix). */
const ICON_BARS = bars3OutlineSvg("size-6 group-open/menu:hidden");
const ICON_X = xMarkOutlineSvg("hidden size-6 group-open/menu:block");

/** Theme toggle — Heroicons moon (light) / sun (dark); CSS swaps under `.dark`. */
export function renderThemeToggleButton(className?: string): string {
  const cls =
    className ??
    "inline-flex size-9 items-center justify-center rounded-full border border-line bg-paper-raised text-ink hover:bg-sand";
  const icons = `<span class="inline-flex dark:hidden" aria-hidden="true">${moonOutlineSvg("size-4")}</span><span class="hidden dark:inline-flex" aria-hidden="true">${sunOutlineSvg("size-4")}</span>`;
  return `<button type="button" data-as-theme-toggle class="${escapeAttr(cls)}" aria-label="Toggle color mode" title="Toggle light / dark">${icons}</button>`;
}

function rootClass(props: HeaderProps): string {
  const sticky = props.sticky === "on" ? "sticky top-0 z-40" : "relative";
  const transparent = props.transparent === "on";
  const tone = transparent
    ? "bg-transparent text-ink"
    : "bg-paper/95 text-ink backdrop-blur";
  const border =
    !transparent && props.borderBottom !== "off" ? "border-b border-line" : "";
  return ["w-full", sticky, tone, border, props.className ?? ""]
    .filter(Boolean)
    .join(" ");
}

/**
 * Marketing top bar — brand, nav links, CTAs, mobile hamburger menu.
 * Compose links as slot HTML so the Inspect tree stays navigable.
 */
export function renderHeader(
  input: HeaderRenderInput | HeaderProps = {},
): string {
  const normalized =
    "props" in input || "slots" in input || "children" in input
      ? (input as HeaderRenderInput)
      : { props: input as HeaderProps };
  const props = normalized.props ?? {};
  const slots = normalized.slots ?? {};
  const stamp = componentStamp({
    componentId: "header",
    instanceId: props.instanceId,
  });
  const brandStamp = stampSlotAttrs({
    componentId: "header",
    slot: "brand",
    instanceId: props.instanceId,
  });
  const navStamp = stampSlotAttrs({
    componentId: "header",
    slot: "nav",
    instanceId: props.instanceId,
  });
  const actionsStamp = stampSlotAttrs({
    componentId: "header",
    slot: "actions",
    instanceId: props.instanceId,
  });

  const brand = slots.brand?.trim()
    ? `<div class="min-w-0" ${brandStamp}>${slots.brand}</div>`
    : "";

  const navInner = slots.nav?.trim() ?? "";
  const actionsInner = slots.actions?.trim() ?? "";
  const hasNav = Boolean(navInner);
  const hasActions = Boolean(actionsInner);

  const desktopNav = hasNav
    ? `<nav class="hidden items-center gap-1 md:flex" aria-label="Primary" ${navStamp}>${navInner}</nav>`
    : "";

  const desktopActions = hasActions
    ? `<div class="hidden items-center gap-2 md:flex" ${actionsStamp}>${actionsInner}</div>`
    : "";

  const mobileActions = hasActions
    ? `<div class="mt-3 flex flex-col gap-2 border-t border-line px-3 pt-4">${actionsInner}</div>`
    : "";

  const mobileMenu =
    hasNav || hasActions
      ? `<details class="group/menu contents md:hidden"><summary class="list-none cursor-pointer select-none inline-flex size-10 items-center justify-center rounded-md text-ink-soft hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden" aria-label="Toggle navigation menu">${ICON_BARS}${ICON_X}</summary><div class="absolute inset-x-0 top-full z-50 hidden border-t border-line bg-paper shadow-md group-open/menu:block"><nav class="flex w-full flex-col gap-1 px-4 py-4" aria-label="Mobile">${navInner}${mobileActions}</nav></div></details>`
      : "";

  return `<header class="${escapeAttr(rootClass(props))}" ${stamp}><div class="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 md:gap-8">${brand}${desktopNav}${desktopActions}${mobileMenu}</div></header>`;
}

export function Header(
  props: HeaderProps & HeaderSlots & { children?: string } = {},
): string {
  const { children, brand, nav, actions, ...rest } = props;
  return renderHeader({
    props: rest,
    slots: { brand, nav, actions },
    children,
  });
}
