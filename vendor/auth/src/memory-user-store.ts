import type { AuthUser, CredentialRecord, CredentialStore, UserStore } from "./types.js";

type StoredUser = AuthUser & { passwordHash?: string };

export type MemorySeed = {
  user: AuthUser;
  passwordHash: string;
  username?: string;
};

export function createMemoryUserStore(seeds: MemorySeed[] = []): MemoryUserStore {
  const users = new Map<string, StoredUser>();
  const loginIndex = new Map<string, string>();

  function indexUser(user: StoredUser, username?: string) {
    loginIndex.set(user.email.toLowerCase(), user.id);
    if (username) loginIndex.set(username.toLowerCase(), user.id);
  }

  for (const seed of seeds) {
    const stored: StoredUser = { ...seed.user, passwordHash: seed.passwordHash };
    users.set(stored.id, stored);
    indexUser(stored, seed.username);
  }

return {
    upsert(user) {
      const existing = users.get(user.id);
      const next: StoredUser = { ...existing, ...user };
      users.set(user.id, next);
      indexUser(next);
      return next;
    },
    register(seed: MemorySeed) {
      if (loginIndex.has(seed.user.email.toLowerCase())) {
        return { ok: false as const, error: "email_taken" as const };
      }
      if (seed.username && loginIndex.has(seed.username.toLowerCase())) {
        return { ok: false as const, error: "username_taken" as const };
      }
      if (users.has(seed.user.id)) {
        return { ok: false as const, error: "id_taken" as const };
      }
      const stored: StoredUser = { ...seed.user, passwordHash: seed.passwordHash };
      users.set(stored.id, stored);
      indexUser(stored, seed.username);
      const { passwordHash: _passwordHash, ...authUser } = stored;
      return { ok: true as const, user: authUser };
    },
    getById(id) {
      const user = users.get(id);
      if (!user) return null;
      const { passwordHash: _passwordHash, ...authUser } = user;
      return authUser;
    },
    getByEmail(email: string) {
      const userId = loginIndex.get(email.trim().toLowerCase());
      if (!userId) return null;
      const user = users.get(userId);
      if (!user) return null;
      const { passwordHash: _passwordHash, ...authUser } = user;
      return authUser;
    },
    updatePasswordHash(userId: string, passwordHash: string) {
      const user = users.get(userId);
      if (!user) return;
      users.set(userId, { ...user, passwordHash });
    },
    findByLogin(login) {
      const userId = loginIndex.get(login.toLowerCase());
      if (!userId) return null;
      const user = users.get(userId);
      if (!user?.passwordHash) return null;
      const { passwordHash, ...authUser } = user;
      return { user: authUser, passwordHash } satisfies CredentialRecord;
    },
  };
}

export type MemoryUserStore = UserStore &
  CredentialStore & {
    register: (seed: MemorySeed) =>
      | { ok: true; user: AuthUser }
      | { ok: false; error: "email_taken" | "username_taken" | "id_taken" };
    getByEmail: (email: string) => AuthUser | null;
    updatePasswordHash: (userId: string, passwordHash: string) => void;
  };
