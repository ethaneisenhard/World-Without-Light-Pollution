import type { AuthUser, UserRole } from "./types.js";

export function userHasRole(user: AuthUser, required: UserRole): boolean {
  if (required === "MEMBER") return user.role === "MEMBER" || user.role === "SUBSCRIBER";
  return user.role === required;
}

export function requireUserRole(user: AuthUser | null, required: UserRole): AuthUser | null {
  if (!user) return null;
  return userHasRole(user, required) ? user : null;
}
