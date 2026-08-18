import type { SqlExecutor } from "./types.js";

/** Project-scoped people (marketing / app / admin roles) — not Studio auth User. */
export type ProjectUser = {
  id: string;
  email: string;
  name: string | null;
  roles: string[];
  attrs: Record<string, unknown>;
  consent: Record<string, unknown>;
  source: string | null;
  createdAt: number;
  updatedAt: number;
};

export type UpsertProjectUserInput = {
  email: string;
  name?: string | null;
  roles?: string[];
  attrs?: Record<string, unknown>;
  consent?: Record<string, unknown>;
  source?: string | null;
  /** When set, merge with existing roles (union). Default true. */
  mergeRoles?: boolean;
};

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  roles_json: string;
  attrs_json: string;
  consent_json: string;
  source: string | null;
  created_at: number;
  updated_at: number;
};

function parseJsonObject(raw: string): Record<string, unknown> {
  try {
    const v = JSON.parse(raw) as unknown;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return v as Record<string, unknown>;
    }
  } catch {
    /* ignore */
  }
  return {};
}

function parseJsonStringArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw) as unknown;
    if (Array.isArray(v)) {
      return v.filter((x): x is string => typeof x === "string" && x.trim() !== "");
    }
  } catch {
    /* ignore */
  }
  return [];
}

function rowToUser(row: UserRow): ProjectUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    roles: parseJsonStringArray(row.roles_json),
    attrs: parseJsonObject(row.attrs_json),
    consent: parseJsonObject(row.consent_json),
    source: row.source,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

function newUserId(): string {
  return `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export type ProjectUsersStore = {
  list: (opts?: { limit?: number; offset?: number }) => Promise<ProjectUser[]>;
  count: () => Promise<number>;
  getByEmail: (email: string) => Promise<ProjectUser | null>;
  upsert: (input: UpsertProjectUserInput) => Promise<ProjectUser>;
};

export function createSqlProjectUsersStore(sql: SqlExecutor): ProjectUsersStore {
  return {
    async list(opts) {
      const limit = Math.min(Math.max(opts?.limit ?? 100, 1), 500);
      const offset = Math.max(opts?.offset ?? 0, 0);
      const rows = await sql.all<UserRow>(
        `SELECT * FROM users ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
        [limit, offset],
      );
      return rows.map(rowToUser);
    },

    async count() {
      const row = await sql.get<{ c: number }>(`SELECT COUNT(*) AS c FROM users`);
      return Number(row?.c ?? 0);
    },

    async getByEmail(email) {
      const normalized = email.trim().toLowerCase();
      if (!normalized) return null;
      const row = await sql.get<UserRow>(
        `SELECT * FROM users WHERE email = ?`,
        [normalized],
      );
      return row ? rowToUser(row) : null;
    },

    async upsert(input) {
      const email = input.email.trim().toLowerCase();
      if (!email || !email.includes("@")) {
        throw new Error("valid email required");
      }
      const now = Date.now();
      const existing = await this.getByEmail(email);
      const mergeRoles = input.mergeRoles !== false;
      const nextRoles = existing
        ? mergeRoles
          ? Array.from(
              new Set([
                ...existing.roles,
                ...(input.roles ?? []),
              ]),
            )
          : (input.roles ?? existing.roles)
        : (input.roles ?? []);
      const nextAttrs = {
        ...(existing?.attrs ?? {}),
        ...(input.attrs ?? {}),
      };
      const nextConsent = {
        ...(existing?.consent ?? {}),
        ...(input.consent ?? {}),
      };
      const name =
        input.name !== undefined
          ? input.name?.trim() || null
          : (existing?.name ?? null);
      const source =
        input.source !== undefined
          ? input.source
          : (existing?.source ?? null);

      if (existing) {
        await sql.run(
          `UPDATE users SET name = ?, roles_json = ?, attrs_json = ?,
           consent_json = ?, source = ?, updated_at = ? WHERE id = ?`,
          [
            name,
            JSON.stringify(nextRoles),
            JSON.stringify(nextAttrs),
            JSON.stringify(nextConsent),
            source,
            now,
            existing.id,
          ],
        );
        return {
          ...existing,
          name,
          roles: nextRoles,
          attrs: nextAttrs,
          consent: nextConsent,
          source,
          updatedAt: now,
        };
      }

      const id = newUserId();
      await sql.run(
        `INSERT INTO users (
          id, email, name, roles_json, attrs_json, consent_json, source, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          email,
          name,
          JSON.stringify(nextRoles),
          JSON.stringify(nextAttrs),
          JSON.stringify(nextConsent),
          source,
          now,
          now,
        ],
      );
      return {
        id,
        email,
        name,
        roles: nextRoles,
        attrs: nextAttrs,
        consent: nextConsent,
        source,
        createdAt: now,
        updatedAt: now,
      };
    },
  };
}

/** Extract email/name from a typical form payload for upsert. */
export function extractUserFieldsFromFormPayload(
  payload: Record<string, unknown>,
): { email: string; name: string | null } | null {
  const emailRaw = payload.email;
  if (typeof emailRaw !== "string" || !emailRaw.trim().includes("@")) {
    return null;
  }
  const nameRaw = payload.name;
  const name =
    typeof nameRaw === "string" && nameRaw.trim() ? nameRaw.trim() : null;
  return { email: emailRaw.trim(), name };
}
