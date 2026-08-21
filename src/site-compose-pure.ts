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
import {
  COUNTY_LETTER_SUBJECT,
  COUNTY_LOOKUP_LINKS,
  countyLetterBody,
  countyLetterMailtoHref,
} from "./county-letter-pure.js";
import {
  homePathsFromDoc,
  type HomePathView,
} from "./home-paths-pure.js";
import {
  getNightLabEmbed,
  groupLabArticleBlocks,
  nightLabMountAttrString,
  splitMarkdownLabBlocks,
} from "./night-lab-pure.js";

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
  pathCopy?: HomePathView[];
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
      className: "nl-hero-band",
    },
    children: shell,
    chrome: "live",
  });

  const paths = composeHomePathsHtml({
    sourcePath: input.sourcePath,
    paths: input.pathCopy ?? homePathsFromDoc(""),
  });
  return `<main data-as-preview-root class="bg-paper text-ink">${band}${paths}</main>`;
}

function composeHomePathHtml(input: {
  path: HomePathView;
  sourcePath: string;
}): string {
  const { path, sourcePath } = input;
  const eyebrow = renderEyebrow({
    props: {
      align: "left",
      color: "brand",
      instanceId: `home-${path.id}-eyebrow`,
    },
    slots: { text: path.eyebrow },
  });
  const title = renderHeading({
    props: {
      level: 2,
      size: "xl",
      weight: "bold",
      color: "ink",
      className: "font-display",
      instanceId: `home-${path.id}-title`,
    },
    slots: { text: markdownToInlineHtml(path.title) },
  });
  const copy = renderText({
    props: {
      variant: "lead",
      color: "muted",
      instanceId: `home-${path.id}-copy`,
    },
    slots: { content: markdownToInlineHtml(path.story) },
  });
  const lab = path.embedId
    ? composeNightLabMountHtml({
        embedId: path.embedId,
        sourcePath,
        instanceId: `home-${path.id}-lab`,
      })
    : "";
  const ctaVariant = path.ctaVariant ?? "primary";
  const primary = renderButton({
    props: {
      variant: ctaVariant,
      href: path.cta.href,
      className: buttonClassName(ctaVariant),
      instanceId: `home-${path.id}-cta`,
    },
    slots: { label: path.cta.label },
  });
  const more = (path.more ?? []).map((link, i) =>
    renderButton({
      props: {
        variant: "secondary",
        href: link.href,
        className: buttonClassName("secondary"),
        instanceId: `home-${path.id}-more-${i + 1}`,
      },
      slots: { label: link.label },
    }),
  );
  const actions = `<div class="nl-home-path__cta">${primary}${more.join("")}</div>`;
  const ctaPlace = path.ctaPlace ?? "end";
  let copyCta = "";
  let endCta = "";
  switch (ctaPlace) {
    case "copy":
      copyCta = actions;
      break;
    case "end":
      endCta = actions;
      break;
    default: {
      const _exhaustive: never = ctaPlace;
      return _exhaustive;
    }
  }
  const intro = `<div class="nl-home-path__intro space-y-6">${eyebrow}${title}${copy}${copyCta}</div>`;
  const split = Boolean(path.embedId);
  const articleClass = split
    ? "nl-home-path nl-home-path--split"
    : "nl-home-path space-y-6";
  const stack = `<article class="${articleClass}" data-nl-path="${escapeAttr(path.id)}">${intro}${lab}${endCta}</article>`;
  const inner = renderContainer({
    props: {
      width: "lg",
      align: "center",
      instanceId: `home-${path.id}-container`,
    },
    children: stack,
    chrome: "live",
  });
  return renderSection({
    props: {
      background: path.background,
      padding: "xl",
      gap: "none",
      instanceId: `home-${path.id}-band`,
    },
    children: inner,
    chrome: "live",
  });
}

function composeHomePathsHtml(input: {
  sourcePath: string;
  paths: HomePathView[];
}): string {
  return input.paths
    .map((path) => composeHomePathHtml({ path, sourcePath: input.sourcePath }))
    .join("");
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
  const mdOpts = {
    apiOrigin,
    defaultProjectId: projectId,
    optimizeImages: true,
  };
  const blocks = groupLabArticleBlocks(splitMarkdownLabBlocks(md));
  const hasLab = blocks.some((b) => b.kind === "lab" || b.kind === "kind");
  if (!hasLab) {
    const html = markdownToSimpleHtml(md, mdOpts);
    return composeProseArticleHtml({
      html,
      sourcePath: input.sourcePath,
      instanceId: "article-prose-md",
    });
  }
  const innerHtml = blocks
    .map((block, i) => {
      switch (block.kind) {
        case "md":
          return renderProse({
            props: {
              size: "lg",
              measure: "md",
              instanceId: `article-prose-${i}`,
              source: input.sourcePath,
            },
            slots: { content: markdownToSimpleHtml(block.text, mdOpts) },
          });
        case "lab":
          return composeNightLabMountHtml({
            embedId: block.embedId,
            sourcePath: input.sourcePath,
            instanceId: `article-lab-${block.embedId}-${i}`,
          });
        case "kind":
          return composeNightKindHtml({
            text: block.text,
            embedId: block.embedId,
            sourcePath: input.sourcePath,
            instanceId: `article-kind-${block.embedId}-${i}`,
            mdOpts,
          });
        default: {
          const _x: never = block;
          return _x;
        }
      }
    })
    .join("");
  return composeProseArticleHtml({
    html: innerHtml,
    sourcePath: input.sourcePath,
    instanceId: "article-prose-md",
    alreadyProse: true,
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
  /** When true, `html` is already stamped prose/lab mounts — don't wrap again. */
  alreadyProse?: boolean;
}): string {
  const prose = input.alreadyProse
    ? `<div class="nl-article-stack space-y-8">${input.html}</div>`
    : renderProse({
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

export function composeCountyLetterHtml(input: {
  title: string;
  paragraphs: string[];
  sourcePath: string;
  siteOrigin?: string;
}): string {
  const titleHtml = renderHeading({
    props: {
      level: 1,
      size: "xl",
      weight: "bold",
      color: "ink",
      className: "font-display",
      instanceId: "county-letter-title",
    },
    slots: { text: markdownToInlineHtml(input.title) },
  });
  const paras = input.paragraphs
    .map((p, i) =>
      renderText({
        props: {
          variant: i === 0 ? "lead" : "body",
          color: "muted",
          instanceId: `county-letter-p-${i + 1}`,
        },
        slots: { content: markdownToInlineHtml(p) },
      }),
    )
    .join("");
  const intro = `<div class="nl-rise flex flex-col gap-5" data-as-source="${escapeAttr(input.sourcePath)}">${titleHtml}${paras}</div>`;

  const letterInput = { siteOrigin: input.siteOrigin };
  const body = countyLetterBody(letterInput);
  const mailto = countyLetterMailtoHref(letterInput);
  const openMail = renderButton({
    props: {
      variant: "primary",
      href: mailto,
      className: `${buttonClassName("primary")} nl-letter__mail`,
      instanceId: "county-letter-mail",
    },
    slots: { label: "Open in mail" },
  });
  const copyBtn = renderButton({
    props: {
      variant: "secondary",
      type: "button",
      className: `${buttonClassName("secondary")} nl-letter__copy`,
      instanceId: "county-letter-copy",
    },
    slots: { label: "Copy letter" },
  }).replace("<button ", '<button data-nl-copy="1" ');

  const letter = `<section class="nl-letter" data-nl-county-letter data-as-source="${escapeAttr(input.sourcePath)}">
    <p class="nl-letter__subject"><span>Subject</span> ${escapeHtmlText(COUNTY_LETTER_SUBJECT)}</p>
    <label class="nl-letter__label" for="nl-county-letter-body">Letter</label>
    <textarea id="nl-county-letter-body" class="nl-letter__body" readonly rows="16">${escapeHtmlText(body)}</textarea>
    <div class="nl-letter__actions">${openMail}${copyBtn}</div>
  </section>`;

  const findTitle = renderHeading({
    props: {
      level: 2,
      size: "lg",
      weight: "bold",
      color: "ink",
      className: "font-display",
      instanceId: "county-letter-find-title",
    },
    slots: { text: "Find who to write" },
  });
  const findLead = renderText({
    props: {
      variant: "body",
      color: "muted",
      instanceId: "county-letter-find-lead",
    },
    slots: {
      content:
        "There is no single national list of county emails. Start with these directories, then look for Public Works, Transportation, or Street Lighting on your city or county site.",
    },
  });
  const lookups = `<ul class="nl-letter-lookups">${COUNTY_LOOKUP_LINKS.map(
    (link) =>
      `<li><a href="${escapeAttr(link.href)}" rel="noopener noreferrer">${escapeHtmlText(link.label)}</a><p>${escapeHtmlText(link.note)}</p></li>`,
  ).join("")}</ul>`;

  const moreTitle = renderHeading({
    props: {
      level: 2,
      size: "lg",
      weight: "bold",
      color: "ink",
      className: "font-display",
      instanceId: "county-letter-more-title",
    },
    slots: { text: "What to send with it" },
  });
  const moreLinks = `<ul class="nl-letter-more">
    <li><a href="/petition">The petition</a> — the five asks, to share with neighbors</li>
    <li><a href="/impacts">Health &amp; wildlife</a> — sleep, birds, and the night sky</li>
    <li><a href="/resources#3-the-one-page-standard-to-ask-for">The one-page standard</a> — 3000K, full shielding, dim after midnight</li>
    <li><a href="/maps">Maps</a> — your street on a sky-brightness map</li>
  </ul>`;

  const stack = `<div class="space-y-8">${intro}${letter}${findTitle}${findLead}${lookups}${moreTitle}${moreLinks}</div>`;
  const inner = renderContainer({
    props: { width: "md", align: "center", instanceId: "county-letter-container" },
    children: stack,
    chrome: "live",
  });
  const band = renderSection({
    props: {
      background: "transparent",
      padding: "xl",
      gap: "lg",
      instanceId: "county-letter-band",
    },
    children: inner,
    chrome: "live",
  });
  return `<main data-as-preview-root class="bg-paper text-ink">${band}</main>`;
}

function escapeHtmlText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function composeNightLabMountHtml(input: {
  embedId: string;
  sourcePath: string;
  instanceId: string;
}): string {
  const embed = getNightLabEmbed(input.embedId);
  if (!embed) return "";
  const attrs = nightLabMountAttrString(embed);
  return `<div class="nl-lab-embed" ${attrs} aria-label="${escapeAttr(embed.caption)}" data-as-source="${escapeAttr(input.sourcePath)}" data-as-instance="${escapeAttr(input.instanceId)}"><p class="m-0 p-4 text-sm text-ink-soft">${escapeAttr(embed.caption)}</p></div>`;
}

function composeNightKindHtml(input: {
  text: string;
  embedId: string;
  sourcePath: string;
  instanceId: string;
  mdOpts: Parameters<typeof markdownToSimpleHtml>[1];
}): string {
  const prose = renderProse({
    props: {
      size: "lg",
      measure: "md",
      instanceId: `${input.instanceId}-copy`,
      source: input.sourcePath,
    },
    slots: { content: markdownToSimpleHtml(input.text, input.mdOpts) },
  });
  const lab = composeNightLabMountHtml({
    embedId: input.embedId,
    sourcePath: input.sourcePath,
    instanceId: `${input.instanceId}-lab`,
  });
  return `<section class="nl-kind" data-nl-kind="${escapeAttr(input.embedId)}">${prose}${lab}</section>`;
}

function escapeAttr(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
}

/**
 * Lumen Lab — interactive "atmosphere" simulator section.
 * Renders a section → container → (heading copy + mount point) tree; the actual
 * scenes/sliders are built client-side by /lumen-lab.js onto `[data-as-lumen-lab]`.
 * The mount div carries a JS-less fallback so the Canvas Inspector still shows
 * intent when client JS can't run.
 */
export function composeLumenLabHtml(input: {
  sourcePath: string;
  title: string;
  intro: string;
}): string {
  const eyebrow = renderEyebrow({
    props: {
      align: "left",
      color: "brand",
      instanceId: "lumen-lab-eyebrow",
    },
    slots: { text: "Lumens" },
  });
  const heading = renderHeading({
    props: {
      level: 1,
      size: "lg",
      weight: "bold",
      color: "ink",
      className: "font-display",
      instanceId: "lumen-lab-title",
    },
    slots: { text: markdownToInlineHtml(input.title) },
  });
  const intro = renderText({
    props: {
      variant: "lead",
      color: "muted",
      instanceId: "lumen-lab-intro",
    },
    slots: { content: markdownToInlineHtml(input.intro) },
  });
  const lab = `<div data-as-lumen-lab data-as-source="${escapeAttr(input.sourcePath)}"><p class="m-0 p-4 text-sm text-ink-soft">A night street.</p></div>`;
  const stack = `<div class="nl-rise flex flex-col gap-3" data-as-source="${escapeAttr(input.sourcePath)}">${eyebrow}${heading}${intro}</div>${lab}`;
  const inner = renderContainer({
    props: { width: "lg", align: "center", instanceId: "lumen-lab-container" },
    children: stack,
    chrome: "live",
  });
  const band = renderSection({
    props: {
      background: "transparent",
      padding: "xl",
      gap: "lg",
      instanceId: "lumen-lab-band",
    },
    children: inner,
    chrome: "live",
  });
  return band;
}
