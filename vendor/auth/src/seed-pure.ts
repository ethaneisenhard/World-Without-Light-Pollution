import type { UserRole } from "./types.js";

export type SeedUserConfig = {
  id: string;
  email: string;
  username: string;
  password: string;
  name?: string;
  role: UserRole;
};

function readEnv(source: Record<string, string | undefined>, key: string): string | undefined {
  const value = source[key]?.trim();
  return value || undefined;
}

export function readSeedUserConfig(
  source: Record<string, string | undefined>,
): SeedUserConfig | null {
  const email = readEnv(source, "DEV_SEED_EMAIL");
  const username = readEnv(source, "DEV_SEED_USERNAME");
  const password = readEnv(source, "DEV_SEED_PASSWORD");
  if (!email || !username || !password) return null;

  const roleRaw = readEnv(source, "DEV_SEED_ROLE") ?? "MEMBER";
  const role: UserRole = roleRaw === "SUBSCRIBER" ? "SUBSCRIBER" : "MEMBER";
  const name = readEnv(source, "DEV_SEED_NAME") ?? username;

  return {
    id: `seed-${username}`,
    email,
    username,
    password,
    name,
    role,
  };
}

export function seedUserSql(config: SeedUserConfig, passwordHash: string): string {
  const esc = (value: string) => value.replace(/'/g, "''");
  return `INSERT INTO User (id, email, name, role, username, passwordHash)
VALUES ('${esc(config.id)}', '${esc(config.email)}', '${esc(config.name ?? config.username)}', '${esc(config.role)}', '${esc(config.username)}', '${esc(passwordHash)}')
ON CONFLICT(id) DO UPDATE SET
  email = excluded.email,
  name = excluded.name,
  role = excluded.role,
  username = excluded.username,
  passwordHash = excluded.passwordHash;`;
}
