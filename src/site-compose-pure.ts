/**
 * Compose Live site pages from design-registry components.
 *
 * Home hero tree (children injection):
 *   <section data-as-component="section">
 *     <div data-as-component="container">
 *       <section data-as-component="blog-hero">
 *         eyebrow / heading / text + Button CTA primitives
 *       </section>
 *
 * Marketing article / contact bands use heading + text primitives
 * (Inspect each block). Long-form blog → composeProseArticleHtml (prose).
 */

import {
  buttonClassName,
  blogHeroSlotsFromText,
  renderBlogHero,
  renderButton,
  renderContainer,
  renderEyebrow,
  renderHeading,
  renderOptimizedImage,
  renderProse,
  renderSection,
  renderText,
} from "@glassbox-studio/components";
import {
  markdownToInlineHtml,
  markdownToSimpleHtml,
  studioMediaApiOrigin,
} from "./md-pure.js";
import { SITE_BRAND } from "./site-pure.js";

const IMAGE_ONLY_RE =
  /^!\[[^\]]*\]\((media:[^)]+|\/api\/(?:projects\/[^/]+\/media\/|studio\/media\/)[^)]+)\)\s*$/;

/** Map home.md title/body → hero H1 + subtitle (no invented brand tagline). */
export function homeHeroCopyFromDoc(doc: {
  title: string;
  body: string;
}): { tagline: string; subtitle: string } {
  const title = doc.title.trim();
  const paragraphs = doc.body
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter((b) => b && !b.startsWith("#"));
  if (title) {
    return { tagline: title, subtitle: paragraphs[0] ?? "" };
  }
  return { tagline: paragraphs[0] ?? "", subtitle: paragraphs[1] ?? "" };
}

/** Split page md into title + body paragraphs for primitive compose. */
export function articleBlocksFromDoc(doc: {
  title: string;
  body: string;
}): { title: string; paragraphs: string[] } {
  const title = doc.title.trim() || "Untitled";
  const paragraphs = doc.body
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter((b) => b && !b.startsWith("#"));
  return { title, paragraphs };
}

export function composeHomeHeroHtml(input: {
  tagline: string;
  subtitle?: string;
  sourcePath: string;
}): string {
  const slots = blogHeroSlotsFromText({
    eyebrow: SITE_BRAND.name,
    title: input.tagline || "Home",
    subtitle: input.subtitle ?? "",
    byline: "",
    ctaPrimary: "",
    ctaSecondary: "",
    cover: "off",
  });

  slots.eyebrow = renderEyebrow({
    props: {
      align: "center",
      color: "brand",
      instanceId: "home-eyebrow",
    },
    slots: { text: SITE_BRAND.name },
  });
  slots.title = renderHeading({
    props: {
      level: 1,
      size: "display",
      align: "center",
      weight: "bold",
      color: "inherit",
      instanceId: "home-title",
    },
    slots: { text: markdownToInlineHtml(input.tagline || "Home") },
  });
  slots.subtitle = input.subtitle
    ? renderText({
        props: {
          variant: "lead",
          align: "center",
          color: "inherit",
          className: "max-w-xl nl-hero-sub",
          instanceId: "home-subtitle",
        },
        slots: { content: markdownToInlineHtml(input.subtitle) },
      })
    : "";
  slots.byline = "";

  // Button primitives in dedicated CTA slots (selectable in Canvas Inspector).
  slots.ctaPrimary = renderButton({
    props: {
      variant: "primary",
      href: "/petition",
      className: buttonClassName("primary"),
      instanceId: "home-cta-primary",
    },
    slots: { label: "Sign the petition" },
  });
  slots.ctaSecondary = renderButton({
    props: {
      variant: "secondary",
      href: "/lumens",
      className:
        "inline-flex items-center rounded-full border border-on-hero/40 px-6 py-3 text-sm font-medium text-on-hero hover:border-on-hero/80 active:scale-[0.97] transition",
      instanceId: "home-cta-secondary",
    },
    slots: { label: "Learn about lumens" },
  });

  const hero = renderBlogHero({
    props: {
      layout: "magazine",
      instanceId: "home-hero",
      source: input.sourcePath,
    },
    slots,
  });

  // section → container → blog-hero (injected as container children)
  const shell = renderContainer({
    props: { width: "lg", align: "center", instanceId: "home-container" },
    children: hero,
    chrome: "live",
  });

  // Transparent band — page `bg-paper` shows through (pre-package look).
  const band = renderSection({
    props: {
      background: "transparent",
      padding: "xl",
      gap: "none",
      instanceId: "home-band",
    },
    children: shell,
    chrome: "live",
  });

  return `<main data-as-preview-root class="bg-paper text-ink">${band}</main>`;
}

/**
 * Marketing article band — heading + text primitives (not opaque markdown).
 * Image-only paragraphs → optimized-image (sharp srcset via Studio media API).
 * Each block is Inspect-selectable.
 */
export function composeArticlePageHtml(input: {
  title: string;
  paragraphs: string[];
  sourcePath: string;
  projectId?: string;
  apiOrigin?: string;
}): string {
  const projectId = input.projectId ?? "glassbox-studio-template";
  const apiOrigin = input.apiOrigin ?? studioMediaApiOrigin();
  const titleHtml = renderHeading({
    props: {
      level: 1,
      size: "xl",
      weight: "bold",
      color: "ink",
      className: "font-display",
      instanceId: "article-title",
    },
    slots: { text: markdownToInlineHtml(input.title) },
  });
  const paras = input.paragraphs
    .map((p, i) => {
      const image = p.match(IMAGE_ONLY_RE);
      if (image) {
        const href = image[1]!;
        const altMatch = p.match(/^!\[([^\]]*)\]/);
        return renderOptimizedImage({
          props: {
            src: href,
            alt: altMatch?.[1] ?? "",
            projectId,
            apiOrigin,
            className: "mt-6",
            instanceId: `article-img-${i + 1}`,
            source: input.sourcePath,
          },
        });
      }
      return renderText({
        props: {
          variant: i === 0 ? "lead" : "body",
          color: "muted",
          instanceId: `article-p-${i + 1}`,
        },
        slots: { content: markdownToInlineHtml(p) },
      });
    })
    .join("");
  const stack = `<div class="nl-rise flex flex-col gap-5" data-as-source="${escapeAttr(input.sourcePath)}">${titleHtml}${paras}</div>`;
  const inner = renderContainer({
    props: { width: "md", align: "center", instanceId: "article-container" },
    children: stack,
    chrome: "live",
  });
  const band = renderSection({
    props: {
      background: "transparent",
      padding: "xl",
      gap: "md",
      instanceId: "article-band",
    },
    children: inner,
    chrome: "live",
  });
  return `<main data-as-preview-root class="bg-paper text-ink">${band}</main>`;
}

/** When MD has mixed blocks + images, prefer prose + optimized markdown images. */
export function composeArticleFromMarkdownHtml(input: {
  title: string;
  body: string;
  sourcePath: string;
  projectId?: string;
  apiOrigin?: string;
}): string {
  const projectId = input.projectId ?? "glassbox-studio-template";
  const apiOrigin = input.apiOrigin ?? studioMediaApiOrigin();
  // Preserve leading blank lines in body (gap under title); only add `\n\n` when body has no lead.
  const md = input.body.match(/^\r?\n/)
    ? `# ${input.title}${input.body}`
    : `# ${input.title}\n\n${input.body}`;
  const html = markdownToSimpleHtml(md, {
    apiOrigin,
    defaultProjectId: projectId,
    optimizeImages: true,
  });
  return composeProseArticleHtml({
    html,
    sourcePath: input.sourcePath,
    instanceId: "article-prose-md",
  });
}

export function articleHasMediaImages(body: string): boolean {
  return (
    /!\[[^\]]*\]\(media:/i.test(body) ||
    /!\[[^\]]*\]\(\/api\/(?:projects|studio)\//i.test(body)
  );
}

/**
 * Long-form / blog body — single prose component (lists, quotes, multi-block).
 */
export function composeProseArticleHtml(input: {
  html: string;
  sourcePath: string;
  instanceId?: string;
}): string {
  const prose = renderProse({
    props: {
      size: "lg",
      measure: "md",
      instanceId: input.instanceId ?? "article-prose",
      source: input.sourcePath,
    },
    slots: { content: input.html },
  });
  const inner = renderContainer({
    props: { width: "md", align: "center", instanceId: "prose-container" },
    children: prose,
    chrome: "live",
  });
  const band = renderSection({
    props: {
      background: "transparent",
      padding: "xl",
      gap: "md",
      instanceId: "prose-band",
    },
    children: inner,
    chrome: "live",
  });
  return `<main data-as-preview-root class="bg-paper text-ink">${band}</main>`;
}

export function composeContactPageHtml(input: {
  title: string;
  paragraphs: string[];
  formHtml: string;
  sourcePath: string;
}): string {
  const titleHtml = renderHeading({
    props: {
      level: 1,
      size: "xl",
      weight: "bold",
      color: "ink",
      className: "font-display",
      instanceId: "contact-title",
    },
    slots: { text: markdownToInlineHtml(input.title) },
  });
  const paras = input.paragraphs
    .map((p, i) =>
      renderText({
        props: {
          variant: i === 0 ? "lead" : "body",
          color: "muted",
          instanceId: `contact-p-${i + 1}`,
        },
        slots: { content: markdownToInlineHtml(p) },
      }),
    )
    .join("");
  const intro = `<div class="nl-rise flex flex-col gap-5" data-as-source="${escapeAttr(input.sourcePath)}">${titleHtml}${paras}</div>`;
  const form = `<div data-as-inspect="1" data-as-kind="text" data-as-source="contact-form">${input.formHtml}</div>`;
  const inner = renderContainer({
    props: { width: "sm", align: "center", instanceId: "contact-container" },
    children: `${intro}${form}`,
    chrome: "live",
  });
  const band = renderSection({
    props: {
      background: "transparent",
      padding: "xl",
      gap: "lg",
      instanceId: "contact-band",
    },
    children: inner,
    chrome: "live",
  });
  return `<main data-as-preview-root class="bg-paper text-ink">${band}</main>`;
}

function escapeAttr(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
}
