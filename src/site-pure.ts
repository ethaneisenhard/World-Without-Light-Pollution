export type SitePageId =
  | "home"
  | "what-is-light-pollution"
  | "lumens"
  | "myths"
  | "impacts"
  | "petition"
  | "maps"
  | "resources"
  | "email-your-county"
  | "about"
  | "contact";

export type SiteNavItem = {
  id: SitePageId;
  label: string;
  path: string;
};

export type SiteBrand = {
  name: string;
  tagline: string;
};

export const SITE_BRAND: SiteBrand = {
  name: "World Without Light Pollution",
  tagline: "Reclaim the night sky.",
};

/** Full page list — route matching, page titles, canonical sitemap. */
export const SITE_NAV: SiteNavItem[] = [
  { id: "home", label: "Home", path: "/" },
  { id: "what-is-light-pollution", label: "Night light", path: "/what-is-light-pollution" },
  { id: "lumens", label: "Lumens", path: "/lumens" },
  { id: "myths", label: "What we hear", path: "/myths" },
  { id: "impacts", label: "Health & wildlife", path: "/impacts" },
  { id: "petition", label: "Petition", path: "/petition" },
  { id: "maps", label: "Maps", path: "/maps" },
  { id: "resources", label: "For your street", path: "/resources" },
  { id: "email-your-county", label: "Email your county", path: "/email-your-county" },
  { id: "about", label: "About", path: "/about" },
  { id: "contact", label: "Contact", path: "/contact" },
];

/** Header nav — keep it short: Night light · Petition · Resources ▾. */
export const SITE_HEADER_NAV: SiteNavItem[] = [
  { id: "what-is-light-pollution", label: "Night light", path: "/what-is-light-pollution" },
  { id: "petition", label: "Petition", path: "/petition" },
];

/** Resources dropdown items. */
export const SITE_RESOURCES_NAV: SiteNavItem[] = [
  { id: "lumens", label: "Lumen education", path: "/lumens" },
  { id: "myths", label: "What we hear", path: "/myths" },
  { id: "impacts", label: "Health & wildlife", path: "/impacts" },
  { id: "maps", label: "Maps", path: "/maps" },
  { id: "resources", label: "For your street", path: "/resources" },
  { id: "email-your-county", label: "Email your county", path: "/email-your-county" },
];

/** Footer link groups. */
export const SITE_FOOTER_GROUPS: { title: string; items: SiteNavItem[] }[] = [
  {
    title: "Learn",
    items: [
      { id: "what-is-light-pollution", label: "Night light", path: "/what-is-light-pollution" },
      { id: "lumens", label: "Lumens", path: "/lumens" },
      { id: "myths", label: "What we hear", path: "/myths" },
      { id: "impacts", label: "Health & wildlife", path: "/impacts" },
    ],
  },
  {
    title: "Your street",
    items: [
      { id: "petition", label: "Petition", path: "/petition" },
      { id: "maps", label: "Maps", path: "/maps" },
      { id: "resources", label: "For your street", path: "/resources" },
      { id: "email-your-county", label: "Email your county", path: "/email-your-county" },
    ],
  },
  {
    title: "With us",
    items: [
      { id: "about", label: "About", path: "/about" },
      { id: "contact", label: "Contact", path: "/contact" },
    ],
  },
];

/** Auth routes stay wired for later. Header does not show Sign in. */
export const SITE_AUTH_NAV = {
  login: { label: "Sign in", path: "/login" },
  account: { label: "Account", path: "/account" },
} as const;

export function matchSitePage(pathname: string): SitePageId | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  const byPath: Record<string, SitePageId> = {
    "/": "home",
    "/about": "about",
    "/contact": "contact",
    "/what-is-light-pollution": "what-is-light-pollution",
    "/lumens": "lumens",
    "/myths": "myths",
    "/impacts": "impacts",
    "/petition": "petition",
    "/maps": "maps",
    "/resources": "resources",
    "/email-your-county": "email-your-county",
  };
  return byPath[path] ?? null;
}

export function pageTitle(page: SitePageId, brand = SITE_BRAND): string {
  if (page === "home") return `${brand.name} — ${brand.tagline}`;
  const item = SITE_NAV.find((n) => n.id === page);
  return `${item?.label ?? page} · ${brand.name}`;
}

export function isActiveNav(item: SiteNavItem, page: SitePageId): boolean {
  return item.id === page;
}
