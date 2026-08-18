export type SitePageId =
  | "home"
  | "what-is-light-pollution"
  | "lumens"
  | "impacts"
  | "petition"
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

export const SITE_NAV: SiteNavItem[] = [
  { id: "home", label: "Home", path: "/" },
  { id: "what-is-light-pollution", label: "The Problem", path: "/what-is-light-pollution" },
  { id: "lumens", label: "Lumens", path: "/lumens" },
  { id: "impacts", label: "Impacts", path: "/impacts" },
  { id: "petition", label: "Petition", path: "/petition" },
  { id: "resources", label: "Resources", path: "/resources" },
  { id: "about", label: "About", path: "/about" },
  { id: "contact", label: "Contact", path: "/contact" },
];

/** Auth-gated demo (not a content page id — link only). */
export const SITE_AUTH_NAV = {
  members: { label: "Members", path: "/members" },
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
