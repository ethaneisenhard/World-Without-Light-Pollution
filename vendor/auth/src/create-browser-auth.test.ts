import { describe, expect, it } from "vitest";
import { AUTH_ROUTES } from "./auth-routes-pure.js";
import {
  AUTH_SESSION_MAX_AGE_SEC,
  createBrowserAuth,
} from "./create-browser-auth.js";
import { createMemoryUserStore } from "./memory-user-store.js";

describe("createBrowserAuth", () => {
  it("keeps a multi-week session Max-Age (desktop remember-me)", () => {
    expect(AUTH_SESSION_MAX_AGE_SEC).toBeGreaterThanOrEqual(60 * 60 * 24 * 7);
  });

  it("exposes auth routes + middleware + actions", () => {
    const store = createMemoryUserStore([
      {
        user: {
          id: "u1",
          email: "a@example.com",
          role: "MEMBER",
        },
        passwordHash: "x",
      },
    ]);
    const browser = createBrowserAuth({
      env: {
        sessionSecret: "test-secret-at-least-32-chars-long!!",
        googleClientId: "cid",
        googleClientSecret: "csecret",
        appOrigin: "http://127.0.0.1:4400",
      },
      userStore: store,
      credentialStore: store,
      appTitle: "Test App",
    });
    expect(browser.routes).toBeTruthy();
    expect(browser.middleware.length).toBe(2);
    expect(typeof browser.actions.login.handler).toBe("function");
    expect(AUTH_ROUTES.login).toBe("/login");
  });
});
