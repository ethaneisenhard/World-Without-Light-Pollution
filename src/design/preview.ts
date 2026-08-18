/**
 * Design preview pages — thin project wrapper around @glassbox-studio/sandbox-engine/html.
 */

import {
  generateTheme,
  renderDesignSystemAtlasBody,
} from "@glassbox-studio/ui-tokens";
import {
  renderSandboxApiPayload,
  renderSandboxComponentPage,
  renderSandboxComponentsIndex,
  type SandboxHtmlShellOptions,
} from "@glassbox-studio/sandbox-engine/html";
import type {
  SandboxInspectorDraft,
  SandboxMode,
} from "@glassbox-studio/sandbox-engine";
import {
  siteThemeBootInlineScript,
  type AsThemeMode,
} from "@glassbox-studio/studio-core/browser";
import { moonOutlineSvg } from "@glassbox-studio/ui-icons/ssr";
import { designSandboxRegistry, designComponentNavPath } from "./registry.js";
import { designSystem } from "./design-system.generated.js";
import {
  renderDesignHomeBody,
} from "./home-pure.js";
import {
  buildDesignBreadcrumbs,
  DESIGN_CANVAS_NAV_SCRIPT,
  renderDesignBreadcrumbHtml,
} from "@glassbox-studio/sandbox-engine/html";

const FONT_HEAD = `
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap" rel="stylesheet" />`;

/** Mirrors `.glassbox-studio/design.json` brand — keep in sync for Design home. */
const PROJECT_BRAND = {
  name: "Studio Starter",
  initials: "SS",
  tagline: "Ideal-stack marketing template.",
} as const;

function shellOpts(colorMode: AsThemeMode = "dark"): SandboxHtmlShellOptions {
  return {
    registry: designSandboxRegistry,
    stylesheets: ["/styles.css"],
    headExtra: FONT_HEAD,
    colorMode,
    componentNavPath: designComponentNavPath,
  };
}

const HOME_SWATCH_KEYS = [
  "accent",
  "ink",
  "paper",
  "sand",
  "glow",
  "hero-from",
] as const;

export function renderDesignHome(colorMode: AsThemeMode = "dark"): string {
  const colors = (designSystem.tokens?.color ?? {}) as Record<string, string>;
  const swatches = HOME_SWATCH_KEYS.filter((k) => typeof colors[k] === "string").map(
    (k) => ({ name: k, value: colors[k]! }),
  );
  const body = renderDesignHomeBody({
    brand: { ...PROJECT_BRAND },
    overview:
      "This project’s design system — tokens for color, type, and space, plus a component library you can sandbox without leaving Design.",
    links: [
      {
        id: "system",
        title: "Design system",
        description:
          "Token atlas — colors, type, radius, motion. Edit and save back to Nav.",
        navPath: "design/design-system.json",
        href: "/__as/design/system",
      },
      {
        id: "components",
        title: "Component library",
        description:
          "Primitives and composites in the sandbox — linked to Design → Components in Nav.",
        navPath: "design/components",
        href: "/__as/design/components",
      },
    ],
    swatches,
    colorMode,
  });
  const boot = siteThemeBootInlineScript({
    storageKey: "as-sandbox:color-mode",
    defaultMode: colorMode,
    toggleSelector: "[data-as-theme-toggle]",
  });
  const crumbs = buildDesignBreadcrumbs("home");
  const darkClass = colorMode === "dark" ? "dark" : "";

  return `<!DOCTYPE html>
<html lang="en" class="${darkClass}" data-theme="${colorMode}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Design · ${PROJECT_BRAND.name}</title>
    <script>${boot}</script>
    <link rel="stylesheet" href="/styles.css" />
    ${FONT_HEAD}
  </head>
  <body class="min-h-screen bg-paper text-ink antialiased">
    <div class="as-ds-topbar">
      <div class="as-ds-topbar__meta">
        ${renderDesignBreadcrumbHtml(crumbs)}
      </div>
      <button type="button" data-as-theme-toggle class="as-ds-theme-btn" aria-label="Toggle color mode">${moonOutlineSvg("size-4")}</button>
    </div>
    ${body}
    <script>${DESIGN_CANVAS_NAV_SCRIPT}</script>
  </body>
</html>`;
}

export function renderDesignComponentPreview(
  id: string,
  mode: SandboxMode = "sandbox",
  colorMode: AsThemeMode = "dark",
): string | null {
  return renderSandboxComponentPage(shellOpts(colorMode), id, mode);
}

export function renderDesignComponentsIndex(
  colorMode: AsThemeMode = "dark",
): string {
  return renderSandboxComponentsIndex(shellOpts(colorMode));
}

export function renderDesignSystemAtlas(colorMode: AsThemeMode = "light"): string {
  const body = renderDesignSystemAtlasBody(designSystem);
  const crumbs = buildDesignBreadcrumbs("system");
  const boot = siteThemeBootInlineScript({
    storageKey: "as-sandbox:color-mode",
    defaultMode: colorMode,
    toggleSelector: "[data-as-theme-toggle]",
  });
  const darkClass = colorMode === "dark" ? "dark" : "";
  const bootJson = JSON.stringify({
    design: designSystem,
    themeCss: generateTheme(designSystem, {
      banner: "Generated from design/design-system.json — do not edit by hand",
    }),
  }).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="en" class="${darkClass}" data-theme="${colorMode}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Design system · Tokens</title>
    <script>${boot}</script>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body class="min-h-screen bg-paper text-ink antialiased">
    <div class="as-ds-topbar">
      <div class="as-ds-topbar__meta">
        ${renderDesignBreadcrumbHtml(crumbs)}
        <span class="as-ds-save" data-as-ds-save-status data-state="idle">Ready</span>
      </div>
      <button type="button" data-as-theme-toggle class="as-ds-theme-btn" aria-label="Toggle color mode">${moonOutlineSvg("size-4")}</button>
    </div>
    ${body}
    <script type="application/json" id="as-design-system-boot">${bootJson}</script>
    <script src="/design-system-edit.js" defer></script>
    <script>${DESIGN_CANVAS_NAV_SCRIPT}</script>
  </body>
</html>`;
}

export function renderDesignApiPayload(
  id: string,
  mode: SandboxMode,
  draft: SandboxInspectorDraft,
): { html: string } | null {
  return renderSandboxApiPayload(designSandboxRegistry, id, mode, draft);
}
