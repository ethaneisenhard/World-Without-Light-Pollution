import type { AnalyticsEnvironment } from "./types.js";

export interface ResolveEnvironmentInput {
  /** `pnpm dev` / local orchestrator. */
  isLocalDev?: boolean;
  /** Workspace kind (preview vs production). */
  workspaceKind?: "production" | "preview";
}

export function resolveAnalyticsEnvironment(input: ResolveEnvironmentInput): AnalyticsEnvironment {
  if (input.isLocalDev) return "dev";
  if (input.workspaceKind === "preview") return "staging";
  return "production";
}

export function resolveWorkspaceId(input: {
  workspaceKind?: "production" | "preview";
  workspaceId?: string;
}): string {
  if (input.workspaceKind === "preview" && input.workspaceId) return input.workspaceId;
  return "production";
}
