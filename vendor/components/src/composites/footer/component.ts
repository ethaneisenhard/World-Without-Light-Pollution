import type { DesignComponentMeta } from "@glassbox-studio/studio-core/browser";
import { renderNavLink } from "../nav-link/component.js";
import { renderSiteLogo } from "../site-logo/component.js";
import { escapeHtml } from "../../ssr-escape.js";

/**
 * Footer — BrowserUI marketing footer.
 * brand | columns | bottom. Prefer variant transparent + section band.
 */
export const meta = {
  id: "footer",
  title: "Footer",
  layer: "composite",
  acceptsChildren: false,
  props: {
    variant: {
      type: "enum",
      values: ["transparent", "muted", "surface"],
      default: "muted",
      title: "Colour scheme",
      description:
        "Muted matches the site footer band. Transparent when a wrapping section owns the band.",
    },
    borderTop: {
      type: "enum",
      values: ["off", "on"],
      default: "off",
      title: "Top border",
    },
  },
  slots: {
    brand: { title: "Brand", optional: true },
    columns: { title: "Columns", optional: true },
    bottom: { title: "Bottom bar", optional: true },
  },
} as const satisfies DesignComponentMeta;

export const slotTextDefaults = {
  brand: "Northline|Ship the work that matters.",
  columns: "Explore|Home|/|About|/about|Contact|/contact",
  bottom: "Studio Starter · Cloudflare Workers",
} as const;

function footerColumn(title: string, linksHtml: string): string {
  return `<div class="flex flex-col gap-3"><div class="text-xs font-semibold uppercase tracking-wider text-ink-soft">${escapeHtml(title)}</div><ul class="flex flex-col gap-2">${linksHtml}</ul></div>`;
}

function parseColumnsSpec(spec: string): string {
  // Groups separated by || — each: Title|Label|/href|Label|/href...
  return spec
    .split("||")
    .map((group) => group.trim())
    .filter(Boolean)
    .map((group) => {
      const parts = group.split("|").map((s) => s.trim());
      const title = parts[0] || "Links";
      const links: string[] = [];
      for (let i = 1; i + 1 < parts.length; i += 2) {
        const label = parts[i]!;
        const href = parts[i + 1]!;
        links.push(
          `<li>${renderNavLink({
            props: { href, className: "text-sm text-ink-soft hover:text-ink" },
            slots: { label },
          })}</li>`,
        );
      }
      return footerColumn(title, links.join(""));
    })
    .join("");
}

export function slotsFromPlainText(
  text: Record<string, string>,
): Record<string, string> {
  const brandRaw = text.brand?.trim() || "";
  const columnsRaw = text.columns?.trim() || "";
  const bottom = text.bottom?.trim() || "";

  let brand = "";
  if (brandRaw) {
    const [name, tagline] = brandRaw.split("|").map((s) => s.trim());
    const wordmark = name || "Northline";
    const logo = renderSiteLogo({
      props: {
        href: "/",
        className: "font-display text-base",
        markVariant: "initials",
      },
      slots: { mark: wordmark.slice(0, 1), wordmark },
    });
    brand = tagline
      ? `${logo}<p class="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">${escapeHtml(tagline)}</p>`
      : logo;
  }

  return {
    brand,
    columns: columnsRaw ? parseColumnsSpec(columnsRaw) : "",
    bottom,
  };
}

export type { FooterProps, FooterSlots } from "./footer.js";
export { Footer, renderFooter } from "./footer.js";
