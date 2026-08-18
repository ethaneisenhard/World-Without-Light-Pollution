export const AUTH_ROUTES = {
  login: "/login",
  signup: "/signup",
  googleLogin: "/login/google",
  googleCallback: "/auth/google/callback",
  credentialsLogin: "/login/credentials",
  credentialsSignup: "/signup/credentials",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  logout: "/logout",
  /** Signed-in proof / account surface (Studio + Starter) */
  account: "/account",
  /** Kent-shaped WebAuthn (kentcdodds.com / Kody) */
  webauthnRegistrationOptions: "/resources/webauthn/registration/options",
  webauthnRegistrationVerify: "/resources/webauthn/registration/verify",
  webauthnAuthenticationOptions: "/resources/webauthn/authentication/options",
  webauthnAuthenticationVerify: "/resources/webauthn/authentication/verify",
} as const;

export function googleOAuthRedirectUri(appOrigin: string): string {
  return new URL(AUTH_ROUTES.googleCallback, appOrigin).toString();
}

export function isGoogleOAuthRedirect(location: string): boolean {
  try {
    const url = new URL(location);
    return url.hostname === "accounts.google.com";
  } catch {
    return false;
  }
}
