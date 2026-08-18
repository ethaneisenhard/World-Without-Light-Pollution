/** Mint a time-sortable opaque id (UUID when runtime supports it). */
export function mintId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `as-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function mintVisitorId(): string {
  return mintId();
}

export function mintSessionId(): string {
  return mintId();
}
