// @ts-nocheck — remix middleware pulls fetch-router .ts sources; runtime oracle is wrangler / host
/**
 * Kent/Kody-shaped browser auth mount — Google + credentials + cookie session.
 * Hosts (Studio, Starter) inject stores + env; do not fork OAuth glue.
 */
import { route } from "remix/routes";
import {
  completeAuth,
  createGoogleAuthProvider,
  finishExternalAuth,
  startExternalAuth,
} from "remix/auth";
import { auth, createSessionAuthScheme } from "remix/middleware/auth";
import { session } from "remix/middleware/session";
import { createCookie } from "remix/cookie";
import { createCookieSessionStorage } from "remix/session-storage/cookie";
import { redirect } from "remix/response/redirect";
import type { Action } from "remix/router";
import {
  AUTH_ROUTES,
  googleOAuthRedirectUri,
} from "./auth-routes-pure.js";
import {
  renderAuthLoginHtml,
  renderAuthSignupHtml,
} from "./auth-pages-html-pure.js";
import { resolveOAuthReturnTo } from "./oauth-return-to-pure.js";
import { googleProfileToUser } from "./user-pure.js";
import { hashPassword, verifyPassword } from "./password-pure.js";
import type {
  AuthEnv,
  AuthSessionValue,
  AuthUser,
  CredentialStore,
  UserStore,
} from "./types.js";

export const authRoutes = route({
  login: AUTH_ROUTES.login,
  signup: AUTH_ROUTES.signup,
  googleLogin: AUTH_ROUTES.googleLogin,
  googleCallback: AUTH_ROUTES.googleCallback,
  credentialsLogin: { method: "POST", pattern: AUTH_ROUTES.credentialsLogin },
  credentialsSignup: { method: "POST", pattern: AUTH_ROUTES.credentialsSignup },
});

type RegisterUserResult =
  | { ok: true; user: AuthUser }
  | { ok: false; error: string };

type CredentialStoreWithRegister = CredentialStore & {
  register?: (seed: {
    user: AuthUser;
    passwordHash: string;
    username?: string;
  }) => RegisterUserResult | Promise<RegisterUserResult>;
};

function createGoogleProvider(env: AuthEnv) {
  return createGoogleAuthProvider({
    clientId: env.googleClientId,
    clientSecret: env.googleClientSecret,
    redirectUri: googleOAuthRedirectUri(env.appOrigin),
    authorizationParams: {
      access_type: "offline",
      prompt: "consent",
    },
  });
}

/** Persist login across browser / Tauri quit (session cookies die with WKWebView). */
export const AUTH_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

export function createAuthMiddleware(env: AuthEnv, userStore: UserStore) {
  const sessionCookie = createCookie("__session", {
    secrets: [env.sessionSecret],
    httpOnly: true,
    secure: env.appOrigin.startsWith("https"),
    sameSite: "Lax",
    path: "/",
    maxAge: env.sessionMaxAgeSec ?? AUTH_SESSION_MAX_AGE_SEC,
    ...(env.cookieDomain ? { domain: env.cookieDomain } : {}),
  });
  const sessionStorage = createCookieSessionStorage();

  return [
    session(sessionCookie, sessionStorage),
    auth({
      schemes: [
        createSessionAuthScheme({
          read(session) {
            return session.get("auth") as AuthSessionValue | null;
          },
          async verify(value) {
            return userStore.getById(value.userId);
          },
          invalidate(session) {
            session.unset("auth");
          },
        }),
      ],
    }),
  ] as const;
}

export function createAuthRouteActions(deps: {
  env: AuthEnv;
  userStore: UserStore;
  credentialStore: CredentialStore;
  /** Optional brand for login HTML title */
  appTitle?: string;
  /** Where to land after login when no `returnTo` (Studio shell → `/`) */
  defaultReturnTo?: string;
}) {
  const googleProvider = createGoogleProvider(deps.env);
  const title = deps.appTitle ?? "Glass Box Studio";
  const afterLogin = deps.defaultReturnTo ?? AUTH_ROUTES.account;

  const credentialStore = deps.credentialStore as CredentialStoreWithRegister;

  return {
    login: {
      middleware: [],
      async handler(context) {
        const error = context.url?.searchParams?.get?.("error") ?? null;
        const returnTo =
          context.url?.searchParams?.get?.("returnTo") ?? afterLogin;
        const html = renderAuthLoginHtml({
          skin: "studio",
          stylesheetHref: "/styles.css",
          brandName: title,
          appTitle: `Sign in · ${title}`,
          error,
          showGoogle: true,
          returnTo,
          passkeyScriptHref: "/auth-passkey.js",
        });
        return new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      },
    },
    signup: {
      middleware: [],
      async handler(context) {
        const error = context.url?.searchParams?.get?.("error") ?? null;
        const returnTo =
          context.url?.searchParams?.get?.("returnTo") ?? afterLogin;
        const html = renderAuthSignupHtml({
          skin: "studio",
          stylesheetHref: "/styles.css",
          brandName: title,
          appTitle: `Sign up · ${title}`,
          error,
          showGoogle: true,
          returnTo,
        });
        return new Response(html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      },
    },
    googleLogin: {
      middleware: [],
      async handler(context) {
        const returnTo = resolveOAuthReturnTo({
          requestUrl: context.request.url,
          rawReturnTo: context.url.searchParams.get("returnTo"),
          fallbackPath: afterLogin,
          allowedSiteBaseDomain: deps.env.oauthReturnSiteBaseDomain,
        });
        return startExternalAuth(googleProvider, context, { returnTo });
      },
    },
    googleCallback: {
      middleware: [],
      async handler(context) {
        const { result, returnTo } = await finishExternalAuth(googleProvider, context);
        const user = googleProfileToUser(result.profile);
        await deps.userStore.upsert(user);

        const session = completeAuth(context);
        session.set("auth", { userId: user.id });

        const dest =
          typeof returnTo === "string" && returnTo.trim()
            ? resolveOAuthReturnTo({
                requestUrl: context.request.url,
                rawReturnTo: returnTo,
                fallbackPath: afterLogin,
                allowedSiteBaseDomain: deps.env.oauthReturnSiteBaseDomain,
              })
            : afterLogin;
        return redirect(dest);
      },
    },
    credentialsLogin: {
      middleware: [],
      async handler(context) {
        const body = await context.request.text();
        const params = new URLSearchParams(body);
        const login = String(params.get("login") ?? "").trim();
        const password = String(params.get("password") ?? "");
        if (!login || !password) {
          return redirect(`${AUTH_ROUTES.login}?error=invalid`);
        }

        const record = await credentialStore.findByLogin(login);
        const ok =
          record != null && (await verifyPassword(password, record.passwordHash));
        if (!ok || !record) {
          return redirect(`${AUTH_ROUTES.login}?error=invalid`);
        }

        const session = completeAuth(context);
        session.set("auth", { userId: record.user.id });
        const returnTo = String(params.get("returnTo") ?? "").trim();
        const dest =
          returnTo.startsWith("/") && !returnTo.startsWith("//")
            ? returnTo
            : afterLogin;
        return redirect(dest);
      },
    },
    credentialsSignup: {
      middleware: [],
      async handler(context) {
        if (typeof credentialStore.register !== "function") {
          return new Response("Signup unavailable", { status: 501 });
        }
        const body = await context.request.text();
        const params = new URLSearchParams(body);
        const email = String(params.get("email") ?? "").trim().toLowerCase();
        const password = String(params.get("password") ?? "");
        const name = String(params.get("name") ?? "").trim();
        if (!email.includes("@") || password.length < 8) {
          return redirect(`${AUTH_ROUTES.signup}?error=invalid`);
        }
        const passwordHash = await hashPassword(password);
        const id = `user_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
        const registered = await credentialStore.register({
          user: {
            id,
            email,
            name: name || email.split("@")[0] || "Member",
            role: "MEMBER",
          },
          passwordHash,
        });
        if (!registered.ok) {
          return redirect(`${AUTH_ROUTES.signup}?error=taken`);
        }
        const session = completeAuth(context);
        session.set("auth", { userId: registered.user.id });
        const returnTo = String(params.get("returnTo") ?? "").trim();
        const dest =
          returnTo.startsWith("/") && !returnTo.startsWith("//")
            ? returnTo
            : afterLogin;
        return redirect(dest);
      },
    },
  } satisfies Record<
    keyof typeof authRoutes,
    Action<(typeof authRoutes)[keyof typeof authRoutes]>
  >;
}

/** Facade: middleware + routes + actions for one app. */
export function createBrowserAuth(deps: {
  env: AuthEnv;
  userStore: UserStore;
  credentialStore: CredentialStore;
  appTitle?: string;
}) {
  return {
    routes: authRoutes,
    middleware: createAuthMiddleware(deps.env, deps.userStore),
    actions: createAuthRouteActions(deps),
  };
}
