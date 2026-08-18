export type UserRole = "MEMBER" | "SUBSCRIBER";

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
};

export type AuthSessionValue = {
  userId: string;
};

export type AuthEnv = {
  sessionSecret: string;
  googleClientId: string;
  googleClientSecret: string;
  /**
   * Public origin for Google `redirect_uri` (and similar).
   * Multi-tenant Studio: site apex (`https://browserui.site`), not `{slug}.…`.
   */
  appOrigin: string;
  /**
   * `__session` Max-Age seconds. Default 30d so desktop / Safari quit
   * does not force re-login (bare session cookies die with the process).
   */
  sessionMaxAgeSec?: number;
  /**
   * Optional `Domain=` for session cookie (e.g. `.browserui.site`) so OAuth
   * callback on the apex shares session with `{slug}` subdomains.
   */
  cookieDomain?: string;
  /**
   * When set, OAuth `returnTo` may be absolute under this base domain
   * (apex + subdomains). Used to bounce from apex callback → tenant host.
   */
  oauthReturnSiteBaseDomain?: string;
};

export type UserStore = {
  upsert: (user: AuthUser) => AuthUser | Promise<AuthUser>;
  getById: (id: string) => AuthUser | null | Promise<AuthUser | null>;
};

export type CredentialRecord = {
  user: AuthUser;
  passwordHash: string;
};

export type CredentialStore = {
  findByLogin: (login: string) => CredentialRecord | null | Promise<CredentialRecord | null>;
};
