import {
  SITE_BRAND,
  SITE_AUTH_NAV,
  SITE_NAV,
  isActiveNav,
  pageTitle,
  type SitePageId,
} from "./site-pure.js";
import { pages } from "./pages.generated.js";
import {
  bodyAfterHeading,
  parseMarkdownFrontmatter,
  siteThemeBootInlineScript,
  type AsThemeMode,
} from "@glassbox-studio/studio-core/browser";
import {
  stripAuthoringAttrsFromHtml,
} from "@glassbox-studio/canvas-inspector";
import {
  PROJECT_CANVAS_INSPECTOR,
  shouldStripAuthoringAttrs,
} from "./canvas-inspector-config-pure.js";
import {
  articleBlocksFromDoc,
  composeArticleFromMarkdownHtml,
  composeContactPageHtml,
  composeHomeHeroHtml,
  homeHeroCopyFromDoc,
} from "./site-compose-pure.js";
import {
  renderFooter,
  renderHeader,
  renderNavLink,
  renderSiteLogo,
  renderThemeToggleButton,
} from "@glassbox-studio/components";
import analyticsIntegration from "../integrations/analytics.json" with { type: "json" };
import consentIntegration from "../integrations/consent.json" with { type: "json" };
export type RenderDraftOpts = {
  getDraft?: (path: string) => string | undefined;
  theme?: AsThemeMode;
  /** Studio Live iframe (`as-preview=1`) — keep authoring attrs. */
  studioPreview?: boolean;
  /** Local ideal-stack host (127.0.0.1 / localhost) — keep attrs + guest. */
  devSite?: boolean;
};

/** Node preview may set this to read `content/pages/*.md` live (no module cache). */
type PageMdReader = (slug: string) => string | undefined;

function pageMdReader(): PageMdReader | undefined {
  const g = globalThis as { __AS_PAGE_MD_READER?: PageMdReader };
  return typeof g.__AS_PAGE_MD_READER === "function"
    ? g.__AS_PAGE_MD_READER
    : undefined;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function contentPathForPage(page: SitePageId): string {
  return `content/pages/${page}.md`;
}

function parseTitleAndBody(source: string): { title: string; body: string } {
  // Peel YAML so `---` / title: never leak into Live HTML as hr/headings.
  // Keep author blank lines after `# Title` (do not `.trim()` them away).
  const { body: afterFm, fields } = parseMarkdownFrontmatter(source);
  const peeled = bodyAfterHeading(afterFm);
  const title = peeled.title || fields.title?.trim() || "Untitled";
  return { title, body: peeled.body };
}

function navHtml(page: SitePageId): string {
  const pageLinks = SITE_NAV.map((item) =>
    renderNavLink({
      props: {
        href: item.path,
        current: isActiveNav(item, page) ? "on" : "off",
        className:
          "text-sm max-md:block max-md:px-3 max-md:py-3 max-md:text-base",
      },
      slots: { label: item.label },
    }),
  ).join("");

  const authLinks = [
    renderNavLink({
      props: {
        href: SITE_AUTH_NAV.members.path,
        current: "off",
        className:
          "text-sm max-md:block max-md:px-3 max-md:py-3 max-md:text-base",
      },
      slots: { label: SITE_AUTH_NAV.members.label },
    }),
    renderNavLink({
      props: {
        href: SITE_AUTH_NAV.login.path,
        current: "off",
        className:
          "text-sm max-md:block max-md:px-3 max-md:py-3 max-md:text-base",
      },
      slots: { label: SITE_AUTH_NAV.login.label },
    }),
  ].join("");

  const links = pageLinks + authLinks;

  const themeToggle = renderThemeToggleButton();

  return renderHeader({
    props: {
      sticky: "off",
      transparent: "on",
      borderBottom: "off",
      className: "z-10",
      instanceId: "site-header",
    },
    slots: {
      brand: renderSiteLogo({
        props: {
          href: "/",
          className: "font-display text-xl tracking-tight md:text-2xl",
          instanceId: "site-logo",
          size: "sm",
        },
        slots: {
          wordmark: SITE_BRAND.name,
        },
      }),
      nav: links,
      actions: themeToggle,
    },
  });
}

function shell(
  page: SitePageId,
  body: string,
  theme: AsThemeMode = "light",
  opts?: RenderDraftOpts,
): string {
  const title = pageTitle(page);
  const darkClass = theme === "dark" ? "dark" : "";
  const boot = siteThemeBootInlineScript({
    storageKey: "walp:color-mode",
    defaultMode: theme,
    toggleSelector: "[data-as-theme-toggle]",
  });
  const strip = shouldStripAuthoringAttrs({
    isStudioPreview: Boolean(opts?.studioPreview),
    isDevSite: Boolean(opts?.devSite),
    config: PROJECT_CANVAS_INSPECTOR,
  });
  const inspectorScript = strip
    ? ""
    : `<script src="/as-canvas-inspector.js" defer></script>`;
  let html = `<!DOCTYPE html>
<html lang="en" class="${darkClass}" data-theme="${theme}" style="color-scheme:${theme}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="as-vite-client" content="http://127.0.0.1:5194/as-preview-client.js" />
    <title>${escapeHtml(title)}</title>
    <script>${boot}</script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400;1,9..40,700&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="/styles.css" />
    <style>
      html[data-as-hmr-quiet] .nl-fade,
      html[data-as-hmr-quiet] .nl-rise,
      html[data-as-hmr-patching] .nl-fade,
      html[data-as-hmr-patching] .nl-rise {
        animation: none !important;
        opacity: 1 !important;
        transform: none !important;
      }
    </style>
  </head>
  <body class="min-h-dvh bg-paper text-ink">
    <script>
      (function () {
        if (/(?:^|[?&])as-preview=1(?:&|$)/.test(location.search || "")) {
          document.documentElement.setAttribute("data-as-hmr-quiet", "");
        }
      })();
    </script>
    ${navHtml(page)}
    ${body}
    <section class="bg-sand" data-as-band="footer">
    ${renderFooter({
      props: {
        variant: "transparent",
        borderTop: "off",
        instanceId: "site-footer",
      },
      slots: {
        brand: `<span class="font-display text-base text-ink">${escapeHtml(SITE_BRAND.name)}</span><p class="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">${escapeHtml(SITE_BRAND.tagline)}</p>`,
        columns: `<div class="flex flex-col gap-3"><div class="text-xs font-semibold uppercase tracking-wider text-ink-soft">Explore</div><ul class="flex flex-col gap-2">${SITE_NAV.map(
          (item) =>
            `<li><a href="${item.path}" class="rounded-md px-2 py-1 text-sm font-medium text-ink-soft hover:text-ink">${escapeHtml(item.label)}</a></li>`,
        ).join("")}</ul></div>`,
        bottom: "World Against Light Pollution · Cloudflare Workers",
      },
    })}
    </section>
    <script src="/as-hmr-bridge.js" defer></script>
    ${inspectorScript}
    <script>
      window.__AS_ANALYTICS_BOOT__ = ${JSON.stringify({
        siteId: "world-against-light-pollution",
        analytics: analyticsIntegration,
        consent: consentIntegration,
        environment: "dev",
      })};
    </script>
    <script src="/analytics-client.js" defer></script>
  </body>
</html>`;  if (strip) {
    html = stripAuthoringAttrsFromHtml(html, { strip: true });
  }
  return html;
}

function contentOrFallback(
  page: SitePageId,
  opts?: RenderDraftOpts,
): { title: string; body: string } {
  const draft = opts?.getDraft?.(contentPathForPage(page));
  if (draft !== undefined) return parseTitleAndBody(draft);
  const fromDisk = pageMdReader()?.(page);
  if (fromDisk !== undefined) return parseTitleAndBody(fromDisk);
  return (
    pages[page] ?? {
      title: page,
      body: `_Missing content/pages/${page}.md_`,
    }
  );
}

function homeBody(opts?: RenderDraftOpts): string {
  const path = contentPathForPage("home");
  const draft = opts?.getDraft?.(path);
  const diskHome = pageMdReader()?.("home");
  // File/draft truth only — never invent SITE_BRAND.tagline.
  const doc =
    draft !== undefined
      ? parseTitleAndBody(draft)
      : diskHome !== undefined
        ? parseTitleAndBody(diskHome)
        : (pages.home ?? { title: "home", body: "" });
  const { tagline, subtitle } = homeHeroCopyFromDoc(doc);
  return composeHomeHeroHtml({
    tagline,
    subtitle,
    sourcePath: contentPathForPage("home"),
  });
}

function articleBody(page: SitePageId, opts?: RenderDraftOpts): string {
  const doc = contentOrFallback(page, opts);
  const sourcePath = contentPathForPage(page);
  // One Live path for all article MD: marked → prose (same engine as Code Write/Source).
  // Do not fork to heading/text primitives — that desyncs blank lines, breaks, and media.
  return composeArticleFromMarkdownHtml({
    title: doc.title,
    body: doc.body,
    sourcePath,
    projectId: "world-against-light-pollution",
  });
}

function contactBody(opts?: RenderDraftOpts): string {
  const doc = contentOrFallback("contact", opts);
  const { title, paragraphs } = articleBlocksFromDoc(doc);
  const formHtml = `
      <form class="nl-rise nl-rise-delay-2 mt-10 space-y-5" method="get" action="/contact">
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-ink">Name</span>
          <input name="name" class="w-full rounded-xl border border-line bg-paper-raised px-4 py-3 outline-none focus:border-accent" placeholder="Alex Rivera" />
        </label>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-ink">Email</span>
          <input type="email" name="email" class="w-full rounded-xl border border-line bg-paper-raised px-4 py-3 outline-none focus:border-accent" placeholder="alex@company.com" />
        </label>
        <label class="block">
          <span class="mb-2 block text-sm font-medium text-ink">Message</span>
          <textarea name="message" rows="4" class="w-full resize-y rounded-xl border border-line bg-paper-raised px-4 py-3 outline-none focus:border-accent" placeholder="What should Northline help you ship?"></textarea>
        </label>
        <button type="submit" class="nl-cta inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-inverse-fg hover:bg-accent-deep">
          Send message
        </button>
      </form>`;
  return composeContactPageHtml({
    title,
    paragraphs,
    formHtml,
    sourcePath: contentPathForPage("contact"),
  });
}

export function renderSitePage(page: SitePageId, opts?: RenderDraftOpts): string {
  const theme = opts?.theme ?? "light";
  if (page === "home") return shell(page, homeBody(opts), theme, opts);
  if (page === "contact") return shell(page, contactBody(opts), theme, opts);
  return shell(page, articleBody(page, opts), theme, opts);
}
