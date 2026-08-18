import { describe, expect, it } from "vitest";
import {
  destIsUnderStudioHome,
  parseGithubCloneUrl,
  parseWorkspaceCloneFromGitInput,
} from "./workspace-clone-from-git-pure.js";

describe("parseGithubCloneUrl", () => {
  it("accepts owner/repo", () => {
    const r = parseGithubCloneUrl("ethaneisenhard/glassbox-studio");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.httpsUrl).toBe(
      "https://github.com/ethaneisenhard/glassbox-studio.git",
    );
    expect(r.value.suggestedId).toBe("glassbox-studio");
  });

  it("accepts https and ssh", () => {
    const https = parseGithubCloneUrl(
      "https://github.com/org/demo.git",
    );
    expect(https.ok).toBe(true);
    if (https.ok) expect(https.value.repo).toBe("demo");
    const ssh = parseGithubCloneUrl("git@github.com:org/demo.git");
    expect(ssh.ok).toBe(true);
    if (ssh.ok) expect(ssh.value.owner).toBe("org");
  });

  it("rejects non-GitHub hosts", () => {
    const r = parseGithubCloneUrl("https://gitlab.com/org/demo");
    expect(r.ok).toBe(false);
  });
});

describe("parseWorkspaceCloneFromGitInput", () => {
  it("requires url", () => {
    expect(parseWorkspaceCloneFromGitInput({}).ok).toBe(false);
  });

  it("normalizes url + optional id", () => {
    const r = parseWorkspaceCloneFromGitInput({
      url: "acme/widgets",
      id: "My Widgets",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.url).toBe("https://github.com/acme/widgets.git");
    expect(r.value.id).toBe("my-widgets");
  });
});

describe("destIsUnderStudioHome", () => {
  it("allows Studio home children only", () => {
    expect(
      destIsUnderStudioHome(
        "/home/.glassbox-studio/workspaces/x",
        "/home/.glassbox-studio",
      ),
    ).toBe(true);
    expect(destIsUnderStudioHome("/tmp/evil", "/home/.glassbox-studio")).toBe(
      false,
    );
  });
});
