/**
 * SSR HTML shell for Integrations directory demo (client-mounted remix/ui).
 */

import {
  siteThemeBootInlineScript,
  type AsThemeMode,
} from "@glassbox-studio/studio-core/browser";
import { moonOutlineSvg } from "@glassbox-studio/ui-icons/ssr";

const FONT_HEAD = `
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap" rel="stylesheet" />`;

export function renderIntegrationsDemoPage(
  colorMode: AsThemeMode = "dark",
): string {
  const boot = siteThemeBootInlineScript({
    storageKey: "as-sandbox:color-mode",
    defaultMode: colorMode,
    toggleSelector: "[data-as-theme-toggle]",
  });
  const darkClass = colorMode === "dark" ? "dark" : "";

  return `<!DOCTYPE html>
<html lang="en" class="${darkClass}" data-theme="${colorMode}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Integrations · Studio Starter</title>
    <script>${boot}</script>
    <link rel="stylesheet" href="/styles.css" />
    ${FONT_HEAD}
    <link rel="modulepreload" href="/integrations-client.js" />
  </head>
  <body class="min-h-screen bg-paper text-ink antialiased">
    <div class="as-ds-topbar">
      <div class="as-ds-topbar__meta">
        <nav class="as-design-bc" aria-label="Integrations">
          <a class="as-design-bc__item as-design-bc__link" href="/__as/design">Design</a>
          <span class="as-design-bc__sep" aria-hidden="true">/</span>
          <span class="as-design-bc__item as-design-bc__item--current" aria-current="page">Integrations</span>
        </nav>
      </div>
      <button type="button" data-as-theme-toggle class="as-ds-theme-btn" aria-label="Toggle color mode">${moonOutlineSvg("size-4")}</button>
    </div>
    <div id="root" data-as-mount="integrations-directory"></div>
    <script type="module" src="/integrations-client.js"></script>
  </body>
</html>`;
}
