/**
 * Parse `gh auth login --web` stdout for GitHub device-flow URL + one-time code.
 */

const DEVICE_URL_RE = /https:\/\/github\.com\/login\/device\/?[^\s"'<>]*/i;
const ONE_TIME_CODE_RE = /one-time code:\s*([A-Z0-9]{4,}-[A-Z0-9]{4,})/i;

export type GithubDeviceLogin = {
  loginUrl: string;
  userCode: string | null;
};

export function parseGithubDeviceLoginFromOutput(
  text: string,
): GithubDeviceLogin | null {
  const raw = String(text ?? "");
  if (!raw.trim()) return null;
  const urlMatch = DEVICE_URL_RE.exec(raw);
  if (!urlMatch?.[0]) return null;
  const loginUrl = urlMatch[0].replace(/[.,;:)\]]+$/g, "");
  const codeMatch = ONE_TIME_CODE_RE.exec(raw);
  return {
    loginUrl,
    userCode: codeMatch?.[1] ?? null,
  };
}

export function isGithubDeviceLoginUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "https:") return false;
    if (u.hostname !== "github.com" && u.hostname !== "www.github.com") {
      return false;
    }
    return u.pathname === "/login/device" || u.pathname === "/login/device/";
  } catch {
    return false;
  }
}

/** Chat / Voice face — open the link, type the code. */
export function formatGithubConnectPrompt(login: GithubDeviceLogin): string {
  const code = login.userCode
    ? ` Enter this code: ${login.userCode}.`
    : "";
  return `Open ${login.loginUrl} on your phone.${code} When GitHub says you're in, say done.`;
}
