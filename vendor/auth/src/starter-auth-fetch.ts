/**
 * Minimal Starter Worker auth branch — login + signup + credentials + Google + reset.
 * Full remix mount = createBrowserAuth when the app grows a router.
 */
import { AUTH_ROUTES } from "./auth-routes-pure.js";
import type { AuthPageSkin } from "./auth-pages-classes.js";
import {
  renderAuthForgotPasswordHtml,
  renderAuthLoginHtml,
  renderAuthResetPasswordHtml,
  renderAuthSignupHtml,
} from "./auth-pages-html-pure.js";
import {
  exchangeGoogleAuthorizationCode,
  fetchGoogleUserProfile,
} from "./google-oauth-starter-orchestrator.js";
import {
  buildGoogleAuthorizeUrl,
  encodeGoogleOAuthStatePayload,
  newGoogleOAuthNonce,
  parseGoogleOAuthStatePayload,
} from "./google-oauth-starter-pure.js";
import { hashPassword, verifyPassword } from "./password-pure.js";
import { buildPasswordResetUrl } from "./password-reset-pure.js";
import type { PasswordResetTokenStore } from "./password-reset-store.js";
import {
  parseCookie,
  sessionSetCookieHeader,
  signSessionUserId,
  STARTER_SESSION_COOKIE,
  verifySessionUserId,
} from "./session-cookie-pure.js";
import type { AuthUser, CredentialStore, UserStore } from "./types.js";
import { canViewContent, type ContentVisibility } from "./visibility-pure.js";
import type { MemorySeed } from "./memory-user-store.js";
import { googleProfileToUser } from "./user-pure.js";

const OAUTH_STATE_COOKIE = "as_oauth_state";

export type StarterGoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  /**
   * Override callback path (default `AUTH_ROUTES.googleCallback`).
   * BrowserUI legacy Google clients use `/api/auth/oauth/google/callback`.
   */
  callbackPath?: string;
};

export type StarterPasswordResetEmailInput = {
  to: string;
  resetUrl: string;
  brandName: string;
};

export type StarterAuthDeps = {
  sessionSecret: string;
  userStore: UserStore;
  credentialStore: CredentialStore;
  appTitle?: string;
  brandName?: string;
  /** Company on “Secured by” (starter skin). Studio default: Glass Box Computer. */
  companyName?: string;
  /**
   * Gate page chrome — `studio` matches Glass Box Studio login/signup exactly.
   * Default `starter` keeps ideal-stack marketing tokens.
   */
  skin?: AuthPageSkin;
  /** Public origin for Google redirect_uri + password-reset links. */
  appOrigin?: string;
  /** Optional register on memory (or compatible) store. */
  registerUser?: (
    seed: MemorySeed,
  ) =>
    | { ok: true; user: AuthUser }
    | { ok: false; error: "email_taken" | "username_taken" | "id_taken" }
    | Promise<
        | { ok: true; user: AuthUser }
        | { ok: false; error: "email_taken" | "username_taken" | "id_taken" }
      >;
  /** After successful signup — create tenant, etc. */
  onSignup?: (user: AuthUser) => void | Promise<void>;
  /** Light/dark chrome — boot script + Heroicon toggle HTML. */
  theme?: {
    defaultMode?: "light" | "dark";
    bootScript: string;
    toggleHtml: string;
  };
  /** When set with appOrigin, login/signup show Google and OAuth routes work. */
  google?: StarterGoogleOAuthConfig;
  /** Lookup for Google email-link + password reset. */
  getByEmail?: (email: string) => Promise<AuthUser | null> | AuthUser | null;
  updatePasswordHash?: (
    userId: string,
    passwordHash: string,
  ) => Promise<void> | void;
  passwordResetTokenStore?: PasswordResetTokenStore;
  sendPasswordResetEmail?: (
    input: StarterPasswordResetEmailInput,
  ) => Promise<void> | void;
};

function themePageOpts(deps: StarterAuthDeps): {
  colorMode?: "light" | "dark";
  themeBootScript?: string;
  themeToggleHtml?: string;
} {
  if (!deps.theme) return {};
  return {
    colorMode: deps.theme.defaultMode ?? "light",
    themeBootScript: deps.theme.bootScript,
    themeToggleHtml: deps.theme.toggleHtml,
  };
}

function safeReturnTo(raw: string | null | undefined, fallback: string): string {
  const returnTo = (raw ?? "").trim();
  if (returnTo.startsWith("/") && !returnTo.startsWith("//")) return returnTo;
  return fallback;
}

function showGoogle(deps: StarterAuthDeps): boolean {
  return Boolean(
    deps.google?.clientId &&
      deps.google?.clientSecret &&
      deps.appOrigin?.trim(),
  );
}

function googleCallbackPath(deps: StarterAuthDeps): string {
  const custom = deps.google?.callbackPath?.trim();
  if (custom?.startsWith("/") && !custom.startsWith("//")) return custom;
  return AUTH_ROUTES.googleCallback;
}

function googleRedirectUri(deps: StarterAuthDeps): string {
  return new URL(googleCallbackPath(deps), deps.appOrigin!.trim()).toString();
}

function showForgotPassword(deps: StarterAuthDeps): boolean {
  return Boolean(
    deps.passwordResetTokenStore &&
      deps.sendPasswordResetEmail &&
      deps.getByEmail &&
      deps.updatePasswordHash &&
      deps.appOrigin?.trim(),
  );
}

function htmlResponse(html: string): Response {
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function oauthStateSetCookie(token: string, secure: boolean): string {
  const parts = [
    `${OAUTH_STATE_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=600",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

function oauthStateClearCookie(secure: boolean): string {
  const parts = [
    `${OAUTH_STATE_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export async function readStarterSessionUser(
  request: Request,
  deps: StarterAuthDeps,
): Promise<AuthUser | null> {
  const raw = parseCookie(request.headers.get("Cookie"), STARTER_SESSION_COOKIE);
  if (!raw) return null;
  const userId = await verifySessionUserId(raw, deps.sessionSecret);
  if (!userId) return null;
  return deps.userStore.getById(userId);
}

async function resolveGoogleUser(
  deps: StarterAuthDeps,
  profile: { sub: string; email?: string | null; name?: string | null },
): Promise<{ user: AuthUser; isNew: boolean }> {
  const email = (profile.email ?? "").trim().toLowerCase();
  if (email && deps.getByEmail) {
    const existing = await deps.getByEmail(email);
    if (existing) {
      const next = {
        ...existing,
        name: profile.name ?? existing.name,
        email: existing.email || email,
      };
      await deps.userStore.upsert(next);
      return { user: next, isNew: false };
    }
  }
  const bySub = await deps.userStore.getById(profile.sub);
  if (bySub) {
    const next = {
      ...bySub,
      name: profile.name ?? bySub.name,
      email: email || bySub.email,
    };
    await deps.userStore.upsert(next);
    return { user: next, isNew: false };
  }
  const user = googleProfileToUser(profile);
  await deps.userStore.upsert(user);
  return { user, isNew: true };
}

export async function handleStarterAuthFetch(
  request: Request,
  deps: StarterAuthDeps,
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;
  const skin: AuthPageSkin = deps.skin ?? "starter";
  const brandName =
    deps.brandName ?? (skin === "studio" ? undefined : "Northline");
  const companyName = deps.companyName;
  const googleOn = showGoogle(deps);
  const forgotOn = showForgotPassword(deps);
  const themeOpts = skin === "studio" ? {} : themePageOpts(deps);

  if (path === AUTH_ROUTES.login && request.method === "GET") {
    const existing = await readStarterSessionUser(request, deps);
    if (existing) {
      const dest = safeReturnTo(url.searchParams.get("returnTo"), "/app");
      return Response.redirect(new URL(dest, url).toString(), 302);
    }
    const html = renderAuthLoginHtml({
      skin,
      stylesheetHref: "/styles.css",
      brandName,
      companyName,
      appTitle: deps.appTitle,
      error: url.searchParams.get("error"),
      notice: url.searchParams.get("notice"),
      returnTo: url.searchParams.get("returnTo"),
      showGoogle: googleOn,
      showForgotPassword: forgotOn,
      ...themeOpts,
    });
    return htmlResponse(html);
  }

  if (path === AUTH_ROUTES.signup && request.method === "GET") {
    const existing = await readStarterSessionUser(request, deps);
    if (existing) {
      const dest = safeReturnTo(url.searchParams.get("returnTo"), "/app");
      return Response.redirect(new URL(dest, url).toString(), 302);
    }
    const html = renderAuthSignupHtml({
      skin,
      stylesheetHref: "/styles.css",
      brandName,
      companyName,
      appTitle: deps.appTitle,
      error: url.searchParams.get("error"),
      returnTo: url.searchParams.get("returnTo") || "/app",
      showGoogle: googleOn,
      ...themeOpts,
    });
    return htmlResponse(html);
  }

  if (path === AUTH_ROUTES.credentialsLogin && request.method === "POST") {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const login = String(params.get("login") ?? "").trim();
    const password = String(params.get("password") ?? "");
    if (!login || !password) {
      return Response.redirect(new URL(`${AUTH_ROUTES.login}?error=invalid`, url).toString(), 302);
    }
    const record = await deps.credentialStore.findByLogin(login);
    const ok =
      record != null && (await verifyPassword(password, record.passwordHash));
    if (!ok || !record) {
      return Response.redirect(new URL(`${AUTH_ROUTES.login}?error=invalid`, url).toString(), 302);
    }
    const token = await signSessionUserId(record.user.id, deps.sessionSecret);
    const safeReturn = safeReturnTo(
      params.get("returnTo") ?? url.searchParams.get("returnTo"),
      AUTH_ROUTES.account,
    );
    return new Response(null, {
      status: 302,
      headers: {
        Location: safeReturn,
        "Set-Cookie": sessionSetCookieHeader(token, url.protocol === "https:"),
      },
    });
  }

  if (path === AUTH_ROUTES.credentialsSignup && request.method === "POST") {
    if (!deps.registerUser) {
      return new Response("Signup unavailable", { status: 501 });
    }
    const body = await request.text();
    const params = new URLSearchParams(body);
    const email = String(params.get("email") ?? "").trim().toLowerCase();
    const password = String(params.get("password") ?? "");
    const name = String(params.get("name") ?? "").trim();
    if (!email.includes("@") || password.length < 8) {
      return Response.redirect(
        new URL(`${AUTH_ROUTES.signup}?error=invalid`, url).toString(),
        302,
      );
    }
    const passwordHash = await hashPassword(password);
    const id = `user_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
    const registered = await deps.registerUser({
      user: {
        id,
        email,
        name: name || email.split("@")[0],
        role: "MEMBER",
      },
      passwordHash,
    });
    if (!registered.ok) {
      return Response.redirect(
        new URL(`${AUTH_ROUTES.signup}?error=taken`, url).toString(),
        302,
      );
    }
    if (deps.onSignup) await deps.onSignup(registered.user);
    const token = await signSessionUserId(registered.user.id, deps.sessionSecret);
    const safeReturn = safeReturnTo(params.get("returnTo"), "/app");
    return new Response(null, {
      status: 302,
      headers: {
        Location: safeReturn,
        "Set-Cookie": sessionSetCookieHeader(token, url.protocol === "https:"),
      },
    });
  }

  if (path === AUTH_ROUTES.googleLogin && request.method === "GET") {
    if (!deps.google || !showGoogle(deps)) {
      return Response.redirect(new URL(`${AUTH_ROUTES.login}?error=google`, url).toString(), 302);
    }
    const returnTo = safeReturnTo(url.searchParams.get("returnTo"), "/app");
    const nonce = newGoogleOAuthNonce();
    const statePayload = encodeGoogleOAuthStatePayload({ n: nonce, r: returnTo });
    const stateToken = await signSessionUserId(statePayload, deps.sessionSecret);
    const redirectUri = googleRedirectUri(deps);
    const authorize = buildGoogleAuthorizeUrl({
      clientId: deps.google.clientId,
      redirectUri,
      state: stateToken,
    });
    return new Response(null, {
      status: 302,
      headers: {
        Location: authorize,
        "Set-Cookie": oauthStateSetCookie(stateToken, url.protocol === "https:"),
      },
    });
  }

  if (
    (path === AUTH_ROUTES.googleCallback || path === googleCallbackPath(deps)) &&
    request.method === "GET"
  ) {
    if (!deps.google || !showGoogle(deps)) {
      return Response.redirect(new URL(`${AUTH_ROUTES.login}?error=google`, url).toString(), 302);
    }
    const secure = url.protocol === "https:";
    const fail = () =>
      new Response(null, {
        status: 302,
        headers: {
          Location: `${AUTH_ROUTES.login}?error=google`,
          "Set-Cookie": oauthStateClearCookie(secure),
        },
      });

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const cookieState = parseCookie(request.headers.get("Cookie"), OAUTH_STATE_COOKIE);
    if (!code || !state || !cookieState || state !== cookieState) return fail();

    const stateRaw = await verifySessionUserId(state, deps.sessionSecret);
    if (!stateRaw) return fail();
    const statePayload = parseGoogleOAuthStatePayload(stateRaw);
    if (!statePayload) return fail();

    const redirectUri = googleRedirectUri(deps);
    const tokenResult = await exchangeGoogleAuthorizationCode(
      {},
      {
        code,
        clientId: deps.google.clientId,
        clientSecret: deps.google.clientSecret,
        redirectUri,
      },
    );
    if (!tokenResult.ok) return fail();

    const profileResult = await fetchGoogleUserProfile({}, tokenResult.accessToken);
    if (!profileResult.ok) return fail();

    const { user, isNew } = await resolveGoogleUser(deps, profileResult.profile);
    if (isNew && deps.onSignup) await deps.onSignup(user);

    const sessionToken = await signSessionUserId(user.id, deps.sessionSecret);
    const dest = safeReturnTo(statePayload.r, "/app");
    const headers = new Headers();
    headers.set("Location", dest);
    headers.append("Set-Cookie", sessionSetCookieHeader(sessionToken, secure));
    headers.append("Set-Cookie", oauthStateClearCookie(secure));
    return new Response(null, { status: 302, headers });
  }

  if (path === AUTH_ROUTES.forgotPassword && request.method === "GET") {
    if (!forgotOn) return new Response("Not found", { status: 404 });
    const html = renderAuthForgotPasswordHtml({
      skin,
      stylesheetHref: "/styles.css",
      brandName,
      companyName,
      appTitle: deps.appTitle,
      notice: url.searchParams.get("notice"),
      ...themeOpts,
    });
    return htmlResponse(html);
  }

  if (path === AUTH_ROUTES.forgotPassword && request.method === "POST") {
    if (
      !deps.passwordResetTokenStore ||
      !deps.sendPasswordResetEmail ||
      !deps.getByEmail
    ) {
      return new Response("Not found", { status: 404 });
    }
    const appOrigin = deps.appOrigin?.trim();
    if (!appOrigin) {
      return new Response("Password reset misconfigured (APP_ORIGIN)", {
        status: 503,
      });
    }
    const body = await request.text();
    const params = new URLSearchParams(body);
    const email = String(params.get("email") ?? "").trim().toLowerCase();
    // Always redirect to generic success (no email enumeration).
    const done = () =>
      Response.redirect(
        new URL(`${AUTH_ROUTES.forgotPassword}?notice=sent`, url).toString(),
        302,
      );
    if (!email.includes("@")) return done();
    const user = await deps.getByEmail(email);
    if (!user) return done();
    const issued = await deps.passwordResetTokenStore.issue(user.id);
    const resetUrl = buildPasswordResetUrl(appOrigin, issued.raw);
    await deps.sendPasswordResetEmail({
      to: user.email,
      resetUrl,
      brandName: brandName ?? (skin === "studio" ? "Glass Box Studio" : "Northline"),
    });
    return done();
  }

  if (path === AUTH_ROUTES.resetPassword && request.method === "GET") {
    if (!forgotOn) return new Response("Not found", { status: 404 });
    const html = renderAuthResetPasswordHtml({
      skin,
      stylesheetHref: "/styles.css",
      brandName,
      companyName,
      appTitle: deps.appTitle,
      resetToken: url.searchParams.get("token"),
      error: url.searchParams.get("error"),
      ...themeOpts,
    });
    return htmlResponse(html);
  }

  if (path === AUTH_ROUTES.resetPassword && request.method === "POST") {
    if (!deps.passwordResetTokenStore || !deps.updatePasswordHash) {
      return new Response("Not found", { status: 404 });
    }
    const body = await request.text();
    const params = new URLSearchParams(body);
    const token = String(params.get("token") ?? "").trim();
    const password = String(params.get("password") ?? "");
    if (!token) {
      return Response.redirect(
        new URL(`${AUTH_ROUTES.resetPassword}?error=token`, url).toString(),
        302,
      );
    }
    if (password.length < 8) {
      return Response.redirect(
        new URL(
          `${AUTH_ROUTES.resetPassword}?error=invalid&token=${encodeURIComponent(token)}`,
          url,
        ).toString(),
        302,
      );
    }
    const userId = await deps.passwordResetTokenStore.consume(token);
    if (!userId) {
      return Response.redirect(
        new URL(`${AUTH_ROUTES.resetPassword}?error=token`, url).toString(),
        302,
      );
    }
    const passwordHash = await hashPassword(password);
    await deps.updatePasswordHash(userId, passwordHash);
    return Response.redirect(
      new URL(`${AUTH_ROUTES.login}?notice=reset`, url).toString(),
      302,
    );
  }

  if (path === AUTH_ROUTES.logout) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
        "Set-Cookie": `${STARTER_SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
      },
    });
  }

  return null;
}

/** Gate a path: anonymous → redirect login; wrong role → 403. */
export async function requireStarterVisibility(
  request: Request,
  deps: StarterAuthDeps,
  visibility: ContentVisibility,
): Promise<Response | null> {
  if (visibility === "public") return null;
  const user = await readStarterSessionUser(request, deps);
  if (canViewContent(user, visibility)) return null;
  if (!user) {
    const reqUrl = new URL(request.url);
    return Response.redirect(
      new URL(
        `${AUTH_ROUTES.login}?error=auth&returnTo=${encodeURIComponent(reqUrl.pathname)}`,
        reqUrl,
      ).toString(),
      302,
    );
  }
  return new Response("Forbidden", { status: 403 });
}
