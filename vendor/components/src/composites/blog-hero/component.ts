import type { DesignComponentMeta } from "@glassbox-studio/studio-core/browser";
import { buttonClassName } from "../../primitives/button/button-classes.js";
import { renderButton } from "../../primitives/button/component.js";
import { renderEyebrow } from "../../primitives/eyebrow/component.js";
import { renderHeading } from "../../primitives/heading/component.js";
import { renderText } from "../../primitives/text/component.js";

/**
 * Blog hero — composite.
 * Composed Live as: section → container → blog-hero (children).
 * Copy slots hold typography primitives (eyebrow / heading / text).
 * CTAs are dedicated slots holding Button primitives.
 */
export const meta = {
  id: "blog-hero",
  title: "Blog hero",
  layer: "composite",
  acceptsChildren: false,
  props: {
    layout: {
      type: "enum",
      values: ["magazine", "side", "backdrop"],
      default: "magazine",
      title: "Layout",
      description: "How eyebrow / title / cover compose.",
    },
  },
  slots: {
    eyebrow: {
      title: "Eyebrow",
      description: "Eyebrow primitive above the title",
      optional: true,
    },
    title: {
      title: "Title",
      description: "Heading primitive",
    },
    subtitle: {
      title: "Subtitle",
      description: "Text primitive (lead)",
      optional: true,
    },
    byline: {
      title: "Byline",
      description: "Text primitive (small)",
      optional: true,
    },
    ctaPrimary: {
      title: "Primary CTA",
      description: "Primary Button primitive",
      optional: true,
    },
    ctaSecondary: {
      title: "Secondary CTA",
      description: "Secondary Button primitive",
      optional: true,
    },
    cover: {
      title: "Cover",
      description: "Show cover placeholder — set to off to hide",
      optional: true,
    },
  },
} as const satisfies DesignComponentMeta;

/** Plain-text defaults for the inspector (not raw HTML). */
export const slotTextDefaults = {
  eyebrow: "Essay",
  title: "An untitled essay",
  subtitle: "",
  byline: "Ada Lovelace · 2026-01-15 · 5 min read",
  ctaPrimary: "Read more",
  ctaSecondary: "About",
  cover: "on",
} as const;

function defaultPrimaryButton(label: string): string {
  return renderButton({
    props: {
      variant: "primary",
      href: "#",
      className: buttonClassName("primary"),
    },
    slots: { label },
  });
}

function defaultSecondaryButton(label: string): string {
  return renderButton({
    props: {
      variant: "secondary",
      href: "#",
      className: buttonClassName("secondary"),
    },
    slots: { label },
  });
}

/** Map inspector plain text → slot HTML for SSR (typography + button primitives). */
export function slotsFromPlainText(
  text: Record<string, string>,
): Record<string, string> {
  const eyebrow = text.eyebrow?.trim() ?? "";
  const title = text.title?.trim() ?? "";
  const subtitle = text.subtitle?.trim() ?? "";
  const byline = text.byline?.trim() ?? "";
  const ctaPrimary = text.ctaPrimary?.trim() ?? "";
  const ctaSecondary = text.ctaSecondary?.trim() ?? "";
  const coverRaw = (text.cover ?? "on").trim().toLowerCase();
  const coverOn = coverRaw !== "off" && coverRaw !== "false" && coverRaw !== "0";

  return {
    eyebrow: eyebrow
      ? renderEyebrow({
          props: { align: "center", color: "muted" },
          slots: { text: eyebrow },
        })
      : "",
    title: title
      ? renderHeading({
          props: {
            level: 1,
            size: "display",
            align: "center",
            weight: "bold",
            color: "ink",
          },
          slots: { text: title },
        })
      : "",
    subtitle: subtitle
      ? renderText({
          props: {
            variant: "lead",
            align: "center",
            color: "muted",
            className: "max-w-xl",
          },
          slots: { content: subtitle },
        })
      : "",
    byline: byline
      ? renderText({
          props: { variant: "small", align: "center", color: "muted" },
          slots: { content: byline },
        })
      : "",
    ctaPrimary: ctaPrimary ? defaultPrimaryButton(ctaPrimary) : "",
    ctaSecondary: ctaSecondary ? defaultSecondaryButton(ctaSecondary) : "",
    cover: coverOn
      ? `<figure class="overflow-hidden rounded-2xl border border-line bg-sand/50"><div class="aspect-[16/9] w-full bg-gradient-to-br from-accent/30 to-sand" role="img" aria-label="Cover placeholder"></div></figure>`
      : "",
  };
}

export const defaultSlots = slotsFromPlainText({ ...slotTextDefaults });

export type { BlogHeroProps, BlogHeroSlots } from "./blog-hero.js";
export { BlogHero, renderBlogHero } from "./blog-hero.js";
