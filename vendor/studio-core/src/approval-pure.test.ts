import { describe, expect, it } from "vitest";
import {
  approvalConfirmed,
  buildApprovalSummary,
  isApprovalAction,
  needsWorkspaceDestructiveApproval,
} from "./approval-pure.js";

describe("approval-pure", () => {
  it("detects actions", () => {
    expect(isApprovalAction("git.push")).toBe(true);
    expect(isApprovalAction("studio.workspace.delete")).toBe(true);
    expect(isApprovalAction("files.write")).toBe(false);
  });

  it("confirm flags", () => {
    expect(approvalConfirmed({})).toBe(false);
    expect(approvalConfirmed({ confirm: true })).toBe(true);
    expect(approvalConfirmed({ yes: true })).toBe(true);
  });

  it("workspace destructive always needs confirm", () => {
    expect(needsWorkspaceDestructiveApproval({})).toBe(true);
    expect(needsWorkspaceDestructiveApproval({ confirm: true })).toBe(false);
  });

  it("summaries", () => {
    expect(buildApprovalSummary("git.push", { remote: "origin" })).toMatch(
      /Push/,
    );
    expect(buildApprovalSummary("deploy.ship", {})).toMatch(/Ship/);
    expect(
      buildApprovalSummary("studio.workspace.delete", {
        projectId: "van-build",
        deleteFiles: true,
      }),
    ).toMatch(/Delete workspace van-build/);
  });
});
