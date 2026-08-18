import { arrowRightOutlineSvg, fingerPrintOutlineSvg } from "@glassbox-studio/ui-icons/ssr";
import { renderLogo } from "@glassbox-studio/components";
import { AUTH_ROUTES } from "./auth-routes-pure.js";
import {
  GLASS_BOX_COMPUTER_COMPANY_NAME,
  GLASS_BOX_STUDIO_PRODUCT_NAME,
} from "./brand-names-pure.js";
import {
  authPageClasses,
  type AuthPageClasses,
  type AuthPageSkin,
} from "./auth-pages-classes.js";
import {
  studioAuthColorModeClientScript,
  studioAuthColorModeControlsHtml,
} from "./auth-studio-color-mode-pure.js";
import type { AuthUser } from "./types.js";

/** Studio auth: Glass Box splash mark + mount scripts. */
export const AUTH_GLASS_BOX_MOUNT_SCRIPT = "/glass-box-splash/mount.js";
export const AUTH_GLASS_BOX_MARK_SCRIPT = "/auth-glass-box-mark.js";

function studioBrandDefaults(skin: AuthPageSkin): {
  brand: string;
  company: string;
} {
  if (skin !== "studio") {
    return { brand: "Northline", company: "Northline" };
  }
  return {
    brand: GLASS_BOX_STUDIO_PRODUCT_NAME,
    company: GLASS_BOX_COMPUTER_COMPANY_NAME,
  };
}

export type AuthPageRenderOpts = {
  skin?: AuthPageSkin;
  /** Stylesheet href — Starter + Studio both serve `/styles.css`. */
  stylesheetHref?: string;
  /** Product name (login title, mark). Studio default: Glass Box Studio. */
  brandName?: string;
  /** Company on “Secured by”. Studio default: Glass Box Computer. */
  companyName?: string;
  appTitle?: string;
  error?: string | null;
  showGoogle?: boolean;
  /** Show “Forgot password?” on login when reset flow is wired. */
  showForgotPassword?: boolean;
  /** Safe same-origin path to resume after login (credentials + Google). */
  returnTo?: string | null;
  /** Reset form: opaque token from email link. */
  resetToken?: string | null;
  /** Forgot/reset success banner key. */
  notice?: string | null;
  /** Kent passkey client (`/auth-passkey.js`). */
  passkeyScriptHref?: string | null;
  /** Account: registered passkeys (id + device label). */
  passkeys?: { id: string; label: string }[] | null;
  /** Initial color mode (boot script may override from storage/URL). */
  colorMode?: "light" | "dark";
  /** Inline FOUC theme boot JS body (from `siteThemeBootInlineScript`). */
  themeBootScript?: string | null;
  /** Pre-rendered theme toggle control HTML (Heroicons / Studio segment). */
  themeToggleHtml?: string | null;
  /** Studio: external FOUC boot (`/color-mode-boot.js`) — default when skin=studio. */
  colorModeBootHref?: string | null;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapDocument(input: {
  title: string;
  stylesheetHref: string;
  bodyClass: string;
  shellClass: string;
  navHtml: string;
  mainHtml: string;
  dataAuth: string;
  passkeyScriptHref?: string | null;
  returnTo?: string;
  colorMode?: "light" | "dark";
  themeBootScript?: string | null;
  themeToggleHtml?: string | null;
  /** Studio shell color-mode (system default + Light/Dark/System toggles). */
  studioColorMode?: boolean;
  colorModeBootHref?: string | null;
  colorModeClientScript?: string | null;
  /** Studio: animated Glass Box splash mark on brand header. */
  glassBoxMarkScripts?: boolean;
}): string {
  const passkeyScript = input.passkeyScriptHref
    ? `<script type="module" src="${escapeHtml(input.passkeyScriptHref)}"></script>`
    : "";
  const glassBoxScripts = input.glassBoxMarkScripts
    ? `<script src="${escapeHtml(AUTH_GLASS_BOX_MOUNT_SCRIPT)}" data-as-glass-box-splash="1"></script>
    <script src="${escapeHtml(AUTH_GLASS_BOX_MARK_SCRIPT)}"></script>`
    : "";
  const returnToAttr = input.returnTo
    ? ` data-as-return-to="${escapeHtml(input.returnTo)}"`
    : "";
  const colorClient =
    input.studioColorMode && input.colorModeClientScript
      ? `<script>${input.colorModeClientScript}</script>`
      : "";

  if (input.studioColorMode) {
    const bootHref = escapeHtml(
      input.colorModeBootHref?.trim() || "/color-mode-boot.js",
    );
    return `<!DOCTYPE html>
<html lang="en" data-color-mode="system">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.title)}</title>
    <link rel="icon" href="/icons/favicon.ico" sizes="any" />
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
    <script src="${bootHref}"></script>
    <link rel="stylesheet" href="${escapeHtml(input.stylesheetHref)}" />
  </head>
  <body class="${input.bodyClass}" data-as-auth="${escapeHtml(input.dataAuth)}"${returnToAttr}>
    <div class="${input.shellClass}">
      ${input.navHtml}
      ${input.mainHtml}
    </div>
    ${glassBoxScripts}
    ${passkeyScript}
    ${colorClient}
  </body>
</html>`;
  }

  const mode = input.colorMode === "dark" ? "dark" : "light";
  const darkClass = mode === "dark" ? "dark" : "";
  const boot = input.themeBootScript
    ? `<script>${input.themeBootScript}</script>`
    : "";
  return `<!DOCTYPE html>
<html lang="en" class="${darkClass}" data-theme="${mode}" style="color-scheme:${mode}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.title)}</title>
    <link rel="icon" href="/icons/favicon.ico" sizes="any" />
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
    ${boot}
    <link rel="stylesheet" href="${escapeHtml(input.stylesheetHref)}" />
  </head>
  <body class="${input.bodyClass}" data-as-auth="${escapeHtml(input.dataAuth)}"${returnToAttr}>
    <div class="${input.shellClass}">
      ${input.navHtml}
      ${input.mainHtml}
    </div>
    ${passkeyScript}
  </body>
</html>`;
}

function themeFields(
  opts: AuthPageRenderOpts,
  skin: AuthPageSkin,
): {
  colorMode?: "light" | "dark";
  themeBootScript?: string | null;
  themeToggleHtml?: string | null;
  studioColorMode?: boolean;
  colorModeBootHref?: string | null;
  colorModeClientScript?: string | null;
  glassBoxMarkScripts?: boolean;
} {
  if (skin === "studio") {
    return {
      studioColorMode: true,
      colorModeBootHref: opts.colorModeBootHref ?? "/color-mode-boot.js",
      themeToggleHtml: opts.themeToggleHtml ?? studioAuthColorModeControlsHtml(),
      colorModeClientScript: studioAuthColorModeClientScript(),
      glassBoxMarkScripts: true,
    };
  }
  return {
    colorMode: opts.colorMode,
    themeBootScript: opts.themeBootScript,
    themeToggleHtml: opts.themeToggleHtml,
  };
}

function navHtml(
  c: AuthPageClasses,
  brand: string,
  links: { href: string; label: string }[],
  themeToggleHtml?: string | null,
): string {
  const linkHtml = links
    .map(
      (l) =>
        `<a href="${escapeHtml(l.href)}" class="${c.navLink}">${escapeHtml(l.label)}</a>`,
    )
    .join("");
  const toggle = themeToggleHtml?.trim()
    ? `<span class="ml-1 shrink-0">${themeToggleHtml}</span>`
    : "";
  return `<header class="${c.nav}" data-as-component="auth-nav">
  <a href="/" class="${c.navBrand}">${escapeHtml(brand)}</a>
  <nav class="ml-auto flex flex-wrap items-center gap-2" aria-label="Account">
    ${linkHtml}
    ${toggle}
  </nav>
</header>`;
}

/** Corner theme toggle only — Clerk-style gate pages have no top chrome bar. */
function gateChromeHtml(
  c: AuthPageClasses,
  themeToggleHtml?: string | null,
): string {
  const toggle = themeToggleHtml?.trim() || "";
  if (!toggle) return "";
  return `<div class="${c.navCorner}" data-as-component="auth-gate-chrome">${toggle}</div>`;
}

function brandInitials(brand: string): string {
  const parts = brand.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return brand.slice(0, 2).toUpperCase() || "AS";
}

function brandHeaderHtml(
  c: AuthPageClasses,
  brand: string,
  skin: AuthPageSkin = "starter",
): string {
  if (skin === "studio") {
    // Mark only — title sits under it (no duplicate wordmark).
    const logo = renderLogo({
      props: {
        size: "xl",
        layout: "stack",
        markVariant: "glass-box-splash",
        instanceId: "auth-brand",
        className: "text-on-surface",
      },
      slots: { wordmark: "" },
    });
    return `<div class="${c.brandBlock}" data-as-component="auth-brand">${logo}</div>`;
  }
  const mark = `<span class="${c.brandMark}" aria-hidden="true">${escapeHtml(brandInitials(brand))}</span>`;
  return `<div class="${c.brandBlock}" data-as-component="auth-brand">
  ${mark}
  <span class="${c.brandWord}">${escapeHtml(brand)}</span>
</div>`;
}

function orDividerHtml(c: AuthPageClasses): string {
  return `<div class="${c.divider}" role="separator" aria-label="or">
  <span class="${c.dividerLine}"></span>
  <span class="${c.dividerText}">or</span>
  <span class="${c.dividerLine}"></span>
</div>`;
}

/** Google “G” mark — brand logo, not chrome icon catalog. */
function googleMarkSvg(): string {
  return `<svg class="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`;
}

function googleOauthHtml(
  c: AuthPageClasses,
  returnTo: string,
  show: boolean,
): string {
  if (!show) return "";
  return `<div class="${c.oauthRow}">
  <a class="${c.oauthBtn}" href="${AUTH_ROUTES.googleLogin}?returnTo=${encodeURIComponent(returnTo)}">
    ${googleMarkSvg()}
    <span>Google</span>
  </a>
</div>`;
}

function passkeyOauthHtml(c: AuthPageClasses, show: boolean): string {
  if (!show) return "";
  const rowClass = c.oauthRowFollow;
  return `<div class="${rowClass}">
  <button type="button" class="${c.oauthBtn}" data-as-passkey-login>
    ${fingerPrintOutlineSvg("size-4 shrink-0")}
    <span>Passkey</span>
  </button>
</div>
<p class="${c.passkeyStatus} px-8 pb-6" data-as-passkey-status hidden></p>`;
}

/** Studio gate: Google + Passkey share one row (tighter, like ref social strip). */
function studioOauthRowHtml(
  c: AuthPageClasses,
  returnTo: string,
  showGoogle: boolean,
  showPasskey: boolean,
): string {
  const parts: string[] = [];
  if (showGoogle) {
    parts.push(`<a class="${c.oauthBtn}" href="${AUTH_ROUTES.googleLogin}?returnTo=${encodeURIComponent(returnTo)}">
    ${googleMarkSvg()}
    <span>Google</span>
  </a>`);
  }
  if (showPasskey) {
    parts.push(`<button type="button" class="${c.oauthBtn}" data-as-passkey-login>
    ${fingerPrintOutlineSvg("size-4 shrink-0")}
    <span>Passkey</span>
  </button>`);
  }
  if (!parts.length) return "";
  const status = showPasskey
    ? `\n  <p class="${c.passkeyStatus}" data-as-passkey-status hidden></p>`
    : "";
  // One padded stack: buttons + status share bottom inset (errors no longer kiss the card edge).
  return `<div class="mt-3 px-5 pb-5">
  <div class="${c.oauthRow}">
  ${parts.join("\n  ")}
  </div>${status}
</div>`;
}

function continueBtnHtml(c: AuthPageClasses, label: string): string {
  return `<button type="submit" class="${c.btnPrimary}">
  <span>${escapeHtml(label)}</span>
  ${arrowRightOutlineSvg("size-4 shrink-0")}
</button>`;
}

function secureBarHtml(c: AuthPageClasses, brand: string): string {
  return `<p class="${c.secureBar}">Secured by <strong class="font-semibold">${escapeHtml(brand)}</strong></p>`;
}

export function renderAuthLoginHtml(opts: AuthPageRenderOpts = {}): string {
  const skin = opts.skin ?? "starter";
  const theme = themeFields(opts, skin);
  const c = authPageClasses(skin);
  const defaults = studioBrandDefaults(skin);
  const brand = opts.brandName ?? defaults.brand;
  const company = opts.companyName ?? defaults.company;
  const title = opts.appTitle ?? `Sign in · ${brand}`;
  // `error=auth` = soft redirect from a gated route — page title/lead already say sign in; no banner.
  const err =
    opts.error === "invalid"
      ? `<p class="${c.alert}" role="alert">Invalid email or password.</p>`
      : opts.error === "google"
        ? `<p class="${c.alert}" role="alert">Google sign-in failed. Try again or use email.</p>`
        : "";
  const notice =
    opts.notice === "reset"
      ? `<p class="${c.meta}" role="status">Password updated. Sign in with your new password.</p>`
      : "";
  const returnToRaw = (opts.returnTo ?? "").trim();
  const returnToFallback = skin === "studio" ? "/" : "/app";
  const returnTo =
    returnToRaw.startsWith("/") && !returnToRaw.startsWith("//")
      ? returnToRaw
      : returnToFallback;
  const returnToField = `<input type="hidden" name="returnTo" value="${escapeHtml(returnTo)}" />`;
  const showGoogle = opts.showGoogle === true;
  const showPasskey = Boolean(opts.passkeyScriptHref);
  const forgot =
    opts.showForgotPassword === true
      ? `<p class="mt-1.5 text-right text-sm"><a href="${AUTH_ROUTES.forgotPassword}" class="${c.link}">Forgot password?</a></p>`
      : "";

  let main: string;
  if (skin === "studio") {
    // Tight gate: mark → title → switch → form → or → socials (no duplicate brand / lead / footer band).
    const oauth = studioOauthRowHtml(c, returnTo, showGoogle, showPasskey);
    const afterForm = oauth
      ? `${orDividerHtml(c)}
    ${oauth}`
      : `<div class="pb-5"></div>`;
    main = `<main class="${c.main}" data-as-component="login">
  <section class="${c.card}">
    ${brandHeaderHtml(c, brand, skin)}
    <h1 class="${c.title}">Welcome back</h1>
    <p class="${c.lead}">Don't have an account? <a href="${AUTH_ROUTES.signup}?returnTo=${encodeURIComponent(returnTo)}" class="${c.link}">Sign up</a></p>
    ${err}
    ${notice}
    <form class="${c.fieldStack}" method="post" action="${AUTH_ROUTES.credentialsLogin}" data-as-passkey-form>
      ${returnToField}
      <div>
        <label class="${c.label}" for="as-auth-login">Email address</label>
        <input id="as-auth-login" class="${c.input}" name="login" autocomplete="username webauthn" placeholder="email address" required />
      </div>
      <div>
        <label class="${c.label}" for="as-auth-password">Password</label>
        <input id="as-auth-password" class="${c.input}" name="password" type="password" autocomplete="current-password" placeholder="Password" required />
        ${forgot}
      </div>
      ${continueBtnHtml(c, "Sign in")}
    </form>
    ${afterForm}
  </section>
</main>`;
  } else {
    const google = googleOauthHtml(c, returnTo, showGoogle);
    const passkey = passkeyOauthHtml(c, showPasskey);
    const passkeyBlock = passkey
      ? showGoogle
        ? passkey
        : passkey.replace(c.oauthRowFollow, c.oauthRow)
      : "";
    const oauthBlock =
      google || passkeyBlock
        ? `${google}${passkeyBlock ? `\n    ${passkeyBlock}` : ""}
    ${orDividerHtml(c)}`
        : "";
    main = `<main class="${c.main}" data-as-component="login">
  <section class="${c.card}">
    ${brandHeaderHtml(c, brand, skin)}
    <h1 class="${c.title}">Sign in to ${escapeHtml(brand)}</h1>
    <p class="${c.lead}">Welcome back! Please sign in to continue</p>
    ${err}
    ${notice}
    ${oauthBlock}
    <form class="${c.fieldStack}" method="post" action="${AUTH_ROUTES.credentialsLogin}" data-as-passkey-form>
      ${returnToField}
      <div>
        <label class="${c.label}" for="as-auth-login">Email address</label>
        <input id="as-auth-login" class="${c.input}" name="login" autocomplete="username webauthn" placeholder="Enter your email address" required />
      </div>
      <div>
        <label class="${c.label}" for="as-auth-password">Password</label>
        <input id="as-auth-password" class="${c.input}" name="password" type="password" autocomplete="current-password" placeholder="Enter your password" required />
        ${forgot}
      </div>
      ${continueBtnHtml(c, "Continue")}
    </form>
    <p class="${c.cardFooter}">Don't have an account? <a href="${AUTH_ROUTES.signup}?returnTo=${encodeURIComponent(returnTo)}" class="${c.link}">Sign up</a></p>
    ${secureBarHtml(c, company)}
  </section>
</main>`;
  }

  return wrapDocument({
    title,
    stylesheetHref: opts.stylesheetHref ?? "/styles.css",
    bodyClass: c.body,
    shellClass: c.shell,
    navHtml: gateChromeHtml(c, theme.themeToggleHtml),
    mainHtml: main,
    dataAuth: "login",
    passkeyScriptHref: opts.passkeyScriptHref,
    returnTo,
    ...theme,
  });
}

export function renderAuthSignupHtml(opts: AuthPageRenderOpts = {}): string {
  const skin = opts.skin ?? "starter";
  const theme = themeFields(opts, skin);
  const c = authPageClasses(skin);
  const defaults = studioBrandDefaults(skin);
  const brand = opts.brandName ?? defaults.brand;
  const company = opts.companyName ?? defaults.company;
  const title = opts.appTitle ?? `Sign up · ${brand}`;
  const err =
    opts.error === "invalid"
      ? `<p class="${c.alert}" role="alert">Enter a valid email and password (8+ characters).</p>`
      : opts.error === "taken"
        ? `<p class="${c.alert}" role="alert">That email is already registered. Sign in instead.</p>`
        : "";
  const returnToRaw = (opts.returnTo ?? "").trim();
  const returnToFallback = skin === "studio" ? "/" : "/app";
  const returnTo =
    returnToRaw.startsWith("/") && !returnToRaw.startsWith("//")
      ? returnToRaw
      : returnToFallback;
  const returnToField = `<input type="hidden" name="returnTo" value="${escapeHtml(returnTo)}" />`;
  const showGoogle = opts.showGoogle === true;

  let main: string;
  if (skin === "studio") {
    const oauth = studioOauthRowHtml(c, returnTo, showGoogle, false);
    const afterForm = oauth
      ? `${orDividerHtml(c)}
    ${oauth}`
      : `<div class="pb-5"></div>`;
    main = `<main class="${c.main}" data-as-component="signup">
  <section class="${c.card}">
    ${brandHeaderHtml(c, brand, skin)}
    <h1 class="${c.title}">Create account</h1>
    <p class="${c.lead}">Already have an account? <a href="${AUTH_ROUTES.login}?returnTo=${encodeURIComponent(returnTo)}" class="${c.link}">Sign in</a></p>
    ${err}
    <form class="${c.fieldStack}" method="post" action="${AUTH_ROUTES.credentialsSignup}">
      ${returnToField}
      <div>
        <label class="${c.label}" for="as-auth-name">Name</label>
        <input id="as-auth-name" class="${c.input}" name="name" autocomplete="name" placeholder="Your name" />
      </div>
      <div>
        <label class="${c.label}" for="as-auth-email">Email address</label>
        <input id="as-auth-email" class="${c.input}" name="email" type="email" autocomplete="email" placeholder="email address" required />
      </div>
      <div>
        <label class="${c.label}" for="as-auth-password-new">Password</label>
        <input id="as-auth-password-new" class="${c.input}" name="password" type="password" autocomplete="new-password" placeholder="At least 8 characters" minlength="8" required />
      </div>
      ${continueBtnHtml(c, "Create account")}
    </form>
    ${afterForm}
  </section>
</main>`;
  } else {
    const google = googleOauthHtml(c, returnTo, showGoogle);
    const oauthBlock = google
      ? `${google}
    ${orDividerHtml(c)}`
      : "";
    main = `<main class="${c.main}" data-as-component="signup">
  <section class="${c.card}">
    ${brandHeaderHtml(c, brand, skin)}
    <h1 class="${c.title}">Create your ${escapeHtml(brand)} account</h1>
    <p class="${c.lead}">Welcome! Please fill in the details to get started</p>
    ${err}
    ${oauthBlock}
    <form class="${c.fieldStack}" method="post" action="${AUTH_ROUTES.credentialsSignup}">
      ${returnToField}
      <div>
        <label class="${c.label}" for="as-auth-name">Name</label>
        <input id="as-auth-name" class="${c.input}" name="name" autocomplete="name" placeholder="Your name" />
      </div>
      <div>
        <label class="${c.label}" for="as-auth-email">Email address</label>
        <input id="as-auth-email" class="${c.input}" name="email" type="email" autocomplete="email" placeholder="Enter your email address" required />
      </div>
      <div>
        <label class="${c.label}" for="as-auth-password-new">Password</label>
        <input id="as-auth-password-new" class="${c.input}" name="password" type="password" autocomplete="new-password" placeholder="At least 8 characters" minlength="8" required />
      </div>
      ${continueBtnHtml(c, "Continue")}
    </form>
    <p class="${c.cardFooter}">Already have an account? <a href="${AUTH_ROUTES.login}?returnTo=${encodeURIComponent(returnTo)}" class="${c.link}">Sign in</a></p>
    ${secureBarHtml(c, company)}
  </section>
</main>`;
  }

  return wrapDocument({
    title,
    stylesheetHref: opts.stylesheetHref ?? "/styles.css",
    bodyClass: c.body,
    shellClass: c.shell,
    navHtml: gateChromeHtml(c, theme.themeToggleHtml),
    mainHtml: main,
    dataAuth: "signup",
    returnTo,
    ...theme,
  });
}

export function renderAuthForgotPasswordHtml(opts: AuthPageRenderOpts = {}): string {
  const skin = opts.skin ?? "starter";
  const theme = themeFields(opts, skin);
  const c = authPageClasses(skin);
  const defaults = studioBrandDefaults(skin);
  const brand = opts.brandName ?? defaults.brand;
  const company = opts.companyName ?? defaults.company;
  const title = opts.appTitle ?? `Reset password · ${brand}`;
  const sent = opts.notice === "sent";
  const body = sent
    ? `<p class="${c.lead}" role="status">If an account exists for that email, we sent a reset link. Check your inbox.</p>
    <p class="${c.cardFooter}"><a href="${AUTH_ROUTES.login}" class="${c.link}">Back to sign in</a></p>`
    : `<p class="${c.lead}">Enter your account email and we’ll send a reset link.</p>
    <form class="${c.fieldStack}" method="post" action="${AUTH_ROUTES.forgotPassword}">
      <div>
        <label class="${c.label}" for="as-auth-forgot-email">Email address</label>
        <input id="as-auth-forgot-email" class="${c.input}" name="email" type="email" autocomplete="email" placeholder="Enter your email address" required />
      </div>
      ${continueBtnHtml(c, "Send reset link")}
    </form>
    <p class="${c.cardFooter}"><a href="${AUTH_ROUTES.login}" class="${c.link}">Back to sign in</a></p>`;

  const main = `<main class="${c.main}" data-as-component="forgot-password">
  <section class="${c.card}">
    ${brandHeaderHtml(c, brand, skin)}
    <h1 class="${c.title}">Forgot password</h1>
    ${body}
    ${secureBarHtml(c, company)}
  </section>
</main>`;

  return wrapDocument({
    title,
    stylesheetHref: opts.stylesheetHref ?? "/styles.css",
    bodyClass: c.body,
    shellClass: c.shell,
    navHtml: gateChromeHtml(c, theme.themeToggleHtml),
    mainHtml: main,
    dataAuth: "forgot-password",
    ...theme,
  });
}

export function renderAuthResetPasswordHtml(opts: AuthPageRenderOpts = {}): string {
  const skin = opts.skin ?? "starter";
  const theme = themeFields(opts, skin);
  const c = authPageClasses(skin);
  const defaults = studioBrandDefaults(skin);
  const brand = opts.brandName ?? defaults.brand;
  const company = opts.companyName ?? defaults.company;
  const title = opts.appTitle ?? `Choose a new password · ${brand}`;
  const token = (opts.resetToken ?? "").trim();
  const err =
    opts.error === "invalid"
      ? `<p class="${c.alert}" role="alert">Enter a password with at least 8 characters.</p>`
      : opts.error === "token"
        ? `<p class="${c.alert}" role="alert">This reset link is invalid or expired. Request a new one.</p>`
        : "";

  const form = token
    ? `${err}
    <form class="${c.fieldStack}" method="post" action="${AUTH_ROUTES.resetPassword}">
      <input type="hidden" name="token" value="${escapeHtml(token)}" />
      <div>
        <label class="${c.label}" for="as-auth-reset-password">New password</label>
        <input id="as-auth-reset-password" class="${c.input}" name="password" type="password" autocomplete="new-password" placeholder="At least 8 characters" minlength="8" required />
      </div>
      ${continueBtnHtml(c, "Update password")}
    </form>
    <p class="${c.cardFooter}"><a href="${AUTH_ROUTES.forgotPassword}" class="${c.link}">Request a new link</a></p>`
    : `<p class="${c.alert}" role="alert">Missing reset token. Use the link from your email.</p>
    <p class="${c.cardFooter}"><a href="${AUTH_ROUTES.forgotPassword}" class="${c.link}">Request a reset link</a></p>`;

  const main = `<main class="${c.main}" data-as-component="reset-password">
  <section class="${c.card}">
    ${brandHeaderHtml(c, brand, skin)}
    <h1 class="${c.title}">Choose a new password</h1>
    <p class="${c.lead}">Pick a password with at least 8 characters.</p>
    ${form}
    ${secureBarHtml(c, company)}
  </section>
</main>`;

  return wrapDocument({
    title,
    stylesheetHref: opts.stylesheetHref ?? "/styles.css",
    bodyClass: c.body,
    shellClass: c.shell,
    navHtml: gateChromeHtml(c, theme.themeToggleHtml),
    mainHtml: main,
    dataAuth: "reset-password",
    ...theme,
  });
}

export function renderAuthAccountHtml(
  user: AuthUser,
  opts: AuthPageRenderOpts = {},
): string {
  const skin = opts.skin ?? "starter";
  const theme = themeFields(opts, skin);
  const c = authPageClasses(skin);
  const defaults = studioBrandDefaults(skin);
  const brand = opts.brandName ?? defaults.brand;
  const company = opts.companyName ?? defaults.company;
  const display = user.name ?? user.email;
  const membersLink =
    skin === "starter"
      ? `<a href="/members" class="${c.btnPrimary}">Open members area</a>`
      : `<a href="/" class="${c.btnPrimary}">Open Studio</a>`;

  const passkeyList = (opts.passkeys ?? [])
    .map(
      (p) =>
        `<li><code class="${c.code}">${escapeHtml(p.id.slice(0, 16))}…</code> · ${escapeHtml(p.label)}</li>`,
    )
    .join("");
  const passkeyBorder =
    skin === "studio" ? "border-border-bui" : "border-line";
  const passkeySection = opts.passkeyScriptHref
    ? `<section class="mt-8 border-t ${passkeyBorder} pt-6" data-as-passkey-manage>
    <h2 class="${c.title}" style="font-size:1.25rem">Passkeys</h2>
    <p class="${c.lead}">Register a passkey on this device for passwordless sign-in.</p>
    ${
      passkeyList
        ? `<ul class="${c.list}" data-as-passkey-list>${passkeyList}</ul>`
        : `<p class="${c.meta}">No passkeys yet.</p>`
    }
    <div class="${c.actions}">
      <button type="button" class="${c.btnSecondary}" data-as-passkey-register>Add passkey</button>
    </div>
    <p class="${c.meta}" data-as-passkey-status hidden></p>
  </section>`
    : "";

  const accountLead =
    skin === "studio"
      ? "mt-2 text-sm leading-relaxed text-on-surface-muted"
      : "mt-2 text-sm leading-relaxed text-ink-soft";
  const accountTitle =
    skin === "studio"
      ? "text-2xl font-semibold tracking-tight text-on-surface"
      : "font-display text-2xl font-semibold tracking-tight text-ink";

  const main = `<main class="${c.main}" data-as-component="account">
  <section class="${c.card}" data-as-auth="account">
    <div class="px-8 pt-8">
      <p class="${c.eyebrow}">Signed in</p>
      <h1 class="${accountTitle}">Welcome back</h1>
      <p class="${accountLead}" data-as-auth="signed-in">You are signed in as <strong>${escapeHtml(display)}</strong>.</p>
    </div>
    <dl class="${c.dl}">
      <dt class="${c.dt}">Email</dt><dd class="${c.dd}">${escapeHtml(user.email)}</dd>
      <dt class="${c.dt}">Role</dt><dd class="${c.dd}">${escapeHtml(user.role)}</dd>
      <dt class="${c.dt}">User id</dt><dd class="${c.dd}"><code class="${c.code}">${escapeHtml(user.id)}</code></dd>
    </dl>
    <div class="${c.actions}">
      ${membersLink}
      <a href="${AUTH_ROUTES.logout}" class="${c.btnSecondary}">Sign out</a>
      <a href="/" class="${c.link}">Home</a>
    </div>
    <div class="px-8 pb-8">${passkeySection}</div>
  </section>
</main>`;

  return wrapDocument({
    title: opts.appTitle ?? `Account · ${brand}`,
    stylesheetHref: opts.stylesheetHref ?? "/styles.css",
    bodyClass: c.body,
    shellClass: c.shell,
    navHtml: navHtml(
      c,
      brand,
      [
        { href: "/", label: "Home" },
        ...(skin === "starter" ? [{ href: "/members", label: "Members" }] : []),
        { href: AUTH_ROUTES.account, label: "Account" },
        { href: AUTH_ROUTES.logout, label: "Sign out" },
      ],
      theme.themeToggleHtml,
    ),
    mainHtml: main,
    dataAuth: "account",
    passkeyScriptHref: opts.passkeyScriptHref,
    ...theme,
  });
}

export function renderAuthMembersHtml(
  user: AuthUser,
  opts: AuthPageRenderOpts = {},
): string {
  const skin = opts.skin ?? "starter";
  const theme = themeFields(opts, skin);
  const c = authPageClasses(skin);
  const brand = opts.brandName ?? "Northline";
  const display = user.name ?? user.email;

  const main = `<main class="${c.main}" data-as-component="members">
  <section class="${c.card}" data-as-auth="members-area">
    ${brandHeaderHtml(c, brand, skin)}
    <p class="${c.eyebrow} px-8 text-center">Members only</p>
    <h1 class="${c.title}">Private area</h1>
    <p class="${c.lead}">Hello, <strong>${escapeHtml(display)}</strong> — this page is gated with <code class="${c.code}">canViewContent(user, "members")</code>.</p>
    <ul class="${c.list}">
      <li>Public marketing pages stay open without a session</li>
      <li><a class="${c.link}" href="${AUTH_ROUTES.account}">Account</a> shows your profile</li>
      <li>Anonymous visitors hitting /members are sent to sign in</li>
    </ul>
    <div class="${c.actions}">
      <a href="${AUTH_ROUTES.account}" class="${c.btnPrimary}">Account</a>
      <a href="${AUTH_ROUTES.logout}" class="${c.btnSecondary}">Sign out</a>
      <a href="/" class="${c.link}">Home</a>
    </div>
  </section>
</main>`;

  return wrapDocument({
    title: opts.appTitle ?? `Members · ${brand}`,
    stylesheetHref: opts.stylesheetHref ?? "/styles.css",
    bodyClass: c.body,
    shellClass: c.shell,
    navHtml: navHtml(
      c,
      brand,
      [
        { href: "/", label: "Home" },
        { href: "/members", label: "Members" },
        { href: AUTH_ROUTES.account, label: "Account" },
        { href: AUTH_ROUTES.logout, label: "Sign out" },
      ],
      theme.themeToggleHtml,
    ),
    mainHtml: main,
    dataAuth: "starter-gated",
    ...theme,
  });
}
