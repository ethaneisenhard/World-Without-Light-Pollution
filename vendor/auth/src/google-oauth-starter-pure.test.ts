import { describe, expect, it } from "vitest";
import {
  buildGoogleAuthorizeUrl,
  encodeGoogleOAuthStatePayload,
  parseGoogleOAuthStatePayload,
} from "./google-oauth-starter-pure.js";

describe("google-oauth-starter-pure", () => {
  it("builds authorize URL", () => {
    const url = buildGoogleAuthorizeUrl({
      clientId: "cid",
      redirectUri: "https://browserui.org/auth/google/callback",
      state: "st",
    });
    expect(url).toContain("accounts.google.com");
    expect(url).toContain("client_id=cid");
    expect(url).toContain("redirect_uri=");
    expect(url).toContain("state=st");
  });

  it("round-trips state payload", () => {
    const raw = encodeGoogleOAuthStatePayload({ n: "abc", r: "/app" });
    expect(parseGoogleOAuthStatePayload(raw)).toEqual({ n: "abc", r: "/app" });
    expect(parseGoogleOAuthStatePayload("{")).toBeNull();
  });
});
