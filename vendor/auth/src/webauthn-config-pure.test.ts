import { describe, expect, it } from "vitest";
import { getWebAuthnConfig } from "./webauthn-config-pure.js";

describe("getWebAuthnConfig", () => {
  it("derives rpID and origin from request URL", () => {
    const cfg = getWebAuthnConfig(
      { url: "https://app.example.com/login" },
      { rpName: "Demo" },
    );
    expect(cfg).toEqual({
      rpName: "Demo",
      rpID: "app.example.com",
      origin: "https://app.example.com",
    });
  });
});
