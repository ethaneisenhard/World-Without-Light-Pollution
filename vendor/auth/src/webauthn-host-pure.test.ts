import { describe, expect, it } from "vitest";
import {
  formatPasskeyClientError,
  isWebAuthnRpIdHostname,
  passkeyUnsupportedHostMessage,
} from "./webauthn-host-pure.js";

describe("isWebAuthnRpIdHostname", () => {
  it("allows localhost and real domains", () => {
    expect(isWebAuthnRpIdHostname("localhost")).toBe(true);
    expect(isWebAuthnRpIdHostname("app.example.com")).toBe(true);
  });

  it("rejects bare IPs", () => {
    expect(isWebAuthnRpIdHostname("127.0.0.1")).toBe(false);
    expect(isWebAuthnRpIdHostname("192.168.1.1")).toBe(false);
  });
});

describe("formatPasskeyClientError", () => {
  it("silences autofill invalid-domain on 127.0.0.1", () => {
    expect(
      formatPasskeyClientError({
        message: "127.0.0.1 is an invalid domain",
        hostname: "127.0.0.1",
        autofill: true,
      }),
    ).toBeNull();
  });

  it("hints localhost when user clicks Passkey on 127.0.0.1", () => {
    expect(
      formatPasskeyClientError({
        message: "127.0.0.1 is an invalid domain",
        hostname: "127.0.0.1",
        autofill: false,
      }),
    ).toBe(passkeyUnsupportedHostMessage("127.0.0.1"));
  });
});
