// @ts-nocheck — remix middleware / router types; host runtime is oracle
import { route } from "remix/routes";
import { completeAuth } from "remix/auth";
import { requireAuth } from "remix/middleware/auth";
import { redirect } from "remix/response/redirect";
import { AUTH_ROUTES } from "./auth-routes-pure.js";
import type { PasskeyStore } from "./passkey-types.js";
import type { AuthUser, UserStore } from "./types.js";
import { getWebAuthnConfig } from "./webauthn-config-pure.js";
import {
  createPasskeyAuthenticationOptions,
  createPasskeyRegistrationOptions,
  verifyPasskeyAuthentication,
  verifyPasskeyRegistration,
  type ChallengeStore,
} from "./passkey-webauthn.js";
import {
  createRequestCookieChallengeStore,
  createWebAuthnChallengeCookie,
  webauthnCookieSecureFromRequest,
} from "./webauthn-challenge-cookie.js";

export const passkeyRoutes = route({
  registrationOptions: {
    method: "POST",
    pattern: AUTH_ROUTES.webauthnRegistrationOptions,
  },
  registrationVerify: {
    method: "POST",
    pattern: AUTH_ROUTES.webauthnRegistrationVerify,
  },
  authenticationOptions: {
    method: "POST",
    pattern: AUTH_ROUTES.webauthnAuthenticationOptions,
  },
  authenticationVerify: {
    method: "POST",
    pattern: AUTH_ROUTES.webauthnAuthenticationVerify,
  },
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function identityUser(context: {
  auth?: { ok?: boolean; identity?: AuthUser };
}): AuthUser | null {
  if (context.auth?.ok && context.auth.identity) return context.auth.identity;
  return null;
}

export function createPasskeyRouteActions(deps: {
  passkeyStore: PasskeyStore;
  /** Fallback when no sessionSecret (tests / memory-only). */
  challengeStore?: ChallengeStore;
  /** Prefer cookie challenges (Cloud / multi-isolate). */
  sessionSecret?: string;
  appOrigin?: string;
  userStore: UserStore;
  rpName?: string;
}) {
  const challengeCookie = deps.sessionSecret
    ? createWebAuthnChallengeCookie(deps.sessionSecret)
    : null;

  function challengeJar(request: Request) {
    if (challengeCookie) {
      return createRequestCookieChallengeStore({
        cookie: challengeCookie,
        request,
        secure: webauthnCookieSecureFromRequest(request, deps.appOrigin),
      });
    }
    const store = deps.challengeStore;
    if (!store) {
      throw new Error(
        "createPasskeyRouteActions requires sessionSecret or challengeStore",
      );
    }
    return {
      store,
      applyToResponse: async (response: Response) => response,
    };
  }

  const requireUser = [
    requireAuth({
      onFailure: () => redirect(`${AUTH_ROUTES.login}?error=auth`),
    }),
  ];

  return {
    registrationOptions: {
      middleware: requireUser,
      async handler(context) {
        const user = identityUser(context);
        if (!user) return json({ error: "unauthorized" }, 401);
        const jar = challengeJar(context.request);
        const config = getWebAuthnConfig(context.request, {
          rpName: deps.rpName,
        });
        const options = await createPasskeyRegistrationOptions({
          config,
          user,
          passkeyStore: deps.passkeyStore,
          challengeStore: jar.store,
        });
        return jar.applyToResponse(json(options));
      },
    },
    registrationVerify: {
      middleware: requireUser,
      async handler(context) {
        const user = identityUser(context);
        if (!user) return json({ error: "unauthorized" }, 401);
        const jar = challengeJar(context.request);
        const config = getWebAuthnConfig(context.request, {
          rpName: deps.rpName,
        });
        const body = (await context.request.json()) as Parameters<
          typeof verifyPasskeyRegistration
        >[0]["response"];
        const result = await verifyPasskeyRegistration({
          config,
          user,
          response: body,
          passkeyStore: deps.passkeyStore,
          challengeStore: jar.store,
        });
        if (!result.ok) {
          return jar.applyToResponse(json({ error: result.error }, 400));
        }
        return jar.applyToResponse(json({ ok: true, id: result.passkey.id }));
      },
    },
    authenticationOptions: {
      middleware: [],
      async handler(context) {
        const jar = challengeJar(context.request);
        const config = getWebAuthnConfig(context.request, {
          rpName: deps.rpName,
        });
        // Discoverable credentials — empty allowCredentials (Kent autofill).
        const options = await createPasskeyAuthenticationOptions({
          config,
          passkeyStore: deps.passkeyStore,
          challengeStore: jar.store,
          challengeSubject: "anonymous",
        });
        return jar.applyToResponse(json(options));
      },
    },
    authenticationVerify: {
      middleware: [],
      async handler(context) {
        const jar = challengeJar(context.request);
        const config = getWebAuthnConfig(context.request, {
          rpName: deps.rpName,
        });
        const body = (await context.request.json()) as Parameters<
          typeof verifyPasskeyAuthentication
        >[0]["response"];
        const result = await verifyPasskeyAuthentication({
          config,
          response: body,
          passkeyStore: deps.passkeyStore,
          challengeStore: jar.store,
          challengeSubject: "anonymous",
        });
        if (!result.ok) {
          return jar.applyToResponse(json({ error: result.error }, 400));
        }
        const user = await deps.userStore.getById(result.userId);
        if (!user) {
          return jar.applyToResponse(json({ error: "user_missing" }, 400));
        }
        const session = completeAuth(context);
        session.set("auth", { userId: user.id });
        return jar.applyToResponse(json({ ok: true, userId: user.id }));
      },
    },
  };
}
