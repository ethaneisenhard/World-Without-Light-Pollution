/**
 * Parse GitHub clone URL / owner/repo shorthand for workspace.cloneFromGit.
 * Pure — no fs / gh.
 */

import { slugifyPlanningWorkspaceName } from "./planning-workspace-pure.js";

export type ParsedGithubCloneUrl = {
  httpsUrl: string;
  owner: string;
  repo: string;
  suggestedId: string;
};

export type WorkspaceCloneFromGitInput = {
  url: string;
  id?: string;
  dest?: string;
  name?: string;
};

const OWNER_REPO_RE = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export function parseGithubCloneUrl(
  raw: string,
): { ok: true; value: ParsedGithubCloneUrl } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "url is required" };

  const ssh = /^git@github\.com:([^/\s]+)\/([^/\s]+?)(?:\.git)?$/i.exec(trimmed);
  if (ssh?.[1] && ssh[2]) {
    return okClone(ssh[1], stripGitSuffix(ssh[2]));
  }

  if (OWNER_REPO_RE.test(trimmed) && !trimmed.includes("://")) {
    const [owner, repo] = trimmed.split("/");
    if (owner && repo) return okClone(owner, stripGitSuffix(repo));
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "url must be owner/repo or a GitHub https URL" };
  }
  if (parsed.protocol !== "https:") {
    return { ok: false, error: "GitHub clone URL must be https" };
  }
  const host = parsed.hostname.toLowerCase();
  if (host !== "github.com" && host !== "www.github.com") {
    return { ok: false, error: "Only github.com URLs are supported" };
  }
  const parts = parsed.pathname.replace(/^\/+|\/+$/g, "").split("/");
  const owner = parts[0]?.trim() ?? "";
  const repo = stripGitSuffix(parts[1]?.trim() ?? "");
  if (!owner || !repo) {
    return { ok: false, error: "GitHub URL must be github.com/owner/repo" };
  }
  return okClone(owner, repo);
}

function stripGitSuffix(repo: string): string {
  return repo.replace(/\.git$/i, "");
}

function okClone(
  owner: string,
  repo: string,
): { ok: true; value: ParsedGithubCloneUrl } {
  return {
    ok: true,
    value: {
      httpsUrl: `https://github.com/${owner}/${repo}.git`,
      owner,
      repo,
      suggestedId: slugifyPlanningWorkspaceName(repo),
    },
  };
}

export function parseWorkspaceCloneFromGitInput(
  input: Record<string, unknown>,
): { ok: true; value: WorkspaceCloneFromGitInput } | { ok: false; error: string } {
  const url =
    typeof input.url === "string"
      ? input.url.trim()
      : typeof input.repo === "string"
        ? input.repo.trim()
        : "";
  if (!url) return { ok: false, error: "url is required (https or owner/repo)" };
  const parsed = parseGithubCloneUrl(url);
  if (!parsed.ok) return parsed;
  const idRaw =
    typeof input.id === "string" && input.id.trim()
      ? input.id.trim()
      : typeof input.projectId === "string"
        ? input.projectId.trim()
        : "";
  const id = idRaw ? slugifyPlanningWorkspaceName(idRaw) : undefined;
  const dest =
    typeof input.dest === "string" && input.dest.trim()
      ? input.dest.trim()
      : typeof input.path === "string" && input.path.trim()
        ? input.path.trim()
        : undefined;
  const name =
    typeof input.name === "string" && input.name.trim()
      ? input.name.trim()
      : undefined;
  return {
    ok: true,
    value: {
      url: parsed.value.httpsUrl,
      ...(id ? { id } : {}),
      ...(dest ? { dest } : {}),
      ...(name ? { name } : {}),
    },
  };
}

export function destIsUnderStudioHome(dest: string, studioHome: string): boolean {
  const n = dest.replace(/\\/g, "/").replace(/\/+$/, "");
  const home = studioHome.replace(/\\/g, "/").replace(/\/+$/, "");
  if (!n || !home) return false;
  return n === home || n.startsWith(`${home}/`);
}
