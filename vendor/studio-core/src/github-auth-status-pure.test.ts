import { describe, expect, it } from "vitest";
import {
  formatGithubAuthStatusText,
  parseGithubAuthStatusOutput,
} from "./github-auth-status-pure.js";

const SAMPLE = `github.com
  ✓ Logged in to github.com account ethaneisenhard (/home/studio/.config/gh/hosts.yml)
  - Active account: true
  - Git operations protocol: https
  - Token: gho_************************************
  - Token scopes: 'gist', 'read:org', 'repo'
`;

describe("parseGithubAuthStatusOutput", () => {
  it("parses a signed-in HTTPS session", () => {
    expect(
      parseGithubAuthStatusOutput({ text: SAMPLE, ghPresent: true }),
    ).toEqual({
      ghPresent: true,
      signedIn: true,
      login: "ethaneisenhard",
      protocol: "https",
    });
  });

  it("marks missing CLI", () => {
    expect(
      parseGithubAuthStatusOutput({ text: "", ghPresent: false }),
    ).toEqual({
      ghPresent: false,
      signedIn: false,
      login: null,
      protocol: null,
    });
  });

  it("marks not signed in", () => {
    expect(
      parseGithubAuthStatusOutput({
        text: "You are not logged into any GitHub hosts.",
        ghPresent: true,
      }),
    ).toMatchObject({ signedIn: false, login: null });
  });
});

describe("formatGithubAuthStatusText", () => {
  it("names the login when signed in", () => {
    expect(
      formatGithubAuthStatusText({
        ghPresent: true,
        signedIn: true,
        login: "ethaneisenhard",
        protocol: "https",
      }),
    ).toContain("ethaneisenhard");
  });

  it("points at git.github.connect when signed out", () => {
    expect(
      formatGithubAuthStatusText({
        ghPresent: true,
        signedIn: false,
        login: null,
        protocol: null,
      }),
    ).toContain("git.github.connect");
  });
});
