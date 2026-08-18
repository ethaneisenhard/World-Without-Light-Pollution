/**
 * Tailwind class tokens for auth chrome.
 * Kept as string literals so Studio + Starter CSS `@source` can scan them.
 *
 * - starter → ideal-stack `@theme` (paper / ink / line / accent)
 * - studio → Studio chrome tokens (surface / on-surface / border-bui / brand)
 *
 * Gate pages (login / signup) follow a centered Clerk-style card; account /
 * members keep a fuller header nav.
 */

export type AuthPageSkin = "starter" | "studio";

export type AuthPageClasses = {
  body: string;
  shell: string;
  nav: string;
  navCorner: string;
  navBrand: string;
  navLink: string;
  main: string;
  card: string;
  brandBlock: string;
  brandMark: string;
  /** Studio Glass Box mark image (replaces initials). */
  brandMarkImg: string;
  brandWord: string;
  eyebrow: string;
  title: string;
  lead: string;
  alert: string;
  label: string;
  input: string;
  fieldStack: string;
  oauthRow: string;
  /** Second oauth-style control under Google (passkey). */
  oauthRowFollow: string;
  oauthBtn: string;
  divider: string;
  dividerLine: string;
  dividerText: string;
  btnPrimary: string;
  btnSecondary: string;
  link: string;
  meta: string;
  cardFooter: string;
  /** Passkey status line under OAuth (padded so errors clear the card edge). */
  passkeyStatus: string;
  secureBar: string;
  dl: string;
  dt: string;
  dd: string;
  actions: string;
  list: string;
  code: string;
};

/** Ideal-stack / Studio Starter — matches site contact form + button primitives. */
export const AUTH_CLASSES_STARTER: AuthPageClasses = {
  body: "min-h-dvh bg-paper text-ink antialiased",
  shell: "relative flex min-h-dvh flex-col",
  nav: "flex items-center gap-4 border-b border-line px-4 py-4 md:px-8",
  navCorner:
    "absolute right-4 top-4 z-10 flex items-center gap-2 md:right-6 md:top-5",
  navBrand: "font-display text-xl tracking-tight text-ink md:text-2xl",
  navLink:
    "rounded-md px-2 py-1 text-sm font-medium text-ink-soft transition hover:text-ink",
  main: "flex flex-1 flex-col items-center justify-center px-4 py-16 md:px-8",
  card: "w-full max-w-[400px] overflow-hidden rounded-2xl border border-line bg-paper-raised shadow-sm",
  brandBlock: "flex flex-col items-center gap-3 px-8 pt-8 text-center",
  brandMark:
    "inline-flex size-10 items-center justify-center rounded-xl bg-accent text-sm font-bold tracking-tight text-inverse-fg",
  brandMarkImg: "size-10 object-contain",
  brandWord: "text-base font-semibold tracking-tight text-ink",
  eyebrow:
    "mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft",
  title:
    "px-8 text-center font-display text-[22px] font-semibold tracking-tight text-ink",
  lead: "mt-2 px-8 text-center text-sm leading-relaxed text-ink-soft",
  alert:
    "mx-8 mt-4 rounded-xl border border-line bg-sand px-4 py-3 text-sm text-ink",
  label: "block text-sm font-medium text-ink",
  input:
    "mt-1.5 w-full rounded-lg border border-line bg-paper px-3.5 py-2.5 text-[16px] text-ink outline-none transition focus:border-accent",
  fieldStack: "mt-6 flex flex-col gap-4 px-8",
  oauthRow: "mt-6 flex gap-2 px-8",
  oauthRowFollow: "mt-2 flex gap-2 px-8",
  oauthBtn:
    "inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-paper px-3 py-2.5 text-sm font-medium text-ink transition hover:border-ink active:scale-[0.98]",
  divider: "mt-5 flex items-center gap-3 px-8",
  dividerLine: "h-px flex-1 bg-line",
  dividerText: "shrink-0 text-xs font-medium uppercase tracking-wide text-ink-soft",
  btnPrimary:
    "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-inverse-fg transition hover:bg-accent-deep active:scale-[0.98]",
  btnSecondary:
    "inline-flex w-full items-center justify-center rounded-lg border border-line bg-paper-raised px-4 py-2.5 text-sm font-medium text-ink transition hover:border-ink active:scale-[0.98]",
  link: "text-sm font-medium text-accent underline-offset-4 hover:underline",
  meta: "mt-4 px-8 text-center text-sm text-ink-soft",
  cardFooter:
    "mt-6 border-t border-line px-8 py-5 text-center text-sm text-ink-soft",
  passkeyStatus:
    "mt-2 text-center text-sm leading-snug text-ink-soft",
  secureBar:
    "border-t border-line bg-sand px-8 py-3 text-center text-xs text-ink-soft",
  dl: "mt-6 grid grid-cols-[7rem_1fr] gap-x-4 gap-y-3 px-8 text-sm",
  dt: "text-ink-soft",
  dd: "font-medium text-ink",
  actions: "mt-8 flex flex-wrap items-center gap-3 px-8 pb-8",
  list: "mt-4 list-disc space-y-2 px-8 pl-5 text-sm leading-relaxed text-ink-soft",
  code: "rounded-md border border-line bg-sand px-1.5 py-0.5 font-mono text-xs text-ink",
};

/**
 * Studio gate background — BrowserUI static World-Map (not spinning globe).
 * Served from `apps/studio/public/assets/svgs/World-Map.svg`.
 * Keep path literal in `AUTH_CLASSES_STUDIO.body` so Tailwind `@source` scans it.
 */
export const AUTH_STUDIO_WORLD_MAP_SRC = "/assets/svgs/World-Map.svg";

/** Studio shell chrome — surface / brand tokens from studio-ui-classes vocabulary. */
export const AUTH_CLASSES_STUDIO: AuthPageClasses = {
  // World-Map bg + body scroll so signup fits one screen or scrolls on mobile.
  // URL must stay a full string literal for Tailwind content scan.
  body: "min-h-dvh overflow-y-auto bg-canvas bg-[url('/assets/svgs/World-Map.svg')] bg-center bg-no-repeat bg-contain text-on-surface antialiased",
  shell: "relative flex min-h-dvh flex-col",
  nav: "flex items-center gap-4 border-b border-border-bui bg-surface/80 px-4 py-3 backdrop-blur-sm md:px-6",
  navCorner:
    "absolute right-4 top-4 z-10 flex items-center gap-2 md:right-6 md:top-5",
  navBrand: "text-base font-semibold tracking-tight text-on-surface",
  navLink:
    "rounded-md px-2 py-1 text-sm font-medium text-on-surface-muted transition hover:text-on-surface",
  // Card `my-auto` centers when short; body `overflow-y-auto` scrolls when tall (mobile).
  main: "flex flex-1 flex-col items-center px-4 py-4 md:px-6 md:py-6",
  card: "my-auto w-full max-w-[380px] overflow-hidden rounded-2xl border border-border-bui bg-surface",
  brandBlock: "flex flex-col items-center justify-center px-5 pt-5 pb-0 text-center",
  brandMark:
    "inline-flex size-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold tracking-tight text-[color:var(--as-color-fg-onAccent)]",
  /** Scanned so Tailwind emits size-[100px] for auth mark host. */
  brandMarkImg: "size-[100px] aspect-square object-contain",
  brandWord: "text-base font-semibold tracking-tight text-on-surface",
  eyebrow:
    "mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-on-surface-muted",
  title:
    "mt-3 px-5 text-center text-[22px] font-semibold tracking-tight text-on-surface",
  // Switch link under title (Welcome Back → Sign up) — not a fat footer band.
  lead: "mt-1.5 px-5 text-center text-sm leading-snug text-on-surface-muted",
  alert:
    "mx-5 mt-3 rounded-lg border border-border-bui bg-surface-muted px-3 py-2 text-sm text-on-surface",
  label: "block text-sm font-medium text-on-surface",
  input:
    "mt-1 w-full rounded-lg border border-border-bui bg-canvas px-3 py-2 text-[16px] text-on-surface outline-none transition focus:border-brand-600",
  fieldStack: "mt-4 flex flex-col gap-2.5 px-5",
  oauthRow: "flex gap-2",
  oauthRowFollow: "mt-2 flex gap-2 px-5",
  oauthBtn:
    "inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border-bui bg-canvas px-3 py-2 text-sm font-medium text-on-surface transition hover:bg-surface-muted active:scale-[0.98]",
  divider: "mt-3 flex items-center gap-3 px-5",
  dividerLine: "h-px flex-1 bg-border-bui",
  dividerText:
    "shrink-0 text-[11px] font-medium uppercase tracking-wide text-on-surface-muted",
  btnPrimary:
    "inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-[color:var(--as-color-fg-onAccent)] transition hover:opacity-90 active:scale-[0.98]",
  btnSecondary:
    "inline-flex w-full items-center justify-center rounded-lg border border-border-bui bg-surface px-4 py-2 text-sm font-medium text-on-surface transition hover:bg-surface-muted active:scale-[0.98]",
  link: "font-medium text-on-surface underline-offset-4 hover:underline",
  meta: "mt-2 px-5 text-center text-sm text-on-surface-muted",
  cardFooter:
    "mt-3 border-t border-border-bui px-5 py-3 text-center text-sm text-on-surface-muted",
  /** Inside oauth stack — parent owns px/pb so errors clear the card bottom. */
  passkeyStatus: "mt-2 text-center text-sm leading-snug text-on-surface-muted",
  secureBar:
    "border-t border-border-bui bg-canvas px-5 py-2 text-center text-xs text-on-surface-muted",
  dl: "mt-4 grid grid-cols-[7rem_1fr] gap-x-4 gap-y-2 px-5 text-sm",
  dt: "text-on-surface-muted",
  dd: "font-medium text-on-surface",
  actions: "mt-6 flex flex-wrap items-center gap-3 px-5 pb-5",
  list: "mt-3 list-disc space-y-1.5 px-5 pl-5 text-sm leading-relaxed text-on-surface-muted",
  code: "rounded border border-border-bui bg-surface-muted px-1.5 py-0.5 font-mono text-xs text-on-surface",
};

export function authPageClasses(skin: AuthPageSkin): AuthPageClasses {
  return skin === "studio" ? AUTH_CLASSES_STUDIO : AUTH_CLASSES_STARTER;
}
