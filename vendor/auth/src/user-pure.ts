import type { AuthUser } from "./types.js";

export type GoogleProfile = {
  sub: string;
  email?: string | null;
  name?: string | null;
};

export function googleProfileToUser(profile: GoogleProfile): AuthUser {
  return {
    id: profile.sub,
    email: profile.email ?? `${profile.sub}@users.google`,
    name: profile.name ?? undefined,
    role: "MEMBER",
  };
}
