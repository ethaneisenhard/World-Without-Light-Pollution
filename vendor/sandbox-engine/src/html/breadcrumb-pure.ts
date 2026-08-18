/**
 * Design canvas breadcrumb — Home → section → leaf.
 * Pure HTML + crumb builders; clicks use data-as-design-nav / data-as-design-site.
 */

import { escapeHtml } from "./escape-pure.js";

export type DesignBreadcrumbCrumb = {
  label: string;
  /** Omit on the current (last) crumb. */
  href?: string;
  /** Studio Nav file/folder path when known. */
  navPath?: string;
  /** Design site path — Studio can reverse-resolve when navPath missing. */
  sitePath?: string;
};

export type DesignBreadcrumbKind =
  | "home"
  | "components"
  | "system"
  | "component";

const HOME: DesignBreadcrumbCrumb = {
  label: "Design",
  href: "/__as/design",
  navPath: "design",
  sitePath: "/__as/design",
};

const COMPONENTS: DesignBreadcrumbCrumb = {
  label: "Components",
  href: "/__as/design/components",
  navPath: "design/components",
  sitePath: "/__as/design/components",
};

const SYSTEM: DesignBreadcrumbCrumb = {
  label: "Design system",
  href: "/__as/design/system",
  navPath: "design/design-system.json",
  sitePath: "/__as/design/system",
};

/** Build crumb trail for a Design canvas location. */
export function buildDesignBreadcrumbs(
  kind: DesignBreadcrumbKind,
  leaf?: { label: string; href?: string; navPath?: string; sitePath?: string },
): DesignBreadcrumbCrumb[] {
  if (kind === "home") {
    return [{ label: HOME.label }];
  }
  if (kind === "components") {
    return [
      { ...HOME },
      { label: COMPONENTS.label },
    ];
  }
  if (kind === "system") {
    return [
      { ...HOME },
      { label: SYSTEM.label },
    ];
  }
  // component
  const title = leaf?.label?.trim() || "Component";
  return [
    { ...HOME },
    { ...COMPONENTS },
    {
      label: title,
      href: leaf?.href,
      navPath: leaf?.navPath,
      sitePath: leaf?.sitePath,
    },
  ].map((c, i, arr) =>
    i === arr.length - 1
      ? { label: c.label, navPath: c.navPath, sitePath: c.sitePath }
      : c,
  );
}

/** Accessible breadcrumb nav HTML. */
export function renderDesignBreadcrumbHtml(
  crumbs: readonly DesignBreadcrumbCrumb[],
): string {
  if (crumbs.length === 0) return "";
  const items = crumbs
    .map((c, i) => {
      const current = i === crumbs.length - 1 || !c.href;
      const sep =
        i === 0
          ? ""
          : `<span class="as-design-bc__sep" aria-hidden="true">/</span>`;
      if (current) {
        return `${sep}<span class="as-design-bc__item as-design-bc__item--current" aria-current="page">${escapeHtml(c.label)}</span>`;
      }
      const attrs = [
        `class="as-design-bc__item as-design-bc__link"`,
        `href="${escapeHtml(c.href!)}"`,
      ];
      if (c.navPath) {
        attrs.push(`data-as-design-nav="${escapeHtml(c.navPath)}"`);
      }
      if (c.sitePath) {
        attrs.push(`data-as-design-site="${escapeHtml(c.sitePath)}"`);
      }
      return `${sep}<a ${attrs.join(" ")}>${escapeHtml(c.label)}</a>`;
    })
    .join("");

  return `<nav class="as-design-bc" aria-label="Design">${items}</nav>`;
}

/**
 * Click bridge — postMessage Studio so Nav stays linked.
 * Handles `[data-as-design-nav]` and `[data-as-design-site]`.
 */
export const DESIGN_CANVAS_NAV_SCRIPT = `(function(){
  document.addEventListener("click", function(e){
    var t = e.target;
    if (!t || !t.closest) return;
    var a = t.closest("[data-as-design-nav], [data-as-design-site]");
    if (!a) return;
    var path = a.getAttribute("data-as-design-nav");
    var site = a.getAttribute("data-as-design-site");
    var href = a.getAttribute("href");
    if (!path && !site && !href) return;
    e.preventDefault();
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: "as-design-nav/1",
          action: "open",
          path: path || undefined,
          sitePath: site || undefined,
          href: href || undefined
        }, "*");
      } else if (href) {
        window.location.href = href;
      }
    } catch (_) {
      if (href) window.location.href = href;
    }
  });
})();`;
