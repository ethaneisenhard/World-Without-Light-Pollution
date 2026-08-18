import { describe, expect, it } from "vitest";
import { AUTH_ROUTES, googleOAuthRedirectUri, isGoogleOAuthRedirect } from "./auth-routes-pure.js";

describe("googleOAuthRedirectUri", () => {
  it("builds callback from origin", () => {
    expect(googleOAuthRedirectUri("http://127.0.0.1:4400")).toBe(
      "http://127.0.0.1:4400/auth/google/callback",
    );
  });
});

describe("isGoogleOAuthRedirect", () => {
  it("true for Google accounts host", () => {
    expect(
      isGoogleOAuthRedirect("https://accounts.google.com/o/oauth2/v2/auth?client_id=x"),
    ).toBe(true);
  });

  it("false for other hosts", () => {
    expect(isGoogleOAuthRedirect("https://example.com/login")).toBe(false);
  });
});

describe("AUTH_ROUTES", () => {
  it("exposes google login path", () => {
    expect(AUTH_ROUTES.googleLogin).toBe("/login/google");
  });

  it("exposes Kent webauthn resource paths", () => {
    expect(AUTH_ROUTES.webauthnRegistrationOptions).toBe(
      "/resources/webauthn/registration/options",
    );
    expect(AUTH_ROUTES.webauthnAuthenticationVerify).toBe(
      "/resources/webauthn/authentication/verify",
    );
  });

  it("exposes account proof path", () => {
    expect(AUTH_ROUTES.account).toBe("/account");
  });

  it("exposes password reset paths", () => {
    expect(AUTH_ROUTES.forgotPassword).toBe("/forgot-password");
    expect(AUTH_ROUTES.resetPassword).toBe("/reset-password");
  });
});
