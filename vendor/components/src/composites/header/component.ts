import type { DesignComponentMeta } from "@glassbox-studio/studio-core/browser";
import { renderNavLink } from "../nav-link/component.js";
import { renderSiteLogo } from "../site-logo/component.js";
import { renderThemeToggleButton } from "./header.js";

/**
 * Site Header — BrowserUI marketing top bar.
 * Desktop: brand | nav | actions. Mobile: hamburger <details> panel.
 */
export const meta = {
  id: "header",
  title: "Site Header",
  layer: "composite",
  acceptsChildren: false,
  props: {
    sticky: {
      type: "enum",
      values: ["off", "on"],
      default: "off",
      title: "Sticky",
    },
    transparent: {
      type: "enum",
      values: ["off", "on"],
      default: "off",
      title: "Transparent",
      description: "Drop the background fill so the header floats over a hero.",
    },
    borderBottom: {
      type: "enum",
      values: ["off", "on"],
      default: "on",
      title: "Bottom border",
      description: "1px divider under the header (ignored when transparent).",
    },
  },
  slots: {
    brand: { title: "Brand", optional: true },
    nav: { title: "Navigation", optional: true },
    actions: { title: "Actions", optional: true },
  },
} as const satisfies DesignComponentMeta;

/** Plain-text inspector defaults — composed into site-shaped slot HTML. */
export const slotTextDefaults = {
  brand: "Northline",
  nav: "Home|/|,About|/about|,Contact|/contact",
  actions: "theme",
} as const;

function parseNavSpec(spec: string): Array<{ label: string; href: string }> {
  return spec
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [label, href] = part.split("|").map((s) => s.trim());
      return { label: label || "Link", href: href || "#" };
    });
}

export function slotsFromPlainText(
  text: Record<string, string>,
): Record<string, string> {
  const brandLabel = text.brand?.trim() || "Northline";
  const navSpec = text.nav?.trim() || "";
  const actionsRaw = text.actions?.trim() || "";

  const brand = renderSiteLogo({
    props: {
      href: "/",
      className: "font-display text-xl tracking-tight md:text-2xl",
      markVariant: "initials",
    },
    slots: {
      mark: brandLabel.slice(0, 1),
      wordmark: brandLabel,
    },
  });

  const nav = parseNavSpec(navSpec)
    .map((item) =>
      renderNavLink({
        props: {
          href: item.href,
          className:
            "text-sm max-md:block max-md:px-3 max-md:py-3 max-md:text-base",
        },
        slots: { label: item.label },
      }),
    )
    .join("");

  let actions = "";
  if (actionsRaw === "theme" || actionsRaw.toLowerCase() === "theme") {
    actions = renderThemeToggleButton();
  } else if (actionsRaw) {
    actions = actionsRaw;
  }

  return { brand, nav, actions };
}

export type { HeaderProps, HeaderSlots } from "./header.js";
export { Header, renderHeader, renderThemeToggleButton } from "./header.js";
