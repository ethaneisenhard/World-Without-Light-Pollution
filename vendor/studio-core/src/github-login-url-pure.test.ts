import { describe, expect, it } from "vitest";
import {
  formatGithubConnectPrompt,
  isGithubDeviceLoginUrl,
  parseGithubDeviceLoginFromOutput,
} from "./github-login-url-pure.js";

describe("parseGithubDeviceLoginFromOutput", () => {
  it("extracts device URL and one-time code", () => {
    const parsed = parseGithubDeviceLoginFromOutput(
      "! First copy your one-time code: ABCD-EFGH\nOpen this URL to continue in your web browser: https://github.com/login/device\n",
    );
    expect(parsed).toEqual({
      loginUrl: "https://github.com/login/device",
      userCode: "ABCD-EFGH",
    });
  });

  it("returns null when the device URL is missing", () => {
    expect(parseGithubDeviceLoginFromOutput("Waiting…")).toBeNull();
  });

  it("keeps the URL when the code line is missing", () => {
    expect(
      parseGithubDeviceLoginFromOutput(
        "Open https://github.com/login/device in your browser",
      ),
    ).toEqual({
      loginUrl: "https://github.com/login/device",
      userCode: null,
    });
  });
});

describe("isGithubDeviceLoginUrl", () => {
  it("accepts github.com/login/device", () => {
    expect(isGithubDeviceLoginUrl("https://github.com/login/device")).toBe(
      true,
    );
  });

  it("rejects other hosts", () => {
    expect(isGithubDeviceLoginUrl("https://evil.example/login/device")).toBe(
      false,
    );
  });
});

describe("formatGithubConnectPrompt", () => {
  it("asks to open the link and type the code", () => {
    expect(
      formatGithubConnectPrompt({
        loginUrl: "https://github.com/login/device",
        userCode: "WXYZ-1234",
      }),
    ).toContain("WXYZ-1234");
  });
});
