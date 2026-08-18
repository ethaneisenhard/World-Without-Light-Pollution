/**
 * Starter auth host — D1 when bound, else memory. Email/password + Google OAuth
 * + password reset all come from the shared `createStarterAuthDeps` helper, so
 * any project copied from this template inherits the full owned auth stack with
 * zero custom wiring (just set env vars).
 * Proof UX: /login → /account + gated /members.
 * No Node `process` — Workers runtime only.
 */
import {
  AUTH_ROUTES,
  createStarterAuthDeps,
  handleStarterAuthFetch,
  readStarterSessionUser,
  renderStarterAccountHtml,
  renderStarterMembersHtml,
  requireStarterVisibility,
  type D1DatabaseLike,
  type StarterAuthDeps,
} from "@glassbox-studio/auth";

type StarterEnv = {
  SESSION_SECRET?: string;
  APP_ORIGIN?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  AS_STARTER_PASSWORD?: string;
  DB?: D1DatabaseLike;
};

let depsPromise: Promise<StarterAuthDeps> | null = null;

function getDeps(env: StarterEnv): Promise<StarterAuthDeps> {
  if (!depsPromise) {
    depsPromise = createStarterAuthDeps(env.DB, {
      sessionSecret:
        env.SESSION_SECRET ?? "dev-only-starter-session-secret-change-me",
      appOrigin: env.APP_ORIGIN?.trim() || undefined,
      appTitle: "Studio Starter",
      brandName: "Northline",
      companyName: "Glass Box Computer",
      google:
        env.GOOGLE_CLIENT_ID?.trim() && env.GOOGLE_CLIENT_SECRET?.trim()
          ? {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
            }
          : undefined,
      seed: {
        id: "starter-member",
        email: "member@example.com",
        name: "Starter Member",
        username: "member",
        password: env.AS_STARTER_PASSWORD ?? "starter-dev",
      },
    });
  }
  return depsPromise;
}

export async function tryHandleStarterAuth(
  request: Request,
  env: StarterEnv,
): Promise<Response | null> {
  const deps = await getDeps(env);
  const url = new URL(request.url);
  const brandName = "Northline";

  if (url.pathname === AUTH_ROUTES.account) {
    const gate = await requireStarterVisibility(request, deps, "members");
    if (gate) return gate;
    const user = await readStarterSessionUser(request, deps);
    if (!user) return new Response("Unauthorized", { status: 401 });
    return new Response(renderStarterAccountHtml(user, { brandName }), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (url.pathname === "/members" || url.pathname.startsWith("/members/")) {
    const gate = await requireStarterVisibility(request, deps, "members");
    if (gate) return gate;
    const user = await readStarterSessionUser(request, deps);
    if (!user) return new Response("Forbidden", { status: 403 });
    return new Response(renderStarterMembersHtml(user, { brandName }), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return handleStarterAuthFetch(request, deps);
}
