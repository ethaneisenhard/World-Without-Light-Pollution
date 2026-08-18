import type { AuthUser } from "./types.js";
import { userHasRole } from "./roles-pure.js";

/** Content visibility levels for Starter / blog gating. */
export type ContentVisibility = "public" | "members" | "subscribers";

/**
 * Can this user view content with the given visibility?
 * - public → anyone (including anonymous)
 * - members → signed-in MEMBER or SUBSCRIBER
 * - subscribers → SUBSCRIBER only
 */
export function canViewContent(
  user: AuthUser | null | undefined,
  visibility: ContentVisibility,
): boolean {
  if (visibility === "public") return true;
  if (!user) return false;
  if (visibility === "members") return userHasRole(user, "MEMBER");
  return userHasRole(user, "SUBSCRIBER");
}
