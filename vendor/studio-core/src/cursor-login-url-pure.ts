/**
 * Parse Cursor Agent CLI `login` stdout for the browser auth URL.
 */

const CURSOR_LOGIN_URL_RE =
  /https:\/\/(?:www\.)?cursor\.com\/loginDeepControl\?[^\s"'<>]+/i;

/**
 * Extract clickable login URL from `cursor-agent login` / `agent login` output.
 */
export function parseCursorLoginUrlFromOutput(text: string): string | null {
  const raw = String(text ?? "");
  if (!raw.trim()) return null;
  const match = CURSOR_LOGIN_URL_RE.exec(raw);
  if (!match?.[0]) return null;
  // Strip trailing punctuation from prose.
  return match[0].replace(/[.,;:)\]]+$/g, "");
}

export function isCursorLoginUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "https:") return false;
    if (u.hostname !== "cursor.com" && u.hostname !== "www.cursor.com") {
      return false;
    }
    return u.pathname === "/loginDeepControl";
  } catch {
    return false;
  }
}
