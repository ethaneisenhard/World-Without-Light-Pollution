/**
 * Spoken / typed “clone this GitHub / site” → explicit repo or a search query.
 * No I/O — search + cloneFromGit stay in Chat / Host. Voice only drafts Chat.
 */

import { parseGithubCloneUrl, type ParsedGithubCloneUrl } from "./workspace-clone-from-git-pure.js";

export type GithubCloneHint =
  | { kind: "url"; httpsUrl: string; owner: string; repo: string }
  | { kind: "search"; query: string; token: string }
  | { kind: "ask" }
  | { kind: "none" };

/** Spoken / site aliases → GitHub search token (not project ids). */
export const GITHUB_SITE_ALIASES: Readonly<Record<string, string>> = {
  beehive: "beehiiv",
  "beehive.com": "beehiiv",
  "www.beehive.com": "beehiiv",
  beehiiv: "beehiiv",
  beevibe: "beehiiv",
  "bee vibe": "beehiiv",
};

const CLONE_JOB_RE =
  /\b(clone|download|pull down|get|add|import)\b.+\b(github|repo|repos|repository|workspace)\b|\b(github)\b.+\b(clone|download|add|import|workspace|repo|repos)\b/i;

const BEE_VIBE_RE = /\bbee\s*vibe\b|\bbeevibe\b|\bbeehive\b|\bbeehiiv\b/i;

const HOST_RE =
  /(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z]{2,})+(?:\/[^\s]*)?)/i;

const OWNER_REPO_RE = /\b([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)\b/;

const STOP_TOKENS = new Set([
  "github",
  "repo",
  "repository",
  "workspace",
  "workspaces",
  "clone",
  "download",
  "the",
  "into",
  "a",
  "an",
  "my",
  "new",
  "please",
  "www",
  "http",
  "https",
  "com",
]);

const SKIP_GITHUB_PATHS = new Set([
  "topics",
  "search",
  "orgs",
  "features",
  "about",
  "pricing",
  "login",
  "marketplace",
  "settings",
  "notifications",
  "explore",
  "trending",
]);

export function isGithubCloneUtterance(text: string): boolean {
  return CLONE_JOB_RE.test(text.trim());
}

/** Clone / GitHub jobs stay one Agent turn — never Multitask / Electric. */
export function isSingleAgentGithubJob(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (isGithubCloneUtterance(t)) return true;
  if (/\bclone\b/i.test(t)) return true;
  if (BEE_VIBE_RE.test(t)) return true;
  return /\bgithub\b/i.test(t) && /\b(repo|repos|repositories|download|list)\b/i.test(t);
}

export function normalizeGithubSearchToken(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return "";
  const aliased = GITHUB_SITE_ALIASES[trimmed];
  if (aliased) return aliased;
  const host = trimmed.replace(/^www\./, "");
  const hostAlias = GITHUB_SITE_ALIASES[host];
  if (hostAlias) return hostAlias;
  const leaf = host.split(".")[0] ?? host;
  return GITHUB_SITE_ALIASES[leaf] ?? leaf;
}

export function classifyGithubCloneHint(text: string): GithubCloneHint {
  const t = text.trim();
  if (!t || !isGithubCloneUtterance(t)) return { kind: "none" };

  const fromUrl = extractGithubRepoFromText(t);
  if (fromUrl) {
    return {
      kind: "url",
      httpsUrl: fromUrl.httpsUrl,
      owner: fromUrl.owner,
      repo: fromUrl.repo,
    };
  }

  const token = extractCloneSearchToken(t);
  if (!token) return { kind: "ask" };
  return { kind: "search", query: `${token} github`, token };
}

export function extractGithubRepoFromText(
  text: string,
): ParsedGithubCloneUrl | null {
  const github = /https?:\/\/(?:www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/i.exec(
    text,
  );
  if (github?.[0]) {
    const parsed = parseGithubCloneUrl(github[0]);
    if (parsed.ok) return parsed.value;
  }
  const ssh = /git@github\.com:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/i.exec(text);
  if (ssh?.[0]) {
    const parsed = parseGithubCloneUrl(ssh[0]);
    if (parsed.ok) return parsed.value;
  }
  const ownerRepo = OWNER_REPO_RE.exec(text);
  if (ownerRepo?.[1] && !ownerRepo[1].includes(".")) {
    const parsed = parseGithubCloneUrl(ownerRepo[1]);
    if (parsed.ok) return parsed.value;
  }
  return null;
}

export function extractCloneSearchToken(text: string): string {
  if (BEE_VIBE_RE.test(text)) return "beehiiv";
  const host = HOST_RE.exec(text);
  if (host?.[1]) {
    const first = host[1].split("/")[0] ?? host[1];
    if (!first.includes("github.com")) {
      return normalizeGithubSearchToken(first);
    }
  }
  const words = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .split(/[^a-z0-9.-]+/)
    .filter((w) => w && !STOP_TOKENS.has(w) && !/^\d+$/.test(w));
  const named = words.find((w) => w.includes("."));
  if (named) return normalizeGithubSearchToken(named);
  const token = words.find((w) => w.length >= 3) ?? "";
  return normalizeGithubSearchToken(token);
}

export function pickGithubRepoFromSearchResults(
  results: readonly { url?: string; title?: string }[],
  token?: string,
): ParsedGithubCloneUrl | null {
  const parsed: ParsedGithubCloneUrl[] = [];
  for (const row of results) {
    const url = (row.url ?? "").trim();
    if (!url) continue;
    const hit = parseGithubCloneUrl(url);
    if (!hit.ok) continue;
    if (SKIP_GITHUB_PATHS.has(hit.value.owner.toLowerCase())) continue;
    if (SKIP_GITHUB_PATHS.has(hit.value.repo.toLowerCase())) continue;
    parsed.push(hit.value);
  }
  if (!parsed.length) return null;
  const needle = (token ?? "").trim().toLowerCase();
  if (needle) {
    const exact =
      parsed.find(
        (p) =>
          p.owner.toLowerCase() === needle && p.repo.toLowerCase() === needle,
      ) ??
      parsed.find((p) => p.owner.toLowerCase() === needle) ??
      parsed.find(
        (p) =>
          p.repo.toLowerCase() === needle ||
          p.owner.toLowerCase().includes(needle),
      );
    if (exact) return exact;
  }
  return parsed[0] ?? null;
}
