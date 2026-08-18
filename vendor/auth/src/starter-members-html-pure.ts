import type { AuthUser } from "./types.js";
import {
  renderAuthAccountHtml,
  renderAuthMembersHtml,
} from "./auth-pages-html-pure.js";

/** Starter authenticated pages — Tailwind + ideal-stack tokens. */
export function renderStarterAccountHtml(
  user: AuthUser,
  opts?: {
    brandName?: string;
    colorMode?: "light" | "dark";
    themeBootScript?: string;
    themeToggleHtml?: string;
  },
): string {
  return renderAuthAccountHtml(user, {
    skin: "starter",
    stylesheetHref: "/styles.css",
    brandName: opts?.brandName ?? "Northline",
    colorMode: opts?.colorMode,
    themeBootScript: opts?.themeBootScript,
    themeToggleHtml: opts?.themeToggleHtml,
  });
}

export function renderStarterMembersHtml(
  user: AuthUser,
  opts?: {
    brandName?: string;
    colorMode?: "light" | "dark";
    themeBootScript?: string;
    themeToggleHtml?: string;
  },
): string {
  return renderAuthMembersHtml(user, {
    skin: "starter",
    stylesheetHref: "/styles.css",
    brandName: opts?.brandName ?? "Northline",
    colorMode: opts?.colorMode,
    themeBootScript: opts?.themeBootScript,
    themeToggleHtml: opts?.themeToggleHtml,
  });
}
