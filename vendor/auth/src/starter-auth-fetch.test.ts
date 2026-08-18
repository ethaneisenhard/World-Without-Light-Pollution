import { describe, expect, it, vi } from "vitest";
import { hashPassword } from "./password-pure.js";
import { createMemoryUserStore } from "./memory-user-store.js";
import { createMemoryPasswordResetTokenStore } from "./password-reset-store.js";
import { handleStarterAuthFetch, requireStarterVisibility } from "./starter-auth-fetch.js";
import { AUTH_ROUTES } from "./auth-routes-pure.js";
import { isGoogleOAuthRedirect } from "./auth-routes-pure.js";

describe("handleStarterAuthFetch", () => {
  it("serves login HTML and rejects bad credentials", async () => {
    const store = createMemoryUserStore([
      {
        user: { id: "u1", email: "a@example.com", role: "MEMBER" },
        passwordHash: await hashPassword("secret"),
      },
    ]);
    const deps = {
      sessionSecret: "test-secret-at-least-32-chars-long!!",
      userStore: store,
      credentialStore: store,
      appTitle: "Starter",
    };
    const login = await handleStarterAuthFetch(
      new Request("http://127.0.0.1:8789/login"),
      deps,
    );
    expect(login?.status).toBe(200);
    expect(await login!.text()).toContain("Sign in");

    const bad = await handleStarterAuthFetch(
      new Request("http://127.0.0.1:8789/login/credentials", {
        method: "POST",
        body: "login=a@example.com&password=wrong",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }),
      deps,
    );
    expect(bad?.status).toBe(302);
    expect(bad?.headers.get("Location")).toContain("error=invalid");

    const good = await handleStarterAuthFetch(
      new Request("http://127.0.0.1:8789/login/credentials", {
        method: "POST",
        body: "login=a@example.com&password=secret",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }),
      deps,
    );
    expect(good?.status).toBe(302);
    expect(good?.headers.get("Set-Cookie")).toContain("as_auth=");
    expect(good?.headers.get("Location")).toBe("/account");
  });

  it("redirects signed-in users from /login to /app", async () => {
    const store = createMemoryUserStore([
      {
        user: { id: "u1", email: "a@example.com", role: "MEMBER" },
        passwordHash: await hashPassword("secret"),
      },
    ]);
    const deps = {
      sessionSecret: "test-secret-at-least-32-chars-long!!",
      userStore: store,
      credentialStore: store,
      brandName: "BrowserUI",
    };
    const login = await handleStarterAuthFetch(
      new Request("http://127.0.0.1:8789/login/credentials", {
        method: "POST",
        body: "login=a@example.com&password=secret&returnTo=/app",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }),
      deps,
    );
    const cookie = login?.headers.get("Set-Cookie")?.split(";")[0] ?? "";
    const again = await handleStarterAuthFetch(
      new Request("http://127.0.0.1:8789/login", {
        headers: { Cookie: cookie },
      }),
      deps,
    );
    expect(again?.status).toBe(302);
    expect(again?.headers.get("Location")).toContain("/app");
  });

  it("signs up and sets session", async () => {
    const store = createMemoryUserStore([]);
    const onSignup = vi.fn();
    const deps = {
      sessionSecret: "test-secret-at-least-32-chars-long!!",
      userStore: store,
      credentialStore: store,
      brandName: "BrowserUI",
      registerUser: (seed: Parameters<typeof store.register>[0]) =>
        store.register(seed),
      onSignup,
    };
    const page = await handleStarterAuthFetch(
      new Request("http://127.0.0.1:8789/signup"),
      deps,
    );
    expect(page?.status).toBe(200);
    expect(await page!.text()).toContain("Create your BrowserUI account");

    const studioPage = await handleStarterAuthFetch(
      new Request("http://127.0.0.1:8789/signup"),
      { ...deps, skin: "studio", brandName: undefined },
    );
    expect(studioPage?.status).toBe(200);
    const studioHtml = await studioPage!.text();
    expect(studioHtml).toContain("Create account");
    expect(studioHtml).toContain('data-color-mode="system"');
    expect(studioHtml).toContain("glass-box-splash");

    const created = await handleStarterAuthFetch(
      new Request("http://127.0.0.1:8789/signup/credentials", {
        method: "POST",
        body: "email=new@example.com&password=password1&name=New&returnTo=/app",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }),
      deps,
    );
    expect(created?.status).toBe(302);
    expect(created?.headers.get("Location")).toBe("/app");
    expect(created?.headers.get("Set-Cookie")).toContain("as_auth=");
    expect(onSignup).toHaveBeenCalledOnce();
  });

  it("gates members visibility", async () => {
    const store = createMemoryUserStore([]);
    const deps = {
      sessionSecret: "test-secret-at-least-32-chars-long!!",
      userStore: store,
      credentialStore: store,
    };
    const gated = await requireStarterVisibility(
      new Request(`http://127.0.0.1:8789/members`),
      deps,
      "members",
    );
    expect(gated?.status).toBe(302);
    expect(gated?.headers.get("Location")).toContain(AUTH_ROUTES.login);
  });

  it("redirects Google login to accounts.google.com when configured", async () => {
    const store = createMemoryUserStore([]);
    const deps = {
      sessionSecret: "test-secret-at-least-32-chars-long!!",
      userStore: store,
      credentialStore: store,
      appOrigin: "https://browserui.org",
      google: {
        clientId: "cid",
        clientSecret: "secret",
        callbackPath: "/api/auth/oauth/google/callback",
      },
    };
    const loginPage = await handleStarterAuthFetch(
      new Request("http://127.0.0.1:8789/login"),
      deps,
    );
    const loginHtml = await loginPage!.text();
    expect(loginHtml).toContain("Google");
    expect(loginHtml).toContain("/login/google");

    const start = await handleStarterAuthFetch(
      new Request("http://127.0.0.1:8789/login/google?returnTo=/app"),
      deps,
    );
    expect(start?.status).toBe(302);
    const location = start?.headers.get("Location") ?? "";
    expect(isGoogleOAuthRedirect(location)).toBe(true);
    expect(location).toContain(
      encodeURIComponent("https://browserui.org/api/auth/oauth/google/callback"),
    );
    expect(start?.headers.get("Set-Cookie")).toContain("as_oauth_state=");
  });

  it("forgot → reset → login with new password", async () => {
    const store = createMemoryUserStore([
      {
        user: { id: "u1", email: "a@example.com", role: "MEMBER" },
        passwordHash: await hashPassword("old-password"),
      },
    ]);
    const send = vi.fn(async () => {});
    const deps = {
      sessionSecret: "test-secret-at-least-32-chars-long!!",
      userStore: store,
      credentialStore: store,
      appOrigin: "https://browserui.org",
      getByEmail: (email: string) => store.getByEmail(email),
      updatePasswordHash: (userId: string, hash: string) =>
        store.updatePasswordHash(userId, hash),
      passwordResetTokenStore: createMemoryPasswordResetTokenStore(),
      sendPasswordResetEmail: send,
    };

    const forgot = await handleStarterAuthFetch(
      new Request("http://127.0.0.1:8789/forgot-password", {
        method: "POST",
        body: "email=a@example.com",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }),
      deps,
    );
    expect(forgot?.status).toBe(302);
    expect(forgot?.headers.get("Location")).toContain("notice=sent");
    expect(send).toHaveBeenCalledOnce();
    const resetUrl = String(send.mock.calls[0]![0].resetUrl);
    const token = new URL(resetUrl).searchParams.get("token")!;

    const reset = await handleStarterAuthFetch(
      new Request("http://127.0.0.1:8789/reset-password", {
        method: "POST",
        body: `token=${encodeURIComponent(token)}&password=new-password`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }),
      deps,
    );
    expect(reset?.status).toBe(302);
    expect(reset?.headers.get("Location")).toContain("notice=reset");

    const badOld = await handleStarterAuthFetch(
      new Request("http://127.0.0.1:8789/login/credentials", {
        method: "POST",
        body: "login=a@example.com&password=old-password",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }),
      deps,
    );
    expect(badOld?.headers.get("Location")).toContain("error=invalid");

    const goodNew = await handleStarterAuthFetch(
      new Request("http://127.0.0.1:8789/login/credentials", {
        method: "POST",
        body: "login=a@example.com&password=new-password",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }),
      deps,
    );
    expect(goodNew?.headers.get("Set-Cookie")).toContain("as_auth=");
  });
});
