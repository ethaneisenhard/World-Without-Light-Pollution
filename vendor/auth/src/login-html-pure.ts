import { renderAuthLoginHtml } from "./auth-pages-html-pure.js";

/** Starter login — Tailwind + ideal-stack tokens via `/styles.css`. */
export function renderLoginHtml(opts?: {
  appTitle?: string;
  error?: string | null;
  brandName?: string;
  returnTo?: string | null;
}): string {
  return renderAuthLoginHtml({
    skin: "starter",
    stylesheetHref: "/styles.css",
    brandName: opts?.brandName ?? "Northline",
    appTitle: opts?.appTitle,
    error: opts?.error,
    returnTo: opts?.returnTo,
    showGoogle: false,
  });
}
