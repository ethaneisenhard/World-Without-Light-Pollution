export type SitePageId =
  | "home"
  | "what-is-light-pollution"
  | "lumens"
  | "impacts"
  | "petition"
  | "maps"
  | "resources"
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
  name: "World Against Light Pollution",
  tagline: "Reclaim the night sky.",
};

/** Full page list — route matching, page titles, canonical sitemap. */
export const SITE_NAV: SiteNavItem[] = [
  { id: "home", label: "Home", path: "/" },
  { id: "what-is-light-pollution", label: "The Problem", path: "/what-is-light-pollution" },
  { id: "lumens", label: "Lumens", path: "/lumens" },
  { id: "impacts", label: "Impacts", path: "/impacts" },
  { id: "petition", label: "Petition", path: "/petition" },
  { id: "maps", label: "Light pollution maps", path: "/maps" },
  { id: "resources", label: "Advocacy toolkit", path: "/resources" },
  { id: "about", label: "About", path: "/about" },
  { id: "contact", label: "Contact", path: "/contact" },
];

/** Header nav — keep it short: The Problem · Petition · Resources ▾ · Sign in. */
export const SITE_HEADER_NAV: SiteNavItem[] = [
  { id: "what-is-light-pollution", label: "The Problem", path: "/what-is-light-pollution" },
  { id: "petition", label: "Petition", path: "/petition" },
];

/** Resources dropdown items. */
export const SITE_RESOURCES_NAV: SiteNavItem[] = [
  { id: "lumens", label: "Lumen education", path: "/lumens" },
  { id: "impacts", label: "Impacts", path: "/impacts" },
  { id: "maps", label: "Light pollution maps", path: "/maps" },
  { id: "resources", label: "Advocacy toolkit", path: "/resources" },
];

/** Footer link groups. */
export const SITE_FOOTER_GROUPS: { title: string; items: SiteNavItem[] }[] = [
  {
    title: "Learn",
    items: [
      { id: "what-is-light-pollution", label: "The Problem", path: "/what-is-light-pollution" },
      { id: "lumens", label: "Lumens", path: "/lumens" },
      { id: "impacts", label: "Impacts", path: "/impacts" },
    ],
  },
  {
    title: "Take action",
    items: [
      { id: "petition", label: "Petition", path: "/petition" },
      { id: "maps", label: "Light pollution maps", path: "/maps" },
      { id: "resources", label: "Advocacy toolkit", path: "/resources" },
    ],
  },
  {
    title: "Movement",
    items: [
      { id: "about", label: "About", path: "/about" },
      { id: "contact", label: "Contact", path: "/contact" },
    ],
  },
];

/** Auth links (community arrives later — header shows only "Sign in"). */
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
    "/impacts": "impacts",
    "/petition": "petition",
    "/maps": "maps",
    "/resources": "resources",
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
