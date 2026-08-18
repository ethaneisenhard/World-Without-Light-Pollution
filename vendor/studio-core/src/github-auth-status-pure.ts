/**
 * Parse `gh auth status` and paint a chat/voice face (no Host jargon).
 */

export type GithubGitProtocol = "https" | "ssh";

export type GithubAuthStatus = {
  ghPresent: boolean;
  signedIn: boolean;
  login: string | null;
  protocol: GithubGitProtocol | null;
};

export function parseGithubAuthStatusOutput(input: {
  text: string;
  ghPresent: boolean;
}): GithubAuthStatus {
  if (!input.ghPresent) {
    return {
      ghPresent: false,
      signedIn: false,
      login: null,
      protocol: null,
    };
  }
  const raw = String(input.text ?? "");
  const signedIn = /logged in to github\.com/i.test(raw);
  const loginMatch =
    /logged in to github\.com account\s+(\S+)/i.exec(raw) ??
    /account\s+(\S+)\s+\(/i.exec(raw);
  const login = loginMatch?.[1]?.replace(/[.,;:)]+$/g, "") ?? null;
  let protocol: GithubGitProtocol | null = null;
  if (/git operations protocol:\s*https/i.test(raw)) protocol = "https";
  else if (/git operations protocol:\s*ssh/i.test(raw)) protocol = "ssh";
  return {
    ghPresent: true,
    signedIn,
    login: signedIn ? login : null,
    protocol: signedIn ? protocol : null,
  };
}

export function formatGithubAuthStatusText(status: GithubAuthStatus): string {
  if (!status.ghPresent) {
    return "GitHub CLI is not installed on this Studio computer. Install gh, then call git.github.connect.";
  }
  if (!status.signedIn) {
    return "GitHub is not signed in on this Studio computer. Call git.github.connect — you will get a one-time code and a link to open on your phone.";
  }
  const who = status.login ?? "your account";
  const proto = status.protocol === "ssh" ? "SSH" : "HTTPS";
  return `GitHub is signed in as ${who} (${proto}). git.push uses this login.`;
}
