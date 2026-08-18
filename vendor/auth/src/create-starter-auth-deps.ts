/**
 * Reusable Starter auth wiring — one call builds a full `StarterAuthDeps` for
 * email/password + Google OAuth + password reset, backed by D1 (Worker) or a
 * memory store (tests / Node preview). Every ideal-stack project (template,
 * glassboxcomputer, fauna, …) calls this instead of copy-pasting the same
 * ~150 lines of store + deps assembly.
 */
import type { D1DatabaseLike } from "./d1-passkey-store.js";
import { createD1AuthStores } from "./d1-auth-store.js";
import {
  createD1PasswordResetTokenStore,
  createMemoryPasswordResetTokenStore,
  type PasswordResetTokenStore,
} from "./password-reset-store.js";
import {
  createMemoryUserStore,
  type MemorySeed,
} from "./memory-user-store.js";
import { hashPassword } from "./password-pure.js";
import type {
  AuthUser,
  CredentialRecord,
  CredentialStore,
  UserStore,
} from "./types.js";
import type { StarterAuthDeps } from "./starter-auth-fetch.js";

export type StarterAuthDepsOptions = {
  sessionSecret: string;
  /** Public origin for Google redirect_uri + password-reset links. */
  appOrigin?: string;
  appTitle?: string;
  brandName?: string;
  companyName?: string;
  skin?: StarterAuthDeps["skin"];
  theme?: StarterAuthDeps["theme"];
  /** Present with appOrigin → login/signup show Google and OAuth routes work. */
  google?: StarterAuthDeps["google"];
  /** After a successful signup (credentials or Google) — create profile/tenant, etc. */
  onSignup?: (user: AuthUser) => void | Promise<void>;
  /**
   * Required (with appOrigin) to enable forgot/reset password. Projects wire
   * their own email sender (e.g. `@glassbox-studio/studio-email`).
   */
  sendPasswordResetEmail?: StarterAuthDeps["sendPasswordResetEmail"];
  /** Optional dogfood seed user — persisted only when `db` is provided. */
  seed?: {
    id: string;
    email: string;
    name: string;
    username: string;
    password: string;
  };
};

/** Structural shape shared by `createD1AuthStores` and `createMemoryUserStore`. */
type AuthStoreLike = UserStore &
  CredentialStore & {
    register: (
      seed: MemorySeed,
    ) =>
      | { ok: true; user: AuthUser }
      | { ok: false; error: "email_taken" | "username_taken" | "id_taken" }
      | Promise<
          | { ok: true; user: AuthUser }
          | { ok: false; error: "email_taken" | "username_taken" | "id_taken" }
        >;
    getByEmail: (email: string) => AuthUser | null | Promise<AuthUser | null>;
    updatePasswordHash: (
      userId: string,
      passwordHash: string,
    ) => void | Promise<void>;
    findByLogin: (
      login: string,
    ) => CredentialRecord | null | Promise<CredentialRecord | null>;
  };

async function seedInto(
  store: AuthStoreLike,
  seed: StarterAuthDepsOptions["seed"],
) {
  if (!seed) return;
  const existing = await store.getById(seed.id);
  if (existing) return;
  const passwordHash = await hashPassword(seed.password);
  await store.register({
    user: {
      id: seed.id,
      email: seed.email,
      name: seed.name,
      role: "MEMBER",
    },
    passwordHash,
    username: seed.username,
  });
}

export async function createStarterAuthDeps(
  db: D1DatabaseLike | undefined,
  options: StarterAuthDepsOptions,
): Promise<StarterAuthDeps> {
  const { sessionSecret, appOrigin, google } = options;

  let userStore: AuthStoreLike;
  let resetStore: PasswordResetTokenStore;

  if (db) {
    userStore = createD1AuthStores(db);
    resetStore = createD1PasswordResetTokenStore(db);
    await seedInto(userStore, options.seed);
  } else {
    const memory: MemorySeed[] = [];
    if (options.seed) {
      memory.push({
        user: {
          id: options.seed.id,
          email: options.seed.email,
          name: options.seed.name,
          role: "MEMBER",
        },
        passwordHash: await hashPassword(options.seed.password),
        username: options.seed.username,
      });
    }
    userStore = createMemoryUserStore(memory);
    resetStore = createMemoryPasswordResetTokenStore();
  }

  const enableReset = Boolean(
    options.appOrigin && options.sendPasswordResetEmail,
  );

  return {
    sessionSecret,
    userStore,
    credentialStore: userStore,
    appTitle: options.appTitle,
    brandName: options.brandName,
    companyName: options.companyName,
    skin: options.skin,
    theme: options.theme,
    appOrigin,
    google,
    registerUser: (seed) => userStore.register(seed),
    onSignup: options.onSignup,
    getByEmail: (email) => userStore.getByEmail(email),
    updatePasswordHash: (userId, hash) =>
      userStore.updatePasswordHash(userId, hash),
    passwordResetTokenStore: enableReset ? resetStore : undefined,
    sendPasswordResetEmail: enableReset
      ? options.sendPasswordResetEmail
      : undefined,
  };
}
