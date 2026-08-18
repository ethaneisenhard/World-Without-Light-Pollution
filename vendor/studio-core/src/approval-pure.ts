/**
 * Dangerous action approvals — push / deploy / workspace delete need explicit confirm.
 */

export type ApprovalActionId =
  | "git.push"
  | "deploy.run"
  | "deploy.ship"
  | "studio.workspace.unlink"
  | "studio.workspace.delete"
  | "messages.send";

export type PendingApproval = {
  id: string;
  projectId: string;
  action: ApprovalActionId;
  summary: string;
  input: Record<string, unknown>;
  createdAt: number;
};

export function isApprovalAction(action: string): action is ApprovalActionId {
  return (
    action === "git.push" ||
    action === "deploy.run" ||
    action === "deploy.ship" ||
    action === "studio.workspace.unlink" ||
    action === "studio.workspace.delete" ||
    action === "messages.send"
  );
}

/** True when caller already confirmed (CLI --yes or prior approve). */
export function approvalConfirmed(input: Record<string, unknown>): boolean {
  return input.confirm === true || input.yes === true || input.confirmed === true;
}

/**
 * Workspace unlink/delete always need Approve (or confirm:true) —
 * All-access does **not** auto-skip (stronger than git.push).
 */
export function needsWorkspaceDestructiveApproval(
  input: Record<string, unknown>,
): boolean {
  return !approvalConfirmed(input);
}

export function buildApprovalSummary(
  action: ApprovalActionId,
  input: Record<string, unknown>,
): string {
  if (action === "git.push") {
    const remote =
      typeof input.remote === "string" && input.remote.trim()
        ? input.remote.trim()
        : "origin";
    const branch =
      typeof input.branch === "string" && input.branch.trim()
        ? input.branch.trim()
        : "current";
    return `Push ${branch} → ${remote}`;
  }
  if (action === "deploy.run") {
    const target =
      typeof input.target === "string" && input.target.trim()
        ? input.target.trim()
        : "default";
    return `Deploy (${target})`;
  }
  if (action === "studio.workspace.unlink") {
    const id =
      typeof input.projectId === "string" && input.projectId.trim()
        ? input.projectId.trim()
        : "workspace";
    return `Unlink workspace ${id} (registry only)`;
  }
  if (action === "studio.workspace.delete") {
    const id =
      typeof input.projectId === "string" && input.projectId.trim()
        ? input.projectId.trim()
        : "workspace";
    const files = input.deleteFiles === true ? " + delete files" : "";
    return `Delete workspace ${id}${files}`;
  }
  if (action === "messages.send") {
    const channel =
      typeof input.channel === "string" && input.channel.trim()
        ? input.channel.trim()
        : "message";
    const conv =
      typeof input.conversationId === "string" && input.conversationId.trim()
        ? input.conversationId.trim()
        : "thread";
    return `Send ${channel} → ${conv}`;
  }
  return "Ship (push + deploy)";
}
