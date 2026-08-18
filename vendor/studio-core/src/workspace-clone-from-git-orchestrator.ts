/**
 * Clone a GitHub repo onto the Host and register it as a workspace.
 */

import { planningWorkspacesHome } from "./planning-workspace-pure.js";
import { linkWorkspaceOrchestrator } from "./workspace-crud-orchestrator.js";
import type { WorkspaceCrudOrchestratorDeps } from "./workspace-crud-orchestrator.js";
import {
  destIsUnderStudioHome,
  parseGithubCloneUrl,
  parseWorkspaceCloneFromGitInput,
} from "./workspace-clone-from-git-pure.js";
import { findRegistryEntry } from "./workspace-registry-pure.js";

export type GithubProbeResult = {
  ghPresent: boolean;
  signedIn: boolean;
  face: string;
};

export type GithubConnectResult = {
  ok: boolean;
  text: string;
  loginUrl?: string | null;
  userCode?: string | null;
};

export type CloneRepoResult = { ok: true } | { ok: false; error: string };

export type WorkspaceCloneFromGitOrchestratorDeps = WorkspaceCrudOrchestratorDeps & {
  probeGithub: () => Promise<GithubProbeResult>;
  startGithubConnect: () => Promise<GithubConnectResult>;
  cloneRepo: (input: {
    url: string;
    destDir: string;
  }) => Promise<CloneRepoResult>;
};

export type CloneWorkspaceFromGitResult =
  | {
      ok: true;
      needsGithubConnect: true;
      text: string;
      loginUrl?: string | null;
      userCode?: string | null;
    }
  | {
      ok: true;
      needsGithubConnect?: false;
      projectId: string;
      name: string;
      path: string;
      cloned: boolean;
      reloadProjects: true;
    }
  | { ok: false; error: string };

export async function cloneWorkspaceFromGitOrchestrator(
  deps: WorkspaceCloneFromGitOrchestratorDeps,
  raw: Record<string, unknown>,
): Promise<CloneWorkspaceFromGitResult> {
  const parsed = parseWorkspaceCloneFromGitInput(raw);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const urlParsed = parseGithubCloneUrl(parsed.value.url);
  if (!urlParsed.ok) return { ok: false, error: urlParsed.error };

  const github = await deps.probeGithub();
  if (!github.ghPresent) {
    return { ok: false, error: github.face };
  }
  if (!github.signedIn) {
    const connect = await deps.startGithubConnect();
    if (!connect.ok) {
      return { ok: false, error: connect.text || github.face };
    }
    return {
      ok: true,
      needsGithubConnect: true,
      text: connect.text,
      loginUrl: connect.loginUrl ?? null,
      userCode: connect.userCode ?? null,
    };
  }

  const projectId = parsed.value.id ?? urlParsed.value.suggestedId;
  const studioHome = deps.getStudioHome();
  const dest =
    parsed.value.dest ??
    deps.joinPath(planningWorkspacesHome(studioHome), projectId);
  if (!destIsUnderStudioHome(dest, studioHome)) {
    return {
      ok: false,
      error: "dest must be under the Studio home folder",
    };
  }

  const registry = await deps.loadRegistry();
  const existing = findRegistryEntry(registry, projectId);
  if (existing) {
    return {
      ok: true,
      projectId: existing.id,
      name: existing.name?.trim() || existing.id,
      path: existing.path,
      cloned: false,
      reloadProjects: true,
    };
  }

  const exists = deps.pathExists ? await deps.pathExists(dest) : false;
  let cloned = false;
  if (!exists) {
    const clonedRes = await deps.cloneRepo({
      url: urlParsed.value.httpsUrl,
      destDir: dest,
    });
    if (!clonedRes.ok) return { ok: false, error: clonedRes.error };
    cloned = true;
  }

  const linked = await linkWorkspaceOrchestrator(deps, {
    id: projectId,
    path: dest,
    name: parsed.value.name ?? urlParsed.value.repo,
  });
  return {
    ok: true,
    projectId: linked.projectId,
    name: linked.name,
    path: linked.path,
    cloned,
    reloadProjects: true,
  };
}
